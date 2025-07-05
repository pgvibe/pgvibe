// Example database types for pgvibe playground
// These types demonstrate how to define your database schema for pgvibe

/**
 * Example User table
 * Represents users in your application
 */
export interface UserTable {
  id: number;
  name: string;
  email: string | null;
  active: boolean;
  created_at: Date;
  updated_at: Date;
}

/**
 * Example Post table
 * Represents blog posts or articles
 */
export interface PostTable {
  id: number;
  user_id: number;
  title: string;
  content: string | null;
  published: boolean;
  created_at: Date;
  updated_at: Date;
}

/**
 * Example Comment table
 * Represents comments on posts
 */
export interface CommentTable {
  id: number;
  post_id: number;
  user_id: number;
  content: string;
  created_at: Date;
}

/**
 * Example database schema
 * Define your complete database structure here
 */
export interface ExampleDatabase {
  users: UserTable;
  posts: PostTable;
  comments: CommentTable;
}

// You can extend this with more tables as needed:
// export interface ProductTable { ... }
// export interface OrderTable { ... }
// etc.
