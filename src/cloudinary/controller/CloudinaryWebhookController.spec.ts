// ABOUTME: Unit tests for CloudinaryWebhookController signature validation
// ABOUTME: Verifies webhook signature checking and payload handling

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, UnauthorizedException } from '@nestjs/common';

import { CloudinaryWebhookController } from './CloudinaryWebhookController';
import { CloudinaryWebhookPayloadDto } from '../dto/CloudinaryWebhookPayloadDto';

// jest.mock is hoisted — use jest.fn() inline in the factory and retrieve via require()
jest.mock('cloudinary', () => ({
  v2: {
    config: jest.fn(),
    uploader: {
      upload_stream: jest.fn(),
      destroy: jest.fn(),
    },
    url: jest.fn(),
    utils: {
      verifyNotificationSignature: jest.fn(),
    },
  },
}));

describe('CloudinaryWebhookController', () => {
  let app: INestApplication;
  let controller: CloudinaryWebhookController;

  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const cloudinaryMock = require('cloudinary').v2 as {
    utils: { verifyNotificationSignature: jest.Mock };
  };

  const fakePayload: CloudinaryWebhookPayloadDto = {
    notification_type: 'upload',
    public_id: 'folder/image123',
    url: 'https://res.cloudinary.com/test/image/upload/folder/image123.jpg',
  };

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CloudinaryWebhookController],
    }).compile();

    app = module.createNestApplication();
    await app.init();

    controller = module.get<CloudinaryWebhookController>(
      CloudinaryWebhookController,
    );
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => jest.clearAllMocks());

  describe('handleWebhook', () => {
    it('returns { received: true } when signature is valid', () => {
      cloudinaryMock.utils.verifyNotificationSignature.mockReturnValue(true);

      const result = controller.handleWebhook(
        fakePayload,
        'valid-signature',
        '1234567890',
      );

      expect(result).toEqual({ received: true });
      expect(
        cloudinaryMock.utils.verifyNotificationSignature,
      ).toHaveBeenCalledWith(
        JSON.stringify(fakePayload),
        1234567890,
        'valid-signature',
      );
    });

    it('throws UnauthorizedException when signature is invalid', () => {
      cloudinaryMock.utils.verifyNotificationSignature.mockReturnValue(false);

      expect(() =>
        controller.handleWebhook(
          fakePayload,
          'invalid-signature',
          '1234567890',
        ),
      ).toThrow(UnauthorizedException);
    });
  });
});
