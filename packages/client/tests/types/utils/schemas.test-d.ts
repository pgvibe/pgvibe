// Test database schemas for type tests
// This file consolidates all database schema definitions used in type testing

import type { JsonbType } from "../../../src/core/builders/expression-builder";
import type {
  Generated,
  WithDefault,
  Nullable,
} from "../../../src/core/types/utility-types";

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
 * Uses utility types to encode database semantics
 */
export interface TestUserTable {
  id: Generated<number>; // SERIAL PRIMARY KEY (auto-generated)
  name: string; // VARCHAR(255) NOT NULL (required)
  email: Nullable<string>; // VARCHAR(255) UNIQUE (nullable)
  active: WithDefault<boolean>; // BOOLEAN DEFAULT true (has default)
  created_at: Generated<Date>; // TIMESTAMP DEFAULT CURRENT_TIMESTAMP (auto-generated)
}

/**
 * Test Posts table for integration tests
 * Uses utility types to encode database semantics
 */
export interface TestPostTable {
  id: Generated<number>; // SERIAL PRIMARY KEY (auto-generated)
  user_id: number; // INTEGER REFERENCES test_users(id) (required)
  title: string; // VARCHAR(255) NOT NULL (required)
  content: Nullable<string>; // TEXT (nullable)
  published: WithDefault<boolean>; // BOOLEAN DEFAULT false (has default)
  created_at: Generated<Date>; // TIMESTAMP DEFAULT CURRENT_TIMESTAMP (auto-generated)
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
 */
export interface IntegrationTestDatabase {
  test_users: TestUserTable;
  test_posts: TestPostTable;
}
