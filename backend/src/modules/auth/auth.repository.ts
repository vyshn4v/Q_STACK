import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';

export interface UserRow {
  id: string;
  email: string;
  password_hash: string | null;
  display_name: string;
  avatar_url: string | null;
  bio: string | null;
  role: string;
  reputation_total: number;
  is_banned: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface AuthIdentityRow {
  id: string;
  user_id: string;
  provider: string;
  provider_user_id: string;
  created_at: Date;
}

@Injectable()
export class AuthRepository {
  constructor(private readonly db: DatabaseService) {}

  async findUserByEmail(email: string): Promise<UserRow | null> {
    const result = await this.db.query<UserRow>(
      `SELECT id, email, password_hash, display_name, avatar_url, bio, role, reputation_total, is_banned, created_at, updated_at
       FROM users
       WHERE email = $1`,
      [email.toLowerCase().trim()],
    );
    return result.rows[0] || null;
  }

  async findUserById(userId: string): Promise<UserRow | null> {
    const result = await this.db.query<UserRow>(
      `SELECT id, email, password_hash, display_name, avatar_url, bio, role, reputation_total, is_banned, created_at, updated_at
       FROM users
       WHERE id = $1`,
      [userId],
    );
    return result.rows[0] || null;
  }

  async createUserWithLocalAuth(
    email: string,
    passwordHash: string,
    displayName: string,
  ): Promise<UserRow> {
    return this.db.transaction(async (client) => {
      // 1. Insert user
      const userResult = await client.query<UserRow>(
        `INSERT INTO users (email, password_hash, display_name, role, reputation_total)
         VALUES ($1, $2, $3, 'user', 1)
         RETURNING id, email, password_hash, display_name, avatar_url, bio, role, reputation_total, is_banned, created_at, updated_at`,
        [email.toLowerCase().trim(), passwordHash, displayName.trim()],
      );
      const user = userResult.rows[0];

      // 2. Insert auth identity
      await client.query(
        `INSERT INTO auth_identities (user_id, provider, provider_user_id)
         VALUES ($1, 'local', $2)`,
        [user.id, email.toLowerCase().trim()],
      );

      // 3. Initial reputation ledger entry
      await client.query(
        `INSERT INTO reputation_ledger (user_id, delta, reason)
         VALUES ($1, 1, 'Welcome to QStack')`,
        [user.id],
      );

      return user;
    });
  }

  async findOrCreateOAuthUser(
    provider: 'google' | 'github',
    providerUserId: string,
    email: string,
    displayName: string,
    avatarUrl?: string,
  ): Promise<UserRow> {
    return this.db.transaction(async (client) => {
      // Check if identity exists
      const identityResult = await client.query<AuthIdentityRow>(
        `SELECT user_id FROM auth_identities WHERE provider = $1 AND provider_user_id = $2`,
        [provider, providerUserId],
      );

      if (identityResult.rows.length > 0) {
        const userResult = await client.query<UserRow>(
          `SELECT id, email, password_hash, display_name, avatar_url, bio, role, reputation_total, is_banned, created_at, updated_at
           FROM users WHERE id = $1`,
          [identityResult.rows[0].user_id],
        );
        return userResult.rows[0];
      }

      // Check if user exists by email
      const existingUser = await client.query<UserRow>(
        `SELECT id, email, password_hash, display_name, avatar_url, bio, role, reputation_total, is_banned, created_at, updated_at
         FROM users WHERE email = $1`,
        [email.toLowerCase().trim()],
      );

      let user: UserRow;
      if (existingUser.rows.length > 0) {
        user = existingUser.rows[0];
      } else {
        const newUserResult = await client.query<UserRow>(
          `INSERT INTO users (email, display_name, avatar_url, role, reputation_total)
           VALUES ($1, $2, $3, 'user', 1)
           RETURNING id, email, password_hash, display_name, avatar_url, bio, role, reputation_total, is_banned, created_at, updated_at`,
          [email.toLowerCase().trim(), displayName.trim(), avatarUrl || null],
        );
        user = newUserResult.rows[0];
      }

      // Link identity
      await client.query(
        `INSERT INTO auth_identities (user_id, provider, provider_user_id)
         VALUES ($1, $2, $3)`,
        [user.id, provider, providerUserId],
      );

      return user;
    });
  }
}
