import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

import { AuthService } from './service/AuthService';
import { AuthController } from './controller/AuthController';
import { UserModule } from '../users/UserModule';
import { SmsValidationModule } from '../sms-validation/SmsValidationModule';
import { EnvironmentVariables } from '../config/EnvironmentVariables';

@Module({
  imports: [
    UserModule,
    SmsValidationModule,
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
  providers: [AuthService],
  exports: [AuthService, JwtModule],
})
export class AuthModule {}
