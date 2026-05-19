// ABOUTME: Unit tests for AiController covering POST /ai/generate
// ABOUTME: Guards are overridden; AiService is mocked

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, UnprocessableEntityException } from '@nestjs/common';
import { Types } from 'mongoose';

import { AiController } from './AiController';
import { AiService } from '../service/AiService';
import { AiGeneratePayloadDto } from '../dto/AiGeneratePayloadDto';
import { AiGenerateResultDto } from '../dto/AiGenerateResultDto';
import { JwtAuthGuard } from '../../auth/guard/JwtAuthGuard';
import { TenantGuard } from '../../casl/guard/TenantGuard';

const allowAllGuard = { canActivate: () => true };

const fakeOrgId = new Types.ObjectId().toString();
const fakeWorkspaceId = new Types.ObjectId().toString();
const fakeAssetId = new Types.ObjectId().toString();

const fakeAsset = {
  _id: new Types.ObjectId(fakeAssetId),
  id: fakeAssetId,
  organizationId: new Types.ObjectId(fakeOrgId),
  workspaceId: new Types.ObjectId(fakeWorkspaceId),
  cloudinaryPublicId: 'canvas-flow/org/ai-generated/ai_img1',
  url: 'https://res.cloudinary.com/demo/image/upload/ai_img1.jpg',
  type: 'image',
  metadata: new Map(),
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockRequest = {
  user: { sub: new Types.ObjectId().toString(), organizationId: fakeOrgId },
} as unknown as Request & { user: { sub: string; organizationId: string } };

const mockAiService = {
  generate: jest.fn(),
};

describe('AiController', () => {
  let app: INestApplication;
  let controller: AiController;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AiController],
      providers: [{ provide: AiService, useValue: mockAiService }],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue(allowAllGuard)
      .overrideGuard(TenantGuard)
      .useValue(allowAllGuard)
      .compile();

    app = module.createNestApplication();
    await app.init();
    controller = module.get<AiController>(AiController);
  });

  afterAll(async () => await app.close());
  afterEach(() => jest.clearAllMocks());

  describe('generate', () => {
    const dto: AiGeneratePayloadDto = {
      prompt: 'a beautiful sunset',
      modelId: 'model-abc-123',
      workspaceId: fakeWorkspaceId,
    };

    it('returns AiGenerateResultDto with mapped AssetDtos on success', async () => {
      mockAiService.generate.mockResolvedValue([fakeAsset]);

      const result = await controller.generate(dto, mockRequest);

      expect(result).toBeInstanceOf(Object);
      expect(result).toHaveProperty('assets');
      expect((result as AiGenerateResultDto).assets).toHaveLength(1);
      expect((result as AiGenerateResultDto).assets[0].cloudinaryPublicId).toBe(
        fakeAsset.cloudinaryPublicId,
      );
      expect(mockAiService.generate).toHaveBeenCalledWith(dto, fakeOrgId);
    });

    it('returns empty assets array when Leonardo returns no images', async () => {
      mockAiService.generate.mockResolvedValue([]);

      const result = await controller.generate(dto, mockRequest);

      expect((result as AiGenerateResultDto).assets).toHaveLength(0);
    });

    it('propagates UnprocessableEntityException from service', async () => {
      mockAiService.generate.mockRejectedValue(
        new UnprocessableEntityException('AI generation timed out after 60 seconds'),
      );

      await expect(controller.generate(dto, mockRequest)).rejects.toThrow(
        UnprocessableEntityException,
      );
    });
  });
});
