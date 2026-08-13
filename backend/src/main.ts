import { NestFactory } from '@nestjs/core';
import { Logger, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);

  const configService = app.get(ConfigService);
  const port = configService.get<number>('PORT', 4000);
  const apiPrefix = configService.get<string>('API_PREFIX', 'api/v1');
  const clientUrl = configService.get<string>('CLIENT_URL', 'http://localhost:5173');
  const adminUrl = configService.get<string>('ADMIN_URL', 'http://localhost:5174');

  // CORS configuration for client and admin frontends
  app.enableCors({
    origin: [clientUrl, adminUrl, 'http://localhost:5173', 'http://localhost:5174'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  });

  // Global routing prefix
  app.setGlobalPrefix(apiPrefix);

  // Global DTO input validation (OWASP Best Practice)
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // Global exception filter and response transformer
  app.useGlobalFilters(new AllExceptionsFilter());
  app.useGlobalInterceptors(new TransformInterceptor());

  await app.listen(port);
  logger.log(`====================================================`);
  logger.log(`🚀 QStack Backend running at: http://localhost:${port}/${apiPrefix}`);
  logger.log(`🌐 Allowed Client: ${clientUrl}`);
  logger.log(`🛡️ Allowed Admin: ${adminUrl}`);
  logger.log(`====================================================`);
}
bootstrap();
