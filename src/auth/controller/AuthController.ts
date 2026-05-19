// ABOUTME: Authentication REST controller handling sign-in, sign-up, token operations, and org switching
// ABOUTME: All endpoints versioned at v1; switch-organization requires a valid JWT

import {
  Controller,
  Post,
  Body,
  Version,
  HttpCode,
  HttpStatus,
  UseGuards,
  Request,
} from '@nestjs/common';
import { AuthService } from '../service/AuthService';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiExtraModels,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTooManyRequestsResponse,
  ApiUnauthorizedResponse,
  ApiUnprocessableEntityResponse,
} from '@nestjs/swagger';
import { JwtDto } from '../dto/JwtDto';
import { SignInUserPayloadDto } from '../dto/SignInUserPayloadDto';
import { UserSessionDto } from '../dto/UserSessionDto';
import { ValidateJwtPayloadDto } from '../dto/ValidateJwtPayloadDto';
import { AddressDto } from '../../users/dto/AddressDto';
import { UserDto } from '../../users/dto/UserDto';
import { SignUpPayloadDto } from '../dto/SignUpPayloadDto';
import { RefreshTokenPayloadDto } from '../dto/RefeshTokenPayloadDto';
import { RefreshTokenResponseDto } from '../dto/RefeshTokenResponseDto';
import { ResendSignUpCodePayloadDto } from '../../sms-validation/dto/ResendSignUpCodePayloadDto';
import { ConfirmSignUpPayloadDto } from '../../sms-validation/dto/ConfirmSignUpPayloadDto';
import { RecoverPasswordPayloadDto } from '../dto/RecoverPasswordPayloadDto';
import { CompleteRecoverPasswordPayloadDto } from '../dto/CompleteRecoverPasswordPayloadDto';
import { IsValidSmsCodeDto } from '../../sms-validation/dto/IsValidSmCodeDto';
import { ValidateSmsRequestPayloadDto } from '../../sms-validation/dto/ValidateSmsRequestPayloadDto';
import { SwitchOrganizationPayloadDto } from '../dto/SwitchOrganizationPayloadDto';
import { JwtPayload } from '../interfaces/JwtPayload';
import { JwtAuthGuard } from '../guard/JwtAuthGuard';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('sign-in')
  @Version('1')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    operationId: 'signIn',
    summary: 'Sign In an user',
    parameters: [{ name: 'verifyPassword', in: 'query' }],
  })
  @ApiBadRequestResponse({
    description: 'Bad Request',
  })
  @ApiOkResponse({
    description: 'Returns an user session',
    type: UserSessionDto,
  })
  async signIn(
    @Body() signInUserPayloadDto: SignInUserPayloadDto,
  ): Promise<UserSessionDto> {
    return this.authService.signIn(signInUserPayloadDto);
  }

  @Post('sign-up')
  @Version('1')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    operationId: 'signUp',
    summary: 'Sign up an User',
  })
  @ApiConflictResponse({
    description: 'Conflict (phone number already exists)',
  })
  @ApiBadRequestResponse({
    description: 'Bad Request',
  })
  @ApiUnprocessableEntityResponse({
    description: 'Unprocessable Entity',
  })
  @ApiTooManyRequestsResponse({
    description: 'Too many requests',
  })
  @ApiExtraModels(AddressDto)
  @ApiCreatedResponse({
    description: 'Returns a new user',
    type: UserDto,
  })
  async signUp(@Body() signUpPayloadDto: SignUpPayloadDto): Promise<UserDto> {
    return this.authService.signUp(signUpPayloadDto);
  }

  @Post('resend-sign-up-code')
  @Version('1')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    operationId: 'resendSignUpCode',
    summary: 'Resend a Sign up code',
  })
  @ApiConflictResponse({
    description: 'Conflict',
  })
  @ApiBadRequestResponse({
    description: 'Bad Request',
  })
  @ApiUnprocessableEntityResponse({
    description: 'Unprocessable Entity',
  })
  @ApiTooManyRequestsResponse({
    description: 'Too many requests',
  })
  @ApiOkResponse({
    description: 'No Content',
  })
  async resendSignUpCode(
    @Body() resendSignUpCodePayloadDto: ResendSignUpCodePayloadDto,
  ): Promise<void> {
    return this.authService.resendSignUpCode(resendSignUpCodePayloadDto);
  }

  @Post('confirm-sign-up')
  @Version('1')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    operationId: 'confirmSignUp',
    summary: 'Confirms sign up',
  })
  @ApiBadRequestResponse({
    description: 'Bad Request',
  })
  @ApiUnprocessableEntityResponse({
    description: 'Unprocessable Entity',
  })
  @ApiNotFoundResponse({
    description: 'Not Found',
  })
  @ApiOkResponse({
    description: 'Returns an user session',
    type: UserDto,
  })
  async confirmSignUp(
    @Body() confirmSignUp: ConfirmSignUpPayloadDto,
  ): Promise<UserDto> {
    return this.authService.confirmSignUp(confirmSignUp);
  }

  @Post('recover-password')
  @Version('1')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    operationId: 'recoverPassword',
    summary: 'Start a recover password process',
  })
  @ApiBadRequestResponse({
    description: 'Bad Request',
  })
  @ApiNotFoundResponse({
    description: 'Not Found',
  })
  @ApiUnprocessableEntityResponse({
    description: 'Unprocessable Entity',
  })
  @ApiTooManyRequestsResponse({
    description: 'Too many requests',
  })
  @ApiNoContentResponse({
    description: 'Returns No Content',
  })
  async recoverPassword(
    @Body() payload: RecoverPasswordPayloadDto,
  ): Promise<void> {
    return this.authService.recoverPassword(payload);
  }

  @Post('resend-recover-password')
  @Version('1')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    operationId: 'resendRecoverPasswordCode',
    summary: 'Resend a recover password code',
  })
  @ApiBadRequestResponse({
    description: 'Bad Request',
  })
  @ApiNotFoundResponse({
    description: 'Not Found',
  })
  @ApiUnprocessableEntityResponse({
    description: 'Unprocessable Entity',
  })
  @ApiNoContentResponse({
    description: 'Returns No Content',
  })
  @ApiTooManyRequestsResponse({
    description: 'Too many requests',
  })
  async resendRecoverPassword(
    @Body()
    payload: RecoverPasswordPayloadDto,
  ): Promise<void> {
    return this.authService.resendRecoverPassword(payload);
  }

  @Post('complete-recover-password')
  @Version('1')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    operationId: 'completeRecoverPassword',
    summary: 'Complete a recover password proccess',
  })
  @ApiBadRequestResponse({
    description: 'Bad Request',
  })
  @ApiNotFoundResponse({
    description: 'Not Found',
  })
  @ApiUnprocessableEntityResponse({
    description: 'Unprocessable Entity',
  })
  @ApiNoContentResponse({
    description: 'Returns No Content',
  })
  async confirmRecoverPassword(
    @Body() confirmRecoverPasswordPayloadDto: CompleteRecoverPasswordPayloadDto,
  ): Promise<void> {
    return this.authService.confirmRecoverPassword(
      confirmRecoverPasswordPayloadDto,
    );
  }

  @Post('validate-sms-code')
  @Version('1')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    operationId: 'validateSmsCode',
    summary: 'Validate a SMS code',
  })
  @ApiBadRequestResponse({
    description: 'Bad Request',
  })
  @ApiOkResponse({
    description: 'Returns validation result',
    type: IsValidSmsCodeDto,
  })
  @ApiBadRequestResponse({
    description: 'Bad Request',
  })
  @ApiOkResponse({
    description: 'Returns decoded jwt',
    type: IsValidSmsCodeDto,
  })
  async validateCode(
    @Body() payload: ValidateSmsRequestPayloadDto,
  ): Promise<IsValidSmsCodeDto> {
    return this.authService.validateSmsCode(payload);
  }

  @Post('refresh')
  @Version('1')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    operationId: 'refreshToken',
    summary: 'Refresh a JWT',
  })
  @ApiBadRequestResponse({
    description: 'Bad Request',
  })
  @ApiOkResponse({
    description: 'Returns decoded jwt',
    type: RefreshTokenResponseDto,
  })
  async refreshToken(
    @Body() refreshTokenPayloadDto: RefreshTokenPayloadDto,
  ): Promise<RefreshTokenResponseDto> {
    return this.authService.refreshToken(refreshTokenPayloadDto);
  }

  @Post('validate-jwt')
  @Version('1')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    operationId: 'validateJWT',
    summary: 'Validate a JWT',
  })
  @ApiBadRequestResponse({
    description: 'Bad Request',
  })
  @ApiOkResponse({
    description: 'Returns decoded jwt',
    type: JwtDto,
  })
  async validateWebToken(
    @Body() validateJwtPayloadDto: ValidateJwtPayloadDto,
  ): Promise<JwtDto> {
    return this.authService.validateJwt(validateJwtPayloadDto);
  }

  @Post('switch-organization')
  @Version('1')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    operationId: 'switchOrganization',
    summary: 'Switch active organization and re-issue tokens',
  })
  @ApiOkResponse({
    description: 'Returns new token pair for the switched organization',
    type: RefreshTokenResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: 'Unauthorized or not a member of the requested organization',
  })
  @ApiBadRequestResponse({
    description: 'Bad Request',
  })
  async switchOrganization(
    @Request() req: { user: JwtPayload },
    @Body() body: SwitchOrganizationPayloadDto,
  ): Promise<RefreshTokenResponseDto> {
    return this.authService.switchOrganization(
      req.user.sub,
      body.organizationId,
      body.audience,
    );
  }
}
