import { ApiProperty } from '@nestjs/swagger';

export class SiteInformationDto {
  @ApiProperty({ type: String, required: true })
  name: string;

  @ApiProperty({ type: String, required: true })
  version: string;
}
