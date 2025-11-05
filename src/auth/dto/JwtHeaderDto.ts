import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, Allow } from 'class-validator';

export class JwtHeaderDto {
  @ApiProperty({ type: String, required: true })
  @IsNotEmpty()
  @IsString()
  @Allow()
  alg: string;

  @ApiProperty({ type: String, required: true })
  @IsNotEmpty()
  @IsString()
  @Allow()
  typ: string;

  @ApiProperty({ type: String, required: true })
  @IsNotEmpty()
  @IsString()
  @Allow()
  kid: string;
}
