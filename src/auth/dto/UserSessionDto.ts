import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsString, Allow, IsOptional } from 'class-validator';
import { UserDto } from '../../users/dto/UserDto';
import { OrgSummaryDto } from './OrgSummaryDto';

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

  @ApiPropertyOptional({ description: 'Active organization ID embedded in JWT (first org auto-selected)' })
  @IsOptional()
  @IsString()
  organizationId?: string;

  @ApiPropertyOptional({ type: [OrgSummaryDto], description: 'All organizations the user belongs to' })
  @IsOptional()
  organizations?: OrgSummaryDto[];
}
