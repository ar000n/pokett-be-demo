import { Controller, Get, Query, Request, Res } from '@nestjs/common';
import { 
  ApiTags, 
  ApiOperation, 
  ApiResponse, 
  ApiBearerAuth,
  ApiQuery 
} from '@nestjs/swagger';
import { Response } from 'express';
import { AnalyticsService } from './analytics.service';
import { AnalyticsQueryDto, TimePeriod } from './dto/analytics-query.dto';
import { ExpenseAnalyticsDto } from './dto/analytics-response.dto';
import { ExportQueryDto, ExportFormat } from './dto/export-query.dto';
import { RequestWithUser } from '../auth/interfaces/request-with-user.interface';

@ApiTags('analytics')
@ApiBearerAuth('Bearer Token')
@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('expenses')
  @ApiOperation({ 
    summary: 'Get expense analytics and insights',
    description: 'Provides comprehensive analytics including spending breakdowns by category, monthly trends, user comparisons, and personalized insights. Perfect for creating dashboards and helping users understand their spending patterns.'
  })
  @ApiQuery({
    name: 'period',
    enum: TimePeriod,
    description: 'Time period for analytics',
    required: false,
    example: TimePeriod.MONTH
  })
  @ApiQuery({
    name: 'startDate',
    type: 'string',
    description: 'Start date for custom period (ISO string)',
    required: false,
    example: '2024-01-01T00:00:00.000Z'
  })
  @ApiQuery({
    name: 'endDate',
    type: 'string',
    description: 'End date for custom period (ISO string)',
    required: false,
    example: '2024-12-31T23:59:59.999Z'
  })
  @ApiQuery({
    name: 'groupId',
    type: 'string',
    description: 'Filter analytics by specific group',
    required: false,
    example: '507f1f77bcf86cd799439011'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Analytics data retrieved successfully',
    type: ExpenseAnalyticsDto
  })
  @ApiResponse({ 
    status: 401, 
    description: 'Unauthorized - Invalid or missing authentication token'
  })
  @ApiResponse({ 
    status: 400, 
    description: 'Bad request - Invalid query parameters'
  })
  async getExpenseAnalytics(
    @Request() req: RequestWithUser,
    @Query() query: AnalyticsQueryDto
  ): Promise<ExpenseAnalyticsDto> {
    return this.analyticsService.getExpenseAnalytics(req.user.id, query);
  }

  @Get('categories')
  @ApiOperation({ 
    summary: 'Get category spending breakdown',
    description: 'Returns detailed spending breakdown by category for the specified time period. Useful for category-specific insights and budgeting.'
  })
  @ApiQuery({
    name: 'period',
    enum: TimePeriod,
    description: 'Time period for analytics',
    required: false,
    example: TimePeriod.MONTH
  })
  @ApiQuery({
    name: 'groupId',
    type: 'string',
    description: 'Filter by specific group',
    required: false
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Category breakdown retrieved successfully',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          categoryId: { type: 'string' },
          categoryName: { type: 'string' },
          totalAmount: { type: 'number' },
          expenseCount: { type: 'number' },
          percentage: { type: 'number' },
          averageAmount: { type: 'number' }
        }
      }
    }
  })
  async getCategoryBreakdown(
    @Request() req: RequestWithUser,
    @Query() query: AnalyticsQueryDto
  ) {
    const analytics = await this.analyticsService.getExpenseAnalytics(req.user.id, query);
    return analytics.categoryBreakdown;
  }

  @Get('trends')
  @ApiOperation({ 
    summary: 'Get monthly spending trends',
    description: 'Returns monthly spending trends showing how expenses change over time. Great for trend analysis and forecasting.'
  })
  @ApiQuery({
    name: 'period',
    enum: TimePeriod,
    description: 'Time period for trends (recommended: quarter or year)',
    required: false,
    example: TimePeriod.YEAR
  })
  @ApiQuery({
    name: 'groupId',
    type: 'string',
    description: 'Filter by specific group',
    required: false
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Monthly trends retrieved successfully',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          month: { type: 'string', example: '2024-03' },
          totalAmount: { type: 'number' },
          expenseCount: { type: 'number' },
          averageAmount: { type: 'number' }
        }
      }
    }
  })
  async getMonthlyTrends(
    @Request() req: RequestWithUser,
    @Query() query: AnalyticsQueryDto
  ) {
    const analytics = await this.analyticsService.getExpenseAnalytics(req.user.id, query);
    return analytics.monthlyTrends;
  }

  @Get('insights')
  @ApiOperation({ 
    summary: 'Get personalized spending insights',
    description: 'Returns AI-generated insights about spending patterns, trends, and recommendations. Perfect for helping users understand and improve their financial habits.'
  })
  @ApiQuery({
    name: 'period',
    enum: TimePeriod,
    description: 'Time period for insights',
    required: false,
    example: TimePeriod.MONTH
  })
  @ApiQuery({
    name: 'groupId',
    type: 'string',
    description: 'Filter by specific group',
    required: false
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Insights retrieved successfully',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          type: { type: 'string', example: 'spending_increase' },
          message: { type: 'string', example: 'Your spending increased by 15% compared to last month' },
          value: { type: 'number', example: 15.5 },
          context: { type: 'string', example: 'Food & Dining' }
        }
      }
    }
  })
  async getSpendingInsights(
    @Request() req: RequestWithUser,
    @Query() query: AnalyticsQueryDto
  ) {
    const analytics = await this.analyticsService.getExpenseAnalytics(req.user.id, query);
    return analytics.insights;
  }

  @Get('summary')
  @ApiOperation({ 
    summary: 'Get quick analytics summary',
    description: 'Returns a condensed summary of key metrics for dashboard widgets or quick overviews.'
  })
  @ApiQuery({
    name: 'period',
    enum: TimePeriod,
    description: 'Time period for summary',
    required: false,
    example: TimePeriod.MONTH
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Summary retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        totalSpent: { type: 'number' },
        totalExpenses: { type: 'number' },
        averageExpense: { type: 'number' },
        topCategory: { type: 'string' },
        topCategoryAmount: { type: 'number' },
        periodComparison: {
          type: 'object',
          properties: {
            totalSpentChange: { type: 'number' },
            expenseCountChange: { type: 'number' }
          }
        }
      }
    }
  })
  async getAnalyticsSummary(
    @Request() req: RequestWithUser,
    @Query() query: AnalyticsQueryDto
  ) {
    const analytics = await this.analyticsService.getExpenseAnalytics(req.user.id, query);
    const topCategory = analytics.categoryBreakdown[0];
    
    return {
      totalSpent: analytics.totalSpent,
      totalExpenses: analytics.totalExpenses,
      averageExpense: analytics.averageExpense,
      topCategory: topCategory?.categoryName || 'None',
      topCategoryAmount: topCategory?.totalAmount || 0,
      periodComparison: {
        totalSpentChange: analytics.periodComparison.totalSpentChange,
        expenseCountChange: analytics.periodComparison.expenseCountChange
      }
    };
  }

  @Get('export')
  @ApiOperation({ 
    summary: 'Export analytics data',
    description: 'Export comprehensive analytics data in various formats (CSV, JSON) for external analysis, reporting, or backup purposes.'
  })
  @ApiQuery({
    name: 'format',
    enum: ExportFormat,
    description: 'Export format',
    example: ExportFormat.CSV
  })
  @ApiQuery({
    name: 'startDate',
    type: 'string',
    description: 'Start date for export (ISO string)',
    example: '2024-01-01T00:00:00.000Z'
  })
  @ApiQuery({
    name: 'endDate',
    type: 'string',
    description: 'End date for export (ISO string)',
    example: '2024-12-31T23:59:59.999Z'
  })
  @ApiQuery({
    name: 'groupId',
    type: 'string',
    description: 'Filter by specific group',
    required: false
  })
  @ApiQuery({
    name: 'includeBreakdown',
    type: 'boolean',
    description: 'Include detailed breakdown in export',
    required: false,
    example: true
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Analytics data exported successfully',
    headers: {
      'Content-Type': {
        description: 'MIME type of the exported file',
        schema: { type: 'string' }
      },
      'Content-Disposition': {
        description: 'Attachment filename',
        schema: { type: 'string' }
      }
    }
  })
  @ApiResponse({ 
    status: 400, 
    description: 'Bad request - Invalid export parameters'
  })
  async exportAnalytics(
    @Request() req: RequestWithUser,
    @Query() query: ExportQueryDto,
    @Res() res: Response
  ) {
    const exportResult = await this.analyticsService.exportAnalytics(req.user.id, query);
    
    res.setHeader('Content-Type', exportResult.contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${exportResult.filename}"`);
    res.send(exportResult.data);
  }
}
