import { ApiProperty } from '@nestjs/swagger';

export class CategorySpendingDto {
  @ApiProperty({
    description: 'Category ID',
    example: '507f1f77bcf86cd799439011'
  })
  categoryId: string;

  @ApiProperty({
    description: 'Category name',
    example: 'Food & Dining'
  })
  categoryName: string;

  @ApiProperty({
    description: 'Total amount spent in this category',
    example: 450.75
  })
  totalAmount: number;

  @ApiProperty({
    description: 'Number of expenses in this category',
    example: 12
  })
  expenseCount: number;

  @ApiProperty({
    description: 'Percentage of total spending',
    example: 35.2
  })
  percentage: number;

  @ApiProperty({
    description: 'Average expense amount in this category',
    example: 37.56
  })
  averageAmount: number;
}

export class MonthlyTrendDto {
  @ApiProperty({
    description: 'Month and year',
    example: '2024-03'
  })
  month: string;

  @ApiProperty({
    description: 'Total amount spent in the month',
    example: 1250.50
  })
  totalAmount: number;

  @ApiProperty({
    description: 'Number of expenses in the month',
    example: 25
  })
  expenseCount: number;

  @ApiProperty({
    description: 'Average expense amount for the month',
    example: 50.02
  })
  averageAmount: number;
}

export class UserSpendingDto {
  @ApiProperty({
    description: 'User ID',
    example: '507f1f77bcf86cd799439011'
  })
  userId: string;

  @ApiProperty({
    description: 'User name',
    example: 'John Doe'
  })
  userName: string;

  @ApiProperty({
    description: 'Total amount paid by user',
    example: 850.25
  })
  totalPaid: number;

  @ApiProperty({
    description: 'Total amount owed by user',
    example: 320.75
  })
  totalOwed: number;

  @ApiProperty({
    description: 'Net balance (positive = owed money, negative = owes money)',
    example: 529.50
  })
  netBalance: number;

  @ApiProperty({
    description: 'Number of expenses paid by user',
    example: 15
  })
  expensesPaid: number;

  @ApiProperty({
    description: 'Number of expenses user participated in',
    example: 28
  })
  expensesParticipated: number;
}

export class SpendingInsightDto {
  @ApiProperty({
    description: 'Type of insight',
    example: 'category_increase'
  })
  type: string;

  @ApiProperty({
    description: 'Insight message',
    example: 'Your dining expenses increased by 25% compared to last month'
  })
  message: string;

  @ApiProperty({
    description: 'Insight value (percentage, amount, etc.)',
    example: 25.5
  })
  value: number;

  @ApiProperty({
    description: 'Category or context related to the insight',
    example: 'Food & Dining'
  })
  context?: string;
}

export class ExpenseAnalyticsDto {
  @ApiProperty({
    description: 'Time period for the analytics',
    example: 'month'
  })
  period: string;

  @ApiProperty({
    description: 'Start date of the analytics period',
    example: '2024-03-01T00:00:00.000Z'
  })
  startDate: string;

  @ApiProperty({
    description: 'End date of the analytics period',
    example: '2024-03-31T23:59:59.999Z'
  })
  endDate: string;

  @ApiProperty({
    description: 'Total amount spent in the period',
    example: 2450.75
  })
  totalSpent: number;

  @ApiProperty({
    description: 'Total number of expenses in the period',
    example: 45
  })
  totalExpenses: number;

  @ApiProperty({
    description: 'Average expense amount',
    example: 54.46
  })
  averageExpense: number;

  @ApiProperty({
    description: 'Spending breakdown by category',
    type: [CategorySpendingDto]
  })
  categoryBreakdown: CategorySpendingDto[];

  @ApiProperty({
    description: 'Monthly spending trends',
    type: [MonthlyTrendDto]
  })
  monthlyTrends: MonthlyTrendDto[];

  @ApiProperty({
    description: 'User spending breakdown',
    type: [UserSpendingDto]
  })
  userBreakdown: UserSpendingDto[];

  @ApiProperty({
    description: 'Spending insights and recommendations',
    type: [SpendingInsightDto]
  })
  insights: SpendingInsightDto[];

  @ApiProperty({
    description: 'Comparison with previous period',
    example: {
      totalSpentChange: 15.5,
      expenseCountChange: -2.3,
      averageExpenseChange: 18.2
    }
  })
  periodComparison: {
    totalSpentChange: number;
    expenseCountChange: number;
    averageExpenseChange: number;
  };
}

