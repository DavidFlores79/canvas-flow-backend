import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { InvestmentProduct } from '../entity/InvestmentProduct';
import { CreateInvestmentProductPayloadDto } from '../dto/CreateInvestmentProductPayloadDto';
import { UpdateInvestmentProductPayloadDto } from '../dto/UpdateInvestmentProductPayloadDto';
import { OutdatedEntityVersionError } from '../../shared/error/OutdatedEntityVersionError';
import { FilterInvestmentProductQueryDto } from '../dto/FilterInvestmentProductQueryDto';
import { PaginatedResult } from '../../shared/interface/Pagination';
import { InvestmentProduct as InvestmentProductInterface } from '../interface/InvestmentProduct';

@Injectable()
export class InvestmentProductService {
  constructor(
    @InjectRepository(InvestmentProduct)
    private investmentProductRepository: Repository<InvestmentProduct>,
  ) {}

  async findAll(
    filterInvestmentProductQueryDto: FilterInvestmentProductQueryDto,
  ): Promise<PaginatedResult<InvestmentProduct>> {
    const { page, limit, ...query } = filterInvestmentProductQueryDto;
    const skip = (page - 1) * limit;
    const [items, totalItems] =
      await this.investmentProductRepository.findAndCount({
        where: query,
        take: limit,
        skip,
      });

    const pagination: PaginatedResult<InvestmentProduct> = {
      docs: items,
      total: totalItems,
      page: page,
      pages: Math.ceil(totalItems / limit),
      limit,
    };

    return pagination;
  }

  async findById(id: string): Promise<InvestmentProduct | null> {
    return this.investmentProductRepository.findOneBy({ id });
  }

  async create(
    payload: CreateInvestmentProductPayloadDto,
  ): Promise<InvestmentProduct> {
    const entity = new InvestmentProduct();
    entity.name = payload.name;
    entity.description = payload.description;
    entity.termDays = payload.termDays;
    entity.annualRate = payload.annualRate;
    entity.penaltyRate = payload.penaltyRate;
    entity.minAmount = payload.minAmount;
    entity.maxAmount = payload.maxAmount;
    entity.isActive = payload.isActive;
    return this.investmentProductRepository.save(entity);
  }

  async updateById(
    id: string,
    payload: UpdateInvestmentProductPayloadDto,
  ): Promise<InvestmentProduct | null> {
    const { updatedAt, ...data } = payload;
    const exists = await this.investmentProductRepository.existsBy({ id });

    if (!exists) {
      return null;
    }

    const result = await this.investmentProductRepository
      .createQueryBuilder()
      .update()
      .set(data)
      .where(
        'id = :id AND updated_at::timestamp(3) = :updatedAt::timestamp(3)',
        { id, updatedAt },
      )
      .returning('*')
      .execute();

    if (result.affected === 0) {
      throw new OutdatedEntityVersionError(
        'an old version of Investment Product was detected during the update',
        'InvestmentProduct',
        '409',
      );
    }

    const rows = result.raw as InvestmentProductInterface[];
    const row = rows[0];

    const entity = new InvestmentProduct();
    entity.id = row.id;
    entity.name = row.name;
    entity.description = row.description;
    entity.termDays = row.term_days;
    entity.annualRate = row.annual_rate;
    entity.penaltyRate = row.penalty_rate;
    entity.minAmount = row.min_amount;
    entity.maxAmount = row.max_amount;
    entity.isActive = row.is_active;
    entity.createdAt = row.created_at;
    entity.updatedAt = row.updated_at;
    return entity;
  }
}
