import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DatabaseService } from './database.service';
import * as fs from 'fs';
import * as path from 'path';
import * as bcrypt from 'bcrypt';

@Injectable()
export class MigratorService implements OnModuleInit {
  private readonly logger = new Logger(MigratorService.name);

  constructor(
    private readonly db: DatabaseService,
    private readonly configService: ConfigService,
  ) {}

  async onModuleInit(): Promise<void> {
    try {
      await this.runMigrations();
      await this.seedSuperAdmin();
    } catch (error) {
      this.logger.error(`Migration/seed step encountered an issue: ${(error as Error).message}`);
    }
  }

  /**
   * Run all pending SQL migrations found in the migrations folder.
   */
  async runMigrations(): Promise<void> {
    this.logger.log('Checking for database migrations...');

    // 1. Ensure migrations table exists
    await this.db.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        version VARCHAR(50) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        executed_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 2. Discover migration files
    const migrationsDir = path.resolve(__dirname, '../../migrations');
    if (!fs.existsSync(migrationsDir)) {
      this.logger.warn(`Migrations directory not found at: ${migrationsDir}`);
      return;
    }

    const files = fs
      .readdirSync(migrationsDir)
      .filter((file) => file.endsWith('.sql'))
      .sort();

    // 3. Get applied migrations
    const appliedResult = await this.db.query<{ version: string }>(
      'SELECT version FROM schema_migrations ORDER BY version ASC',
    );
    const appliedVersions = new Set(appliedResult.rows.map((row) => row.version));

    // 4. Run unapplied migrations sequentially
    for (const file of files) {
      const version = file.split('_')[0];
      if (!appliedVersions.has(version)) {
        this.logger.log(`Applying migration: ${file}...`);
        const filePath = path.join(migrationsDir, file);
        const sqlContent = fs.readFileSync(filePath, 'utf-8');

        await this.db.transaction(async (client) => {
          await client.query(sqlContent);
          await client.query(
            'INSERT INTO schema_migrations (version, name) VALUES ($1, $2)',
            [version, file],
          );
        });

        this.logger.log(`Successfully applied migration: ${file}`);
      }
    }

    this.logger.log('Database schema is up to date.');
  }

  /**
   * Ensure the Super Admin account is seeded if configured.
   */
  async seedSuperAdmin(): Promise<void> {
    const email = this.configService.get<string>('SUPER_ADMIN_EMAIL');
    const password = this.configService.get<string>('SUPER_ADMIN_PASSWORD');
    const displayName = this.configService.get<string>('SUPER_ADMIN_NAME', 'Super Admin');

    if (!email || !password) {
      return;
    }

    const existing = await this.db.query(
      'SELECT id, role FROM users WHERE email = $1',
      [email.toLowerCase().trim()],
    );

    if (existing.rows.length === 0) {
      const passwordHash = await bcrypt.hash(password, 12);
      await this.db.query(
        `INSERT INTO users (email, password_hash, display_name, role, reputation_total)
         VALUES ($1, $2, $3, 'super_admin', 1000)`,
        [email.toLowerCase().trim(), passwordHash, displayName],
      );
      this.logger.log(`Seeded Super Admin user: ${email}`);
    }
  }
}
