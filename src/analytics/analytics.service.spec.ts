import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { AnalyticsService } from './analytics.service';
import { Expense } from '../expenses/schemas/expense.schema';
import { User } from '../users/schemas/user.schema';
import { Category } from '../categories/schemas/category.schema';
import { Balance } from '../balances/schemas/balance.schema';
import { TimePeriod } from './dto/analytics-query.dto';
import { ExportFormat } from './dto/export-query.dto';

describe('AnalyticsService', () => {
  let service: AnalyticsService;
  let mockExpenseModel: any;
  let mockUserModel: any;
  let mockCategoryModel: any;
  let mockBalanceModel: any;

  const mockUserId = '507f1f77bcf86cd799439011';
  const mockGroupId = '507f1f77bcf86cd799439012';

  const mockExpenses = [
    {
      _id: '507f1f77bcf86cd799439013',
      amount: 100,
      description: 'Dinner',
      paidBy: { _id: mockUserId, name: 'John Doe' },
      categoryId: { _id: '507f1f77bcf86cd799439014', name: 'Food & Dining' },
      groupId: { _id: mockGroupId, name: 'Test Group' },
      shares: new Map([
        [mockUserId, 50],
        ['507f1f77bcf86cd799439015', 50]
      ]),
      createdAt: new Date('2024-03-15T12:00:00Z')
    },
    {
      _id: '507f1f77bcf86cd799439016',
      amount: 80,
      description: 'Coffee',
      paidBy: { _id: mockUserId, name: 'John Doe' },
      categoryId: { _id: '507f1f77bcf86cd799439014', name: 'Food & Dining' },
      groupId: { _id: mockGroupId, name: 'Test Group' },
      shares: new Map([
        [mockUserId, 40],
        ['507f1f77bcf86cd799439015', 40]
      ]),
      createdAt: new Date('2024-03-20T10:00:00Z')
    }
  ];

  beforeEach(async () => {
    mockExpenseModel = {
      find: jest.fn().mockReturnThis(),
      populate: jest.fn().mockReturnThis(),
      sort: jest.fn().mockReturnValue(mockExpenses),
    };

    mockUserModel = {
      findById: jest.fn().mockResolvedValue({
        _id: '507f1f77bcf86cd799439015',
        name: 'Jane Doe'
      })
    };

    mockCategoryModel = {};
    mockBalanceModel = {};

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AnalyticsService,
        {
          provide: getModelToken(Expense.name),
          useValue: mockExpenseModel,
        },
        {
          provide: getModelToken(User.name),
          useValue: mockUserModel,
        },
        {
          provide: getModelToken(Category.name),
          useValue: mockCategoryModel,
        },
        {
          provide: getModelToken(Balance.name),
          useValue: mockBalanceModel,
        },
      ],
    }).compile();

    service = module.get<AnalyticsService>(AnalyticsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getExpenseAnalytics', () => {
    it('should return analytics for a user', async () => {
      const query = {
        period: TimePeriod.MONTH,
        startDate: '2024-03-01T00:00:00Z',
        endDate: '2024-03-31T23:59:59Z'
      };

      const result = await service.getExpenseAnalytics(mockUserId, query);

      expect(result).toBeDefined();
      expect(result.totalSpent).toBe(90); // 50 + 40 from user's shares
      expect(result.totalExpenses).toBe(2);
      expect(result.averageExpense).toBe(45);
      expect(result.categoryBreakdown).toHaveLength(1);
      expect(result.categoryBreakdown[0].categoryName).toBe('Food & Dining');
      expect(result.monthlyTrends).toHaveLength(1);
      expect(result.monthlyTrends[0].month).toBe('2024-03');
    });

    it('should handle empty expense data', async () => {
      mockExpenseModel.sort.mockReturnValue([]);

      const query = {
        period: TimePeriod.MONTH
      };

      const result = await service.getExpenseAnalytics(mockUserId, query);

      expect(result.totalSpent).toBe(0);
      expect(result.totalExpenses).toBe(0);
      expect(result.averageExpense).toBe(0);
      expect(result.categoryBreakdown).toHaveLength(0);
    });
  });

  describe('exportAnalytics', () => {
    it('should export analytics as CSV', async () => {
      const query = {
        format: ExportFormat.CSV,
        startDate: '2024-03-01T00:00:00Z',
        endDate: '2024-03-31T23:59:59Z',
        includeBreakdown: true
      };

      const result = await service.exportAnalytics(mockUserId, query);

      expect(result.contentType).toBe('text/csv');
      expect(result.filename).toMatch(/expense-analytics-\d{4}-\d{2}-\d{2}\.csv/);
      expect(result.data).toContain('Expense Analytics Export');
      expect(result.data).toContain('SUMMARY');
      expect(result.data).toContain('CATEGORY BREAKDOWN');
    });

    it('should export analytics as JSON', async () => {
      const query = {
        format: ExportFormat.JSON,
        startDate: '2024-03-01T00:00:00Z',
        endDate: '2024-03-31T23:59:59Z',
        includeBreakdown: true
      };

      const result = await service.exportAnalytics(mockUserId, query);

      expect(result.contentType).toBe('application/json');
      expect(result.filename).toMatch(/expense-analytics-\d{4}-\d{2}-\d{2}\.json/);
      
      const parsedData = JSON.parse(result.data);
      expect(parsedData.exportInfo).toBeDefined();
      expect(parsedData.analytics).toBeDefined();
    });
  });
});

