// sms-validation.service.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import {
  InternalServerErrorException,
  BadGatewayException,
  UnprocessableEntityException,
  NotFoundException,
} from '@nestjs/common';

import { randomUUID } from 'crypto';

import { SmsValidationService } from './SmsValidationService';
import {
  SmsValidation,
  SmsValidationDocument,
} from '../schemas/SmsValidationSchema';
import { getModelToken } from '@nestjs/mongoose';
import { ConfigService } from '@nestjs/config';
import { SmsValidationProvider } from '../enum/SmsValidationProvider';
import { SmsValidationStatus } from '../enum/SmsValidationStatus';
import { SmsValidationAction } from '../enum/SmsValidationAction';
import { Status } from '../../users/enum/UserEnum';
import { OutdatedEntityVersionError } from '../../shared/error/OutdatedEntityVersionError';

type MockModel = {
  new (dto: any): any;
  findOne: jest.Mock;
  exists: jest.Mock;
  findOneAndUpdate: jest.Mock;
  updateOne: jest.Mock;
};

const createMockRepository = (): MockModel => {
  const mockModel = function (this: any, dto: any) {
    Object.assign(this, dto);
    const self = this as { _id: any; save: jest.Mock };
    self._id = {
      toString: () =>
        ((this as Record<string, unknown>).id as string) || 'test-id',
    };
    self.save = jest.fn().mockResolvedValue(this);
  } as unknown as MockModel;

  mockModel.findOne = jest
    .fn()
    .mockReturnValue({ sort: jest.fn().mockReturnValue({ exec: jest.fn() }) });
  mockModel.exists = jest.fn();
  mockModel.findOneAndUpdate = jest.fn().mockReturnValue({ exec: jest.fn() });
  mockModel.updateOne = jest.fn().mockReturnValue({ exec: jest.fn() });
  return mockModel;
};

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
  let repo: MockModel;
  let configService: { get: jest.Mock };
  let twilioClient: MockTwilioClient;

  const fakeSmsValidation = new SmsValidation();
  fakeSmsValidation.id = randomUUID();
  (fakeSmsValidation as unknown as Record<string, any>)._id = {
    toString: () => fakeSmsValidation.id,
  };
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

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SmsValidationService,
        { provide: getModelToken(SmsValidation.name), useValue: repo },
        { provide: ConfigService, useValue: configService },
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
      const res = await service.sendSmsCode({
        userId: 'user-1',
        phone: '5512345678',
        smsAction: SmsValidationAction.CONFIRM_SIGN_UP,
      });
      expect(res).toHaveProperty('id');
      expect(res.phone).toBe('5512345678');
    });
  });

  describe('findByUserId', () => {
    it('throws NotFoundException when not found', async () => {
      repo.findOne.mockReturnValueOnce({
        sort: jest
          .fn()
          .mockReturnValue({ exec: jest.fn().mockResolvedValue(null) }),
      } as any);
      await expect(service.findByUserId(randomUUID())).rejects.toBeInstanceOf(
        NotFoundException,
      );
      expect(repo.findOne).toHaveBeenCalled();
    });

    it('returns entity when found', async () => {
      repo.findOne.mockReturnValueOnce({
        sort: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue(fakeSmsValidation),
        }),
      } as any);
      const res = await service.findByUserId('user-1');
      expect(res).toEqual(fakeSmsValidation);
    });
  });

  describe('validateSmsCode', () => {
    it('throws NotFoundException when validation not found', async () => {
      repo.findOne.mockReturnValueOnce({
        sort: jest
          .fn()
          .mockReturnValue({ exec: jest.fn().mockResolvedValue(null) }),
      } as any);
      await expect(
        service.validateSmsCode({ id: 'x', code: '1234' }),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('throws UnprocessableEntityException when twilio response invalid', async () => {
      repo.findOne.mockReturnValueOnce({
        sort: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue(fakeSmsValidation),
        }),
      } as any);
      twilioClient.verify.v2
        .services()
        .verificationChecks.create.mockResolvedValue({ valid: false });
      await expect(
        service.validateSmsCode({ id: 'user-1', code: '0000' }),
      ).rejects.toBeInstanceOf(UnprocessableEntityException);
    });

    it('updates sms validation on success', async () => {
      repo.findOne.mockReturnValueOnce({
        sort: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue(fakeSmsValidation),
        }),
      } as any);
      twilioClient.verify.v2
        .services()
        .verificationChecks.create.mockResolvedValue({ valid: true });
      repo.exists.mockResolvedValueOnce(true);
      repo.findOneAndUpdate.mockReturnValue({
        exec: jest.fn().mockResolvedValue({
          id: fakeSmsValidation.id,
          userId: fakeSmsValidation.userId,
          smsServiceSid: fakeSmsValidation.smsServiceSid,
          smsRequestSid: fakeSmsValidation.smsRequestSid,
          smsAction: fakeSmsValidation.smsAction,
          smsStatus: SmsValidationStatus.APPROVED,
          status: Status.VALIDATED,
          phone: fakeSmsValidation.phone,
          smsProvider: fakeSmsValidation.smsProvider,
          createdAt: fakeSmsValidation.createdAt,
          updatedAt: new Date(),
          _id: { toString: () => fakeSmsValidation.id },
        } as unknown as SmsValidation),
      } as any);

      const res = await service.validateSmsCode({
        id: fakeSmsValidation.id,
        code: '2222',
      });
      expect(res).toHaveProperty('id');
      expect(res.smsStatus).toBe(SmsValidationStatus.APPROVED);
      expect(repo.findOneAndUpdate).toHaveBeenCalled();
    });

    it('throws UnprocessableEntityException when twilio verification check not found message', async () => {
      repo.findOne.mockReturnValueOnce({
        sort: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue(fakeSmsValidation),
        }),
      } as any);
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
      repo.findOne.mockReturnValueOnce({
        sort: jest
          .fn()
          .mockReturnValue({ exec: jest.fn().mockResolvedValue(null) }),
      } as any);
      await expect(service.resendSmsCode({ id: 'no' })).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });

    it('throws UnprocessableEntityException when requested too soon', async () => {
      const recent = {
        ...fakeSmsValidation,
        smsRequestDate: new Date(Date.now() - 1000 * 60 * 1),
      };
      repo.findOne.mockReturnValueOnce({
        sort: jest
          .fn()
          .mockReturnValue({ exec: jest.fn().mockResolvedValue(recent) }),
      } as any);
      await expect(service.resendSmsCode({ id: 'u' })).rejects.toBeInstanceOf(
        UnprocessableEntityException,
      );
    });

    it('throws BadGatewayException when twilio fails', async () => {
      const old = {
        ...fakeSmsValidation,
        smsRequestDate: new Date(Date.now() - 1000 * 60 * 10),
      };
      repo.findOne.mockReturnValueOnce({
        sort: jest
          .fn()
          .mockReturnValue({ exec: jest.fn().mockResolvedValue(old) }),
      } as any);
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
      repo.findOne.mockReturnValueOnce({
        sort: jest
          .fn()
          .mockReturnValue({ exec: jest.fn().mockResolvedValue(old) }),
      } as any);
      twilioClient.verify.v2.services().verifications.create.mockResolvedValue({
        serviceSid: 'VSID',
        sid: 'SID456',
        dateCreated: new Date().toISOString(),
      });
      repo.findOneAndUpdate.mockResolvedValue({
        affected: 1,
        raw: [],
        generatedMaps: [],
      });
      await service.resendSmsCode({ id: 'u' });
      expect(repo.updateOne).toHaveBeenCalledWith(
        { _id: (old as unknown as { _id: string })._id },
        expect.objectContaining({
          $set: expect.objectContaining({
            smsStatus: SmsValidationStatus.PENDING,
          }) as unknown,
        }),
      );
    });
  });

  describe('updateById', () => {
    it('throws NotFoundException when not exists', async () => {
      repo.exists.mockResolvedValueOnce(false);
      await expect(
        service.updateById('x', { updatedAt: new Date().toISOString() }),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('throws OutdatedEntityVersionError when affected is 0', async () => {
      repo.exists.mockResolvedValueOnce(true);
      repo.findOneAndUpdate.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      } as any);
      await expect(
        service.updateById('x', { updatedAt: new Date().toISOString() }),
      ).rejects.toBeInstanceOf(OutdatedEntityVersionError);
    });

    it('returns mapped entity on success', async () => {
      repo.exists.mockResolvedValueOnce(true);
      const now = new Date();
      repo.findOneAndUpdate.mockReturnValue({
        exec: jest.fn().mockResolvedValue({
          id: 'x',
          userId: 'u',
          smsServiceSid: 'VS',
          smsRequestSid: 'RQ',
          smsAction: SmsValidationAction.CONFIRM_SIGN_UP,
          smsStatus: SmsValidationStatus.APPROVED,
          status: Status.VALIDATED,
          phone: '551',
          smsProvider: SmsValidationProvider.TWILIO,
          createdAt: now,
          updatedAt: now,
          _id: { toString: () => 'x' },
        }),
      } as any);
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
      const dto = service.buildSmsValidationDto(
        fakeSmsValidation as unknown as SmsValidationDocument,
      );
      expect(dto).toHaveProperty('id', fakeSmsValidation.id);
      expect(dto.phone).toBe(fakeSmsValidation.phone);
    });
  });
});
