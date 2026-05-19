// ABOUTME: Unit tests for LeonardoService AI image generation API integration
// ABOUTME: Mocks global fetch to avoid real API calls during testing

import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { UnprocessableEntityException } from '@nestjs/common';

import { LeonardoService } from './LeonardoService';

describe('LeonardoService', () => {
  let service: LeonardoService;
  let fetchMock: jest.Mock;

  const mockConfigService = {
    get: jest.fn((key: string) => {
      if (key === 'LEONARDO_API_KEY') return 'test-api-key';
      if (key === 'LEONARDO_API_BASE_URL') return 'https://test.leonardo.ai/api/rest/v1';
      return undefined;
    }),
  };

  beforeAll(async () => {
    // Mock global fetch
    fetchMock = jest.fn();
    global.fetch = fetchMock;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LeonardoService,
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get<LeonardoService>(LeonardoService);
  });

  afterEach(() => jest.clearAllMocks());

  describe('createGeneration', () => {
    it('returns generationId on success with sdGenerationJob format', async () => {
      fetchMock.mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue({
          sdGenerationJob: { generationId: 'gen-abc-123' },
        }),
      });

      const result = await service.createGeneration('A sunset over the ocean', 'model-xyz');

      expect(result.generationId).toBe('gen-abc-123');
      expect(fetchMock).toHaveBeenCalledWith(
        'https://test.leonardo.ai/api/rest/v1/generations',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            Authorization: 'Bearer test-api-key',
          }),
        }),
      );
    });

    it('returns generationId on success with direct generationId format', async () => {
      fetchMock.mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue({
          generationId: 'gen-direct-456',
        }),
      });

      const result = await service.createGeneration('A snowy mountain', 'model-abc', {
        width: 512,
        height: 512,
        numImages: 2,
      });

      expect(result.generationId).toBe('gen-direct-456');
      const callBody = JSON.parse(fetchMock.mock.calls[0][1].body as string) as Record<string, unknown>;
      expect(callBody.width).toBe(512);
      expect(callBody.height).toBe(512);
      expect(callBody.num_images).toBe(2);
    });

    it('throws UnprocessableEntityException on non-2xx response', async () => {
      fetchMock.mockResolvedValue({
        ok: false,
        status: 422,
        json: jest.fn().mockResolvedValue({ error: 'Invalid model ID' }),
      });

      await expect(
        service.createGeneration('A sunset', 'bad-model-id'),
      ).rejects.toThrow(UnprocessableEntityException);
    });
  });

  describe('getGeneration', () => {
    it('returns status and images on success', async () => {
      fetchMock.mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue({
          generations_by_pk: {
            status: 'COMPLETE',
            generated_images: [
              { url: 'https://cdn.leonardo.ai/image1.jpg', id: 'img-001' },
              { url: 'https://cdn.leonardo.ai/image2.jpg', id: 'img-002' },
            ],
          },
        }),
      });

      const result = await service.getGeneration('gen-abc-123');

      expect(result.status).toBe('COMPLETE');
      expect(result.images).toHaveLength(2);
      expect(result.images[0].id).toBe('img-001');
      expect(result.images[1].url).toBe('https://cdn.leonardo.ai/image2.jpg');
      expect(fetchMock).toHaveBeenCalledWith(
        'https://test.leonardo.ai/api/rest/v1/generations/gen-abc-123',
        expect.objectContaining({ method: 'GET' }),
      );
    });

    it('throws UnprocessableEntityException on non-2xx response', async () => {
      fetchMock.mockResolvedValue({
        ok: false,
        status: 404,
        json: jest.fn().mockResolvedValue({ message: 'Generation not found' }),
      });

      await expect(service.getGeneration('not-found-id')).rejects.toThrow(
        UnprocessableEntityException,
      );
    });
  });

  describe('deleteGeneration', () => {
    it('completes without error on success', async () => {
      fetchMock.mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue({}),
      });

      await expect(service.deleteGeneration('gen-abc-123')).resolves.toBeUndefined();
      expect(fetchMock).toHaveBeenCalledWith(
        'https://test.leonardo.ai/api/rest/v1/generations/gen-abc-123',
        expect.objectContaining({ method: 'DELETE' }),
      );
    });

    it('throws UnprocessableEntityException on non-2xx response', async () => {
      fetchMock.mockResolvedValue({
        ok: false,
        status: 500,
        json: jest.fn().mockResolvedValue({ error: 'Internal server error' }),
      });

      await expect(service.deleteGeneration('gen-abc-123')).rejects.toThrow(
        UnprocessableEntityException,
      );
    });
  });
});
