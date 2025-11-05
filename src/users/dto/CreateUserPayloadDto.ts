// src/users/dto/create-user.payload.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import {
  Allow,
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';
import { AddressDto } from './AddressDto';
import { Gender, Group, Status } from '../enum/UserEnum';

export class CreateUserPayloadDto {
  @ApiProperty({ type: String, example: 'John', required: true })
  @IsOptional()
  @IsString()
  firstName?: string;

  @ApiProperty({ type: String, required: false, example: 'A. ' })
  @IsOptional()
  @IsString()
  middleName?: string;

  @ApiProperty({ type: String, example: 'Doe', required: true })
  @IsOptional()
  @IsString()
  lastName?: string;

  @ApiProperty({ type: String, required: false, example: 'Smith' })
  @IsOptional()
  @IsString()
  secondLastName?: string;

  @ApiProperty({ type: String, example: 'John A. Doe Smith', required: true })
  @IsOptional()
  @IsString()
  fullName?: string;

  @ApiProperty({
    type: String,
    required: false,
    example: 'Johnny',
    maxLength: 255,
  })
  @IsOptional()
  @IsString()
  displayName?: string;

  @ApiProperty({ type: String, required: false, example: 'johnny@example.com' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiProperty({ type: String, example: '+1234567890', required: true })
  @IsString()
  @IsNotEmpty()
  phone: string;

  @ApiProperty({ type: String, required: true, example: 'StrongP@ssw0rd!' })
  @IsNotEmpty()
  @IsString()
  @Allow()
  password: string;

  @ApiProperty({ type: String, required: false, example: '1990-01-01' })
  @IsOptional()
  @IsString()
  birthDate?: string;

  @ApiProperty({ type: String, required: false, example: 'MX' })
  @IsOptional()
  @IsString()
  countryOfBirth?: string;

  // nationality
  @ApiProperty({ type: String, required: false, example: 'MX' })
  @IsOptional()
  @IsString()
  nationality?: string;

  @ApiProperty({ type: String, required: false, example: '123 Main St' })
  @IsOptional()
  @IsString()
  rfc?: string;

  @ApiProperty({ type: String, required: false, example: 'ABCD123456HDFGHI12' })
  @IsOptional()
  @IsString()
  curp?: string;

  @ApiProperty({ type: String, required: false, example: 'male' })
  @IsOptional()
  @IsEnum(Gender)
  gender?: Gender;

  @ApiProperty({ type: String, example: 'client_user', required: false })
  @IsEnum(Group)
  group?: Group;

  @ApiProperty({ type: AddressDto, required: false })
  @IsOptional()
  addresses?: AddressDto[];

  @ApiProperty({ type: Boolean, default: false, required: false })
  @IsOptional()
  profileCompleted?: boolean;

  @ApiProperty({ type: Boolean, default: false, required: false })
  @IsOptional()
  verified?: boolean;

  @ApiProperty({ type: String, enum: Status, required: true })
  @IsEnum(Status)
  @IsNotEmpty()
  @Allow()
  status: string;

  @ApiProperty({ type: String, required: false })
  @IsOptional()
  @IsString()
  riskLevel?: string;
}
