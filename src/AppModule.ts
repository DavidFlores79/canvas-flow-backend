// ABOUTME: Root NestJS application module wiring all feature modules together
// ABOUTME: Registers global interceptor (HttpExceptionFilter) and Sentry filter

import './instrument';

import { Module } from '@nestjs/common';
import { APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { SentryGlobalFilter, SentryModule } from '@sentry/nestjs/setup';

import { CoreModule } from './core/CoreModule.js';
import { DatabaseModule } from './database/DatabaseModule';
import { AuthModule } from './auth/AuthModule';
import { UserModule } from './users/UserModule';
import { OrganizationsModule } from './organizations/OrganizationsModule';
import { WorkspacesModule } from './workspaces/WorkspacesModule';
import { ProjectsModule } from './projects/ProjectsModule';
import { LayersModule } from './layers/LayersModule';
import { AssetsModule } from './assets/AssetsModule';
import { CloudinaryModule } from './cloudinary/CloudinaryModule';
import { LeonardoModule } from './leonardo/LeonardoModule';
import { HttpExceptionFilter } from './interceptors/HttpExceptionFilter';

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
    UserModule,
    AuthModule,
    OrganizationsModule,
    WorkspacesModule,
    ProjectsModule,
    LayersModule,
    AssetsModule,
    CloudinaryModule,
    LeonardoModule,
  ],
  providers: [
    {
      provide: APP_FILTER,
      useClass: SentryGlobalFilter,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: HttpExceptionFilter,
    },
    CoreModule,
  ],
})
export class AppModule {}
