import { NestFactory } from '@nestjs/core';
import { Logger, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import cookieParser from 'cookie-parser';
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

  // Parse HTTP-only cookies
  app.use(cookieParser());

  // CORS configuration for client and admin frontends across localhost & LAN
  app.enableCors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl) or localhost/LAN IPs
      if (!origin || /^http:\/\/(localhost|127\.0\.0\.1|192\.168\.\d+\.\d+|10\.\d+\.\d+\.\d+|172\.(1[6-9]|2\d|3[0-1])\.\d+\.\d+)(:\d+)?$/.test(origin)) {
        callback(null, true);
      } else if (origin === clientUrl || origin === adminUrl) {
        callback(null, true);
      } else {
        callback(null, true); // Permissive in dev/local network
      }
    },
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

  await app.listen(port, '0.0.0.0');
  logger.log(`====================================================`);
  logger.log(`🚀 QStack Backend running at: http://0.0.0.0:${port}/${apiPrefix}`);
  logger.log(`🌐 Allowed Client: ${clientUrl}`);
  logger.log(`🛡️ Allowed Admin: ${adminUrl}`);
  logger.log(`====================================================`);
}
bootstrap();
