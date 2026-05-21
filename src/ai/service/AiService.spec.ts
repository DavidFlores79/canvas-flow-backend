// ABOUTME: Unit tests for AiService covering generation, polling, timeout, and failure scenarios
// ABOUTME: Mocks LeonardoService, CloudinaryService, and AssetService

import { Test, TestingModule } from '@nestjs/testing';
import { UnprocessableEntityException, Logger } from '@nestjs/common';
import { Types } from 'mongoose';

import { AiService } from './AiService';
import { LeonardoService } from '../../leonardo/service/LeonardoService';
import { CloudinaryService } from '../../cloudinary/service/CloudinaryService';
import { AssetService } from '../../assets/service/AssetService';
import { AiGeneratePayloadDto } from '../dto/AiGeneratePayloadDto';
import { LeonardoPresetStyle } from '../../leonardo/enums/LeonardoPresetStyle';

const fakeOrgId = new Types.ObjectId().toString();
const fakeWorkspaceId = new Types.ObjectId().toString();
const fakeAssetId = new Types.ObjectId().toString();

const fakeAsset = {
  id: fakeAssetId,
  cloudinaryPublicId: 'canvas-flow/org/ai-generated/ai_img1.jpg',
  url: 'https://res.cloudinary.com/demo/image/upload/canvas-flow/org/ai-generated/ai_img1.jpg',
  type: 'image',
};

const mockLeonardoService = {
  createGeneration: jest.fn(),
  getGeneration: jest.fn(),
};

const mockCloudinaryService = {
  uploadFile: jest.fn(),
};

const mockAssetService = {
  create: jest.fn(),
};

describe('AiService', () => {
  let service: AiService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AiService,
        { provide: LeonardoService, useValue: mockLeonardoService },
        { provide: CloudinaryService, useValue: mockCloudinaryService },
        { provide: AssetService, useValue: mockAssetService },
      ],
    }).compile();

    service = module.get<AiService>(AiService);

    Object.defineProperty(service, 'logger', {
      value: new Logger('TEST'),
      writable: true,
    });
  });

  afterEach(() => jest.clearAllMocks());

  const baseDto: AiGeneratePayloadDto = {
    prompt: 'a beautiful sunset',
    modelId: 'model-abc-123',
    workspaceId: fakeWorkspaceId,
  };

  describe('generate', () => {
    it('polls until COMPLETE and returns saved assets', async () => {
      mockLeonardoService.createGeneration.mockResolvedValue({ generationId: 'gen-001' });
      mockLeonardoService.getGeneration
        .mockResolvedValueOnce({ status: 'PENDING', images: [] })
        .mockResolvedValueOnce({ status: 'COMPLETE', images: [{ url: 'https://cdn.leonardo.ai/img1.jpg', id: 'img1' }] });

      mockCloudinaryService.uploadFile.mockResolvedValue({
        publicId: 'canvas-flow/org/ai-generated/ai_img1',
        url: 'https://res.cloudinary.com/demo/image/upload/ai_img1.jpg',
        resourceType: 'image',
      });
      mockAssetService.create.mockResolvedValue(fakeAsset);

      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        arrayBuffer: jest.fn().mockResolvedValue(new ArrayBuffer(8)),
      });

      // Speed up polling for tests
      jest.spyOn(global, 'setTimeout').mockImplementation((cb: () => void) => { cb(); return 0 as unknown as NodeJS.Timeout; });

      const result = await service.generate(baseDto, fakeOrgId);

      expect(mockLeonardoService.createGeneration).toHaveBeenCalledWith(
        baseDto.prompt,
        baseDto.modelId,
        { width: undefined, height: undefined, numImages: undefined, presetStyle: undefined },
      );
      expect(result).toHaveLength(1);
      expect(result[0]).toEqual(fakeAsset);

      jest.restoreAllMocks();
    });

    it('forwards presetStyle to leonardoService when provided', async () => {
      const dtoWithStyle: AiGeneratePayloadDto = {
        ...baseDto,
        presetStyle: LeonardoPresetStyle.ILLUSTRATION,
      };

      mockLeonardoService.createGeneration.mockResolvedValue({ generationId: 'gen-style-001' });
      mockLeonardoService.getGeneration.mockResolvedValue({
        status: 'COMPLETE',
        images: [{ url: 'https://cdn.leonardo.ai/img1.jpg', id: 'img1' }],
      });
      mockCloudinaryService.uploadFile.mockResolvedValue({
        publicId: 'canvas-flow/org/ai-generated/ai_img1',
        url: 'https://res.cloudinary.com/demo/image/upload/ai_img1.jpg',
        resourceType: 'image',
      });
      mockAssetService.create.mockResolvedValue(fakeAsset);

      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        arrayBuffer: jest.fn().mockResolvedValue(new ArrayBuffer(8)),
      });

      jest.spyOn(global, 'setTimeout').mockImplementation((cb: () => void) => { cb(); return 0 as unknown as NodeJS.Timeout; });

      await service.generate(dtoWithStyle, fakeOrgId);

      expect(mockLeonardoService.createGeneration).toHaveBeenCalledWith(
        dtoWithStyle.prompt,
        dtoWithStyle.modelId,
        expect.objectContaining({ presetStyle: LeonardoPresetStyle.ILLUSTRATION }),
      );

      jest.restoreAllMocks();
    });

    it('throws UnprocessableEntityException when status is FAILED', async () => {
      mockLeonardoService.createGeneration.mockResolvedValue({ generationId: 'gen-002' });
      mockLeonardoService.getGeneration.mockResolvedValue({ status: 'FAILED', images: [] });

      jest.spyOn(global, 'setTimeout').mockImplementation((cb: () => void) => { cb(); return 0 as unknown as NodeJS.Timeout; });

      await expect(service.generate(baseDto, fakeOrgId)).rejects.toThrow(
        UnprocessableEntityException,
      );

      jest.restoreAllMocks();
    });

    it('throws UnprocessableEntityException when download fails', async () => {
      mockLeonardoService.createGeneration.mockResolvedValue({ generationId: 'gen-003' });
      mockLeonardoService.getGeneration.mockResolvedValue({
        status: 'COMPLETE',
        images: [{ url: 'https://cdn.leonardo.ai/img1.jpg', id: 'img1' }],
      });

      global.fetch = jest.fn().mockResolvedValue({ ok: false, status: 403 });

      jest.spyOn(global, 'setTimeout').mockImplementation((cb: () => void) => { cb(); return 0 as unknown as NodeJS.Timeout; });

      await expect(service.generate(baseDto, fakeOrgId)).rejects.toThrow(
        UnprocessableEntityException,
      );

      jest.restoreAllMocks();
    });

    it('throws UnprocessableEntityException on timeout (all polls PENDING)', async () => {
      mockLeonardoService.createGeneration.mockResolvedValue({ generationId: 'gen-004' });
      mockLeonardoService.getGeneration.mockResolvedValue({ status: 'PENDING', images: [] });

      jest.spyOn(global, 'setTimeout').mockImplementation((cb: () => void) => { cb(); return 0 as unknown as NodeJS.Timeout; });

      await expect(service.generate(baseDto, fakeOrgId)).rejects.toThrow(
        'AI generation timed out after 60 seconds',
      );

      jest.restoreAllMocks();
    });
  });
});
