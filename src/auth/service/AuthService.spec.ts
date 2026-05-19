// ABOUTME: Unit tests for AuthService covering auth flows, token management, and org switching
// ABOUTME: Mocks all external dependencies (UserService, JwtService, SmsValidationService, orgMemberModel)

// auth.service.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException, ConflictException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { randomUUID } from 'crypto';
import { getModelToken } from '@nestjs/mongoose';
import { Types } from 'mongoose';

// Mock bcrypt module
jest.mock('bcrypt');

import { AuthService } from './AuthService';
import { UserService } from '../../users/service/UserService';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { SmsValidationService } from '../../sms-validation/service/SmsValidationService';
import { OrganizationMember } from '../../organizations/schemas/OrganizationMemberSchema';
import { OrgRole } from '../../shared/enum/OrgRole';

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
    updateById: jest.fn(),
  };

  const mockSmsValidationService = {
    sendSmsCode: jest.fn(),
    validateSmsCode: jest.fn(),
    resendSmsCode: jest.fn(),
    validateOnlySmsCode: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn(),
  };

  const mockJwtService = {
    signAsync: jest.fn(),
    verifyAsync: jest.fn(),
  };

  const mockOrgMemberFindChain = {
    sort: jest.fn().mockReturnThis(),
    lean: jest.fn().mockReturnThis(),
    exec: jest.fn(),
  };

  const mockOrgMemberModel = {
    findOne: jest.fn(),
    find: jest.fn().mockReturnValue(mockOrgMemberFindChain),
  };

  // Common fake user used across tests
  const fakeUser: Partial<User> = {
    id: new Types.ObjectId().toHexString(),
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
        {
          provide: getModelToken(OrganizationMember.name),
          useValue: mockOrgMemberModel,
        },
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
    const fakeMembership = {
      organizationId: new Types.ObjectId(),
      userId: new Types.ObjectId(),
      role: OrgRole.Owner,
    };

    beforeEach(() => {
      mockOrgMemberFindChain.exec.mockResolvedValue([fakeMembership]);
    });

    it('should sign in successfully and return UserSessionDto with tokens and org context', async () => {
      // arrange
      mockUserService.findValidatedUser.mockResolvedValue(fakeUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      mockJwtService.signAsync.mockResolvedValueOnce('access-token');
      mockJwtService.signAsync.mockResolvedValueOnce('refresh-token');

      // act
      const session = await service.signIn({
        email: 'test@example.com',
        password: 'plain',
      });

      // assert
      expect(mockUserService.findValidatedUser).toHaveBeenCalledWith({
        email: 'test@example.com',
      });
      expect(bcrypt.compare).toHaveBeenCalledWith('plain', fakeUser.password);
      expect(mockJwtService.signAsync).toHaveBeenCalled();
      expect(session).toHaveProperty('jwt', 'access-token');
      expect(session).toHaveProperty('refreshToken', 'refresh-token');
      expect(session).toHaveProperty('kid');
      expect(session).toHaveProperty('user');
      expect(session.user?.email).toEqual(fakeUser.email);
      expect(session.organizationId).toBe(fakeMembership.organizationId.toString());
      expect(session.organizations).toHaveLength(1);
      expect(session.organizations?.[0].role).toBe(OrgRole.Owner);
    });

    it('should sign in with no org context when user has no memberships', async () => {
      mockUserService.findValidatedUser.mockResolvedValue(fakeUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      mockJwtService.signAsync.mockResolvedValueOnce('access-token');
      mockJwtService.signAsync.mockResolvedValueOnce('refresh-token');
      mockOrgMemberFindChain.exec.mockResolvedValue([]);

      const session = await service.signIn({
        email: 'test@example.com',
        password: 'plain',
      });

      expect(session.organizationId).toBeUndefined();
      expect(session.organizations).toHaveLength(0);
    });

    it('should throw UnauthorizedException when user not found', async () => {
      mockUserService.findValidatedUser.mockResolvedValue(null);

      await expect(
        service.signIn({
          email: 'noone@example.com',
          password: 'x',
        }),
      ).rejects.toThrow(UnauthorizedException);

      expect(mockUserService.findValidatedUser).toHaveBeenCalledWith({
        email: 'noone@example.com',
      });
    });

    it('should throw UnauthorizedException when password invalid', async () => {
      mockUserService.findValidatedUser.mockResolvedValue(fakeUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(
        service.signIn({
          email: 'test@example.com',
          password: 'wrong',
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

  /**
   * switchOrganization
   */
  describe('switchOrganization', () => {
    const userId = new Types.ObjectId().toString();
    const organizationId = new Types.ObjectId().toString();

    const fakeMembership = {
      _id: new Types.ObjectId(),
      userId: new Types.ObjectId(userId),
      organizationId: new Types.ObjectId(organizationId),
      role: OrgRole.Member,
    };

    it('returns new tokens when user is a member of the org', async () => {
      const leanMock = jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue(fakeMembership),
      });
      mockOrgMemberModel.findOne.mockReturnValue({ lean: leanMock });
      mockUserService.findById.mockResolvedValue(fakeUser);
      mockJwtService.signAsync
        .mockResolvedValueOnce('new-access')
        .mockResolvedValueOnce('new-refresh');

      const result: RefreshTokenResponseDto = await service.switchOrganization(
        userId,
        organizationId,
        'aud',
      );

      expect(mockOrgMemberModel.findOne).toHaveBeenCalledWith({
        userId: expect.any(Types.ObjectId),
        organizationId: expect.any(Types.ObjectId),
      });
      expect(mockUserService.findById).toHaveBeenCalledWith(userId);
      expect(result).toEqual({
        accessToken: 'new-access',
        refreshToken: 'new-refresh',
      });
    });

    it('throws UnauthorizedException when membership not found', async () => {
      const leanMock = jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });
      mockOrgMemberModel.findOne.mockReturnValue({ lean: leanMock });

      await expect(
        service.switchOrganization(userId, organizationId),
      ).rejects.toThrow(new UnauthorizedException('Not a member of this organization'));
    });

    it('throws UnauthorizedException when user not found after membership check', async () => {
      const leanMock = jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue(fakeMembership),
      });
      mockOrgMemberModel.findOne.mockReturnValue({ lean: leanMock });
      mockUserService.findById.mockResolvedValue(null);

      await expect(
        service.switchOrganization(userId, organizationId),
      ).rejects.toThrow(new UnauthorizedException('User not found'));
    });
  });

  /**
   * confirmSignUp
   */
  describe('confirmSignUp', () => {
    it('should verify user and return UserDto', async () => {
      const userId = 'user-id-123';
      mockSmsValidationService.validateSmsCode.mockResolvedValue({ userId });
      mockUserService.findById
        .mockResolvedValueOnce({ ...fakeUser, id: userId })
        .mockResolvedValueOnce({ ...fakeUser, id: userId, verified: true, status: Status.VALIDATED });
      mockUserService.updateById.mockResolvedValue(undefined);

      const result = await service.confirmSignUp({ id: 'sms-id', code: '123456' });

      expect(result.email).toBe(fakeUser.email);
    });

    it('should throw NotFoundException when user not found after SMS validation', async () => {
      const { NotFoundException } = await import('@nestjs/common');
      mockSmsValidationService.validateSmsCode.mockResolvedValue({ userId: 'missing-user' });
      mockUserService.findById.mockResolvedValue(null);

      await expect(service.confirmSignUp({ id: 'sms-id', code: '000000' })).rejects.toThrow(NotFoundException);
    });
  });

  /**
   * resendSignUpCode
   */
  describe('resendSignUpCode', () => {
    it('should resend sign-up code successfully', async () => {
      mockUserService.findById.mockResolvedValue(fakeUser);
      mockSmsValidationService.resendSmsCode.mockResolvedValue(undefined);

      await expect(service.resendSignUpCode({ id: fakeUser.id as string })).resolves.not.toThrow();
      expect(mockSmsValidationService.resendSmsCode).toHaveBeenCalled();
    });

    it('should throw NotFoundException when user not found', async () => {
      const { NotFoundException } = await import('@nestjs/common');
      mockUserService.findById.mockResolvedValue(null);

      await expect(service.resendSignUpCode({ id: 'missing' })).rejects.toThrow(NotFoundException);
    });
  });

  /**
   * recoverPassword
   */
  describe('recoverPassword', () => {
    it('should initiate password recovery successfully', async () => {
      mockUserService.findAll.mockResolvedValue({
        docs: [{ ...fakeUser, status: Status.VALIDATED }],
      });
      mockSmsValidationService.sendSmsCode.mockResolvedValue(undefined);

      await expect(service.recoverPassword({ phone: fakeUser.phone as string })).resolves.not.toThrow();
      expect(mockSmsValidationService.sendSmsCode).toHaveBeenCalled();
    });

    it('should throw UnprocessableEntityException when user not found', async () => {
      const { UnprocessableEntityException } = await import('@nestjs/common');
      mockUserService.findAll.mockResolvedValue({ docs: [] });

      await expect(service.recoverPassword({ phone: '0000000000' })).rejects.toThrow(UnprocessableEntityException);
    });

    it('should throw UnprocessableEntityException when user not validated', async () => {
      const { UnprocessableEntityException } = await import('@nestjs/common');
      mockUserService.findAll.mockResolvedValue({
        docs: [{ ...fakeUser, status: Status.REGISTERED }],
      });

      await expect(service.recoverPassword({ phone: fakeUser.phone as string })).rejects.toThrow(UnprocessableEntityException);
    });
  });

  /**
   * resendRecoverPassword
   */
  describe('resendRecoverPassword', () => {
    it('should resend recovery code successfully', async () => {
      mockUserService.findAll.mockResolvedValue({
        docs: [{ ...fakeUser, status: Status.VALIDATED }],
      });
      mockSmsValidationService.resendSmsCode.mockResolvedValue(undefined);

      await expect(service.resendRecoverPassword({ phone: fakeUser.phone as string })).resolves.not.toThrow();
    });

    it('should throw UnprocessableEntityException when user not found', async () => {
      const { UnprocessableEntityException } = await import('@nestjs/common');
      mockUserService.findAll.mockResolvedValue({ docs: [] });

      await expect(service.resendRecoverPassword({ phone: '0000000000' })).rejects.toThrow(UnprocessableEntityException);
    });

    it('should throw UnprocessableEntityException when user not validated', async () => {
      const { UnprocessableEntityException } = await import('@nestjs/common');
      mockUserService.findAll.mockResolvedValue({
        docs: [{ ...fakeUser, status: Status.REGISTERED }],
      });

      await expect(service.resendRecoverPassword({ phone: fakeUser.phone as string })).rejects.toThrow(UnprocessableEntityException);
    });
  });

  /**
   * confirmRecoverPassword
   */
  describe('confirmRecoverPassword', () => {
    it('should complete password recovery successfully', async () => {
      mockUserService.findAll.mockResolvedValue({
        docs: [{ ...fakeUser, status: Status.VALIDATED }],
      });
      mockUserService.updateById.mockResolvedValue(undefined);
      mockSmsValidationService.validateSmsCode.mockResolvedValue({});

      await expect(
        service.confirmRecoverPassword({
          phone: fakeUser.phone as string,
          code: '123456',
          password: 'NewPass123!',
          confirmPassword: 'NewPass123!',
        }),
      ).resolves.not.toThrow();
    });

    it('should throw UnprocessableEntityException when user not found', async () => {
      const { UnprocessableEntityException } = await import('@nestjs/common');
      mockUserService.findAll.mockResolvedValue({ docs: [] });

      await expect(
        service.confirmRecoverPassword({ phone: '0000', code: '000', password: 'x', confirmPassword: 'x' }),
      ).rejects.toThrow(UnprocessableEntityException);
    });
  });

  /**
   * validateSmsCode
   */
  describe('validateSmsCode', () => {
    it('should return IsValidSmsCodeDto from smsValidationService', async () => {
      mockSmsValidationService.validateOnlySmsCode.mockResolvedValue({ isValid: true });

      const result = await service.validateSmsCode({ id: 'user-id', code: '123456' });

      expect(result).toEqual({ isValid: true });
      expect(mockSmsValidationService.validateOnlySmsCode).toHaveBeenCalledWith({
        id: 'user-id',
        code: '123456',
      });
    });
  });
});
