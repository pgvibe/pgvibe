// Table factory for dynamic table creation and management
// Provides utilities for creating isolated test tables

import { pgvibe } from "../../../src/query-builder";
import { safeDbQuery } from "./test-helpers";

/**
 * Table definition interface
 */
export interface TableDefinition {
  name: string;
  schema: string;
}

/**
 * Standard test table set
 */
export interface TestTables {
  users: TableDefinition;
  posts: TableDefinition;
  comments?: TableDefinition;
}

/**
 * Create a users table for testing
 */
export function createUsersTableSchema(tableName: string): TableDefinition {
  return {
    name: tableName,
    schema: `
      CREATE TABLE ${tableName} (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE,
        active BOOLEAN DEFAULT true,
        tags TEXT[] DEFAULT '{}',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `,
  };
}

/**
 * Create a posts table for testing
 */
export function createPostsTableSchema(
  tableName: string,
  usersTableName: string
): TableDefinition {
  return {
    name: tableName,
    schema: `
      CREATE TABLE ${tableName} (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES ${usersTableName}(id) ON DELETE CASCADE,
        title VARCHAR(255) NOT NULL,
        content TEXT,
        published BOOLEAN DEFAULT false,
        categories TEXT[] DEFAULT '{}',
        parent_id INTEGER,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `,
  };
}

/**
 * Create a comments table for testing
 */
export function createCommentsTableSchema(
  tableName: string,
  usersTableName: string,
  postsTableName: string
): TableDefinition {
  return {
    name: tableName,
    schema: `
      CREATE TABLE ${tableName} (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES ${usersTableName}(id) ON DELETE CASCADE,
        post_id INTEGER REFERENCES ${postsTableName}(id) ON DELETE CASCADE,
        content TEXT NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `,
  };
}

/**
 * Create test tables in the database
 */
export async function createTestTables(
  db: pgvibe<any>,
  tables: TestTables
): Promise<void> {
  // Create tables in dependency order
  await db.query(tables.users.schema);
  await db.query(tables.posts.schema);

  if (tables.comments) {
    await db.query(tables.comments.schema);
  }
}

/**
 * Seed test tables with basic data
 */
export async function seedTestData(
  db: pgvibe<any>,
  tables: TestTables
): Promise<{ userIds: number[]; postIds: number[] }> {
  // Insert test users
  const userResult = await db.query(`
    INSERT INTO ${tables.users.name} (name, email, active)
    VALUES 
      ('Test User 1', 'user1@test.com', true),
      ('Test User 2', 'user2@test.com', false),
      ('Test User 3', 'user3@test.com', true)
    RETURNING id
  `);

  const userIds = userResult.rows.map((row: any) => row.id);

  // Insert test posts
  const postResult = await db.query(`
    INSERT INTO ${tables.posts.name} (user_id, title, content, published)
    VALUES 
      (${userIds[0]}, 'Test Post 1', 'Content for post 1', true),
      (${userIds[0]}, 'Test Post 2', 'Content for post 2', false),
      (${userIds[2]}, 'Test Post 3', 'Content for post 3', true)
    RETURNING id
  `);

  const postIds = postResult.rows.map((row: any) => row.id);

  // Insert test comments if comments table exists
  if (tables.comments) {
    await db.query(`
      INSERT INTO ${tables.comments.name} (user_id, post_id, content)
      VALUES 
        (${userIds[1]}, ${postIds[0]}, 'Great post!'),
        (${userIds[2]}, ${postIds[0]}, 'Thanks for sharing'),
        (${userIds[0]}, ${postIds[2]}, 'Interesting perspective')
    `);
  }

  return { userIds, postIds };
}

/**
 * Clean up test tables by dropping them
 */
export async function cleanupTestTables(
  db: pgvibe<any>,
  tableNames: string[]
): Promise<void> {
  // Drop tables in reverse dependency order to avoid foreign key issues
  for (const tableName of tableNames.reverse()) {
    await safeDbQuery(
      db,
      `DROP TABLE IF EXISTS ${tableName} CASCADE`,
      `Dropping table ${tableName}`
    );
  }
}

/**
 * Create a complete test table set with standard naming
 */
export function createStandardTestTables(testId: string): TestTables {
  const usersTable = createUsersTableSchema(`test_users_${testId}`);
  const postsTable = createPostsTableSchema(
    `test_posts_${testId}`,
    usersTable.name
  );
  const commentsTable = createCommentsTableSchema(
    `test_comments_${testId}`,
    usersTable.name,
    postsTable.name
  );

  return {
    users: usersTable,
    posts: postsTable,
    comments: commentsTable,
  };
}

/**
 * Create minimal test tables (just users and posts)
 */
export function createMinimalTestTables(testId: string): TestTables {
  const usersTable = createUsersTableSchema(`test_users_${testId}`);
  const postsTable = createPostsTableSchema(
    `test_posts_${testId}`,
    usersTable.name
  );

  return {
    users: usersTable,
    posts: postsTable,
  };
}
