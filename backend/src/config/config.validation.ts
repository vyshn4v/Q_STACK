import { IsEnum, IsNumber, IsOptional, IsString, validateSync } from 'class-validator';
import { plainToInstance } from 'class-transformer';

export enum Environment {
  Development = 'development',
  Production = 'production',
  Test = 'test',
}

class EnvironmentVariables {
  @IsEnum(Environment)
  @IsOptional()
  NODE_ENV: Environment = Environment.Development;

  @IsNumber()
  @IsOptional()
  PORT: number = 4000;

  @IsString()
  @IsOptional()
  API_PREFIX: string = 'api/v1';

  @IsString()
  @IsOptional()
  CLIENT_URL: string = 'http://localhost:5173';

  @IsString()
  @IsOptional()
  ADMIN_URL: string = 'http://localhost:5174';

  // Database
  @IsString()
  @IsOptional()
  DATABASE_HOST: string = 'localhost';

  @IsNumber()
  @IsOptional()
  DATABASE_PORT: number = 5432;

  @IsString()
  @IsOptional()
  DATABASE_USER: string = 'qstack_user';

  @IsString()
  @IsOptional()
  DATABASE_PASSWORD: string = 'qstack_secret_password';

  @IsString()
  @IsOptional()
  DATABASE_NAME: string = 'qstack_db';

  @IsString()
  @IsOptional()
  DATABASE_SSL: string = 'false';

  // Redis
  @IsString()
  @IsOptional()
  REDIS_HOST: string = 'localhost';

  @IsNumber()
  @IsOptional()
  REDIS_PORT: number = 6379;

  @IsString()
  @IsOptional()
  REDIS_PASSWORD?: string;

  // JWT
  @IsString()
  @IsOptional()
  JWT_ACCESS_SECRET: string = 'dev-jwt-access-secret-qstack-2026-key';

  @IsString()
  @IsOptional()
  JWT_REFRESH_SECRET: string = 'dev-jwt-refresh-secret-qstack-2026-key';

  @IsString()
  @IsOptional()
  JWT_ACCESS_EXPIRES_IN: string = '15m';

  @IsString()
  @IsOptional()
  JWT_REFRESH_EXPIRES_IN: string = '7d';

  // Super Admin
  @IsString()
  @IsOptional()
  SUPER_ADMIN_EMAIL: string = 'superadmin@qstack.dev';

  @IsString()
  @IsOptional()
  SUPER_ADMIN_PASSWORD: string = 'SuperAdmin@QStack2026!';

  @IsString()
  @IsOptional()
  SUPER_ADMIN_NAME: string = 'Super Admin';

  // AI & Vector
  @IsString()
  @IsOptional()
  GEMINI_API_KEY?: string;

  @IsString()
  @IsOptional()
  PINECONE_API_KEY?: string;

  @IsString()
  @IsOptional()
  PINECONE_INDEX?: string = 'qstack-qa-index';

  @IsString()
  @IsOptional()
  PINECONE_ENVIRONMENT?: string;
}

export function validate(config: Record<string, unknown>) {
  const validatedConfig = plainToInstance(EnvironmentVariables, config, {
    enableImplicitConversion: true,
  });
  const errors = validateSync(validatedConfig, { skipMissingProperties: false });

  if (errors.length > 0) {
    throw new Error(errors.toString());
  }
  return validatedConfig;
}
