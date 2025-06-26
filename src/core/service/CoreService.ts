import { Injectable } from '@nestjs/common';

import { name, version } from '../../../package.json';
import { SiteInformationDto } from '../dto/SiteInformationDto';
import {
  HealthCheckResult,
  HealthCheckService,
  TypeOrmHealthIndicator,
} from '@nestjs/terminus';

@Injectable()
export class CoreService {
  constructor(
    private healthCheckService: HealthCheckService,
    private db: TypeOrmHealthIndicator,
  ) {}

  async healthcheck(): Promise<HealthCheckResult> {
    return this.healthCheckService.check([() => this.db.pingCheck('database')]);
  }

  information(): SiteInformationDto {
    const information = new SiteInformationDto();
    information.name = name;
    information.version = version;
    return information;
  }
}
