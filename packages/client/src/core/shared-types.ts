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
 * Supports both simple table names and alias syntax
 */
export type TableExpression<DB> =
  | (keyof DB & string) // Simple table name: "users"
  | TableWithAlias<DB>; // Alias syntax: "users as u"

/**
 * Table with alias syntax type - accepts any string (runtime parsing handles validation)
 */
export type TableWithAlias<DB> = string;

/**
 * Extract table alias from table expressions
 * For aliased tables, returns the table name, not the alias
 * Supports case-insensitive AS keyword
 */
export type ExtractTableAlias<DB, TE> = TE extends keyof DB
  ? TE // Simple table name
  : TE extends `${infer T} as ${string}`
  ? T extends keyof DB
    ? T // Extract table name from alias
    : never
  : TE extends `${infer T} AS ${string}`
  ? T extends keyof DB
    ? T // Extract table name from alias (uppercase AS)
    : never
  : TE extends `${infer T} As ${string}`
  ? T extends keyof DB
    ? T // Extract table name from alias (mixed case As)
    : never
  : never;

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
