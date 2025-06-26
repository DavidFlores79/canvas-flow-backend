import { ApiProperty } from '@nestjs/swagger';
import { IsArray } from 'class-validator';

export class PaginationResultDto<T> {
  @ApiProperty({ type: Object, isArray: true, required: true })
  @IsArray()
  docs: T[];

  @ApiProperty({ type: Number })
  total: number;

  @ApiProperty({ type: Number })
  limit?: number;

  @ApiProperty({ type: Number })
  page?: number;

  @ApiProperty({ type: Number })
  pages?: number;

  @ApiProperty({ type: Boolean })
  hasPrevPage: boolean;

  @ApiProperty({ type: Boolean })
  hasNextPage: boolean;

  @ApiProperty({ type: Number })
  prevPage?: number;

  @ApiProperty({ type: Number })
  nextPage?: number;

  @ApiProperty({ type: Number })
  pagingCounter?: number;
}
