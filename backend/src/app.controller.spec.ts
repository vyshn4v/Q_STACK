import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { AppService } from './app.service';

describe('AppController', () => {
  let appController: AppController;
  let appService: AppService;

  beforeEach(async () => {
    const mockAppService = {
      getHealthStatus: jest.fn().mockResolvedValue({
        status: 'ok',
        services: {
          database: 'up',
          redis: 'up',
        },
        timestamp: '2026-08-13T00:00:00.000Z',
        version: '1.0.0-phase0',
      }),
    };

    const moduleRef: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [
        {
          provide: AppService,
          useValue: mockAppService,
        },
      ],
    }).compile();

    appController = moduleRef.get<AppController>(AppController);
    appService = moduleRef.get<AppService>(AppService);
  });

  describe('health check', () => {
    it('should return health status', async () => {
      const result = await appController.checkHealth();
      expect(result).toHaveProperty('status', 'ok');
      expect(result.services).toHaveProperty('database', 'up');
      expect(result.services).toHaveProperty('redis', 'up');
    });
  });
});
