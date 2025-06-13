// Test database types for ZenQ type testing
// These types are used in tests and should match the database schema examples

import type { JsonbType } from "../../src/core/builders/expression-builder";

/**
 * User table type for testing with all columns from examples
 */
export interface UserTable {
  id: number;
  name: string;
  email: string | null;
  active: boolean;
  created_at: Date;
  // Array columns for array operation testing
  tags: string[];
  permissions: string[];
  scores: number[];
}

/**
 * Post table type for testing with all columns from examples
 */
export interface PostTable {
  id: number;
  user_id: number;
  title: string;
  content: string | null;
  published: boolean;
  created_at: Date;
  // Array columns for array operation testing
  categories: string[];
  ratings: number[];
}

/**
 * Comment table type for testing with all columns from examples
 */
export interface CommentTable {
  id: number;
  post_id: number;
  user_id: number;
  content: string;
  created_at: Date;
}

/**
 * Test Users table for integration tests
 * Matches the schema created in insert-integration.test.ts
 *
 * For INSERT operations:
 * - id is auto-generated (SERIAL), so it's optional for inserts
 * - name is required (NOT NULL, no default)
 * - email is nullable, so it's optional for inserts
 * - active has a default (DEFAULT true), so it's optional for inserts
 * - created_at has a default (DEFAULT CURRENT_TIMESTAMP), so it's optional for inserts
 */
export interface TestUserTable {
  id?: number; // SERIAL PRIMARY KEY (auto-generated, optional for INSERT)
  name: string; // VARCHAR(255) NOT NULL (required)
  email?: string | null; // VARCHAR(255) UNIQUE (nullable, optional for INSERT)
  active?: boolean; // BOOLEAN DEFAULT true (has default, optional for INSERT)
  created_at?: Date; // TIMESTAMP DEFAULT CURRENT_TIMESTAMP (has default, optional for INSERT)
}

/**
 * Test Posts table for integration tests
 * Matches the schema created in insert-integration.test.ts
 *
 * For INSERT operations:
 * - id is auto-generated (SERIAL), so it's optional for inserts
 * - user_id is required (NOT NULL, no default)
 * - title is required (NOT NULL, no default)
 * - content is nullable, so it's optional for inserts
 * - published has a default (DEFAULT false), so it's optional for inserts
 * - created_at has a default (DEFAULT CURRENT_TIMESTAMP), so it's optional for inserts
 */
export interface TestPostTable {
  id?: number; // SERIAL PRIMARY KEY (auto-generated, optional for INSERT)
  user_id: number; // INTEGER REFERENCES test_users(id) (required)
  title: string; // VARCHAR(255) NOT NULL (required)
  content?: string | null; // TEXT (nullable, optional for INSERT)
  published?: boolean; // BOOLEAN DEFAULT false (has default, optional for INSERT)
  created_at?: Date; // TIMESTAMP DEFAULT CURRENT_TIMESTAMP (has default, optional for INSERT)
}

/**
 * JSONB Users table for testing JSONB operations
 */
export interface JsonbUserTable {
  id: number;
  name: string;
  email: string | null;
  settings: JsonbType<{
    theme: "light" | "dark";
    notifications: {
      email: boolean;
      push: boolean;
    };
    language: string;
    features: string[];
  }>;
  metadata: JsonbType<Record<string, any>>;
  created_at: Date;
}

/**
 * JSONB Products table for testing JSONB operations
 */
export interface JsonbProductTable {
  id: number;
  name: string;
  attributes: JsonbType<{
    color: string;
    size: string;
    price: number;
    tags: string[];
    sale?: boolean;
    featured?: boolean;
    trending?: boolean;
  }>;
  analytics: JsonbType<{
    views: number;
    clicks: number;
    conversions: number;
    revenue: number;
  }>;
  created_at: Date;
}

/**
 * Main test database interface
 */
export interface Database {
  users: UserTable;
  posts: PostTable;
  comments: CommentTable;
  jsonb_users: JsonbUserTable;
  jsonb_products: JsonbProductTable;
}

/**
 * Integration test database interface
 * Used specifically for integration tests with real database tables
 */
export interface IntegrationTestDatabase {
  test_users: TestUserTable;
  test_posts: TestPostTable;
}

// Re-export createTestDatabase for convenience in type tests
export { createTestDatabase } from "./test-config";
