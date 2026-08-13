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

  @IsNumber()
  @IsOptional()
  FEED_CACHE_TTL_SECONDS: number = 60;

  // JWT
  @IsString()
  @IsOptional()
  JWT_ACCESS_SECRET: string = 'dev-jwt-access-secret-qstack-2026-key';

  @IsString()
  @IsOptional()
  JWT_REFRESH_SECRET: string = 'dev-jwt-refresh-secret-qstack-2026-key';

  @IsString()
  @IsOptional()
  JWT_ACCESS_EXPIRES_IN: string = '1h';

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

  // AI & Vector Services
  @IsString()
  @IsOptional()
  NVIDIA_NIM_API_KEY?: string;

  @IsString()
  @IsOptional()
  NVIDIA_NIM_BASE_URL?: string = 'https://integrate.api.nvidia.com/v1';

  @IsString()
  @IsOptional()
  NVIDIA_NIM_EMBEDDING_MODEL?: string = 'nvidia/nv-embed-v1';

  @IsString()
  @IsOptional()
  NVIDIA_NIM_CHAT_MODEL?: string = 'meta/llama-3.1-8b-instruct';

  @IsString()
  @IsOptional()
  OPENROUTER_API_KEY?: string;

  @IsString()
  @IsOptional()
  OPENROUTER_BASE_URL?: string = 'https://openrouter.ai/api/v1';

  @IsString()
  @IsOptional()
  OPENROUTER_CHAT_MODEL?: string = 'meta-llama/llama-3.1-8b-instruct:free';

  @IsString()
  @IsOptional()
  PINECONE_API_KEY?: string;

  @IsString()
  @IsOptional()
  PINECONE_INDEX?: string = 'qstack-qa-index';

  @IsString()
  @IsOptional()
  PINECONE_ENVIRONMENT?: string;

  // OAuth Settings
  @IsString()
  @IsOptional()
  GOOGLE_CLIENT_ID?: string;

  @IsString()
  @IsOptional()
  GOOGLE_CLIENT_SECRET?: string;

  @IsString()
  @IsOptional()
  GOOGLE_CALLBACK_URL?: string = 'http://localhost:4000/api/v1/auth/google/callback';

  @IsString()
  @IsOptional()
  GITHUB_CLIENT_ID?: string;

  @IsString()
  @IsOptional()
  GITHUB_CLIENT_SECRET?: string;

  @IsString()
  @IsOptional()
  GITHUB_CALLBACK_URL?: string = 'http://localhost:4000/api/v1/auth/github/callback';
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
