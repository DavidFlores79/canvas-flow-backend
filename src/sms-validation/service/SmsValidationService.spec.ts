// sms-validation.service.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import {
  InternalServerErrorException,
  BadGatewayException,
  UnprocessableEntityException,
  NotFoundException,
} from '@nestjs/common';
import { DataSource } from 'typeorm';
import { randomUUID } from 'crypto';

import { SmsValidationService } from './SmsValidationService';
import { SmsValidation } from '../entity/SmsValidation';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { SmsValidationProvider } from '../enum/SmsValidationProvider';
import { SmsValidationStatus } from '../enum/SmsValidationStatus';
import { SmsValidationAction } from '../enum/SmsValidationAction';
import { Status } from '../../users/enum/UserEnum';
import { OutdatedEntityVersionError } from '../../shared/error/OutdatedEntityVersionError';

const createMockRepository = () => ({
  findOne: jest.fn(),
  save: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  existsBy: jest.fn(),
  createQueryBuilder: jest.fn(),
});

interface MockVerifyServices {
  verifications: { create: jest.Mock };
  verificationChecks: { create: jest.Mock };
}

interface MockTwilioClient {
  verify: {
    v2: {
      services: jest.Mock<MockVerifyServices>;
    };
  };
}

describe('SmsValidationService', () => {
  let service: SmsValidationService;
  let repo: ReturnType<typeof createMockRepository>;
  let configService: { get: jest.Mock };
  let dataSource: { transaction: jest.Mock };
  let twilioClient: MockTwilioClient;

  const fakeSmsValidation = new SmsValidation();
  fakeSmsValidation.id = randomUUID();
  fakeSmsValidation.userId = 'user-1';
  fakeSmsValidation.phone = '5512345678';
  fakeSmsValidation.smsRequestDate = new Date(Date.now() - 1000 * 60 * 10);
  fakeSmsValidation.smsStatus = SmsValidationStatus.PENDING;
  fakeSmsValidation.smsAction = SmsValidationAction.CONFIRM_SIGN_UP;
  fakeSmsValidation.status = Status.REGISTERED;
  fakeSmsValidation.smsProvider = SmsValidationProvider.TWILIO;
  fakeSmsValidation.smsServiceSid = 'VSxxxx';
  fakeSmsValidation.smsRequestSid = 'VQxxxx';
  fakeSmsValidation.createdAt = new Date();
  fakeSmsValidation.updatedAt = new Date();

  beforeAll(async () => {
    repo = createMockRepository();
    configService = { get: jest.fn() };
    configService.get.mockImplementation((key: string) => {
      if (key === 'TWILIO_ACCOUNT_SID') return 'AC_SID';
      if (key === 'TWILIO_AUTH_TOKEN') return 'AUTH';
      if (key === 'TWILIO_VERIFY_SID') return 'VSID';
      return undefined;
    });

    dataSource = {
      transaction: jest
        .fn()
        .mockImplementation(
          (cb: (em: Record<string, jest.Mock>) => Promise<unknown>) => {
            const em = {
              create: jest.fn(
                (_cls: unknown, payload: Record<string, unknown>) => ({
                  ...payload,
                }),
              ),
              save: jest.fn((ent: Record<string, unknown>) =>
                Promise.resolve({
                  ...ent,
                  id: randomUUID(),
                  createdAt: new Date(),
                  updatedAt: new Date(),
                }),
              ),
              find: jest.fn(),
              createQueryBuilder: jest.fn(),
            };
            return cb(em);
          },
        ),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SmsValidationService,
        { provide: getRepositoryToken(SmsValidation), useValue: repo },
        { provide: ConfigService, useValue: configService },
        { provide: DataSource, useValue: dataSource },
      ],
    }).compile();

    service = module.get<SmsValidationService>(SmsValidationService);

    const verifyServicesMock = {
      verifications: { create: jest.fn() },
      verificationChecks: { create: jest.fn() },
    };
    twilioClient = {
      verify: {
        v2: {
          services: jest
            .fn()
            .mockReturnValue(
              verifyServicesMock,
            ) as jest.Mock<MockVerifyServices>,
        },
      },
    };
    Object.defineProperty(service, 'twilioClient', {
      value: twilioClient,
      writable: true,
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('sendSmsCode', () => {
    it('throws InternalServerErrorException when TWILIO_VERIFY_SID not configured', async () => {
      configService.get.mockReturnValueOnce(undefined);
      await expect(
        service.sendSmsCode({ userId: randomUUID(), phone: 'x' }),
      ).rejects.toBeInstanceOf(InternalServerErrorException);
    });

    it('throws BadGatewayException when twilio create fails', async () => {
      configService.get.mockImplementation((k: string) =>
        k === 'TWILIO_VERIFY_SID' ? 'VSID' : 'X',
      );
      twilioClient.verify.v2
        .services()
        .verifications.create.mockRejectedValue(new Error('twilio error'));
      await expect(
        service.sendSmsCode({
          userId: randomUUID(),
          phone: '551',
          smsAction: SmsValidationAction.CONFIRM_SIGN_UP,
        }),
      ).rejects.toBeInstanceOf(BadGatewayException);
    });

    it('creates and returns SmsValidation on success', async () => {
      configService.get.mockImplementation((k: string) =>
        k === 'TWILIO_VERIFY_SID' ? 'VSID' : 'X',
      );
      twilioClient.verify.v2.services().verifications.create.mockResolvedValue({
        serviceSid: 'VSID',
        sid: 'SID123',
        dateCreated: new Date().toISOString(),
      });
      const createdEntity = {
        userId: 'user-1',
        phone: '5512345678',
        smsAction: SmsValidationAction.CONFIRM_SIGN_UP,
        smsServiceSid: 'VSID',
        smsRequestSid: 'SID123',
        smsStatus: SmsValidationStatus.PENDING,
        status: Status.REGISTERED,
        smsProvider: SmsValidationProvider.TWILIO,
      };
      repo.create.mockReturnValue(createdEntity as any);
      repo.save.mockResolvedValue({
        ...createdEntity,
        id: randomUUID(),
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any);
      const res = await service.sendSmsCode({
        userId: 'user-1',
        phone: '5512345678',
        smsAction: SmsValidationAction.CONFIRM_SIGN_UP,
      });
      expect(repo.create).toHaveBeenCalled();
      expect(repo.save).toHaveBeenCalled();
      expect(res).toHaveProperty('id');
      expect(res.phone).toBe('5512345678');
    });
  });

  describe('findByUserId', () => {
    it('throws NotFoundException when not found', async () => {
      repo.findOne.mockResolvedValueOnce(null);
      await expect(service.findByUserId(randomUUID())).rejects.toBeInstanceOf(
        NotFoundException,
      );
      expect(repo.findOne).toHaveBeenCalled();
    });

    it('returns entity when found', async () => {
      repo.findOne.mockResolvedValueOnce(fakeSmsValidation);
      const res = await service.findByUserId('user-1');
      expect(res).toEqual(fakeSmsValidation);
    });
  });

  describe('validateSmsCode', () => {
    it('throws NotFoundException when validation not found', async () => {
      repo.findOne.mockResolvedValueOnce(null);
      await expect(
        service.validateSmsCode({ id: 'x', code: '1234' }),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('throws UnprocessableEntityException when twilio response invalid', async () => {
      repo.findOne.mockResolvedValueOnce(fakeSmsValidation);
      twilioClient.verify.v2
        .services()
        .verificationChecks.create.mockResolvedValue({ valid: false });
      await expect(
        service.validateSmsCode({ id: 'user-1', code: '0000' }),
      ).rejects.toBeInstanceOf(UnprocessableEntityException);
    });

    it('updates sms validation on success', async () => {
      repo.findOne.mockResolvedValueOnce(fakeSmsValidation);
      twilioClient.verify.v2
        .services()
        .verificationChecks.create.mockResolvedValue({ valid: true });
      repo.existsBy.mockResolvedValueOnce(true);
      const mockQueryBuilder = {
        update: jest.fn().mockReturnThis(),
        set: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        returning: jest.fn().mockReturnThis(),
        execute: jest.fn().mockResolvedValue({
          affected: 1,
          raw: [
            {
              id: fakeSmsValidation.id,
              user_id: fakeSmsValidation.userId,
              sms_service_sid: fakeSmsValidation.smsServiceSid,
              sms_request_sid: fakeSmsValidation.smsRequestSid,
              sms_action: fakeSmsValidation.smsAction,
              sms_status: SmsValidationStatus.APPROVED,
              status: Status.VALIDATED,
              phone: fakeSmsValidation.phone,
              sms_provider: fakeSmsValidation.smsProvider,
              created_at: fakeSmsValidation.createdAt,
              updated_at: new Date(),
            },
          ],
        }),
      };
      repo.createQueryBuilder.mockReturnValue(mockQueryBuilder as any);
      const res = await service.validateSmsCode({
        id: fakeSmsValidation.id,
        code: '2222',
      });
      expect(res).toHaveProperty('id');
      expect(res.smsStatus).toBe(SmsValidationStatus.APPROVED);
      expect(mockQueryBuilder.update).toHaveBeenCalled();
    });

    it('throws UnprocessableEntityException when twilio verification check not found message', async () => {
      repo.findOne.mockResolvedValueOnce(fakeSmsValidation);
      twilioClient.verify.v2
        .services()
        .verificationChecks.create.mockRejectedValue(
          new Error('VerificationCheck was not found'),
        );
      await expect(
        service.validateSmsCode({ id: 'user-1', code: '0000' }),
      ).rejects.toBeInstanceOf(UnprocessableEntityException);
    });
  });

  describe('resendSmsCode', () => {
    it('throws NotFoundException when validation not found', async () => {
      repo.findOne.mockResolvedValueOnce(null);
      await expect(service.resendSmsCode({ id: 'no' })).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });

    it('throws UnprocessableEntityException when requested too soon', async () => {
      const recent = {
        ...fakeSmsValidation,
        smsRequestDate: new Date(Date.now() - 1000 * 60 * 1),
      };
      repo.findOne.mockResolvedValueOnce(recent);
      await expect(service.resendSmsCode({ id: 'u' })).rejects.toBeInstanceOf(
        UnprocessableEntityException,
      );
    });

    it('throws BadGatewayException when twilio fails', async () => {
      const old = {
        ...fakeSmsValidation,
        smsRequestDate: new Date(Date.now() - 1000 * 60 * 10),
      };
      repo.findOne.mockResolvedValueOnce(old);
      twilioClient.verify.v2
        .services()
        .verifications.create.mockRejectedValue(new Error('twilio error'));
      await expect(service.resendSmsCode({ id: 'u' })).rejects.toBeInstanceOf(
        BadGatewayException,
      );
    });

    it('updates sms validation when conditions met', async () => {
      const old = {
        ...fakeSmsValidation,
        smsRequestDate: new Date(Date.now() - 1000 * 60 * 10),
      };
      repo.findOne.mockResolvedValueOnce(old);
      twilioClient.verify.v2.services().verifications.create.mockResolvedValue({
        serviceSid: 'VSID',
        sid: 'SID456',
        dateCreated: new Date().toISOString(),
      });
      repo.update.mockResolvedValue({
        affected: 1,
        raw: [],
        generatedMaps: [],
      });
      await service.resendSmsCode({ id: 'u' });
      expect(repo.update).toHaveBeenCalledWith(
        { id: old.id },
        expect.objectContaining({
          smsStatus: SmsValidationStatus.PENDING,
        }),
      );
    });
  });

  describe('updateById', () => {
    it('throws NotFoundException when not exists', async () => {
      repo.existsBy.mockResolvedValueOnce(false);
      await expect(
        service.updateById('x', { updatedAt: new Date().toISOString() }),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('throws OutdatedEntityVersionError when affected is 0', async () => {
      repo.existsBy.mockResolvedValueOnce(true);
      const qb = {
        update: jest.fn().mockReturnThis(),
        set: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        returning: jest.fn().mockReturnThis(),
        execute: jest.fn().mockResolvedValue({ affected: 0, raw: [] }),
      };
      repo.createQueryBuilder.mockReturnValue(qb as any);
      await expect(
        service.updateById('x', { updatedAt: new Date().toISOString() }),
      ).rejects.toBeInstanceOf(OutdatedEntityVersionError);
    });

    it('returns mapped entity on success', async () => {
      repo.existsBy.mockResolvedValueOnce(true);
      const now = new Date();
      const qb = {
        update: jest.fn().mockReturnThis(),
        set: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        returning: jest.fn().mockReturnThis(),
        execute: jest.fn().mockResolvedValue({
          affected: 1,
          raw: [
            {
              id: 'x',
              user_id: 'u',
              sms_service_sid: 'VS',
              sms_request_sid: 'RQ',
              sms_action: SmsValidationAction.CONFIRM_SIGN_UP,
              sms_status: SmsValidationStatus.APPROVED,
              status: Status.VALIDATED,
              phone: '551',
              sms_provider: SmsValidationProvider.TWILIO,
              created_at: now,
              updated_at: now,
            },
          ],
        }),
      };
      repo.createQueryBuilder.mockReturnValue(qb as any);
      const res = await service.updateById('x', {
        updatedAt: now.toISOString(),
        smsStatus: SmsValidationStatus.APPROVED,
      });
      expect(res).toHaveProperty('id', 'x');
      expect(res.smsStatus).toBe(SmsValidationStatus.APPROVED);
    });
  });

  describe('buildSmsValidationDto', () => {
    it('maps entity to dto', () => {
      const dto = service.buildSmsValidationDto(fakeSmsValidation);
      expect(dto).toHaveProperty('id', fakeSmsValidation.id);
      expect(dto.phone).toBe(fakeSmsValidation.phone);
    });
  });
});
