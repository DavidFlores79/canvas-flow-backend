// ABOUTME: Passport JWT strategy that validates Bearer tokens and extracts the payload
// ABOUTME: Validates issuer, secret, and populates request.user with the decoded JWT claims

import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

import { EnvironmentVariables } from '../../config/EnvironmentVariables';
import { JwtPayload } from '../interfaces/JwtPayload';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly configService: ConfigService<EnvironmentVariables>,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey:
        configService.get<string>('JWT_PRIVATE_KEY') || 'default-secret-key',
      issuer: configService.get<string>('JWT_ISSUER'),
    });
  }

  validate(payload: JwtPayload): JwtPayload {
    return payload;
  }
}
