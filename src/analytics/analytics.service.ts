import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Expense, ExpenseDocument } from '../expenses/schemas/expense.schema';
import { User, UserDocument } from '../users/schemas/user.schema';
import { Category, CategoryDocument } from '../categories/schemas/category.schema';
import { Balance, BalanceDocument } from '../balances/schemas/balance.schema';
import { 
  AnalyticsQueryDto, 
  TimePeriod 
} from './dto/analytics-query.dto';
import {
  ExpenseAnalyticsDto,
  CategorySpendingDto,
  MonthlyTrendDto,
  UserSpendingDto,
  SpendingInsightDto
} from './dto/analytics-response.dto';
import { ExportQueryDto, ExportFormat } from './dto/export-query.dto';

@Injectable()
export class AnalyticsService {
  private readonly logger = new Logger(AnalyticsService.name);

  constructor(
    @InjectModel(Expense.name) private expenseModel: Model<ExpenseDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(Category.name) private categoryModel: Model<CategoryDocument>,
    @InjectModel(Balance.name) private balanceModel: Model<BalanceDocument>,
  ) {}

  async getExpenseAnalytics(
    userId: string,
    query: AnalyticsQueryDto
  ): Promise<ExpenseAnalyticsDto> {
    this.logger.debug(`Getting analytics for user ${userId} with query:`, query);

    const { startDate, endDate } = this.getDateRange(query);
    
    // Build base query for user's expenses
    const baseQuery: any = {
      createdAt: { $gte: startDate, $lte: endDate },
      $or: [
        { paidBy: new Types.ObjectId(userId) },
        { [`shares.${userId}`]: { $exists: true } }
      ]
    };

    // Add group filter if specified
    if (query.groupId) {
      baseQuery.groupId = new Types.ObjectId(query.groupId);
    }

    // Get all relevant expenses
    const expenses = await this.expenseModel
      .find(baseQuery)
      .populate('paidBy', 'name')
      .populate('categoryId', 'name')
      .populate('groupId', 'name')
      .sort({ createdAt: -1 });

    this.logger.debug(`Found ${expenses.length} expenses for analytics`);

    // Calculate basic metrics
    const totalSpent = this.calculateTotalSpent(expenses, userId);
    const totalExpenses = expenses.length;
    const averageExpense = totalExpenses > 0 ? totalSpent / totalExpenses : 0;

    // Generate detailed breakdowns
    const categoryBreakdown = await this.getCategoryBreakdown(expenses, userId);
    const monthlyTrends = this.getMonthlyTrends(expenses, userId);
    const userBreakdown = await this.getUserBreakdown(expenses, query.groupId);
    const insights = await this.generateInsights(expenses, userId, query);
    const periodComparison = await this.getPeriodComparison(userId, query);

    return {
      period: query.period,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      totalSpent,
      totalExpenses,
      averageExpense: Math.round(averageExpense * 100) / 100,
      categoryBreakdown,
      monthlyTrends,
      userBreakdown,
      insights,
      periodComparison
    };
  }

  async exportAnalytics(
    userId: string,
    query: ExportQueryDto
  ): Promise<{ data: string; filename: string; contentType: string }> {
    this.logger.debug(`Exporting analytics for user ${userId} in format ${query.format}`);

    const analyticsQuery: AnalyticsQueryDto = {
      period: TimePeriod.CUSTOM,
      startDate: query.startDate,
      endDate: query.endDate,
      groupId: query.groupId
    };

    const analytics = await this.getExpenseAnalytics(userId, analyticsQuery);

    switch (query.format) {
      case ExportFormat.CSV:
        return this.exportToCSV(analytics, query);
      case ExportFormat.JSON:
        return this.exportToJSON(analytics, query);
      default:
        throw new Error(`Export format ${query.format} not supported yet`);
    }
  }

  private exportToCSV(
    analytics: ExpenseAnalyticsDto, 
    query: ExportQueryDto
  ): { data: string; filename: string; contentType: string } {
    const lines: string[] = [];
    
    // Header
    lines.push('Expense Analytics Export');
    lines.push(`Period: ${analytics.startDate} to ${analytics.endDate}`);
    lines.push('');
    
    // Summary
    lines.push('SUMMARY');
    lines.push('Metric,Value');
    lines.push(`Total Spent,$${analytics.totalSpent}`);
    lines.push(`Total Expenses,${analytics.totalExpenses}`);
    lines.push(`Average Expense,$${analytics.averageExpense}`);
    lines.push('');

    // Category Breakdown
    if (query.includeBreakdown) {
      lines.push('CATEGORY BREAKDOWN');
      lines.push('Category,Total Amount,Expense Count,Percentage,Average Amount');
      analytics.categoryBreakdown.forEach(cat => {
        lines.push(`${cat.categoryName},$${cat.totalAmount},${cat.expenseCount},${cat.percentage}%,$${cat.averageAmount}`);
      });
      lines.push('');

      // Monthly Trends
      lines.push('MONTHLY TRENDS');
      lines.push('Month,Total Amount,Expense Count,Average Amount');
      analytics.monthlyTrends.forEach(trend => {
        lines.push(`${trend.month},$${trend.totalAmount},${trend.expenseCount},$${trend.averageAmount}`);
      });
      lines.push('');

      // Insights
      lines.push('INSIGHTS');
      lines.push('Type,Message,Value,Context');
      analytics.insights.forEach(insight => {
        lines.push(`${insight.type},"${insight.message}",${insight.value},${insight.context || ''}`);
      });
    }

    const filename = `expense-analytics-${new Date().toISOString().split('T')[0]}.csv`;
    
    return {
      data: lines.join('\n'),
      filename,
      contentType: 'text/csv'
    };
  }

  private exportToJSON(
    analytics: ExpenseAnalyticsDto, 
    query: ExportQueryDto
  ): { data: string; filename: string; contentType: string } {
    const exportData = {
      exportInfo: {
        exportDate: new Date().toISOString(),
        format: 'JSON',
        includeBreakdown: query.includeBreakdown
      },
      analytics: query.includeBreakdown ? analytics : {
        period: analytics.period,
        startDate: analytics.startDate,
        endDate: analytics.endDate,
        totalSpent: analytics.totalSpent,
        totalExpenses: analytics.totalExpenses,
        averageExpense: analytics.averageExpense,
        periodComparison: analytics.periodComparison
      }
    };

    const filename = `expense-analytics-${new Date().toISOString().split('T')[0]}.json`;
    
    return {
      data: JSON.stringify(exportData, null, 2),
      filename,
      contentType: 'application/json'
    };
  }

  private getDateRange(query: AnalyticsQueryDto): { startDate: Date; endDate: Date } {
    const now = new Date();
    let startDate: Date;
    let endDate: Date = new Date(now);

    if (query.period === TimePeriod.CUSTOM && query.startDate && query.endDate) {
      startDate = new Date(query.startDate);
      endDate = new Date(query.endDate);
    } else {
      switch (query.period) {
        case TimePeriod.WEEK:
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case TimePeriod.MONTH:
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
          break;
        case TimePeriod.QUARTER:
          const quarterStart = Math.floor(now.getMonth() / 3) * 3;
          startDate = new Date(now.getFullYear(), quarterStart, 1);
          break;
        case TimePeriod.YEAR:
          startDate = new Date(now.getFullYear(), 0, 1);
          break;
        default:
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      }
    }

    return { startDate, endDate };
  }

  private calculateTotalSpent(expenses: ExpenseDocument[], userId: string): number {
    return expenses.reduce((total, expense) => {
      // If user paid the expense, add their share amount
      if (expense.paidBy.toString() === userId) {
        const userShare = expense.shares.get(userId) || 0;
        return total + userShare;
      }
      // If user didn't pay but participated, add their share
      const userShare = expense.shares.get(userId) || 0;
      return total + userShare;
    }, 0);
  }

  private async getCategoryBreakdown(
    expenses: ExpenseDocument[], 
    userId: string
  ): Promise<CategorySpendingDto[]> {
    const categoryMap = new Map<string, {
      categoryId: string;
      categoryName: string;
      totalAmount: number;
      expenseCount: number;
    }>();

    for (const expense of expenses) {
      const userShare = expense.shares.get(userId) || 0;
      if (userShare === 0) continue;

      const categoryId = expense.categoryId._id.toString();
      const categoryName = (expense.categoryId as any).name || 'Unknown';

      if (categoryMap.has(categoryId)) {
        const existing = categoryMap.get(categoryId)!;
        existing.totalAmount += userShare;
        existing.expenseCount += 1;
      } else {
        categoryMap.set(categoryId, {
          categoryId,
          categoryName,
          totalAmount: userShare,
          expenseCount: 1
        });
      }
    }

    const totalSpent = Array.from(categoryMap.values())
      .reduce((sum, cat) => sum + cat.totalAmount, 0);

    return Array.from(categoryMap.values())
      .map(cat => ({
        ...cat,
        totalAmount: Math.round(cat.totalAmount * 100) / 100,
        percentage: totalSpent > 0 ? Math.round((cat.totalAmount / totalSpent) * 10000) / 100 : 0,
        averageAmount: Math.round((cat.totalAmount / cat.expenseCount) * 100) / 100
      }))
      .sort((a, b) => b.totalAmount - a.totalAmount);
  }

  private getMonthlyTrends(expenses: ExpenseDocument[], userId: string): MonthlyTrendDto[] {
    const monthlyMap = new Map<string, {
      totalAmount: number;
      expenseCount: number;
    }>();

    for (const expense of expenses) {
      const userShare = expense.shares.get(userId) || 0;
      if (userShare === 0) continue;

      const monthKey = expense.createdAt.toISOString().substring(0, 7); // YYYY-MM

      if (monthlyMap.has(monthKey)) {
        const existing = monthlyMap.get(monthKey)!;
        existing.totalAmount += userShare;
        existing.expenseCount += 1;
      } else {
        monthlyMap.set(monthKey, {
          totalAmount: userShare,
          expenseCount: 1
        });
      }
    }

    return Array.from(monthlyMap.entries())
      .map(([month, data]) => ({
        month,
        totalAmount: Math.round(data.totalAmount * 100) / 100,
        expenseCount: data.expenseCount,
        averageAmount: Math.round((data.totalAmount / data.expenseCount) * 100) / 100
      }))
      .sort((a, b) => a.month.localeCompare(b.month));
  }

  private async getUserBreakdown(
    expenses: ExpenseDocument[], 
    groupId?: string
  ): Promise<UserSpendingDto[]> {
    const userMap = new Map<string, {
      userId: string;
      userName: string;
      totalPaid: number;
      totalOwed: number;
      expensesPaid: number;
      expensesParticipated: number;
    }>();

    for (const expense of expenses) {
      const paidByUserId = expense.paidBy._id.toString();
      const paidByUserName = (expense.paidBy as any).name || 'Unknown';

      // Initialize payer if not exists
      if (!userMap.has(paidByUserId)) {
        userMap.set(paidByUserId, {
          userId: paidByUserId,
          userName: paidByUserName,
          totalPaid: 0,
          totalOwed: 0,
          expensesPaid: 0,
          expensesParticipated: 0
        });
      }

      const payer = userMap.get(paidByUserId)!;
      payer.totalPaid += expense.amount;
      payer.expensesPaid += 1;
      payer.expensesParticipated += 1;

      // Process all participants
      for (const [participantId, shareAmount] of expense.shares.entries()) {
        if (participantId !== paidByUserId) {
          if (!userMap.has(participantId)) {
            // We need to fetch user name for participants
            const user = await this.userModel.findById(participantId);
            userMap.set(participantId, {
              userId: participantId,
              userName: user?.name || 'Unknown',
              totalPaid: 0,
              totalOwed: 0,
              expensesPaid: 0,
              expensesParticipated: 0
            });
          }

          const participant = userMap.get(participantId)!;
          participant.totalOwed += shareAmount;
          participant.expensesParticipated += 1;
        }
      }
    }

    return Array.from(userMap.values())
      .map(user => ({
        ...user,
        totalPaid: Math.round(user.totalPaid * 100) / 100,
        totalOwed: Math.round(user.totalOwed * 100) / 100,
        netBalance: Math.round((user.totalPaid - user.totalOwed) * 100) / 100
      }))
      .sort((a, b) => b.netBalance - a.netBalance);
  }

  private async generateInsights(
    expenses: ExpenseDocument[], 
    userId: string, 
    query: AnalyticsQueryDto
  ): Promise<SpendingInsightDto[]> {
    const insights: SpendingInsightDto[] = [];

    // Get previous period for comparison
    const previousPeriodQuery = { ...query };
    const { startDate, endDate } = this.getDateRange(query);
    const periodLength = endDate.getTime() - startDate.getTime();
    
    previousPeriodQuery.startDate = new Date(startDate.getTime() - periodLength).toISOString();
    previousPeriodQuery.endDate = startDate.toISOString();

    const previousExpenses = await this.expenseModel.find({
      createdAt: { 
        $gte: new Date(previousPeriodQuery.startDate), 
        $lte: new Date(previousPeriodQuery.endDate) 
      },
      $or: [
        { paidBy: new Types.ObjectId(userId) },
        { [`shares.${userId}`]: { $exists: true } }
      ]
    });

    const currentTotal = this.calculateTotalSpent(expenses, userId);
    const previousTotal = this.calculateTotalSpent(previousExpenses, userId);

    // Total spending change insight
    if (previousTotal > 0) {
      const changePercent = ((currentTotal - previousTotal) / previousTotal) * 100;
      if (Math.abs(changePercent) > 10) {
        insights.push({
          type: changePercent > 0 ? 'spending_increase' : 'spending_decrease',
          message: `Your spending ${changePercent > 0 ? 'increased' : 'decreased'} by ${Math.abs(changePercent).toFixed(1)}% compared to the previous period`,
          value: Math.round(changePercent * 10) / 10,
          context: 'total_spending'
        });
      }
    }

    // Category insights
    const categoryBreakdown = await this.getCategoryBreakdown(expenses, userId);
    const topCategory = categoryBreakdown[0];
    
    if (topCategory && topCategory.percentage > 40) {
      insights.push({
        type: 'category_dominance',
        message: `${topCategory.categoryName} accounts for ${topCategory.percentage.toFixed(1)}% of your spending`,
        value: topCategory.percentage,
        context: topCategory.categoryName
      });
    }

    // Frequency insights
    if (expenses.length > 0) {
      const daysInPeriod = Math.ceil(periodLength / (1000 * 60 * 60 * 24));
      const expensesPerDay = expenses.length / daysInPeriod;
      
      if (expensesPerDay > 2) {
        insights.push({
          type: 'high_frequency',
          message: `You're averaging ${expensesPerDay.toFixed(1)} expenses per day`,
          value: Math.round(expensesPerDay * 10) / 10,
          context: 'expense_frequency'
        });
      }
    }

    // Average expense insight
    const averageExpense = currentTotal / expenses.length;
    if (averageExpense > 100) {
      insights.push({
        type: 'high_average',
        message: `Your average expense is $${averageExpense.toFixed(2)}`,
        value: Math.round(averageExpense * 100) / 100,
        context: 'average_expense'
      });
    }

    return insights;
  }

  private async getPeriodComparison(
    userId: string, 
    query: AnalyticsQueryDto
  ): Promise<{
    totalSpentChange: number;
    expenseCountChange: number;
    averageExpenseChange: number;
  }> {
    const { startDate, endDate } = this.getDateRange(query);
    const periodLength = endDate.getTime() - startDate.getTime();
    
    // Get previous period data
    const previousStartDate = new Date(startDate.getTime() - periodLength);
    const previousEndDate = startDate;

    const previousExpenses = await this.expenseModel.find({
      createdAt: { $gte: previousStartDate, $lte: previousEndDate },
      $or: [
        { paidBy: new Types.ObjectId(userId) },
        { [`shares.${userId}`]: { $exists: true } }
      ]
    });

    const currentExpenses = await this.expenseModel.find({
      createdAt: { $gte: startDate, $lte: endDate },
      $or: [
        { paidBy: new Types.ObjectId(userId) },
        { [`shares.${userId}`]: { $exists: true } }
      ]
    });

    const currentTotal = this.calculateTotalSpent(currentExpenses, userId);
    const previousTotal = this.calculateTotalSpent(previousExpenses, userId);
    
    const currentAverage = currentExpenses.length > 0 ? currentTotal / currentExpenses.length : 0;
    const previousAverage = previousExpenses.length > 0 ? previousTotal / previousExpenses.length : 0;

    const totalSpentChange = previousTotal > 0 ? 
      ((currentTotal - previousTotal) / previousTotal) * 100 : 0;
    
    const expenseCountChange = previousExpenses.length > 0 ? 
      ((currentExpenses.length - previousExpenses.length) / previousExpenses.length) * 100 : 0;
    
    const averageExpenseChange = previousAverage > 0 ? 
      ((currentAverage - previousAverage) / previousAverage) * 100 : 0;

    return {
      totalSpentChange: Math.round(totalSpentChange * 10) / 10,
      expenseCountChange: Math.round(expenseCountChange * 10) / 10,
      averageExpenseChange: Math.round(averageExpenseChange * 10) / 10
    };
  }
}
