import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  Allow,
  IsEmail,
  IsEnum,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  Max,
  ValidateIf,
  IsMongoId,
} from 'class-validator';

import { Group, Status } from '../enum/UserEnum';

export class FilterUsersQueryDto {
  @ApiPropertyOptional({ type: String, required: false })
  @IsEmail()
  @IsOptional()
  @Allow()
  email?: string;

  @ApiPropertyOptional({ type: String, required: false })
  @IsOptional()
  @IsString()
  @Allow()
  phone?: string;

  @ApiPropertyOptional({ type: String, enum: Group, required: false })
  @IsEnum(Group)
  @IsOptional()
  @Allow()
  group?: string;

  @ApiPropertyOptional({ type: String, required: false })
  @IsString()
  @IsOptional()
  @Allow()
  rfc?: string;

  @ApiPropertyOptional({ type: String, required: false })
  @IsString()
  @IsOptional()
  @Allow()
  curp?: string;

  @ApiPropertyOptional({ type: String, required: false })
  @IsOptional()
  @IsString()
  @Allow()
  firstName?: string;

  @ApiPropertyOptional({ type: String, required: false })
  @IsOptional()
  @IsString()
  @Allow()
  middleName?: string;

  @ApiPropertyOptional({ type: String, required: false })
  @IsOptional()
  @IsString()
  @Allow()
  lastName?: string;

  @ApiPropertyOptional({ type: String, required: false })
  @IsOptional()
  @IsString()
  @Allow()
  secondLastName?: string;

  //fullName
  @ApiPropertyOptional({ type: String, required: false })
  @IsOptional()
  @IsString()
  @Allow()
  fullName?: string;

  @ApiPropertyOptional({ type: Number, required: false })
  @Transform(({ value }) => parseInt(String(value), 10))
  @IsPositive()
  @IsOptional()
  @IsNumber()
  @Allow()
  page?: number;

  @ApiPropertyOptional({ type: Number, required: false })
  @Transform(({ value }) => parseInt(String(value), 10))
  @IsPositive()
  @IsOptional()
  @IsNumber()
  @Max(100)
  @Allow()
  limit?: number;

  @ApiPropertyOptional({
    enum: Status,
    isArray: true,
    required: false,
  })
  @IsEnum(Status, { each: true })
  @IsOptional()
  @Allow()
  status?: Status;

  @ApiPropertyOptional({ type: String, required: false })
  @IsMongoId()
  @IsOptional()
  @ValidateIf((obj, value) => value !== 'null')
  @Allow()
  id?: string;
}
