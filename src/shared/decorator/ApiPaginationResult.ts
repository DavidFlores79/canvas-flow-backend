import { applyDecorators, Type } from '@nestjs/common';
import { ApiExtraModels, ApiOkResponse, getSchemaPath } from '@nestjs/swagger';

import { PaginationResultDto } from '../../shared/dto/PaginationResultDto';

export const ApiPaginationResponse = <TModel extends Type<any>>(
  model: TModel,
  description = 'Returns a paginated result',
) => {
  return applyDecorators(
    ApiExtraModels(PaginationResultDto, model),
    ApiOkResponse({
      description,
      schema: {
        allOf: [
          { $ref: getSchemaPath(PaginationResultDto) },
          {
            properties: {
              docs: {
                type: 'array',
                items: { $ref: getSchemaPath(model) },
              },
              total: {
                type: 'number',
              },
              limit: {
                type: 'number',
              },
              page: {
                type: 'number',
              },
              pages: {
                type: 'number',
              },
              hasPrevPage: {
                type: 'boolean',
              },
              hasNextPage: {
                type: 'boolean',
              },
              prevPage: {
                type: 'number',
              },
              nextPage: {
                type: 'number',
              },
              pagingCounter: {
                type: 'number',
              },
            },
          },
        ],
      },
    }),
  );
};
