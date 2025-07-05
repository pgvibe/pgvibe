// Example database types for pgvibe playground
// These types demonstrate how to define your database schema for pgvibe

import type { Generated, WithDefault } from "../src/query-builder";

/**
 * Example User table
 * Represents users in your application
 *
 * This schema matches the actual PostgreSQL database structure from init.sql
 * and demonstrates proper use of Generated<T> and WithDefault<T> utility types
 */
export interface UserTable {
  id: Generated<number>; // SERIAL PRIMARY KEY - auto-generated
  name: string; // VARCHAR(255) NOT NULL - required
  email: string | null; // VARCHAR(255) - nullable, optional in INSERT
  active: WithDefault<boolean>; // BOOLEAN DEFAULT true - has default, optional in INSERT
  created_at: WithDefault<Date>; // TIMESTAMP DEFAULT NOW() - has default, optional in INSERT
  // Array columns from actual database schema
  tags: WithDefault<string[]>; // TEXT[] DEFAULT '{}' - has default, optional in INSERT
  permissions: WithDefault<string[]>; // TEXT[] DEFAULT '{}' - has default, optional in INSERT
  scores: WithDefault<number[]>; // INTEGER[] DEFAULT '{}' - has default, optional in INSERT
}

/**
 * Example Post table
 * Represents blog posts or articles
 *
 * Updated to match the actual database schema with proper utility types
 */
export interface PostTable {
  id: Generated<number>; // SERIAL PRIMARY KEY - auto-generated
  user_id: number; // INTEGER NOT NULL - required foreign key
  title: string; // VARCHAR(255) NOT NULL - required
  content: string | null; // TEXT - nullable, optional in INSERT
  published: WithDefault<boolean>; // BOOLEAN DEFAULT false - has default, optional in INSERT
  created_at: WithDefault<Date>; // TIMESTAMP DEFAULT NOW() - has default, optional in INSERT
  // Array columns from actual database schema
  categories: WithDefault<string[]>; // TEXT[] DEFAULT '{}' - has default, optional in INSERT
  ratings: WithDefault<number[]>; // INTEGER[] DEFAULT '{}' - has default, optional in INSERT
}

/**
 * Example Comment table
 * Represents comments on posts
 *
 * Updated to match the actual database schema with proper utility types
 */
export interface CommentTable {
  id: Generated<number>; // SERIAL PRIMARY KEY - auto-generated
  post_id: number; // INTEGER NOT NULL - required foreign key
  user_id: number; // INTEGER NOT NULL - required foreign key
  content: string; // TEXT NOT NULL - required
  created_at: WithDefault<Date>; // TIMESTAMP DEFAULT NOW() - has default, optional in INSERT
}

/**
 * Example database schema
 * Define your complete database structure here
 *
 * This demonstrates the complete schema with proper utility types
 * for optimal INSERT operation type safety
 */
export interface ExampleDatabase {
  users: UserTable;
  posts: PostTable;
  comments: CommentTable;
}
