import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Version,
  HttpCode,
  HttpStatus,
  Query,
  ParseUUIDPipe,
} from '@nestjs/common';
import { NotFoundEntityError } from '../../shared/error/NotFoundEntityError';
import { UserService } from '../service/UserService';
import {
  ApiBadRequestResponse,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
} from '@nestjs/swagger';
import { ApiPaginationResponse } from '../../shared/decorator/ApiPaginationResult';
import { UserDto } from '../dto/UserDto';
import { FilterUsersQueryDto } from '../dto/FilterUsersQueryDto';
import { PaginationResultDto } from '../../shared/dto/PaginationResultDto';
import { User } from '../schemas/UserSchema';
import { CreateUserPayloadDto } from '../dto/CreateUserPayloadDto';
import { UpdateUserPayloadDto } from '../dto/UpdateUserPayloadDto';

@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get()
  @Version('1')
  @ApiOperation({
    parameters: [
      { name: 'page', in: 'query' },
      { name: 'limit', in: 'query' },
      { name: 'firstName', in: 'query' },
      { name: 'middleName', in: 'query' },
      { name: 'lastName', in: 'query' },
      { name: 'secondLastName', in: 'query' },
      { name: 'fullName', in: 'query' },
      { name: 'email', in: 'query' },
      { name: 'phone', in: 'query' },
      { name: 'rfc', in: 'query' },
      { name: 'curp', in: 'query' },
      { name: 'group', in: 'query' },
    ],
    operationId: 'findAllUsers',
    summary: 'Find all Users',
    description: 'Find all Users',
  })
  @HttpCode(HttpStatus.OK)
  @ApiPaginationResponse(UserDto)
  async findAll(
    @Query() query: FilterUsersQueryDto,
  ): Promise<PaginationResultDto<UserDto>> {
    const response = await this.userService.findAll(query);

    const pagination = new PaginationResultDto<UserDto>();
    pagination.docs = response.docs.map((row: User) => UserDto.buildDto(row));
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
    parameters: [
      { name: 'id', in: 'path' },
      { name: 'userId', in: 'query' },
    ],
    operationId: 'findUserById',
    summary: 'Get a User by Id',
    description: 'Get a User by Id',
  })
  @ApiOkResponse({
    description: 'Return a User',
    type: UserDto,
  })
  @ApiNotFoundResponse({
    description: 'Not Found',
  })
  @ApiBadRequestResponse({
    description: 'Bad Request',
  })
  async getById(@Param('id', ParseUUIDPipe) id: string): Promise<UserDto> {
    const User = await this.userService.findById(id);
    if (!User) {
      throw new NotFoundEntityError('User not found', 'User', '404');
    }

    return UserDto.buildDto(User);
  }

  @Post()
  @Version('1')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    operationId: 'createUser',
    summary: 'Create a new User',
    description: 'Create a new User',
  })
  @ApiCreatedResponse({
    description: 'Created',
    type: UserDto,
  })
  @ApiBadRequestResponse({
    description: 'Bad Request',
  })
  async create(@Body() payload: CreateUserPayloadDto) {
    const obj = await this.userService.create(payload);
    return UserDto.buildDto(obj);
  }

  @Patch(':id')
  @Version('1')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    parameters: [{ name: 'id', in: 'path' }],
    operationId: 'updateUserById',
    summary: 'Update a User by id',
    description: 'Update a User by id',
  })
  @ApiOkResponse({
    description: 'User',
    type: UserDto,
  })
  @ApiBadRequestResponse({
    description: 'Bad Request',
  })
  @ApiNotFoundResponse({
    description: 'Not Found',
  })
  async updateById(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() payload: UpdateUserPayloadDto,
  ): Promise<UserDto> {
    const user = await this.userService.updateById(id, payload);
    return UserDto.buildDto(user);
  }

  @Delete(':id')
  @Version('1')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    parameters: [{ name: 'id', in: 'path' }],
    operationId: 'deleteUserById',
    summary: 'Delete a User by id',
    description: 'Delete a User by id',
  })
  @ApiNoContentResponse({
    description: 'No Content',
  })
  @ApiNotFoundResponse({
    description: 'Not Found',
  })
  async deleteById(@Param('id', ParseUUIDPipe) id: string) {
    const result = await this.userService.findById(id);
    if (!result) {
      throw new NotFoundEntityError('User not found', 'User', '404');
    }
    return await this.userService.remove(id);
  }
}
