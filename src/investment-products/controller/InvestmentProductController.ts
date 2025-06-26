import {
  ApiBadRequestResponse,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  Version,
} from '@nestjs/common';

import { InvestmentProductService } from '../service/InvestmentProductService';
import { PaginationResultDto } from '../../shared/dto/PaginationResultDto';
import { InvestmentProductDto } from '../dto/InvestmentProductDto';
import { NotFoundEntityError } from '../../shared/error/NotFoundEntityError';
import { ApiPaginationResponse } from '../../shared/decorator/ApiPaginationResult';
import { CreateInvestmentProductPayloadDto } from '../dto/CreateInvestmentProductPayloadDto';
import { UpdateInvestmentProductPayloadDto } from '../dto/UpdateInvestmentProductPayloadDto';
import { FilterInvestmentProductQueryDto } from '../dto/FilterInvestmentProductQueryDto';
import { InvestmentProduct } from '../entity/InvestmentProduct';

@ApiTags('investment-products')
@Controller('investment-products')
export class InvestmentProductController {
  constructor(private investmentProductService: InvestmentProductService) {}

  @Get()
  @Version('1')
  @ApiOperation({
    parameters: [
      { name: 'name', in: 'query' },
      { name: 'isActive', in: 'query' },
      { name: 'page', in: 'query' },
      { name: 'limit', in: 'query' },
    ],
    operationId: 'findAll',
    summary: 'Find all Investment Products',
    description: 'Find all Investment Products',
  })
  @HttpCode(HttpStatus.OK)
  @ApiPaginationResponse(InvestmentProductDto)
  async findAll(
    @Query() query: FilterInvestmentProductQueryDto,
  ): Promise<PaginationResultDto<InvestmentProductDto>> {
    const response = await this.investmentProductService.findAll(query);

    const pagination = new PaginationResultDto<InvestmentProductDto>();
    pagination.docs = response.docs.map((row: InvestmentProduct) =>
      InvestmentProductDto.buildDto(row),
    );
    pagination.total = response.total;
    pagination.page = response.page;
    pagination.pages = response.pages;
    pagination.limit = response.limit;

    return pagination;
  }

  @Get(':id')
  @Version('1')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    parameters: [{ name: 'id', in: 'path' }],
    operationId: 'findInvestmentProductById',
    summary: 'Get an Investment Product by Id',
    description: 'Get an Investment Product by Id',
  })
  @ApiOkResponse({
    description: 'Return an Investment Product',
    type: InvestmentProductDto,
  })
  @ApiNotFoundResponse({
    description: 'Not Found',
  })
  @ApiBadRequestResponse({
    description: 'Bad Request',
  })
  async getById(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<InvestmentProductDto> {
    const investmentProduct = await this.investmentProductService.findById(id);
    if (!investmentProduct) {
      throw new NotFoundEntityError(
        'Investment Product not found',
        'InvestmentProduct',
        '404',
      );
    }

    return InvestmentProductDto.buildDto(investmentProduct);
  }

  @Post()
  @Version('1')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    operationId: 'createInvestmentProduct',
    summary: 'Create an Investment Product',
    description: 'Create an Investment Product',
  })
  @ApiCreatedResponse({
    description: 'Created',
    type: InvestmentProductDto,
  })
  @ApiBadRequestResponse({
    description: 'Bad Request',
  })
  async create(@Body() payload: CreateInvestmentProductPayloadDto) {
    const obj = await this.investmentProductService.create(payload);
    return InvestmentProductDto.buildDto(obj);
  }

  @Patch(':id')
  @Version('1')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    parameters: [{ name: 'id', in: 'path' }],
    operationId: 'updateInvestmentProductById',
    summary: 'Update an Investment Product by id',
    description: 'Update an Investment Product by id',
  })
  @ApiOkResponse({
    description: 'Investment Product',
    type: InvestmentProductDto,
  })
  @ApiBadRequestResponse({
    description: 'Bad Request',
  })
  @ApiNotFoundResponse({
    description: 'Not Found',
  })
  async updateById(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() payload: UpdateInvestmentProductPayloadDto,
  ) {
    const investmentProduct = await this.investmentProductService.updateById(
      id,
      payload,
    );

    if (!investmentProduct) {
      throw new NotFoundEntityError(
        'Investment Product not found',
        'InvestmentProduct',
        'code',
      );
    }

    return InvestmentProductDto.buildDto(investmentProduct);
  }
}
