import { ApiProperty } from '@nestjs/swagger';
import { Group } from '../../users/enum/UserEnum';
import {
  IsNotEmpty,
  IsString,
  Allow,
  IsEmail,
  IsEnum,
  IsPhoneNumber,
  IsOptional,
  ValidateIf,
} from 'class-validator';

export class SignInUserPayloadDto {
  @ApiProperty({ type: String, required: false })
  @IsOptional()
  @IsEmail()
  @Allow()
  email?: string;

  @ApiProperty({ type: String, required: false })
  @ValidateIf((params: SignInUserPayloadDto) => !params.email)
  @IsPhoneNumber()
  @IsNotEmpty()
  @Allow()
  phone?: string;

  @ApiProperty({ type: String, enum: Group, required: true })
  @IsEnum(Group)
  @IsNotEmpty()
  @Allow()
  group: string;

  @ApiProperty({ type: String, required: false })
  @IsOptional()
  @IsString()
  @Allow()
  password?: string;

  @ApiProperty({ type: String, required: true })
  @IsNotEmpty()
  @IsString()
  @Allow()
  audience: string;
}
