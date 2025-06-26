import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { INestApplication } from '@nestjs/common';
import { UpdateQueryBuilder } from 'typeorm';
import { randomUUID } from 'crypto';

import { InvestmentProductService } from './InvestmentProductService';
import { InvestmentProduct } from '../entity/InvestmentProduct';
import { OutdatedEntityVersionError } from '../../shared/error/OutdatedEntityVersionError';
import { PaginatedResult } from '../../shared/interface/Pagination';

const mockQueryBuilder: Partial<jest.Mocked<UpdateQueryBuilder<any>>> = {
  update: jest.fn().mockReturnThis(),
  set: jest.fn().mockReturnThis(),
  where: jest.fn().mockReturnThis(),
  returning: jest.fn().mockReturnThis(),
  execute: jest.fn(),
};

const createMockRepository = () => ({
  findAndCount: jest.fn(),
  findOneBy: jest.fn(),
  save: jest.fn(),
  existsBy: jest.fn(),
  createQueryBuilder: jest.fn().mockReturnValue(mockQueryBuilder),
  delete: jest.fn(),
});

describe(InvestmentProductService, () => {
  let app: INestApplication;
  let investmentProductService: InvestmentProductService;
  let repository: ReturnType<typeof createMockRepository>;

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

  beforeAll(async () => {
    repository = createMockRepository();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InvestmentProductService,
        {
          provide: getRepositoryToken(InvestmentProduct),
          useValue: repository,
        },
      ],
    }).compile();

    app = module.createNestApplication();
    await app.init();

    investmentProductService = app.get(InvestmentProductService);
  });

  afterAll(async () => {
    await app.close();
  });

  describe('findAll', () => {
    describe('when paginate a result', () => {
      let response: PaginatedResult<InvestmentProduct>;

      beforeAll(async () => {
        jest.clearAllMocks();
        repository.findAndCount.mockResolvedValue([[fakeInvestmentProduct], 1]);
        response = await investmentProductService.findAll({
          name: 'name',
          isActive: false,
          limit: 1,
          page: 2,
        });
      });

      it('returns a paginated result', () => {
        expect(response.docs).toEqual([fakeInvestmentProduct]);
        expect(response.total).toBe(1);
        expect(response.limit).toBe(1);
        expect(response.page).toBe(2);
        expect(response.pages).toBe(1);
      });
    });
  });

  describe('findById', () => {
    describe('when finds an Investment Product', () => {
      let response: InvestmentProduct | null;
      beforeAll(async () => {
        jest.clearAllMocks();
        repository.findOneBy.mockResolvedValueOnce(fakeInvestmentProduct);
        response = await investmentProductService.findById('123');
      });
      it('returns an Investment Product', () => {
        expect(response).toEqual(fakeInvestmentProduct);
      });

      it('calls repository.findOneBy once with arguments', () => {
        expect(repository.findOneBy).toHaveBeenCalledTimes(1);
        expect(repository.findOneBy).toHaveBeenCalledWith({ id: '123' });
      });
    });
  });

  describe('create', () => {
    describe('when creates an Investment Product', () => {
      let response: InvestmentProduct;
      const payload = {
        name: 'New',
        description: 'New Desc',
        termDays: 30,
        annualRate: 5,
        penaltyRate: 1,
        minAmount: 100,
        maxAmount: 1000,
        isActive: true,
      };

      const savedEntity = { id: '456', ...payload } as InvestmentProduct;
      beforeAll(async () => {
        jest.clearAllMocks();
        repository.save.mockResolvedValue(savedEntity);
        response = await investmentProductService.create(payload);
      });

      it('returns a created Investment Product', () => {
        expect(response).toEqual(savedEntity);
      });

      it('calls repository.save once with arguments', () => {
        expect(repository.save).toHaveBeenCalledTimes(1);
        expect(repository.save).toHaveBeenCalledWith(payload);
      });
    });
  });

  describe('updateById', () => {
    describe('when updates an Investment Product', () => {
      let response: InvestmentProduct | null;
      const payload = {
        name: 'Updated',
        description: 'Updated Desc',
        termDays: 60,
        annualRate: 6,
        penaltyRate: 2,
        minAmount: 200,
        maxAmount: 2000,
        isActive: false,
        updatedAt: new Date().toISOString(),
      };
      beforeAll(async () => {
        jest.clearAllMocks();
        repository.existsBy.mockResolvedValue(true);
        repository.createQueryBuilder.mockReturnValue(
          mockQueryBuilder as unknown as UpdateQueryBuilder<any>,
        );
        mockQueryBuilder.execute!.mockResolvedValue({
          generatedMaps: [],
          affected: 1,
          raw: [
            {
              id: '789',
              name: payload.name,
              description: payload.description,
              term_days: payload.termDays,
              annual_rate: payload.annualRate,
              penalty_rate: payload.penaltyRate,
              min_amount: payload.minAmount,
              max_amount: payload.maxAmount,
              is_active: payload.isActive,
              created_at: new Date(),
              updated_at: new Date(),
            },
          ],
        });

        response = await investmentProductService.updateById('789', payload);
      });
      it('should update an existing investment product', () => {
        expect(response?.id).toEqual('789');
        expect(response?.name).toEqual(payload.name);
        expect(response?.description).toEqual(payload.description);
      });
      it('calls repository.existsBy once with arguments', () => {
        expect(repository.existsBy).toHaveBeenCalledTimes(1);
        expect(repository.existsBy).toHaveBeenCalledWith({ id: '789' });
      });
    });

    describe('when fails due to outdated version', () => {
      let error: OutdatedEntityVersionError;
      beforeAll(async () => {
        jest.clearAllMocks();
        repository.existsBy.mockResolvedValue(true);
        repository.createQueryBuilder.mockReturnValue(
          mockQueryBuilder as unknown as UpdateQueryBuilder<any>,
        );
        mockQueryBuilder.execute!.mockResolvedValue({
          generatedMaps: [],
          affected: 0,
          raw: [],
        });
        try {
          await investmentProductService.updateById('789', {
            name: 'Conflict',
            description: '',
            termDays: 0,
            annualRate: 0,
            penaltyRate: 0,
            minAmount: 0,
            maxAmount: 0,
            isActive: false,
            updatedAt: new Date().toISOString(),
          });
        } catch (err) {
          error = err as unknown as OutdatedEntityVersionError;
        }
      });

      it('throws an OutdatedEntityVersionError', () => {
        expect(error).toEqual(
          new OutdatedEntityVersionError(
            'an old version of Investment Product was detected during the update',
            'InvestmentProduct',
            '409',
          ),
        );
      });

      it('calls repository.existsBy once with arguments', () => {
        expect(repository.existsBy).toHaveBeenCalledTimes(1);
        expect(repository.existsBy).toHaveBeenCalledWith({ id: '789' });
      });

      it('calls repository.createQueryBuilder once', () => {
        expect(repository.createQueryBuilder).toHaveBeenCalledTimes(1);
      });
    });

    describe('when fails due to missing Investment Product', () => {
      let response: InvestmentProduct | null;
      const payload = { name: 'foo', updatedAt: new Date().toISOString() };
      beforeAll(async () => {
        jest.clearAllMocks();
        repository.existsBy.mockResolvedValue(false);
        response = await investmentProductService.updateById(
          'nonexistent',
          payload,
        );
      });

      it('returns null if product does not exist for update', () => {
        expect(response).toBeNull();
      });

      it('does not call repository.createQueryBuilder', () => {
        expect(repository.createQueryBuilder).toHaveBeenCalledTimes(0);
      });
    });
  });
});
