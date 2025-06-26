import {
  INestApplication,
  ValidationPipe,
  VersioningType,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request, { Response } from 'supertest';
import { App } from 'supertest/types';
import { randomUUID } from 'node:crypto';

import { InvestmentProductController } from './InvestmentProductController';
import { InvestmentProductService } from '../service/InvestmentProductService';
import { HttpExceptionFilter } from '../../interceptors/HttpExceptionFilter';
import { InvestmentProduct } from '../entity/InvestmentProduct';
import { PaginatedResult } from '../../shared/interface/Pagination';
import { InvestmentProductDto } from '../dto/InvestmentProductDto';
import { OutdatedEntityVersionError } from '../../shared/error/OutdatedEntityVersionError';

describe(InvestmentProductController, () => {
  let app: INestApplication<App>;

  const mockInvestmentProductService = {
    findAll: jest.fn(),
    create: jest.fn(),
    findById: jest.fn(),
    updateById: jest.fn(),
  };

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [InvestmentProductController],
      providers: [
        {
          provide: InvestmentProductService,
          useValue: mockInvestmentProductService,
        },
      ],
    }).compile();

    app = module.createNestApplication();

    app.enableVersioning({
      type: VersioningType.URI,
    });

    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, transform: true }),
    );
    app.useGlobalInterceptors(new HttpExceptionFilter());

    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  const fakeInvestmentProduct = new InvestmentProduct();
  fakeInvestmentProduct.id = randomUUID();
  fakeInvestmentProduct.name = 'name';
  fakeInvestmentProduct.description = 'description';
  fakeInvestmentProduct.annualRate = 10.03;
  fakeInvestmentProduct.penaltyRate = 0;
  fakeInvestmentProduct.minAmount = 1.0;
  fakeInvestmentProduct.maxAmount = 1000.0;
  fakeInvestmentProduct.termDays = 90;
  fakeInvestmentProduct.isActive = true;
  fakeInvestmentProduct.createdAt = new Date();
  fakeInvestmentProduct.updatedAt = new Date();

  describe('GET /v1/investment-products', () => {
    describe('when filter Investment Products', () => {
      let response: Response;

      beforeAll(async () => {
        jest.clearAllMocks();

        const pagination: PaginatedResult<InvestmentProduct> = {
          docs: [fakeInvestmentProduct],
          total: 1,
          limit: 1,
          page: 1,
          pages: 1,
        };
        mockInvestmentProductService.findAll.mockResolvedValueOnce(pagination);
        response = await request(app.getHttpServer())
          .get('/v1/investment-products')
          .query({ name: 'foo', isActive: false, limit: 20, page: 2 });
      });

      it('returns a pagination result', () => {
        expect(response.statusCode).toBe(200);
        expect(response.body).toEqual({
          docs: [InvestmentProductDto.buildDto(fakeInvestmentProduct)],
          total: 1,
          limit: 1,
          page: 1,
          pages: 1,
        });
      });
    });

    it('calls InvestmentProductService.findAll once with arguments', () => {
      expect(mockInvestmentProductService.findAll).toHaveBeenCalledTimes(1);
      expect(mockInvestmentProductService.findAll).toHaveBeenCalledWith({
        name: 'foo',
        isActive: false,
        limit: 20,
        page: 2,
      });
    });
  });

  describe('GET /v1/investment-products/:id', () => {
    describe('When not found', () => {
      let response: Response;
      beforeAll(async () => {
        jest.clearAllMocks();

        mockInvestmentProductService.findById.mockResolvedValueOnce(null);
        response = await request(app.getHttpServer()).get(
          `/v1/investment-products/${fakeInvestmentProduct.id}`,
        );
      });

      it('returns a Not Found error', () => {
        expect(response.statusCode).toBe(404);
        expect(response.body).toEqual({
          error: 'Not Found',
          message: `Investment Product not found`,
          statusCode: 404,
        });
      });
    });

    describe('When find an Investment Product', () => {
      let response: Response;
      beforeAll(async () => {
        jest.clearAllMocks();

        mockInvestmentProductService.findById.mockResolvedValueOnce(
          fakeInvestmentProduct,
        );
        response = await request(app.getHttpServer()).get(
          `/v1/investment-products/${fakeInvestmentProduct.id}`,
        );
      });

      it('returns an Investment Product', () => {
        expect(response.statusCode).toBe(200);
        expect(response.body).toEqual(
          InvestmentProductDto.buildDto(fakeInvestmentProduct),
        );
      });
    });
  });

  describe('PATCH /v1/investment-products/:id', () => {
    describe('When updates an InvestmentProduct', () => {
      let response: Response;
      beforeAll(async () => {
        jest.clearAllMocks();

        mockInvestmentProductService.updateById.mockResolvedValueOnce({
          ...fakeInvestmentProduct,
          isActive: false,
        });
        response = await request(app.getHttpServer())
          .patch(`/v1/investment-products/${fakeInvestmentProduct.id}`)
          .send({
            isActive: false,
            updatedAt: new Date().toISOString(),
          });
      });

      it('returns an updated Investment Product', () => {
        expect(response.statusCode).toBe(200);
        expect(response.body).toEqual(
          InvestmentProductDto.buildDto({
            ...fakeInvestmentProduct,
            isActive: false,
          }),
        );
      });
    });

    describe('When Investment Product not found', () => {
      let response: request.Response;
      beforeAll(async () => {
        jest.clearAllMocks();

        mockInvestmentProductService.updateById.mockResolvedValueOnce(null);
        response = await request(app.getHttpServer())
          .patch(`/v1/investment-products/${fakeInvestmentProduct.id}`)
          .send({
            isActive: false,
            updatedAt: new Date().toISOString(),
          });
      });

      it('returns an Not Found Error', () => {
        expect(response.statusCode).toBe(404);
        expect(response.body).toEqual({
          error: 'Not Found',
          message: 'Investment Product not found',
          statusCode: 404,
        });
      });
    });

    describe('When Investment Product is outdated', () => {
      let response: request.Response;
      beforeAll(async () => {
        jest.clearAllMocks();

        mockInvestmentProductService.updateById.mockRejectedValueOnce(
          new OutdatedEntityVersionError(
            'an old version of Investment Product was detected during the update',
            'InvestmentProduct',
            '409',
          ),
        );
        response = await request(app.getHttpServer())
          .patch(`/v1/investment-products/${fakeInvestmentProduct.id}`)
          .send({
            isActive: false,
            updatedAt: new Date().toISOString(),
          });
      });

      it('returns an Not Found Error', () => {
        expect(response.statusCode).toBe(409);
        expect(response.body).toEqual({
          error: 'Conflict',
          message:
            'an old version of Investment Product was detected during the update',
          statusCode: 409,
        });
      });
    });

    describe('When send bad data', () => {
      let response: request.Response;
      beforeAll(async () => {
        jest.clearAllMocks();
        response = await request(app.getHttpServer())
          .patch(`/v1/investment-products/${fakeInvestmentProduct.id}`)
          .send({
            termDays: 'foo',
            annualRate: 'bar',
            penaltyRate: 'penaltyRate',
            minAmount: 'minAmount',
            maxAmount: 'maxAmount',
            isActive: 'isActive',
          });
      });

      it('returns a Bad Request error', () => {
        expect(response.statusCode).toBe(400);
        expect(response.body).toEqual({
          error: 'Bad Request',
          message: [
            'termDays must be a positive number',
            'termDays must be an integer number',
            'annualRate must be a number with up to 5 digits before the decimal and up to 2 digits after',
            'penaltyRate must be a number with up to 5 digits before the decimal and up to 2 digits after',
            'minAmount must be a number with up to 12 digits before the decimal and up to 2 digits after',
            'maxAmount must be a number with up to 12 digits before the decimal and up to 2 digits after',
            'isActive must be a boolean value',
            'updatedAt must be a valid ISO 8601 date string',
            'updatedAt should not be empty',
          ],
          statusCode: 400,
        });
      });
    });
  });

  describe('POST /v1/investment-products', () => {
    describe('When create an Investment Product', () => {
      let response: request.Response;
      beforeAll(async () => {
        jest.clearAllMocks();
        mockInvestmentProductService.create.mockResolvedValueOnce(
          fakeInvestmentProduct,
        );
        response = await request(app.getHttpServer())
          .post('/v1/investment-products')
          .send({
            name: 'Boxito Inc.',
            description: 'foo',
            termDays: 1,
            annualRate: 10,
            penaltyRate: 0.0,
            minAmount: 1,
            maxAmount: 1,
            isActive: true,
          });
      });

      it('returns a created Investment Product', () => {
        expect(response.statusCode).toBe(201);
        expect(response.body).toEqual(
          InvestmentProductDto.buildDto(fakeInvestmentProduct),
        );
      });
    });
  });

  describe('When send bad data', () => {
    let response: request.Response;
    beforeAll(async () => {
      jest.clearAllMocks();
      response = await request(app.getHttpServer())
        .post('/v1/investment-products')
        .send({});
    });

    it('returns a Bad Request error', () => {
      expect(response.statusCode).toBe(400);
      expect(response.body).toEqual({
        error: 'Bad Request',
        message: [
          'name should not be empty',
          'description should not be empty',
          'termDays must be a positive number',
          'termDays must be an integer number',
          'termDays should not be empty',
          'annualRate must be a number with up to 5 digits before the decimal and up to 2 digits after',
          'annualRate must be a positive number',
          'annualRate should not be empty',
          'penaltyRate must be a number with up to 5 digits before the decimal and up to 2 digits after',
          'penaltyRate should not be empty',
          'minAmount must be a number with up to 12 digits before the decimal and up to 2 digits after',
          'minAmount must be a positive number',
          'minAmount should not be empty',
          'maxAmount must be a number with up to 12 digits before the decimal and up to 2 digits after',
          'maxAmount must be a positive number',
          'maxAmount should not be empty',
        ],
        statusCode: 400,
      });
    });
  });
});
