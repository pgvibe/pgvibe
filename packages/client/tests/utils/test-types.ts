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

// Re-export createTestDatabase for convenience in type tests
export { createTestDatabase } from "./test-config";
