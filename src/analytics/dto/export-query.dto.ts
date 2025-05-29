import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsDateString, IsEnum } from 'class-validator';

export enum ExportFormat {
  CSV = 'csv',
  JSON = 'json',
  PDF = 'pdf'
}

export class ExportQueryDto {
  @ApiProperty({
    description: 'Export format',
    enum: ExportFormat,
    example: ExportFormat.CSV
  })
  @IsEnum(ExportFormat)
  format: ExportFormat;

  @ApiProperty({
    description: 'Start date for export (ISO string)',
    example: '2024-01-01T00:00:00.000Z'
  })
  @IsDateString()
  startDate: string;

  @ApiProperty({
    description: 'End date for export (ISO string)',
    example: '2024-12-31T23:59:59.999Z'
  })
  @IsDateString()
  endDate: string;

  @ApiProperty({
    description: 'Group ID to filter export (optional)',
    example: '507f1f77bcf86cd799439011',
    required: false
  })
  @IsOptional()
  @IsString()
  groupId?: string;

  @ApiProperty({
    description: 'Include detailed breakdown in export',
    example: true,
    required: false
  })
  @IsOptional()
  includeBreakdown?: boolean = true;
}

