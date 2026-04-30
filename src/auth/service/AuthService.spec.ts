// auth.service.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException, ConflictException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { randomUUID } from 'crypto';

// Mock bcrypt module
jest.mock('bcrypt');

import { AuthService } from './AuthService';
import { UserService } from '../../users/service/UserService';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { SmsValidationService } from '../../sms-validation/service/SmsValidationService';

import { Status, Group } from '../../users/enum/UserEnum';
import { User } from '../../users/schemas/UserSchema';
import { RefreshTokenResponseDto } from '../dto/RefeshTokenResponseDto';
import { ValidateUserPasswordPayloadDto } from '../dto/ValidateUserPasswordPayloadDto';
import { JwtDto } from '../dto/JwtDto';
import { SignUpPayloadDto } from '../dto/SignUpPayloadDto';

describe('AuthService', () => {
  let service: AuthService;

  const mockUserService = {
    findValidatedUser: jest.fn(),
    findAll: jest.fn(),
    create: jest.fn(),
    findById: jest.fn(),
  };

  const mockSmsValidationService = {
    sendSmsCode: jest.fn(),
    validateSmsCode: jest.fn(),
    resendSmsCode: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn(),
  };

  const mockJwtService = {
    signAsync: jest.fn(),
    verifyAsync: jest.fn(),
  };

  // Common fake user used across tests
  const fakeUser: Partial<User> = {
    id: randomUUID(),
    firstName: 'Test',
    lastName: 'User',
    email: 'test@example.com',
    phone: '5512345678',
    password: 'hashed-password', // this value will be compared by bcrypt mocks
    group: Group.CLIENT_USER,
    status: Status.VALIDATED,
    addresses: [],
    createdAt: new Date(),
    updatedAt: new Date(),
    fullName: 'Test User',
    displayName: 'Test',
  };

  beforeAll(async () => {
    // Default config values used by AuthService
    mockConfigService.get.mockImplementation((key: string) => {
      if (key === 'JWT_ISSUER') return 'test-issuer';
      if (key === 'JWT_PRIVATE_KEY') return 'test-secret';
      return undefined;
    });

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UserService, useValue: mockUserService },
        { provide: SmsValidationService, useValue: mockSmsValidationService },

        { provide: ConfigService, useValue: mockConfigService },
        { provide: JwtService, useValue: mockJwtService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  /**
   * signIn
   */
  describe('signIn', () => {
    it('should sign in successfully and return UserSessionDto with tokens', async () => {
      // arrange
      mockUserService.findValidatedUser.mockResolvedValue(fakeUser);
      // bcrypt.compare should resolve true to simulate valid password
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      // jwtService.signAsync returns access and refresh tokens
      mockJwtService.signAsync.mockResolvedValueOnce('access-token');
      mockJwtService.signAsync.mockResolvedValueOnce('refresh-token');

      // act
      const session = await service.signIn({
        email: 'test@example.com',
        password: 'plain',
        group: Group.CLIENT_USER,
        audience: 'aud',
      });

      // assert
      expect(mockUserService.findValidatedUser).toHaveBeenCalledWith({
        email: 'test@example.com',
        group: Group.CLIENT_USER,
      });
      expect(bcrypt.compare).toHaveBeenCalledWith('plain', fakeUser.password);
      expect(mockJwtService.signAsync).toHaveBeenCalled();
      expect(session).toHaveProperty('jwt', 'access-token');
      expect(session).toHaveProperty('refreshToken', 'refresh-token');
      expect(session).toHaveProperty('kid');
      expect(session).toHaveProperty('user');
      expect(session.user?.email).toEqual(fakeUser.email);
    });

    it('should throw UnauthorizedException when user not found', async () => {
      mockUserService.findValidatedUser.mockResolvedValue(null);

      await expect(
        service.signIn({
          email: 'noone@example.com',
          password: 'x',
          group: Group.CLIENT_USER,
          audience: 'aud',
        }),
      ).rejects.toThrow(UnauthorizedException);

      expect(mockUserService.findValidatedUser).toHaveBeenCalledWith({
        email: 'noone@example.com',
        group: Group.CLIENT_USER,
      });
    });

    it('should throw UnauthorizedException when password invalid', async () => {
      mockUserService.findValidatedUser.mockResolvedValue(fakeUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(
        service.signIn({
          email: 'test@example.com',
          password: 'wrong',
          group: Group.CLIENT_USER,
          audience: 'aud',
        }),
      ).rejects.toThrow(UnauthorizedException);

      expect(bcrypt.compare).toHaveBeenCalledWith('wrong', fakeUser.password);
    });
  });

  /**
   * signUp
   */
  describe('signUp', () => {
    it('should throw ConflictException when user already registered', async () => {
      // arrange: findAll returns one doc with a registered status
      mockUserService.findAll.mockResolvedValue({
        docs: [{ ...fakeUser, status: Status.REGISTERED }],
        total: 1,
        page: 1,
        pages: 1,
        limit: 10,
      });

      // act / assert
      await expect(
        service.signUp({
          firstName: 'X',
          lastName: 'Y',
          phone: '5512345678',
          password: 'p',
        } as SignUpPayloadDto),
      ).rejects.toThrow(ConflictException);

      expect(mockUserService.findAll).toHaveBeenCalledWith({
        phone: '5512345678',
        page: 1,
        limit: 100,
      });
    });

    it('should create a new user and return UserDto', async () => {
      // arrange: no registered user exists
      mockUserService.findAll.mockResolvedValue({
        docs: [],
        total: 0,
        page: 1,
        pages: 1,
        limit: 100,
      });

      const created = { ...fakeUser, id: 'new-id', status: Status.REGISTERED };
      mockUserService.create.mockResolvedValue(created);

      // act
      const result = await service.signUp({
        firstName: 'New',
        lastName: 'User',
        phone: '5599999999',
        password: 'pass',
      } as SignUpPayloadDto);

      // assert
      expect(mockUserService.findAll).toHaveBeenCalled();
      expect(mockUserService.create).toHaveBeenCalled();
      expect(result).toHaveProperty('id', created.id);
      expect(result).toHaveProperty('phone', created.phone);
      expect(result).toHaveProperty('status', created.status);
    });
  });

  /**
   * refreshToken
   */
  describe('refreshToken', () => {
    it('should refresh tokens when refresh token is valid and user exists', async () => {
      const refreshToken = 'rtoken';
      const audience = 'aud';
      const payload = { sub: fakeUser.id, jti: 'kid' };

      // mock verify -> payload
      mockJwtService.verifyAsync.mockResolvedValue(payload as any);
      mockUserService.findById.mockResolvedValue(fakeUser);
      // signAsync first call -> access token, second -> refresh token
      mockJwtService.signAsync
        .mockResolvedValueOnce('new-access')
        .mockResolvedValueOnce('new-refresh');

      const resp: RefreshTokenResponseDto = await service.refreshToken({
        refreshToken,
        audience,
      });

      expect(mockJwtService.verifyAsync).toHaveBeenCalledWith(refreshToken, {
        issuer: 'test-issuer',
        audience,
        secret: 'test-secret',
      });
      expect(mockUserService.findById).toHaveBeenCalledWith(
        String(payload.sub),
      );
      expect(resp).toEqual({
        accessToken: 'new-access',
        refreshToken: 'new-refresh',
      });
    });

    it('should throw UnauthorizedException when verify returns invalid payload (no sub)', async () => {
      mockJwtService.verifyAsync.mockResolvedValue({});

      await expect(
        service.refreshToken({ refreshToken: 'x', audience: 'aud' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException when user not found', async () => {
      const payload = { sub: 'nonexistent', jti: 'kid' };
      mockJwtService.verifyAsync.mockResolvedValue(payload as any);
      mockUserService.findById.mockResolvedValue(null);

      await expect(
        service.refreshToken({ refreshToken: 'x', audience: 'aud' }),
      ).rejects.toThrow(UnauthorizedException);

      expect(mockUserService.findById).toHaveBeenCalledWith(
        String(payload.sub),
      );
    });

    it('should throw UnauthorizedException when verifyAsync throws', async () => {
      mockJwtService.verifyAsync.mockRejectedValue(new Error('invalid'));

      await expect(
        service.refreshToken({ refreshToken: 'bad', audience: 'aud' }),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  /**
   * validatePassword
   */
  describe('validatePassword', () => {
    it('returns { isValid: true } when password matches and user is VALIDATED', async () => {
      const id = fakeUser.id as string;
      mockUserService.findById.mockResolvedValue({
        ...fakeUser,
        status: Status.VALIDATED,
      });
      (bcrypt.compareSync as jest.Mock).mockReturnValue(true);

      const res = await service.validatePassword(id, {
        password: 'plain',
      } as ValidateUserPasswordPayloadDto);
      expect(res).toEqual({ isValid: true });
      expect(mockUserService.findById).toHaveBeenCalledWith(id);
    });

    it('throws UnauthorizedException when user not found', async () => {
      mockUserService.findById.mockResolvedValue(null);
      await expect(
        service.validatePassword('no-id', { password: 'p' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('throws UnauthorizedException when user status is not VALIDATED', async () => {
      mockUserService.findById.mockResolvedValue({
        ...fakeUser,
        status: Status.REGISTERED,
      });
      await expect(
        service.validatePassword(fakeUser.id as string, { password: 'p' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('returns { isValid: false } when compareSync returns false', async () => {
      mockUserService.findById.mockResolvedValue({
        ...fakeUser,
        status: Status.VALIDATED,
        password: 'hashed',
      });
      (bcrypt.compareSync as jest.Mock).mockReturnValue(false);

      const res = await service.validatePassword(fakeUser.id as string, {
        password: 'bad',
      });
      expect(res).toEqual({ isValid: false });
    });
  });

  /**
   * validateJwt
   */
  describe('validateJwt', () => {
    it('should return JwtDto with header and payload from jwtService.verifyAsync', async () => {
      const jwt = 'sometoken';
      const audience = 'aud';
      const decoded = {
        header: { alg: 'HS256', kid: 'kid' },
        payload: { sub: fakeUser.id, aud: audience },
      };
      // jwtService.verifyAsync returns a complete object when complete: true
      mockJwtService.verifyAsync.mockResolvedValue(decoded);

      // call
      const result: JwtDto = await service.validateJwt({
        jwt,
        audience,
      });

      expect(mockJwtService.verifyAsync).toHaveBeenCalledWith(jwt, {
        issuer: 'test-issuer',
        audience,
        complete: true,
        secret: 'test-secret',
      });

      expect(result).toBeInstanceOf(JwtDto);
      expect(result.header).toEqual(decoded.header);
      expect(result.payload).toEqual(decoded.payload);
    });
  });
});
