import { Pool } from 'pg';
import * as fs from 'fs';
import * as path from 'path';
import * as bcrypt from 'bcrypt';
import * as dotenv from 'dotenv';

// Load environment variables from backend/.env or root .env
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

async function runStandaloneMigrations() {
  console.log('----------------------------------------------------');
  console.log('🔄 QStack Database Migration Runner');
  console.log('----------------------------------------------------');

  const host = process.env.DATABASE_HOST || 'localhost';
  const port = parseInt(process.env.DATABASE_PORT || '5432', 10);
  const user = process.env.DATABASE_USER || 'qstack_user';
  const password = process.env.DATABASE_PASSWORD || 'qstack_secret_password';
  const database = process.env.DATABASE_NAME || 'qstack_db';
  const isSsl = process.env.DATABASE_SSL === 'true';

  console.log(`Connecting to PostgreSQL at: ${host}:${port}/${database} (User: ${user})`);

  const pool = new Pool({
    host,
    port,
    user,
    password,
    database,
    ssl: isSsl ? { rejectUnauthorized: false } : false,
    connectionTimeoutMillis: 10000,
  });

  try {
    const client = await pool.connect();
    console.log('✅ Connected to database successfully.');

    // 1. Create schema_migrations table
    await client.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        version VARCHAR(50) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        executed_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 2. Read migration files
    const migrationsDir = path.resolve(__dirname, '../../migrations');
    if (!fs.existsSync(migrationsDir)) {
      throw new Error(`Migrations directory not found at: ${migrationsDir}`);
    }

    const files = fs
      .readdirSync(migrationsDir)
      .filter((file) => file.endsWith('.sql'))
      .sort();

    // 3. Get applied migrations
    const appliedResult = await client.query<{ version: string }>(
      'SELECT version FROM schema_migrations ORDER BY version ASC',
    );
    const appliedVersions = new Set(appliedResult.rows.map((row) => row.version));

    // 4. Apply pending migrations
    let appliedCount = 0;
    for (const file of files) {
      const version = file.split('_')[0];
      if (!appliedVersions.has(version)) {
        console.log(`⏳ Applying migration [${version}]: ${file}...`);
        const filePath = path.join(migrationsDir, file);
        const sql = fs.readFileSync(filePath, 'utf-8');

        await client.query('BEGIN');
        try {
          await client.query(sql);
          await client.query(
            'INSERT INTO schema_migrations (version, name) VALUES ($1, $2)',
            [version, file],
          );
          await client.query('COMMIT');
          console.log(`✅ Applied migration: ${file}`);
          appliedCount++;
        } catch (migErr) {
          await client.query('ROLLBACK');
          console.error(`❌ Migration failed for ${file}: ${(migErr as Error).message}`);
          throw migErr;
        }
      } else {
        console.log(`⏩ Migration already applied: ${file}`);
      }
    }

    // 5. Seed Super Admin
    const adminEmail = process.env.SUPER_ADMIN_EMAIL || 'superadmin@qstack.dev';
    const adminPassword = process.env.SUPER_ADMIN_PASSWORD || 'SuperAdmin@QStack2026!';
    const adminName = process.env.SUPER_ADMIN_NAME || 'Super Admin';

    const existingAdmin = await client.query(
      'SELECT id, role FROM users WHERE email = $1',
      [adminEmail.toLowerCase().trim()],
    );

    if (existingAdmin.rows.length === 0) {
      console.log(`👑 Seeding initial Super Admin: ${adminEmail}`);
      const passwordHash = await bcrypt.hash(adminPassword, 12);
      await client.query(
        `INSERT INTO users (email, password_hash, display_name, role, reputation_total)
         VALUES ($1, $2, $3, 'super_admin', 1000)`,
        [adminEmail.toLowerCase().trim(), passwordHash, adminName],
      );
      console.log('✅ Super Admin seeded successfully.');
    } else {
      console.log(`ℹ️ Super Admin account already exists: ${adminEmail}`);
    }

    client.release();
    console.log('----------------------------------------------------');
    console.log(`🎉 Migration complete! ${appliedCount} new migration(s) applied.`);
    console.log('----------------------------------------------------');
  } catch (error) {
    console.error('❌ Database migration error:', (error as Error).message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

runStandaloneMigrations();
