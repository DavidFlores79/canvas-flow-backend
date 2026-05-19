// ABOUTME: Authentication NestJS module wiring JWT, users, SMS validation, and org membership
// ABOUTME: Provides AuthService, JwtModule, JwtAuthGuard, and JwtStrategy for use in other modules

import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { PassportModule } from '@nestjs/passport';

import { AuthService } from './service/AuthService';
import { AuthController } from './controller/AuthController';
import { JwtAuthGuard } from './guard/JwtAuthGuard';
import { JwtStrategy } from './strategy/JwtStrategy';
import { UserModule } from '../users/UserModule';
import { SmsValidationModule } from '../sms-validation/SmsValidationModule';
import { EnvironmentVariables } from '../config/EnvironmentVariables';
import {
  OrganizationMember,
  OrganizationMemberSchema,
} from '../organizations/schemas/OrganizationMemberSchema';

@Module({
  imports: [
    UserModule,
    SmsValidationModule,
    PassportModule,
    MongooseModule.forFeature([
      { name: OrganizationMember.name, schema: OrganizationMemberSchema },
    ]),
    JwtModule.registerAsync({
      useFactory: (configService: ConfigService<EnvironmentVariables>) => ({
        secret:
          configService.get('JWT_SECRET', { infer: true }) ||
          'default-secret-key',
        signOptions: {
          expiresIn: configService.get('JWT_EXPIRY', { infer: true }) || '30m',
        },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, JwtAuthGuard],
  exports: [AuthService, JwtModule, JwtAuthGuard],
})
export class AuthModule {}
