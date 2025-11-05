import {
  BadGatewayException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { CreateSmsValidationPayloadDto } from '../dto/CreateSmsValidationPayloadDto';
import { ConfigService } from '@nestjs/config';
import { EnvironmentVariables } from '../../config/EnvironmentVariables';
import { Twilio } from 'twilio';
import { SmsValidationDto } from '../dto/SmsValidationDto';
import { SmsValidation } from '../entity/SmsValidation';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SmsValidationProvider } from '../enum/SmsValidationProvider';
import { SmsValidationStatus } from '../enum/SmsValidationStatus';
import { SmsValidationAction } from '../enum/SmsValidationAction';
import { Status } from '../../users/enum/UserEnum';
import { VerificationInstance } from 'twilio/lib/rest/verify/v2/service/verification';
import { ConfirmSignUpPayloadDto } from '../dto/ConfirmSignUpPayloadDto';
import { UpdateSmsValidationPayloadDto } from '../dto/UpdateSmsValidationPayloadDto';
import { OutdatedEntityVersionError } from '../../shared/error/OutdatedEntityVersionError';
import { SmsValidationInterface } from '../interfaces/SmsValidation';
import { ResendSignUpCodePayloadDto } from '../dto/ResendSignUpCodePayloadDto';
import { ValidateSmsRequestPayloadDto } from '../dto/ValidateSmsRequestPayloadDto';
import { IsValidSmsCodeDto } from '../dto/IsValidSmCodeDto';

@Injectable()
export class SmsValidationService {
  private readonly twilioClient: Twilio;
  private readonly logger = new Logger(SmsValidationService.name);

  constructor(
    @InjectRepository(SmsValidation)
    private smsValidationRepository: Repository<SmsValidation>,
    private readonly configService: ConfigService<EnvironmentVariables>,
  ) {
    const accountSid = this.configService.get<string>('TWILIO_ACCOUNT_SID');
    const authToken = this.configService.get<string>('TWILIO_AUTH_TOKEN');

    // Only initialize Twilio if valid credentials are provided
    if (accountSid && authToken && accountSid.startsWith('AC')) {
      this.twilioClient = new Twilio(accountSid, authToken);
    } else {
      this.logger.warn(
        'Twilio credentials not configured or invalid. SMS functionality will be disabled.',
      );
    }
  }

  async sendSmsCode(
    payload: CreateSmsValidationPayloadDto,
  ): Promise<SmsValidationDto> {
    if (!this.twilioClient) {
      this.logger.error('Twilio client not initialized');
      throw new InternalServerErrorException('SMS provider not configured');
    }

    const serviceSid = this.configService.get<string>('TWILIO_VERIFY_SID');
    if (!serviceSid) {
      this.logger.error('TWILIO_VERIFY_SID no configurado');
      throw new InternalServerErrorException('SMS provider not configured');
    }

    let smsResponse: VerificationInstance;
    try {
      smsResponse = await this.twilioClient.verify.v2
        .services(serviceSid)
        .verifications.create({ to: payload.phone, channel: 'sms' });
    } catch (err) {
      this.logger.error('Error creating verification in Twilio', err);
      throw new BadGatewayException(
        `Unable to create verification with SMS provider ${(err as Error).message}`,
      );
    }

    const smsValidationEntity = this.smsValidationRepository.create({
      userId: payload.userId,
      phone: payload.phone,
      status: Status.REGISTERED,
      smsProvider:
        (payload.smsProvider as SmsValidationProvider) ||
        SmsValidationProvider.TWILIO,
      smsAction: payload.smsAction || SmsValidationAction.CONFIRM_SIGN_UP,
      smsServiceSid: smsResponse.serviceSid,
      smsRequestSid: smsResponse.sid,
      smsStatus: payload.smsStatus || SmsValidationStatus.PENDING,
      smsRequestDate: new Date(smsResponse.dateCreated),
    });

    return this.smsValidationRepository.save(smsValidationEntity);
  }

  async validateSmsCode(
    payload: ConfirmSignUpPayloadDto,
  ): Promise<SmsValidationDto> {
    const validationData = await this.findByUserId(payload.id);

    if (!validationData) {
      throw new UnprocessableEntityException('SMS Validation does not exist');
    }

    try {
      const twilioResponse = await this.twilioClient.verify.v2
        .services(this.configService.get<string>('TWILIO_VERIFY_SID', ''))
        .verificationChecks.create({
          to: validationData.phone,
          code: payload.code,
        });

      if (!twilioResponse.valid) {
        throw new UnprocessableEntityException('Invalid sms code');
      }

      const updatedValidation = await this.updateById(validationData.id, {
        smsStatus: SmsValidationStatus.APPROVED,
        status: Status.VALIDATED,
        updatedAt: validationData.updatedAt.toISOString(),
      });
      return this.buildSmsValidationDto(updatedValidation);
    } catch (err) {
      if (
        err &&
        typeof err === 'object' &&
        'message' in err &&
        typeof (err as { message?: unknown }).message === 'string' &&
        (err as { message: string }).message.includes(
          'VerificationCheck was not found',
        )
      ) {
        throw new UnprocessableEntityException('Invalid sms code');
      }

      throw err;
    }
  }

  async resendSmsCode(payload: ResendSignUpCodePayloadDto): Promise<void> {
    const validationData = await this.findByUserId(
      payload.id,
      payload.smsAction as SmsValidationAction,
    );

    const diff = new Date().getTime() - validationData.smsRequestDate.getTime();
    const minutesDiff = diff / (1000 * 60);

    if (minutesDiff < 3) {
      throw new UnprocessableEntityException(
        'User must wait for at least five minutes to request a new code',
      );
    }

    let smsResponse: VerificationInstance;
    try {
      smsResponse = await this.twilioClient.verify.v2
        .services(validationData.smsServiceSid)
        .verifications.create({ to: validationData.phone, channel: 'sms' });
    } catch (err) {
      this.logger.error('Error creating verification in Twilio', err);
      throw new BadGatewayException(
        `Unable to create verification with SMS provider ${(err as Error).message}`,
      );
    }

    await this.smsValidationRepository.update(
      {
        id: validationData.id,
      },
      {
        smsStatus: SmsValidationStatus.PENDING,
        smsRequestDate: new Date(smsResponse.dateCreated),
      },
    );
  }

  async validateOnlySmsCode(
    payload: ValidateSmsRequestPayloadDto,
  ): Promise<IsValidSmsCodeDto> {
    const validationData = await this.findByUserId(
      payload.id,
      (payload.smsAction as SmsValidationAction) ||
        SmsValidationAction.RECOVER_PASSWORD,
    );

    if (!validationData) {
      throw new UnprocessableEntityException('SMS Validation does not exist');
    }

    try {
      this.logger.debug(
        `Validating SMS code for user: ${validationData.userId} and phone: ${validationData.phone} and code : ${payload.code}`,
      );
      const twilioResponse = await this.twilioClient.verify.v2
        .services(this.configService.get<string>('TWILIO_VERIFY_SID', ''))
        .verificationChecks.create({
          to: validationData.phone,
          code: payload.code,
        });

      this.logger.debug(`Twilio response: ${JSON.stringify(twilioResponse)}`);

      if (!twilioResponse.valid) {
        throw new UnprocessableEntityException('Invalid sms code');
      }
      return IsValidSmsCodeDto.buildDto(true);
    } catch (err) {
      if (
        err &&
        typeof err === 'object' &&
        'message' in err &&
        typeof (err as { message?: unknown }).message === 'string' &&
        (err as { message: string }).message.includes(
          'VerificationCheck was not found',
        )
      ) {
        throw new UnprocessableEntityException('Invalid sms code');
      }

      throw err;
    }
  }

  /**
   * Find SMS validation by user ID
   * @param userId - external user id
   * @returns
   */
  async findByUserId(
    userId: string,
    smsAction?: SmsValidationAction,
  ): Promise<SmsValidation> {
    // find the latest SMS validation for the user
    const smsValidation = await this.smsValidationRepository.findOne({
      where: { userId: userId, smsAction },
      order: { createdAt: 'DESC' },
    });
    if (!smsValidation) {
      throw new NotFoundException('SMS Validation not found');
    }
    return smsValidation;
  }

  /**
   * Update SMS validation by ID
   * @param id - SMS validation ID
   * @param payload - update payload
   * @returns
   */
  async updateById(
    id: string,
    payload: UpdateSmsValidationPayloadDto,
  ): Promise<SmsValidation> {
    const { updatedAt, ...data } = payload;
    const exists = await this.smsValidationRepository.existsBy({ id });

    if (!exists) {
      throw new NotFoundException('SMS Validation not found');
    }

    // Cast smsProvider to SmsValidationProvider if present
    const updateData: Partial<SmsValidation> = {
      ...data,
      smsAction:
        data.smsAction !== undefined
          ? (data.smsAction as SmsValidationAction)
          : undefined,
      smsStatus:
        data.smsStatus !== undefined
          ? (data.smsStatus as SmsValidationStatus)
          : undefined,
      smsProvider:
        data.smsProvider !== undefined
          ? (data.smsProvider as SmsValidationProvider)
          : undefined,
    };

    const result = await this.smsValidationRepository
      .createQueryBuilder()
      .update()
      .set(updateData)
      .where(
        'id = :id AND updated_at::timestamp(2) = :updatedAt::timestamp(2)',
        { id, updatedAt },
      )
      .returning('*')
      .execute();

    if (result.affected === 0) {
      throw new OutdatedEntityVersionError(
        'an old version of User Balance was detected during the update',
        'InvestmentProduct',
        '409',
      );
    }

    const rows = result.raw as SmsValidationInterface[];
    const row = rows[0];

    const entity = new SmsValidation();
    entity.id = row.id || '';
    entity.userId = row.user_id || '';
    entity.smsServiceSid = row.sms_service_sid || '';
    entity.smsRequestSid = row.sms_request_sid || '';
    entity.smsAction = row.sms_action || '';
    entity.smsStatus = row.sms_status || '';
    entity.status = row.status || '';
    entity.phone = row.phone ?? '';
    entity.smsProvider = row.sms_provider as SmsValidationProvider;
    entity.createdAt = row.created_at;
    entity.updatedAt = row.updated_at;
    return entity;
  }

  buildSmsValidationDto(entity: SmsValidation): SmsValidationDto {
    return {
      id: entity.id,
      userId: entity.userId,
      phone: entity.phone,
      status: entity.status,
      smsProvider: entity.smsProvider,
      smsAction: entity.smsAction,
      smsServiceSid: entity.smsServiceSid,
      smsRequestSid: entity.smsRequestSid,
      smsStatus: entity.smsStatus,
      smsRequestDate: entity.smsRequestDate,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    };
  }
}
