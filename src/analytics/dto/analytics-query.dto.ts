import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsDateString, IsEnum } from 'class-validator';

export enum TimePeriod {
  WEEK = 'week',
  MONTH = 'month',
  QUARTER = 'quarter',
  YEAR = 'year',
  CUSTOM = 'custom'
}

export class AnalyticsQueryDto {
  @ApiProperty({
    description: 'Time period for analytics',
    enum: TimePeriod,
    example: TimePeriod.MONTH,
    required: false
  })
  @IsOptional()
  @IsEnum(TimePeriod)
  period?: TimePeriod = TimePeriod.MONTH;

  @ApiProperty({
    description: 'Start date for custom period (ISO string)',
    example: '2024-01-01T00:00:00.000Z',
    required: false
  })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiProperty({
    description: 'End date for custom period (ISO string)',
    example: '2024-12-31T23:59:59.999Z',
    required: false
  })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiProperty({
    description: 'Group ID to filter analytics (optional)',
    example: '507f1f77bcf86cd799439011',
    required: false
  })
  @IsOptional()
  @IsString()
  groupId?: string;
}

