# 📊 Analytics Module

The Analytics Module provides comprehensive expense analytics and insights for the Pokett expense sharing application. This module transforms raw expense data into actionable insights, helping users understand their spending patterns and make better financial decisions.

## 🚀 Features

### Core Analytics
- **Expense Breakdown by Category**: Detailed spending analysis across different expense categories
- **Monthly Trends**: Track spending patterns over time with month-by-month comparisons
- **User Spending Analysis**: Compare spending patterns within groups
- **Period Comparisons**: Automatic comparison with previous periods to identify trends
- **Personalized Insights**: AI-generated insights about spending habits and recommendations

### Export Capabilities
- **CSV Export**: Structured data export for spreadsheet analysis
- **JSON Export**: Machine-readable format for integration with other tools
- **Customizable Date Ranges**: Export data for any time period
- **Detailed Breakdowns**: Include or exclude detailed analytics in exports

## 📋 API Endpoints

### GET `/analytics/expenses`
Get comprehensive expense analytics for the authenticated user.

**Query Parameters:**
- `period` (optional): Time period (`week`, `month`, `quarter`, `year`, `custom`)
- `startDate` (optional): Start date for custom period (ISO string)
- `endDate` (optional): End date for custom period (ISO string)
- `groupId` (optional): Filter by specific group

**Response:** Complete analytics object with breakdowns, trends, and insights.

### GET `/analytics/categories`
Get category spending breakdown only.

**Query Parameters:** Same as above

**Response:** Array of category spending data.

### GET `/analytics/trends`
Get monthly spending trends.

**Query Parameters:** Same as above

**Response:** Array of monthly trend data.

### GET `/analytics/insights`
Get personalized spending insights.

**Query Parameters:** Same as above

**Response:** Array of insight objects with recommendations.

### GET `/analytics/summary`
Get quick analytics summary for dashboards.

**Query Parameters:** Same as above

**Response:** Condensed summary with key metrics.

### GET `/analytics/export`
Export analytics data in various formats.

**Query Parameters:**
- `format`: Export format (`csv`, `json`)
- `startDate`: Start date (required, ISO string)
- `endDate`: End date (required, ISO string)
- `groupId` (optional): Filter by specific group
- `includeBreakdown` (optional): Include detailed breakdown

**Response:** File download with appropriate headers.

## 💡 Business Value

### For Users
- **Spending Awareness**: Clear visibility into where money is being spent
- **Trend Analysis**: Understand spending patterns over time
- **Budget Planning**: Data-driven insights for better financial planning
- **Group Insights**: Compare spending within groups for fairness

### For Business
- **User Engagement**: Rich analytics increase app stickiness
- **Premium Features**: Analytics can be tiered for monetization
- **Data Insights**: Aggregate data provides business intelligence
- **Export Value**: Professional export features justify premium pricing

## 🔧 Technical Implementation

### Architecture
- **Service Layer**: `AnalyticsService` handles all business logic
- **Controller Layer**: `AnalyticsController` provides REST API endpoints
- **DTOs**: Comprehensive data transfer objects for type safety
- **Database Queries**: Optimized MongoDB aggregation queries

### Key Technologies
- **MongoDB Aggregation**: Efficient data processing
- **TypeScript**: Full type safety throughout
- **NestJS**: Modular, scalable architecture
- **Swagger**: Complete API documentation

### Performance Considerations
- **Indexed Queries**: Database queries use indexed fields
- **Caching Ready**: Service methods can be easily cached
- **Pagination**: Large datasets handled efficiently
- **Async Processing**: Non-blocking operations throughout

## 📈 Analytics Insights Generated

### Spending Patterns
- **Category Dominance**: Identifies categories taking up large portions of budget
- **Spending Increases/Decreases**: Compares with previous periods
- **High Frequency**: Alerts for unusually high expense frequency
- **Average Expense**: Insights about typical expense amounts

### Trend Analysis
- **Monthly Comparisons**: Month-over-month spending changes
- **Seasonal Patterns**: Identify recurring spending patterns
- **Growth Trends**: Long-term spending trajectory analysis

### Group Dynamics
- **User Comparisons**: Who pays most/least in groups
- **Balance Analysis**: Net creditor/debtor status
- **Participation Rates**: How often users participate in group expenses

## 🎯 Future Enhancements

### Planned Features
- **Predictive Analytics**: Forecast future spending based on trends
- **Budget Tracking**: Set and monitor spending budgets by category
- **Goal Setting**: Financial goals with progress tracking
- **Advanced Insights**: Machine learning-powered recommendations

### Integration Opportunities
- **Bank Account Integration**: Automatic expense categorization
- **Calendar Integration**: Link expenses to events and trips
- **Receipt Scanning**: OCR-powered expense entry
- **Notification System**: Spending alerts and reminders

## 🧪 Testing

The module includes comprehensive unit tests covering:
- Analytics calculation accuracy
- Export functionality
- Edge cases (empty data, invalid dates)
- Error handling

Run tests with:
```bash
npm run test -- analytics.service.spec.ts
```

## 📊 Usage Examples

### Get Monthly Analytics
```typescript
GET /analytics/expenses?period=month
```

### Export Year Data as CSV
```typescript
GET /analytics/export?format=csv&startDate=2024-01-01T00:00:00Z&endDate=2024-12-31T23:59:59Z
```

### Get Group-Specific Insights
```typescript
GET /analytics/insights?groupId=507f1f77bcf86cd799439011&period=quarter
```

This analytics module provides the foundation for transforming Pokett from a simple expense tracker into a comprehensive financial insights platform, adding significant business value and user engagement.

