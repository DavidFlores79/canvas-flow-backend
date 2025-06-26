import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsBoolean, IsInt, IsOptional, Min } from 'class-validator';

export class FilterInvestmentProductQueryDto {
  @ApiProperty({ type: String, required: false })
  @IsOptional()
  name: string;

  @ApiProperty({ type: Boolean, required: false })
  @Transform(({ value }) => value == 'true')
  @IsOptional()
  @IsBoolean()
  isActive: boolean;

  @ApiProperty({ type: Number, required: false })
  @Transform(({ value }) => parseInt(value as string, 10))
  @IsOptional()
  @IsInt()
  @Min(1)
  page: number = 1;

  @ApiProperty({ type: Number, required: false })
  @IsOptional()
  @Transform(({ value }) => parseInt(value as string, 10))
  @IsInt()
  @Min(1)
  limit: number = 10;
}
