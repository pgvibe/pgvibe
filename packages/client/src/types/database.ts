// Database schema types for pgvibe query builder

/**
 * Represents a database schema as a TypeScript interface.
 * Each key is a table name, each value is the row type for that table.
 * 
 * @example
 * interface MyDB {
 *   users: { id: number; name: string; email: string };
 *   posts: { id: number; user_id: number; title: string };
 * }
 */
export interface DatabaseSchema {
  [tableName: string]: Record<string, any>;
}

/**
 * All available table names in a database schema
 */
export type TableName<DB> = keyof DB & string;

/**
 * Table with alias syntax: "table as alias"
 */
export type AliasedTable<DB> = `${TableName<DB>} as ${string}`;

/**
 * Any valid table expression (with or without alias)
 */
export type TableExpression<DB> = TableName<DB> | AliasedTable<DB>;