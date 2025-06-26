import { ApiProperty } from '@nestjs/swagger';

import { InvestmentProduct } from '../entity/InvestmentProduct';

export class InvestmentProductDto {
  @ApiProperty({ type: String, required: true })
  id: string;

  @ApiProperty({ type: String, required: true })
  name: string;

  @ApiProperty({ type: String, required: true })
  description: string;

  @ApiProperty({ type: Number, required: true })
  termDays: number;

  @ApiProperty({ type: Number, required: true })
  annualRate: number;

  @ApiProperty({ type: Number, required: true })
  penaltyRate: number;

  @ApiProperty({ type: Number, required: true })
  minAmount: number;

  @ApiProperty({ type: Number, required: true })
  maxAmount: number;

  @ApiProperty({ type: Boolean, required: true })
  isActive: boolean;

  @ApiProperty({ type: Date, required: true })
  createdAt: string;

  @ApiProperty({ type: Date, required: true })
  updatedAt: string;

  static buildDto(investmentProduct: InvestmentProduct): InvestmentProductDto {
    const dto = new InvestmentProductDto();
    dto.id = investmentProduct.id;
    dto.name = investmentProduct.name;
    dto.description = investmentProduct.description;
    dto.termDays = investmentProduct.termDays;
    dto.annualRate = investmentProduct.annualRate;
    dto.penaltyRate = investmentProduct.penaltyRate;
    dto.minAmount = investmentProduct.minAmount;
    dto.maxAmount = investmentProduct.maxAmount;
    dto.isActive = investmentProduct.isActive;
    dto.createdAt = investmentProduct.createdAt.toISOString();
    dto.updatedAt = investmentProduct.updatedAt.toISOString();

    return dto;
  }
}
