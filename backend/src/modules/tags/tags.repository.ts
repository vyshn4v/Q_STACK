import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';
import { PoolClient, QueryResult } from 'pg';

export interface TagRow {
  id: string;
  name: string;
  description: string | null;
  questions_count: number;
  created_at: Date;
}

@Injectable()
export class TagsRepository {
  constructor(private readonly db: DatabaseService) {}

  async findAll(search?: string, limit = 50): Promise<TagRow[]> {
    if (search) {
      const result = await this.db.query<TagRow>(
        `SELECT id, name, description, questions_count, created_at
         FROM tags
         WHERE name ILIKE $1
         ORDER BY questions_count DESC, name ASC
         LIMIT $2`,
        [`%${search}%`, limit],
      );
      return result.rows;
    }

    const result = await this.db.query<TagRow>(
      `SELECT id, name, description, questions_count, created_at
       FROM tags
       ORDER BY questions_count DESC, name ASC
       LIMIT $1`,
      [limit],
    );
    return result.rows;
  }

  async findByName(name: string): Promise<TagRow | null> {
    const result = await this.db.query<TagRow>(
      `SELECT id, name, description, questions_count, created_at
       FROM tags
       WHERE name = $1`,
      [name.toLowerCase().trim()],
    );
    return result.rows[0] || null;
  }

  /**
   * Find or create tags in bulk, within a transaction client if provided.
   */
  async findOrCreateTags(tagNames: string[], client?: PoolClient): Promise<TagRow[]> {
    const sanitizedNames = Array.from(
      new Set(
        tagNames
          .map((t) => t.toLowerCase().trim().replace(/[^a-z0-9-+#.]/g, ''))
          .filter((t) => t.length > 0 && t.length <= 50),
      ),
    );

    if (sanitizedNames.length === 0) return [];

    const tags: TagRow[] = [];
    for (const name of sanitizedNames) {
      const querySql = `
        INSERT INTO tags (name)
        VALUES ($1)
        ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name
        RETURNING id, name, description, questions_count, created_at
      `;
      const result: QueryResult<TagRow> = client
        ? await client.query(querySql, [name])
        : await this.db.query<TagRow>(querySql, [name]);

      tags.push(result.rows[0]);
    }

    return tags;
  }
}
