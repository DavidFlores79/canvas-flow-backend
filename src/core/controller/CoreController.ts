import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Controller, Get, HttpCode, HttpStatus } from '@nestjs/common';
import { HealthCheck } from '@nestjs/terminus';

import { CoreService } from '../service/CoreService';
import { SiteInformationDto } from '../dto/SiteInformationDto';

@ApiTags('core')
@Controller()
export class CoreController {
  constructor(private coreService: CoreService) {}

  @Get('healthcheck')
  @HealthCheck()
  @ApiOperation({
    operationId: 'healthCheck',
    summary: 'healthCheck',
    description: 'healthCheck',
  })
  healthcheck() {
    return this.coreService.healthcheck();
  }

  @Get('information')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    operationId: 'getServiceInformation',
    summary: 'Get service information',
    description: 'Get service information',
  })
  @ApiOkResponse({
    description: 'Return service information',
    type: SiteInformationDto,
  })
  information(): SiteInformationDto {
    return this.coreService.information();
  }
}
