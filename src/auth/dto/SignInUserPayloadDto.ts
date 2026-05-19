import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsString,
  Allow,
  IsEmail,
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

  @ApiProperty({ type: String, required: false })
  @IsOptional()
  @IsString()
  @Allow()
  password?: string;
}
