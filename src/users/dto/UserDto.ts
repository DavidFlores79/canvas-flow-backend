// src/users/dto/user.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsOptional,
  IsString,
  IsBoolean,
  IsEnum,
  Matches,
  IsPhoneNumber,
  Allow,
} from 'class-validator';
import { AddressDto } from './AddressDto';
import { Gender, Group } from '../enum/UserEnum';
import { User } from '../schemas/UserSchema';

export class UserDto {
  @ApiProperty({
    type: String,
    format: 'uuid',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  id: string;

  @ApiProperty({ type: String, example: 'John', required: false })
  @IsString()
  firstName?: string;

  @ApiProperty({ type: String, required: false, example: 'A. ' })
  @IsOptional()
  @IsString()
  middleName?: string;

  @ApiProperty({ type: String, example: 'Doe', required: false })
  @IsString()
  lastName?: string;

  @ApiProperty({ type: String, required: false, example: 'Smith' })
  @IsOptional()
  @IsString()
  secondLastName?: string;

  @ApiProperty({ type: String, example: 'John Doe', required: false })
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

  @ApiProperty({
    type: String,
    required: false,
    example: 'johnny@example.com',
    maxLength: 255,
  })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiProperty({
    type: String,
    example: '123-456-7890',
    required: true,
    maxLength: 50,
  })
  @IsPhoneNumber()
  @Allow()
  @IsString()
  phone: string;

  @ApiProperty({ type: String, example: 'male', required: false })
  @IsOptional()
  @IsEnum(Gender)
  gender?: Gender;

  @ApiProperty({
    type: String,
    example: 'merchant_user | disabled_user | merchant_user',
  })
  @IsEnum(Group)
  group: Group;

  @ApiProperty({ type: String, required: false })
  @IsOptional()
  @Matches(
    /^([A-Z,Ñ,&]{3,4}([0-9]{2})(0[1-9]|1[0-2])(0[1-9]|1[0-9]|2[0-9]|3[0-1])[A-Z|\d]{3})$/,
    { message: '$value is not a valid RFC' },
  )
  @IsString()
  rfc?: string;

  @ApiProperty({ type: String, required: false })
  @IsOptional()
  @IsString()
  curp?: string;

  @ApiProperty({ type: String, format: 'date', required: false })
  @IsOptional()
  birthDate?: Date;

  @ApiProperty({ type: String, required: false })
  @IsOptional()
  @IsString()
  nationality?: string;

  @ApiProperty({ type: String, required: false })
  @IsOptional()
  @IsString()
  countryOfBirth?: string;

  @ApiProperty({ type: String, required: false })
  @IsOptional()
  @IsString()
  stateOfBirth?: string;

  @ApiProperty({ type: String, required: false })
  @IsOptional()
  @IsString()
  riskLevel?: string;

  @ApiProperty({ type: Boolean })
  @IsBoolean()
  profileCompleted: boolean;

  @ApiProperty({ type: String })
  @IsString()
  status: string;

  @ApiProperty({ type: Boolean })
  @IsBoolean()
  verified: boolean;

  @ApiProperty({ type: AddressDto, required: false })
  @IsOptional()
  addresses?: AddressDto[];

  @ApiProperty({ type: Date, example: new Date().toISOString() })
  createdAt: Date;

  @ApiProperty({ type: Date, example: new Date().toISOString() })
  updatedAt: Date;

  static buildDto(user: User): UserDto {
    const dto = new UserDto();
    dto.id = user.id;
    dto.firstName = user.firstName;
    dto.middleName = user.middleName;
    dto.lastName = user.lastName;
    dto.secondLastName = user.secondLastName;
    dto.fullName = user.fullName;
    dto.displayName = user.displayName;
    dto.email = user.email;
    dto.phone = user.phone;
    dto.gender = user.gender as Gender;
    dto.nationality = user.nationality;
    dto.rfc = user.rfc;
    dto.curp = user.curp;
    dto.birthDate = user.birthDate;
    dto.addresses = user.addresses?.map((addr) => AddressDto.buildDto(addr));
    dto.countryOfBirth = user.countryOfBirth;
    dto.stateOfBirth = user.stateOfBirth;
    dto.riskLevel = user.riskLevel;
    dto.status = user.status;
    dto.createdAt = user.createdAt;
    dto.updatedAt = user.updatedAt;

    dto.group = user.group as Group;
    dto.profileCompleted = user.profileCompleted;
    dto.verified = user.verified;

    return dto;
  }
}
