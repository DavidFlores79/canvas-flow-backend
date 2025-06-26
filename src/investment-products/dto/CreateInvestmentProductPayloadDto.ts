import { ApiProperty } from '@nestjs/swagger';
import {
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsPositive,
} from 'class-validator';

import { Decimal } from '../../shared/decorator/Decimal';

export class CreateInvestmentProductPayloadDto {
  @ApiProperty({ type: String, required: true })
  @IsNotEmpty()
  name: string;

  @ApiProperty({ type: String, required: true })
  @IsNotEmpty()
  description: string;

  @ApiProperty({ type: Number, required: true })
  @IsNotEmpty()
  @IsInt()
  @IsPositive()
  termDays: number;

  @ApiProperty({ type: Number, required: true })
  @IsNotEmpty()
  @IsPositive()
  @Decimal(5, 2)
  annualRate: number;

  @ApiProperty({ type: Number, required: true })
  @IsNotEmpty()
  @Decimal(5, 2)
  penaltyRate: number;

  @ApiProperty({ type: Number, required: true })
  @IsNotEmpty()
  @IsPositive()
  @Decimal(12, 2)
  minAmount: number;

  @ApiProperty({ type: Number, required: true })
  @IsNotEmpty()
  @IsPositive()
  @Decimal(12, 2)
  maxAmount: number;

  @ApiProperty({ type: Boolean, required: false })
  @IsOptional()
  @IsBoolean()
  isActive: boolean;
}
