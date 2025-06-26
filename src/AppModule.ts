import './instrument';

import { Module } from '@nestjs/common';
import { APP_FILTER } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { SentryGlobalFilter, SentryModule } from '@sentry/nestjs/setup';

import { CoreModule } from './core/CoreModule.js';
import { InvestmentProductModule } from './investment-products/InvestmentProductModule';
import { DatabaseModule } from './database/DatabaseModule';

@Module({
  imports: [
    SentryModule.forRoot(),
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [
        `environment/${process.env.DEPLOY_ENV}.env`,
        'environment/base.env',
      ],
    }),
    DatabaseModule,
    CoreModule,
    InvestmentProductModule,
  ],
  providers: [
    {
      provide: APP_FILTER,
      useClass: SentryGlobalFilter,
    },
    CoreModule,
  ],
})
export class AppModule {}
