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
import {
  SmsValidation,
  SmsValidationDocument,
} from '../schemas/SmsValidationSchema';
import { InjectModel } from '@nestjs/mongoose';
import mongoose from 'mongoose';
import { SmsValidationProvider } from '../enum/SmsValidationProvider';
import { SmsValidationStatus } from '../enum/SmsValidationStatus';
import { SmsValidationAction } from '../enum/SmsValidationAction';
import { Status } from '../../users/enum/UserEnum';
import { VerificationInstance } from 'twilio/lib/rest/verify/v2/service/verification';
import { ConfirmSignUpPayloadDto } from '../dto/ConfirmSignUpPayloadDto';
import { UpdateSmsValidationPayloadDto } from '../dto/UpdateSmsValidationPayloadDto';
import { OutdatedEntityVersionError } from '../../shared/error/OutdatedEntityVersionError';
import { ResendSignUpCodePayloadDto } from '../dto/ResendSignUpCodePayloadDto';
import { ValidateSmsRequestPayloadDto } from '../dto/ValidateSmsRequestPayloadDto';
import { IsValidSmsCodeDto } from '../dto/IsValidSmCodeDto';

@Injectable()
export class SmsValidationService {
  private readonly twilioClient: Twilio;
  private readonly logger = new Logger(SmsValidationService.name);

  constructor(
    @InjectModel(SmsValidation.name)
    private smsValidationModel: mongoose.Model<SmsValidationDocument>,
    private readonly configService: ConfigService<EnvironmentVariables>,
  ) {
    const accountSid = this.configService.get<string>('TWILIO_ACCOUNT_SID');
    const authToken = this.configService.get<string>('TWILIO_AUTH_TOKEN');

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

    const newSmsValidation = new this.smsValidationModel({
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

    const saved = await newSmsValidation.save();
    return this.buildSmsValidationDto(saved);
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
        updatedAt: validationData.updatedAt
          ? validationData.updatedAt.toISOString()
          : new Date().toISOString(),
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

    const diff =
      new Date().getTime() - validationData.smsRequestDate!.getTime();
    const minutesDiff = diff / (1000 * 60);

    if (minutesDiff < 3) {
      throw new UnprocessableEntityException(
        'User must wait for at least five minutes to request a new code',
      );
    }

    let smsResponse: VerificationInstance;
    try {
      smsResponse = await this.twilioClient.verify.v2
        .services(validationData.smsServiceSid!)
        .verifications.create({ to: validationData.phone!, channel: 'sms' });
    } catch (err) {
      this.logger.error('Error creating verification in Twilio', err);
      throw new BadGatewayException(
        `Unable to create verification with SMS provider ${(err as Error).message}`,
      );
    }

    await this.smsValidationModel
      .updateOne(
        { _id: validationData._id },
        {
          $set: {
            smsStatus: SmsValidationStatus.PENDING,
            smsRequestDate: new Date(smsResponse.dateCreated),
          },
        },
      )
      .exec();
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

  async findByUserId(
    userId: string,
    smsAction?: SmsValidationAction,
  ): Promise<SmsValidationDocument> {
    const query: mongoose.QueryFilter<SmsValidation> = {
      userId,
      ...(smsAction ? { smsAction } : {}),
    };

    const smsValidation = await this.smsValidationModel
      .findOne(query)
      .sort({ createdAt: -1 })
      .exec();

    if (!smsValidation) {
      throw new NotFoundException('SMS Validation not found');
    }
    return smsValidation;
  }

  async updateById(
    id: string,
    payload: UpdateSmsValidationPayloadDto,
  ): Promise<SmsValidationDocument> {
    const { updatedAt, ...data } = payload;
    const exists = await this.smsValidationModel.exists({ _id: id });

    if (!exists) {
      throw new NotFoundException('SMS Validation not found');
    }

    const updateData: Partial<SmsValidation> = {
      ...data,
      smsAction: data.smsAction,
      smsStatus: data.smsStatus,
      smsProvider: data.smsProvider,
    };

    const updated = await this.smsValidationModel
      .findOneAndUpdate(
        { _id: id, updatedAt: new Date(updatedAt) },
        { $set: updateData },
        { new: true },
      )
      .exec();

    if (!updated) {
      throw new OutdatedEntityVersionError(
        'an old version of SMS Validation was detected during the update',
        'SmsValidation',
        '409',
      );
    }

    return updated;
  }

  buildSmsValidationDto(entity: SmsValidationDocument): SmsValidationDto {
    return {
      id: entity._id.toString(),
      userId: entity.userId,
      phone: entity.phone!,
      status: entity.status,
      smsProvider: entity.smsProvider!,
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
