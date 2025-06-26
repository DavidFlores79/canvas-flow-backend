import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

import { InvestmentProduct } from './entity/InvestmentProduct';
import { InvestmentProductService } from './service/InvestmentProductService';
import { InvestmentProductController } from './controller/InvestmentProductController';

@Module({
  imports: [TypeOrmModule.forFeature([InvestmentProduct])],
  providers: [InvestmentProductService],
  controllers: [InvestmentProductController],
})
export class InvestmentProductModule {
  constructor(private dataSource: DataSource) {}
}
