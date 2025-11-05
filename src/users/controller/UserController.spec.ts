// user.controller.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';

import { UserController } from './UserController';
import { UserService } from '../service/UserService';
import { User } from '../entity/User';
import { UserDto } from '../dto/UserDto';
import { PaginationResultDto } from '../../shared/dto/PaginationResultDto';
import { NotFoundEntityError } from '../../shared/error/NotFoundEntityError';
import { CreateUserPayloadDto } from '../dto/CreateUserPayloadDto';
import { UpdateUserPayloadDto } from '../dto/UpdateUserPayloadDto';

describe('UserController', () => {
  let app: INestApplication;
  let controller: UserController;

  const mockUserService = {
    findAll: jest.fn(),
    findById: jest.fn(),
    create: jest.fn(),
    updateById: jest.fn(),
    remove: jest.fn(),
  };

  const fakeUser: User = {
    id: 'uuid-123',
    firstName: 'Juan',
    middleName: null,
    lastName: 'Perez',
    secondLastName: null,
    fullName: 'Juan Perez',
    displayName: 'Juan',
    email: 'juan@example.com',
    phone: '5512345678',
    gender: null,
    group: null,
    addresses: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  } as unknown as User;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UserController],
      providers: [
        {
          provide: UserService,
          useValue: mockUserService,
        },
      ],
    }).compile();

    app = module.createNestApplication();
    await app.init();

    controller = module.get<UserController>(UserController);
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => jest.clearAllMocks());

  describe('findAll', () => {
    it('returns paginated users as DTOs', async () => {
      mockUserService.findAll.mockResolvedValue({
        docs: [fakeUser],
        total: 1,
        page: 1,
        pages: 1,
        limit: 10,
      });

      const result: PaginationResultDto<UserDto> = await controller.findAll({
        page: 1,
        limit: 10,
      });

      expect(result.docs).toHaveLength(1);
      // buildDto should return an instance of UserDto — validate shape
      expect(result.docs[0]).toBeInstanceOf(UserDto);
      expect(result.total).toBe(1);
      expect(mockUserService.findAll).toHaveBeenCalledWith({
        page: 1,
        limit: 10,
      });
    });
  });

  describe('getById', () => {
    it('returns a UserDto if found', async () => {
      mockUserService.findById.mockResolvedValue(fakeUser);

      const result = await controller.getById('uuid-123');
      expect(result).toBeInstanceOf(UserDto);
      expect(result.id).toEqual(fakeUser.id);
      expect(mockUserService.findById).toHaveBeenCalledWith('uuid-123');
    });

    it('throws NotFoundEntityError if not found', async () => {
      mockUserService.findById.mockResolvedValue(null);

      await expect(controller.getById('uuid-404')).rejects.toThrow(
        NotFoundEntityError,
      );
      expect(mockUserService.findById).toHaveBeenCalledWith('uuid-404');
    });
  });

  describe('create', () => {
    it('returns a UserDto after creation', async () => {
      mockUserService.create.mockResolvedValue(fakeUser);

      const payload: CreateUserPayloadDto = {
        firstName: 'Juan',
        lastName: 'Perez',
        email: 'juan@example.com',
        // agrega otros campos que tu DTO requiera
      } as CreateUserPayloadDto;

      const result = await controller.create(payload);
      expect(result).toBeInstanceOf(UserDto);
      expect(result.email).toBe(fakeUser.email);
      expect(mockUserService.create).toHaveBeenCalledWith(payload);
    });
  });

  describe('updateById', () => {
    it('returns updated UserDto', async () => {
      mockUserService.updateById.mockResolvedValue(fakeUser);

      const payload: UpdateUserPayloadDto = {
        firstName: 'Juanito',
        updatedAt: new Date().toISOString(),
      } as UpdateUserPayloadDto;

      const result = await controller.updateById('uuid-123', payload);
      expect(result).toBeInstanceOf(UserDto);
      expect(mockUserService.updateById).toHaveBeenCalledWith(
        'uuid-123',
        payload,
      );
    });
  });

  describe('deleteById', () => {
    it('calls remove when user exists', async () => {
      mockUserService.findById.mockResolvedValue(fakeUser);
      mockUserService.remove.mockResolvedValue(undefined);

      await controller.deleteById('uuid-123');

      expect(mockUserService.findById).toHaveBeenCalledWith('uuid-123');
      expect(mockUserService.remove).toHaveBeenCalledWith('uuid-123');
    });

    it('throws NotFoundEntityError if user does not exist', async () => {
      mockUserService.findById.mockResolvedValue(null);

      await expect(controller.deleteById('uuid-404')).rejects.toThrow(
        NotFoundEntityError,
      );

      expect(mockUserService.findById).toHaveBeenCalledWith('uuid-404');
      expect(mockUserService.remove).not.toHaveBeenCalled();
    });
  });
});
