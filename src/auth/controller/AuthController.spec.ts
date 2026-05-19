// ABOUTME: Unit tests for AuthController covering all endpoints including switch-organization
// ABOUTME: Mocks AuthService and verifies correct delegation and response types

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, UnauthorizedException } from '@nestjs/common';

import { AuthController } from './AuthController';
import { AuthService } from '../service/AuthService';
import { UserSessionDto } from '../dto/UserSessionDto';
import { UserDto } from '../../users/dto/UserDto';
import { RefreshTokenResponseDto } from '../dto/RefeshTokenResponseDto';
import { JwtDto } from '../dto/JwtDto';
import { SignInUserPayloadDto } from '../dto/SignInUserPayloadDto';
import { SignUpPayloadDto } from '../dto/SignUpPayloadDto';
import { RefreshTokenPayloadDto } from '../dto/RefeshTokenPayloadDto';
import { ValidateJwtPayloadDto } from '../dto/ValidateJwtPayloadDto';
import { JwtPayloadDto } from '../dto/JwtPayloadDto';
import { JwtHeaderDto } from '../dto/JwtHeaderDto';
import { Group, Status } from '../../users/enum/UserEnum';
import { SwitchOrganizationPayloadDto } from '../dto/SwitchOrganizationPayloadDto';
import { JwtPayload } from '../interfaces/JwtPayload';
import { OrgRole } from '../../shared/enum/OrgRole';

describe('AuthController', () => {
  let app: INestApplication;
  let controller: AuthController;

  // Create a mock AuthService with all methods used by the controller
  const mockAuthService = {
    signIn: jest.fn(),
    signUp: jest.fn(),
    resendSignUpCode: jest.fn(),
    confirmSignUp: jest.fn(),
    recoverPassword: jest.fn(),
    resendRecoverPassword: jest.fn(),
    confirmRecoverPassword: jest.fn(),
    refreshToken: jest.fn(),
    validateJwt: jest.fn(),
    switchOrganization: jest.fn(),
  };

  // Example payloads / responses used in tests
  const fakeUserDto: UserDto = {
    id: 'user-1',
    firstName: 'Alice',
    middleName: undefined,
    lastName: 'Example',
    secondLastName: undefined,
    fullName: 'Alice Example',
    displayName: 'Alice',
    email: 'alice@example.com',
    phone: '5512345678',
    gender: undefined,
    rfc: undefined,
    curp: undefined,
    birthDate: undefined,
    nationality: undefined,
    countryOfBirth: undefined,
    stateOfBirth: undefined,
    riskLevel: 'low',
    status: 'registered' as Status,
    verified: false,
    profileCompleted: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    group: Group.CLIENT_USER,
    addresses: [],
  } as UserDto;

  const fakeSession: UserSessionDto = {
    user: fakeUserDto,
    kid: 'kid-1',
    jwt: 'access-token',
    refreshToken: 'refresh-token',
  } as unknown as UserSessionDto;

  const fakeRefreshResp: RefreshTokenResponseDto = {
    accessToken: 'new-access',
    refreshToken: 'new-refresh',
  };

  const fakeJwtDto: JwtDto = {
    header: { alg: 'HS256' } as JwtHeaderDto,
    payload: { sub: 'user-1' } as JwtPayloadDto,
  };

  const fakeJwtPayload: JwtPayload = {
    sub: 'user-1',
    organizationId: 'org-1',
    orgRole: OrgRole.Member,
    aud: 'aud',
    iss: 'iss',
    iat: 0,
    exp: 9999999999,
    jti: 'jti-1',
  };

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
      ],
    }).compile();

    app = module.createNestApplication();
    await app.init();

    controller = module.get<AuthController>(AuthController);
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  /**
   * signIn
   */
  describe('signIn', () => {
    it('returns a UserSessionDto when signIn succeeds', async () => {
      mockAuthService.signIn.mockResolvedValue(fakeSession);

      const payload: SignInUserPayloadDto = {
        email: 'alice@example.com',
        password: 'plain',
      };

      const res = await controller.signIn(payload);
      expect(mockAuthService.signIn).toHaveBeenCalledWith(payload);
      expect(res).toBeInstanceOf(Object);
      expect(res).toEqual(fakeSession);
      expect(res.jwt).toBe('access-token');
      expect(res.refreshToken).toBe('refresh-token');
    });

    it('propagates errors thrown by AuthService.signIn', async () => {
      mockAuthService.signIn.mockRejectedValue(
        new UnauthorizedException('bad creds'),
      );

      await expect(
        controller.signIn({
          email: 'x',
          password: 'y',
        }),
      ).rejects.toThrow(UnauthorizedException);

      expect(mockAuthService.signIn).toHaveBeenCalled();
    });
  });

  /**
   * signUp
   */
  describe('signUp', () => {
    it('returns a UserDto after successful signUp', async () => {
      mockAuthService.signUp.mockResolvedValue(fakeUserDto);

      const payload: SignUpPayloadDto = {
        firstName: 'Alice',
        lastName: 'Example',
        phone: '5512345678',
        password: 'pwd',
      } as SignUpPayloadDto;

      const res = await controller.signUp(payload);
      expect(mockAuthService.signUp).toHaveBeenCalledWith(payload);
      expect(res).toBeInstanceOf(Object);
      expect(res.id).toBe(fakeUserDto.id);
      expect(res.phone).toBe(fakeUserDto.phone);
    });

    it('propagates errors thrown by AuthService.signUp', async () => {
      mockAuthService.signUp.mockRejectedValue(new Error('conflict'));
      await expect(
        controller.signUp({
          firstName: 'Test',
          lastName: 'User',
          phone: '1234567890',
          phoneCode: 'MX',
          password: 'test',
          confirmPassword: 'test',
        }),
      ).rejects.toThrow(Error);
      expect(mockAuthService.signUp).toHaveBeenCalled();
    });
  });

  /**
   * resendSignUpCode
   */
  describe('resendSignUpCode', () => {
    it('calls AuthService.resendSignUpCode and returns void', async () => {
      mockAuthService.resendSignUpCode.mockResolvedValue(undefined);

      const payload = { id: 'user-1' };

      const res = await controller.resendSignUpCode(payload);
      expect(mockAuthService.resendSignUpCode).toHaveBeenCalledWith(payload);
      expect(res).toBeUndefined();
    });

    it('propagates errors thrown by AuthService.resendSignUpCode', async () => {
      mockAuthService.resendSignUpCode.mockRejectedValue(
        new Error('user not found'),
      );
      await expect(controller.resendSignUpCode({ id: 'x' })).rejects.toThrow(
        Error,
      );
      expect(mockAuthService.resendSignUpCode).toHaveBeenCalled();
    });
  });

  /**
   * confirmSignUp
   */
  describe('confirmSignUp', () => {
    it('returns UserDto when confirmation succeeds', async () => {
      mockAuthService.confirmSignUp.mockResolvedValue(fakeUserDto);

      const payload = {
        id: 'user-1',
        code: '1234',
      };

      const res = await controller.confirmSignUp(payload);
      expect(mockAuthService.confirmSignUp).toHaveBeenCalledWith(payload);
      expect(res).toEqual(fakeUserDto);
    });

    it('propagates errors thrown by AuthService.confirmSignUp', async () => {
      mockAuthService.confirmSignUp.mockRejectedValue(
        new Error('invalid code'),
      );
      await expect(
        controller.confirmSignUp({ id: 'user-1', code: '0000' }),
      ).rejects.toThrow(Error);
      expect(mockAuthService.confirmSignUp).toHaveBeenCalled();
    });
  });

  /**
   * recoverPassword
   */
  describe('recoverPassword', () => {
    it('calls AuthService.recoverPassword and returns void', async () => {
      mockAuthService.recoverPassword.mockResolvedValue(undefined);

      const payload = { phone: '5512345678' };

      const res = await controller.recoverPassword(payload);
      expect(mockAuthService.recoverPassword).toHaveBeenCalledWith(payload);
      expect(res).toBeUndefined();
    });

    it('propagates errors thrown by AuthService.recoverPassword', async () => {
      mockAuthService.recoverPassword.mockRejectedValue(
        new Error('user not found'),
      );
      await expect(
        controller.recoverPassword({ phone: '1234567890' }),
      ).rejects.toThrow(Error);
      expect(mockAuthService.recoverPassword).toHaveBeenCalled();
    });
  });

  /**
   * resendRecoverPassword
   */
  describe('resendRecoverPassword', () => {
    it('calls AuthService.resendRecoverPassword and returns void', async () => {
      mockAuthService.resendRecoverPassword.mockResolvedValue(undefined);

      const payload = { phone: '5512345678' };

      const res = await controller.resendRecoverPassword(payload);
      expect(mockAuthService.resendRecoverPassword).toHaveBeenCalledWith(
        payload,
      );
      expect(res).toBeUndefined();
    });

    it('propagates errors thrown by AuthService.resendRecoverPassword', async () => {
      mockAuthService.resendRecoverPassword.mockRejectedValue(
        new Error('too soon'),
      );
      await expect(
        controller.resendRecoverPassword({ phone: '1234567890' }),
      ).rejects.toThrow(Error);
      expect(mockAuthService.resendRecoverPassword).toHaveBeenCalled();
    });
  });

  /**
   * confirmRecoverPassword
   */
  describe('confirmRecoverPassword', () => {
    it('calls AuthService.confirmRecoverPassword and returns void', async () => {
      mockAuthService.confirmRecoverPassword.mockResolvedValue(undefined);

      const payload = {
        phone: '5512345678',
        code: '1234',
        password: 'newPassword123',
        confirmPassword: 'newPassword123',
      };

      const res = await controller.confirmRecoverPassword(payload);
      expect(mockAuthService.confirmRecoverPassword).toHaveBeenCalledWith(
        payload,
      );
      expect(res).toBeUndefined();
    });

    it('propagates errors thrown by AuthService.confirmRecoverPassword', async () => {
      mockAuthService.confirmRecoverPassword.mockRejectedValue(
        new Error('invalid code'),
      );
      await expect(
        controller.confirmRecoverPassword({
          phone: '1234567890',
          code: '0000',
          password: 'newPwd',
          confirmPassword: 'newPwd',
        }),
      ).rejects.toThrow(Error);
      expect(mockAuthService.confirmRecoverPassword).toHaveBeenCalled();
    });
  });

  /**
   * refreshToken
   */
  describe('refreshToken', () => {
    it('returns new tokens when refresh succeeds', async () => {
      mockAuthService.refreshToken.mockResolvedValue(fakeRefreshResp);

      const payload: RefreshTokenPayloadDto = {
        refreshToken: 'rtok',
        audience: 'aud',
      } as RefreshTokenPayloadDto;

      const res = await controller.refreshToken(payload);
      expect(mockAuthService.refreshToken).toHaveBeenCalledWith(payload);
      expect(res).toEqual(fakeRefreshResp);
    });

    it('propagates errors thrown by AuthService.refreshToken', async () => {
      mockAuthService.refreshToken.mockRejectedValue(
        new UnauthorizedException('bad refresh'),
      );
      await expect(
        controller.refreshToken({
          refreshToken: 'invalid-token',
          audience: 'aud',
        }),
      ).rejects.toThrow(UnauthorizedException);
      expect(mockAuthService.refreshToken).toHaveBeenCalled();
    });
  });

  /**
   * validateWebToken
   */
  describe('validateWebToken', () => {
    it('returns JwtDto when validateJwt succeeds', async () => {
      mockAuthService.validateJwt.mockResolvedValue(fakeJwtDto);

      const payload: ValidateJwtPayloadDto = {
        jwt: 'sometoken',
        audience: 'aud',
      } as ValidateJwtPayloadDto;

      const res = await controller.validateWebToken(payload);
      expect(mockAuthService.validateJwt).toHaveBeenCalledWith(payload);
      expect(res).toEqual(fakeJwtDto);
    });

    it('propagates errors thrown by AuthService.validateJwt', async () => {
      mockAuthService.validateJwt.mockRejectedValue(new Error('invalid token'));
      await expect(
        controller.validateWebToken({
          jwt: 'invalid-token',
          audience: 'aud',
        }),
      ).rejects.toThrow(Error);
      expect(mockAuthService.validateJwt).toHaveBeenCalled();
    });
  });

  /**
   * switchOrganization
   */
  describe('switchOrganization', () => {
    it('returns new tokens when switch succeeds', async () => {
      mockAuthService.switchOrganization.mockResolvedValue(fakeRefreshResp);

      const body: SwitchOrganizationPayloadDto = {
        organizationId: '507f1f77bcf86cd799439011',
      };
      const req = { user: fakeJwtPayload };

      const res = await controller.switchOrganization(req, body);

      expect(mockAuthService.switchOrganization).toHaveBeenCalledWith(
        fakeJwtPayload.sub,
        body.organizationId,
        undefined,
      );
      expect(res).toEqual(fakeRefreshResp);
    });

    it('passes audience when provided', async () => {
      mockAuthService.switchOrganization.mockResolvedValue(fakeRefreshResp);

      const body: SwitchOrganizationPayloadDto = {
        organizationId: '507f1f77bcf86cd799439011',
        audience: 'my-app',
      };
      const req = { user: fakeJwtPayload };

      await controller.switchOrganization(req, body);

      expect(mockAuthService.switchOrganization).toHaveBeenCalledWith(
        fakeJwtPayload.sub,
        body.organizationId,
        'my-app',
      );
    });

    it('propagates UnauthorizedException when user is not a member', async () => {
      mockAuthService.switchOrganization.mockRejectedValue(
        new UnauthorizedException('Not a member of this organization'),
      );

      const body: SwitchOrganizationPayloadDto = {
        organizationId: '507f1f77bcf86cd799439011',
      };
      const req = { user: fakeJwtPayload };

      await expect(controller.switchOrganization(req, body)).rejects.toThrow(
        UnauthorizedException,
      );
      expect(mockAuthService.switchOrganization).toHaveBeenCalled();
    });
  });
});
