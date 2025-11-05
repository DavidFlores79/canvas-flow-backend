import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, Allow } from 'class-validator';
import { UserDto } from '../../users/dto/UserDto';

export class UserSessionDto {
  @ApiProperty({ type: UserDto, required: true })
  @IsNotEmpty()
  @Allow()
  user: UserDto;

  @ApiProperty({ type: String, required: true })
  @IsNotEmpty()
  @IsString()
  @Allow()
  kid: string;

  @ApiProperty({ type: String, required: true })
  @IsNotEmpty()
  @IsString()
  @Allow()
  jwt: string;

  @ApiProperty({ type: String, required: false })
  @IsString()
  @Allow()
  refreshToken?: string;
}
