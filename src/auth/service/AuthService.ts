// ABOUTME: Authentication service handling sign-in, sign-up, token management, and org switching
// ABOUTME: Integrates with UserService, SmsValidationService, and OrganizationMember for JWT issuance

import {
  Injectable,
  Logger,
  UnauthorizedException,
  ConflictException,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { SignInUserPayloadDto } from '../dto/SignInUserPayloadDto';
import { UserSessionDto } from '../dto/UserSessionDto';
import { Gender, Group, Status } from '../../users/enum/UserEnum';
import { JwtService } from '@nestjs/jwt';
import { User } from '../../users/schemas/UserSchema';
import * as bcrypt from 'bcrypt';
import { randomUUID } from 'crypto';
import { ConfigService } from '@nestjs/config';
import { EnvironmentVariables } from '../../config/EnvironmentVariables';
import { UserDto } from '../../users/dto/UserDto';
import { AddressDto } from '../../users/dto/AddressDto';
import { ValidateUserPasswordPayloadDto } from '../dto/ValidateUserPasswordPayloadDto';
import { ValidationPasswordDto } from '../dto/ValidationPasswordDto';
import { ValidateJwtPayloadDto } from '../dto/ValidateJwtPayloadDto';
import { JwtDto } from '../dto/JwtDto';
import { Jwt } from '../interfaces/Jwt';
import { UserService } from '../../users/service/UserService';
import { SignUpPayloadDto } from '../dto/SignUpPayloadDto';
import { CreateUserPayloadDto } from '../../users/dto/CreateUserPayloadDto';
import { RefreshTokenPayloadDto } from '../dto/RefeshTokenPayloadDto';
import { RefreshTokenResponseDto } from '../dto/RefeshTokenResponseDto';
import { JwtPayload } from '../interfaces/JwtPayload';
import { SmsValidationService } from '../../sms-validation/service/SmsValidationService';
import { SmsValidationAction } from '../../sms-validation/enum/SmsValidationAction';
import { SmsValidationStatus } from '../../sms-validation/enum/SmsValidationStatus';
import { ConfirmSignUpPayloadDto } from '../../sms-validation/dto/ConfirmSignUpPayloadDto';
import { RecoverPasswordPayloadDto } from '../dto/RecoverPasswordPayloadDto';
import { CreateSmsValidationPayloadDto } from '../../sms-validation/dto/CreateSmsValidationPayloadDto';
import { ResendSignUpCodePayloadDto } from '../../sms-validation/dto/ResendSignUpCodePayloadDto';
import { CompleteRecoverPasswordPayloadDto } from '../dto/CompleteRecoverPasswordPayloadDto';
import { IsValidSmsCodeDto } from '../../sms-validation/dto/IsValidSmCodeDto';
import { ValidateSmsRequestPayloadDto } from '../../sms-validation/dto/ValidateSmsRequestPayloadDto';
import {
  OrganizationMember,
  OrganizationMemberDocument,
} from '../../organizations/schemas/OrganizationMemberSchema';
import { OrgRole } from '../../shared/enum/OrgRole';

@Injectable()
export class AuthService {
  private readonly accessTokenExpiry = '30m';
  private readonly refreshTokenExpiry = '24h';
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private userService: UserService,
    private smsValidationService: SmsValidationService,
    private readonly configService: ConfigService<EnvironmentVariables>,
    private readonly jwtService: JwtService,
    @InjectModel(OrganizationMember.name)
    private readonly orgMemberModel: Model<OrganizationMemberDocument>,
  ) {}

  async signIn(
    signInUserPayloadDto: SignInUserPayloadDto,
  ): Promise<UserSessionDto> {
    this.logger.debug('Sign-in attempt', {
      email: signInUserPayloadDto.email,
      phone: signInUserPayloadDto.phone,
    });

    const { password, email, phone } = signInUserPayloadDto;

    const lookup: Partial<Pick<User, 'email' | 'phone'>> = {};
    if (email) lookup.email = email;
    if (phone) lookup.phone = phone;

    const user = await this.userService.findValidatedUser(lookup);
    if (!user) {
      this.logger.warn('Sign-in failed: User not found', lookup);
      throw new UnauthorizedException('Invalid credentials');
    }

    if (password) {
      if (!user.password) {
        throw new UnauthorizedException('Invalid credentials');
      }
      const isValid = await bcrypt.compare(password, user.password);
      if (!isValid) {
        this.logger.warn('Sign-in failed: Invalid password', {
          userId: user.id,
        });
        throw new UnauthorizedException('Invalid credentials');
      }
    }

    const { accessToken, refreshToken, kid } = await this.generateTokensForUser(user);

    this.logger.log(`User signed in successfully: ${user.id}`);

    const userSession = new UserSessionDto();
    userSession.user = this.buildUserDto(user);
    userSession.kid = kid;
    userSession.jwt = accessToken;
    userSession.refreshToken = refreshToken;

    return userSession;
  }

  async signUp(signUpPayloadDto: SignUpPayloadDto): Promise<UserDto> {
    this.logger.debug('Sign-up attempt', {
      phone: signUpPayloadDto.phone,
    });

    const getClients = await this.userService.findAll({
      phone: signUpPayloadDto.phone,
      page: 1,
      limit: 100,
    });

    const alreadyRegisteredClient = getClients.docs.find((client) =>
      [Status.REGISTERED, Status.VALIDATED, Status.BLOCKED].includes(
        client.status as Status,
      ),
    );

    if (alreadyRegisteredClient) {
      this.logger.warn('Sign-up failed: User already registered', {
        phone: signUpPayloadDto.phone,
        existingUserId: alreadyRegisteredClient.id,
      });
      throw new ConflictException('The user is already registered');
    }

    const payload: CreateUserPayloadDto = {
      firstName: signUpPayloadDto.firstName,
      lastName: signUpPayloadDto.lastName,
      secondLastName: signUpPayloadDto.secondLastName,
      group: Group.CLIENT_USER,
      status: Status.REGISTERED,
      nationality: signUpPayloadDto.phoneCode,
      password: signUpPayloadDto.password,
      phone: signUpPayloadDto.phone,
      riskLevel: 'low',
    };

    const data = await this.userService.create(payload);

    this.logger.log(`New user registered: ${data.id}, phone: ${data.phone}`);

    await this.smsValidationService.sendSmsCode({
      userId: data.id,
      phone: signUpPayloadDto.phone,
      smsAction: SmsValidationAction.CONFIRM_SIGN_UP,
      smsStatus: SmsValidationStatus.PENDING,
    });

    return {
      id: data.id,
      firstName: data.firstName,
      middleName: data.middleName,
      lastName: data.lastName,
      secondLastName: data.secondLastName,
      fullName: data.fullName,
      displayName: data.displayName,
      email: data.email,
      phone: data.phone,
      group: data.group as Group,
      riskLevel: data.riskLevel,
      status: data.status,
      verified: data.verified,
      profileCompleted: data.profileCompleted,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    };
  }

  async confirmSignUp(
    confirmSignUpPayloadDto: ConfirmSignUpPayloadDto,
  ): Promise<UserDto> {
    this.logger.debug('Confirm sign-up attempt', {
      id: confirmSignUpPayloadDto.id,
    });

    const validationData = await this.smsValidationService.validateSmsCode(
      confirmSignUpPayloadDto,
    );

    const userData = await this.userService.findById(validationData.userId);
    if (!userData) {
      this.logger.error('Confirm sign-up failed: User not found', {
        validationUserId: validationData.userId,
      });
      throw new NotFoundException('User not found');
    }

    // Update user with verified status
    await this.userService.updateById(userData.id, {
      verified: true,
      status: Status.VALIDATED,
      updatedAt: userData.updatedAt.toISOString(),
    });

    // Get the updated user data
    const updatedUser = await this.userService.findById(userData.id);
    if (!updatedUser) {
      throw new NotFoundException('Updated user not found after verification');
    }

    this.logger.log(`User sign-up confirmed: ${userData.id}`);

    return this.buildUserDto(updatedUser);
  }

  async resendSignUpCode(
    resendSignUpCodePayloadDto: ResendSignUpCodePayloadDto,
  ): Promise<void> {
    this.logger.debug('Resend sign-up code attempt', {
      userId: resendSignUpCodePayloadDto.id,
    });

    const user = await this.userService.findById(resendSignUpCodePayloadDto.id);
    if (!user) {
      this.logger.warn('Resend sign-up code failed: User not found', {
        userId: resendSignUpCodePayloadDto.id,
      });
      throw new NotFoundException('User not found');
    }

    await this.smsValidationService.resendSmsCode({
      id: user.id,
      smsAction: SmsValidationAction.CONFIRM_SIGN_UP,
    });

    this.logger.log('Sign-up code resent', { userId: user.id });
  }

  async recoverPassword(
    recoverPasswordPayloadDto: RecoverPasswordPayloadDto,
  ): Promise<void> {
    const { phone } = recoverPasswordPayloadDto;

    this.logger.debug('Password recovery attempt', { phone });

    const users = await this.userService.findAll({
      phone,
      page: 1,
      limit: 1,
    });
    if (users.docs.length < 1) {
      this.logger.warn('Password recovery failed: User not found', { phone });
      throw new UnprocessableEntityException(
        `Not found user with phone ${phone}`,
      );
    }

    const user = users.docs[0];
    if (![Status.VALIDATED, Status.BLOCKED].includes(user.status as Status)) {
      this.logger.warn('Password recovery failed: User not validated', {
        userId: user.id,
        status: user.status,
      });
      throw new UnprocessableEntityException(
        `User with phone ${phone} is not validated`,
      );
    }

    const payload: CreateSmsValidationPayloadDto = {
      userId: user.id,
      phone: user.phone,
      smsAction: SmsValidationAction.RECOVER_PASSWORD,
    };

    this.logger.log(`Password recovery initiated for user: ${user.id}`);

    await this.smsValidationService.sendSmsCode(payload);
  }

  async resendRecoverPassword(
    payload: RecoverPasswordPayloadDto,
  ): Promise<void> {
    const { phone } = payload;

    this.logger.debug('Resend password recovery code attempt', { phone });

    const users = await this.userService.findAll({
      phone,
      page: 1,
      limit: 1,
    });
    if (users.docs.length < 1) {
      this.logger.warn('Resend recovery failed: User not found', { phone });
      throw new UnprocessableEntityException(
        `Not found user with phone ${phone}`,
      );
    }

    const user = users.docs[0];
    if (![Status.VALIDATED, Status.BLOCKED].includes(user.status as Status)) {
      this.logger.warn('Resend recovery failed: User not validated', {
        userId: user.id,
        status: user.status,
      });
      throw new UnprocessableEntityException(
        `User with phone ${phone} is not validated`,
      );
    }

    await this.smsValidationService.resendSmsCode({
      id: user.id,
      smsAction: SmsValidationAction.RECOVER_PASSWORD,
    });

    this.logger.log('Password recovery code resent', { phone: user.phone });
  }

  async confirmRecoverPassword(
    completeRecoverPassword: CompleteRecoverPasswordPayloadDto,
  ): Promise<void> {
    const { phone, code, password } = completeRecoverPassword;

    this.logger.debug('Confirm password recovery attempt', { phone });

    const users = await this.userService.findAll({
      phone,
      page: 1,
      limit: 1,
    });
    if (users.docs.length < 1) {
      this.logger.warn('Confirm recovery failed: User not found', { phone });
      throw new UnprocessableEntityException(
        `Not found user with phone ${phone}`,
      );
    }

    const user = users.docs[0];
    if (![Status.VALIDATED, Status.BLOCKED].includes(user.status as Status)) {
      this.logger.warn('Confirm recovery failed: User not validated', {
        userId: user.id,
        status: user.status,
      });
      throw new UnprocessableEntityException(
        `User with phone ${phone} is not validated`,
      );
    }

    await Promise.all([
      this.userService.updateById(user.id, {
        password,
        updatedAt: user.updatedAt.toISOString(),
      }),
      await this.smsValidationService.validateSmsCode({
        id: user.id,
        code,
      }),
    ]).catch((error) => {
      this.logger.error('Error during password recovery confirmation', error);
      throw error;
    });

    this.logger.log(`Password recovery completed for user: ${user.id}`);
  }

  async validateSmsCode(
    payload: ValidateSmsRequestPayloadDto,
  ): Promise<IsValidSmsCodeDto> {
    this.logger.debug('SMS code request validation attempt', {
      userId: payload.id,
    });

    return await this.smsValidationService.validateOnlySmsCode(payload);
  }

  async refreshToken(
    refreshTokenPayloadDto: RefreshTokenPayloadDto,
  ): Promise<RefreshTokenResponseDto> {
    const { refreshToken, audience } = refreshTokenPayloadDto;

    this.logger.debug('Token refresh attempt');

    // valida y extrae payload del refresh
    const payload = await this.verifyRefreshToken(refreshToken, audience);

    // si usas jti/revocation: validar aquí que sea válido y no consumido
    if (!payload || !payload.sub) {
      this.logger.warn('Token refresh failed: Invalid refresh token payload');
      throw new UnauthorizedException('Invalid refresh token payload');
    }

    const user = await this.userService.findById(String(payload.sub));
    if (!user) {
      this.logger.warn('Token refresh failed: User not found', {
        userId: payload.sub,
      });
      throw new UnauthorizedException('User not found');
    }

    const { accessToken, refreshToken: newRefreshToken } =
      await this.generateTokensForUser(user, audience);

    this.logger.log(`Token refreshed for user: ${user.id}`);

    return {
      accessToken,
      refreshToken: newRefreshToken,
    };
  }

  async switchOrganization(
    userId: string,
    organizationId: string,
    audience?: string,
  ): Promise<RefreshTokenResponseDto> {
    this.logger.debug('Switch organization attempt', { userId, organizationId });

    const membership = await this.orgMemberModel
      .findOne({
        userId: new Types.ObjectId(userId),
        organizationId: new Types.ObjectId(organizationId),
      })
      .lean()
      .exec();

    if (!membership) {
      this.logger.warn('Switch organization failed: Not a member', {
        userId,
        organizationId,
      });
      throw new UnauthorizedException('Not a member of this organization');
    }

    const user = await this.userService.findById(userId);
    if (!user) {
      this.logger.warn('Switch organization failed: User not found', { userId });
      throw new UnauthorizedException('User not found');
    }

    const { accessToken, refreshToken } = await this.generateTokensForUser(
      user,
      audience,
      membership as OrganizationMember,
    );

    this.logger.log(`Organization switched for user: ${userId} to org: ${organizationId}`);

    return { accessToken, refreshToken };
  }

  async validatePassword(
    id: string,
    validateUserPasswordPayloadDto: ValidateUserPasswordPayloadDto,
  ): Promise<ValidationPasswordDto> {
    this.logger.debug('Password validation attempt', { userId: id });

    const user = await this.userService.findById(id);
    if (!user) {
      this.logger.warn('Password validation failed: User not found', {
        userId: id,
      });
      throw new UnauthorizedException();
    }

    if ((user.status as Status) !== Status.VALIDATED) {
      this.logger.warn('Password validation failed: User not validated', {
        userId: id,
        status: user.status,
      });
      throw new UnauthorizedException();
    }

    if (!user.password) {
      throw new UnauthorizedException();
    }
    const isValid = bcrypt.compareSync(
      validateUserPasswordPayloadDto.password,
      user.password,
    );

    this.logger.debug('Password validation result', {
      userId: id,
      isValid,
    });

    return { isValid };
  }

  async validateJwt(
    validateJwtPayloadDto: ValidateJwtPayloadDto,
  ): Promise<JwtDto> {
    const { jwt, audience } = validateJwtPayloadDto;
    const issuer = this.configService.get<string>('JWT_ISSUER');
    this.logger.debug('JWT validation attempt', { audience });

    try {
      const decoded = await this.jwtService.verifyAsync<Jwt>(jwt, {
        issuer,
        audience,
        complete: true,
        secret: this.configService.get<string>('JWT_PRIVATE_KEY'),
      });

      this.logger.debug('JWT validation successful', {
        sub: decoded.payload.sub,
      });

      const jwtDto = new JwtDto();
      jwtDto.header = decoded.header;
      jwtDto.payload = decoded.payload;
      return jwtDto;
    } catch (error) {
      this.logger.warn('JWT validation failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  private getJwtConfig() {
    return {
      issuer: this.configService.get<string>('JWT_ISSUER'),
      secret: this.configService.get<string>('JWT_PRIVATE_KEY'),
    };
  }

  /**
   * Generate access + refresh tokens for a user.
   * - access token with short duration (30m)
   * - refresh token with long duration (24h)
   * Returns { accessToken, refreshToken, kid }.
   * - kid/jti used here to identify the refresh token (rotation).
   * - If orgMembership is provided, organizationId and orgRole are included in claims.
   */
  private async generateTokensForUser(
    user: User,
    audience?: string,
    orgMembership?: OrganizationMember,
  ) {
    const { issuer, secret } = this.getJwtConfig();
    const kid = randomUUID();

    const claims: Record<string, unknown> = {
      sub: user.id,
    };

    if (orgMembership) {
      claims['organizationId'] = orgMembership.organizationId.toString();
      claims['orgRole'] = orgMembership.role as OrgRole;
    }

    const tokenOptions: Record<string, unknown> = { issuer, keyid: kid, secret, expiresIn: this.accessTokenExpiry };
    if (audience) tokenOptions['audience'] = audience;

    const accessToken = await this.jwtService.signAsync(claims, tokenOptions as Parameters<typeof this.jwtService.signAsync>[1]);

    const refreshClaims = { ...claims, jti: kid };

    const refreshToken = await this.jwtService.signAsync(refreshClaims, {
      ...tokenOptions,
      expiresIn: this.refreshTokenExpiry,
    } as Parameters<typeof this.jwtService.signAsync>[1]);

    return {
      accessToken,
      refreshToken,
      kid,
    };
  }

  /**
   * Verifica el refresh token y retorna el payload (decoded) si es válido.
   * Lanza UnauthorizedException si inválido.
   */
  private async verifyRefreshToken(
    refreshToken: string,
    audience?: string,
  ): Promise<JwtPayload> {
    const { issuer, secret } = this.getJwtConfig();

    try {
      // `verifyAsync` should return the payload if valid or throw if not
      const payload = await this.jwtService.verifyAsync<JwtPayload>(
        refreshToken,
        {
          issuer,
          audience,
          secret,
        },
      );

      // payload should include `sub` and `jti`
      if (!payload || typeof payload.sub !== 'string') {
        this.logger.warn('Invalid refresh token payload structure');
        throw new UnauthorizedException('Invalid refresh token payload');
      }
      return payload;
    } catch (err) {
      this.logger.warn('Refresh token verification failed', {
        error: err instanceof Error ? err.message : 'Unknown error',
      });
      throw new UnauthorizedException(`Invalid refresh token ${err}`);
    }
  }

  private buildUserDto(user: User): UserDto {
    const dto = new UserDto();
    dto.id = user.id;
    dto.firstName = user.firstName;
    dto.middleName = user.middleName;
    dto.lastName = user.lastName;
    dto.secondLastName = user.secondLastName;
    dto.fullName = user.fullName;
    dto.displayName = user.displayName;
    dto.email = user.email;
    dto.phone = user.phone;
    dto.gender = user.gender as Gender;
    dto.rfc = user.rfc;
    dto.curp = user.curp;
    dto.birthDate = user.birthDate;
    dto.nationality = user.nationality;
    dto.countryOfBirth = user.countryOfBirth;
    dto.stateOfBirth = user.stateOfBirth;
    dto.riskLevel = user.riskLevel;
    dto.status = user.status;
    dto.createdAt = user.createdAt;
    dto.updatedAt = user.updatedAt;
    dto.group = user.group as Group;
    dto.profileCompleted = user.profileCompleted;
    dto.verified = user.verified;
    dto.addresses = user.addresses?.map((addr) => AddressDto.buildDto(addr));

    return dto;
  }
}
