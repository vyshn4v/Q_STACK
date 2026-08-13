import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Pool, PoolClient, QueryResult, QueryResultRow } from 'pg';

@Injectable()
export class DatabaseService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(DatabaseService.name);
  private pool: Pool;

  constructor(private readonly configService: ConfigService) {}

  async onModuleInit(): Promise<void> {
    const isSsl = this.configService.get<string>('DATABASE_SSL') === 'true';

    this.pool = new Pool({
      host: this.configService.get<string>('DATABASE_HOST', 'localhost'),
      port: Number(this.configService.get<number>('DATABASE_PORT', 5432)),
      user: this.configService.get<string>('DATABASE_USER', 'qstack_user'),
      password: this.configService.get<string>('DATABASE_PASSWORD', 'qstack_secret_password'),
      database: this.configService.get<string>('DATABASE_NAME', 'qstack_db'),
      ssl: isSsl ? { rejectUnauthorized: false } : false,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
    });

    this.pool.on('error', (err) => {
      this.logger.error('Unexpected error on idle PostgreSQL client', err.stack);
    });

    try {
      const client = await this.pool.connect();
      this.logger.log('Successfully connected to PostgreSQL database');
      client.release();
    } catch (error) {
      this.logger.warn(`Could not connect to PostgreSQL immediately: ${(error as Error).message}. Will retry on requests.`);
    }
  }

  async onModuleDestroy(): Promise<void> {
    if (this.pool) {
      this.logger.log('Closing PostgreSQL connection pool');
      await this.pool.end();
    }
  }

  /**
   * Execute a parameterized SQL query safely against the pool.
   * Parameterized queries prevent SQL injection vulnerabilities.
   */
  async query<T extends QueryResultRow = any>(
    queryText: string,
    params?: any[],
  ): Promise<QueryResult<T>> {
    const startTime = Date.now();
    try {
      const result = await this.pool.query<T>(queryText, params);
      const duration = Date.now() - startTime;
      if (duration > 500) {
        this.logger.warn(`Slow query detected (${duration}ms): ${queryText.substring(0, 100)}...`);
      }
      return result;
    } catch (error) {
      this.logger.error(`Database query failed: ${(error as Error).message} - SQL: ${queryText}`, (error as Error).stack);
      throw error;
    }
  }

  /**
   * Execute multiple operations within an atomic transaction.
   */
  async transaction<T>(callback: (client: PoolClient) => Promise<T>): Promise<T> {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      const result = await callback(client);
      await client.query('COMMIT');
      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      this.logger.error(`Transaction rolled back: ${(error as Error).message}`, (error as Error).stack);
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Health check method.
   */
  async ping(): Promise<boolean> {
    try {
      const result = await this.pool.query('SELECT 1 AS healthy');
      return result.rows[0]?.healthy === 1;
    } catch (error) {
      this.logger.error(`Database ping failed: ${(error as Error).message}`);
      return false;
    }
  }
}
