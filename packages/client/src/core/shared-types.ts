// Shared types used across ZenQ core modules
// Contains only the essential types that are actively used

/**
 * Raw SQL builder for complex expressions
 */
export interface RawBuilder {
  sql: string;
  parameters: readonly unknown[];
}

/**
 * Table expression types for type-safe table references
 */
export type TableExpression<DB> = keyof DB & string;

/**
 * Extract table alias from table expressions
 */
export type ExtractTableAlias<DB, TE> = TE extends keyof DB ? TE : never;

// Example database types for testing and documentation
// Users should define their own database types in real applications

/**
 * Example User table type
 */
export interface UserTable {
  id: number;
  name: string;
  email: string | null;
  active: boolean;
  created_at: Date;
}

/**
 * Example Post table type
 */
export interface PostTable {
  id: number;
  user_id: number;
  title: string;
  content: string | null;
  published: boolean;
  created_at: Date;
}

/**
 * Example Comment table type
 */
export interface CommentTable {
  id: number;
  post_id: number;
  user_id: number;
  content: string;
  created_at: Date;
}

/**
 * Example database interface
 * Users should define their own database interface in real applications
 */
export interface Database {
  users: UserTable;
  posts: PostTable;
  comments: CommentTable;
}
