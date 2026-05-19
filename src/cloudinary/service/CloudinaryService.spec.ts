// ABOUTME: Unit tests for CloudinaryService upload, delete, and transform operations
// ABOUTME: Mocks cloudinary v2 uploader to avoid real API calls during testing

import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { PassThrough } from 'stream';

import { CloudinaryService, MulterFile } from './CloudinaryService';

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

describe('CloudinaryService', () => {
  let service: CloudinaryService;

  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const cloudinaryMock = require('cloudinary').v2 as {
    config: jest.Mock;
    uploader: { upload_stream: jest.Mock; destroy: jest.Mock };
    url: jest.Mock;
    utils: { verifyNotificationSignature: jest.Mock };
  };

  const mockConfigService = {
    get: jest.fn().mockReturnValue('test-value'),
  };

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CloudinaryService,
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get<CloudinaryService>(CloudinaryService);
  });

  afterEach(() => jest.clearAllMocks());

  describe('uploadFile', () => {
    const makeFile = (): MulterFile => ({
      buffer: Buffer.from('fake-image-data'),
      originalname: 'test.jpg',
      mimetype: 'image/jpeg',
    });

    it('resolves with publicId, url, and resourceType on success', async () => {
      const fakeResult = {
        public_id: 'folder/image123',
        secure_url: 'https://res.cloudinary.com/test/image/upload/folder/image123.jpg',
        resource_type: 'image',
      };

      cloudinaryMock.uploader.upload_stream.mockImplementation(
        (_options: unknown, callback: (err: null, result: typeof fakeResult) => void) => {
          const stream = new PassThrough();
          process.nextTick(() => callback(null, fakeResult));
          return stream;
        },
      );

      const result = await service.uploadFile(makeFile(), 'test-folder');

      expect(result.publicId).toBe('folder/image123');
      expect(result.url).toBe(
        'https://res.cloudinary.com/test/image/upload/folder/image123.jpg',
      );
      expect(result.resourceType).toBe('image');
      expect(cloudinaryMock.uploader.upload_stream).toHaveBeenCalledWith(
        { folder: 'test-folder', resource_type: 'auto' },
        expect.any(Function),
      );
    });

    it('rejects when cloudinary returns an error', async () => {
      const fakeError = Object.assign(new Error('Upload failed'), { http_code: 400 });

      cloudinaryMock.uploader.upload_stream.mockImplementation(
        (_options: unknown, callback: (err: typeof fakeError, result?: unknown) => void) => {
          const stream = new PassThrough();
          process.nextTick(() => callback(fakeError));
          return stream;
        },
      );

      await expect(
        service.uploadFile(makeFile(), 'test-folder'),
      ).rejects.toThrow('Upload failed');
    });

    it('rejects when cloudinary returns no result', async () => {
      cloudinaryMock.uploader.upload_stream.mockImplementation(
        (_options: unknown, callback: (err: null, result?: undefined) => void) => {
          const stream = new PassThrough();
          process.nextTick(() => callback(null, undefined));
          return stream;
        },
      );

      await expect(
        service.uploadFile(makeFile(), 'test-folder'),
      ).rejects.toThrow('No result returned from Cloudinary upload');
    });
  });

  describe('deleteFile', () => {
    it('calls cloudinary destroy with the publicId', async () => {
      cloudinaryMock.uploader.destroy.mockResolvedValue({ result: 'ok' });

      await service.deleteFile('folder/image123');

      expect(cloudinaryMock.uploader.destroy).toHaveBeenCalledWith(
        'folder/image123',
      );
    });
  });

  describe('getTransformUrl', () => {
    it('returns a URL string with transform options applied', () => {
      const expectedUrl =
        'https://res.cloudinary.com/test/image/upload/w_300,h_300/folder/image123.jpg';
      cloudinaryMock.url.mockReturnValue(expectedUrl);

      const result = service.getTransformUrl('folder/image123', {
        width: 300,
        height: 300,
      });

      expect(result).toBe(expectedUrl);
      expect(cloudinaryMock.url).toHaveBeenCalledWith('folder/image123', {
        width: 300,
        height: 300,
        secure: true,
      });
    });
  });
});
