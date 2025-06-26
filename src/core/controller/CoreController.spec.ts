import { Test, TestingModule } from '@nestjs/testing';
import { App } from 'supertest/types';
import request, { Response } from 'supertest';
import {
  INestApplication,
  ValidationPipe,
  VersioningType,
} from '@nestjs/common';

import { CoreController } from './CoreController';
import { CoreService } from '../service/CoreService';
import { name, version } from '../../../package.json';

describe(CoreController, () => {
  let app: INestApplication<App>;

  const mockCoreService = {
    information: jest.fn(),
  };

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CoreController],
      providers: [
        {
          provide: CoreService,
          useValue: mockCoreService,
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

    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('GET /information', () => {
    describe('when get server information', () => {
      let response: Response;

      beforeAll(async () => {
        jest.clearAllMocks();

        mockCoreService.information.mockReturnValueOnce({ name, version });
        response = await request(app.getHttpServer()).get('/information');
      });

      it('returns the name and version', () => {
        expect(response.body).toEqual({
          name,
          version,
        });
      });
    });
  });
});
