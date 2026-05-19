// ABOUTME: Unit tests for JwtStrategy — validates the passport-jwt strategy validate method
// ABOUTME: Ensures the strategy returns the payload unchanged for use as request.user

import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { JwtStrategy } from './JwtStrategy';
import { OrgRole } from '../../shared/enum/OrgRole';
import { JwtPayload } from '../interfaces/JwtPayload';

describe('JwtStrategy', () => {
  let strategy: JwtStrategy;

  const mockConfigService = {
    get: jest.fn((key: string) => {
      if (key === 'JWT_PRIVATE_KEY') return 'test-secret';
      if (key === 'JWT_ISSUER') return 'test-issuer';
      return undefined;
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JwtStrategy,
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    strategy = module.get<JwtStrategy>(JwtStrategy);
  });

  it('should be defined', () => {
    expect(strategy).toBeDefined();
  });

  it('should return the payload unchanged from validate()', () => {
    const payload: JwtPayload = {
      sub: 'user-id-123',
      organizationId: 'org-id-456',
      orgRole: OrgRole.Owner,
      aud: 'test-aud',
      iss: 'test-issuer',
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 1800,
      jti: 'some-jti',
    };

    const result = strategy.validate(payload);

    expect(result).toStrictEqual(payload);
  });
});
