import { ApiProperty } from '@nestjs/swagger';
import {
  IsBoolean,
  IsDateString,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsPositive,
} from 'class-validator';

import { Decimal } from '../../shared/decorator/Decimal';

export class UpdateInvestmentProductPayloadDto {
  @ApiProperty({ type: String, required: false })
  @IsOptional()
  name?: string;

  @ApiProperty({ type: String, required: false })
  @IsOptional()
  description?: string;

  @ApiProperty({ type: Number, required: false })
  @IsOptional()
  @IsInt()
  @IsPositive()
  termDays?: number;

  @ApiProperty({ type: Number, required: false })
  @IsOptional()
  @Decimal(5, 2)
  annualRate?: number;

  @ApiProperty({ type: Number, required: false })
  @IsOptional()
  @Decimal(5, 2)
  penaltyRate?: number;

  @ApiProperty({ type: Number, required: false })
  @IsOptional()
  @Decimal(12, 2)
  minAmount?: number;

  @ApiProperty({ type: Number, required: false })
  @IsOptional()
  @Decimal(12, 2)
  maxAmount?: number;

  @ApiProperty({ type: Boolean, required: false })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiProperty({ type: Date, required: true })
  @IsNotEmpty()
  @IsDateString()
  updatedAt: string;
}
