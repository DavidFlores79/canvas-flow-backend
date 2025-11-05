import { ApiProperty } from '@nestjs/swagger';
import { JwtHeaderDto } from './JwtHeaderDto';
import { JwtPayloadDto } from './JwtPayloadDto';

export class JwtDto {
  @ApiProperty({ type: JwtHeaderDto, required: true })
  header: JwtHeaderDto;

  @ApiProperty({ type: JwtPayloadDto, required: true })
  payload: JwtPayloadDto;
}
