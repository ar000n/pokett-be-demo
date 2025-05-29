import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AnalyticsController } from './analytics.controller';
import { AnalyticsService } from './analytics.service';
import { Expense, ExpenseSchema } from '../expenses/schemas/expense.schema';
import { User, UserSchema } from '../users/schemas/user.schema';
import { Category, CategorySchema } from '../categories/schemas/category.schema';
import { Balance, BalanceSchema } from '../balances/schemas/balance.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Expense.name, schema: ExpenseSchema },
      { name: User.name, schema: UserSchema },
      { name: Category.name, schema: CategorySchema },
      { name: Balance.name, schema: BalanceSchema },
    ]),
  ],
  controllers: [AnalyticsController],
  providers: [AnalyticsService],
  exports: [AnalyticsService],
})
export class AnalyticsModule {}

