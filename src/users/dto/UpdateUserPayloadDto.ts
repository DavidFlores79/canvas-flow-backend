import { ApiProperty, PartialType } from '@nestjs/swagger';
import { CreateUserPayloadDto } from './CreateUserPayloadDto';
import { IsDateString, IsNotEmpty } from 'class-validator';

export class UpdateUserPayloadDto extends PartialType(CreateUserPayloadDto) {
  @ApiProperty({ type: Date, required: true })
  @IsNotEmpty()
  @IsDateString()
  updatedAt: string;
}
