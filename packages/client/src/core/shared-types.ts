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
 * Parse a table expression to extract table name and alias
 * Supports formats like "table as alias" and "table"
 */
export type ParseTableExpression<T extends string> =
  T extends `${infer Table} as ${infer Alias}`
    ? { table: Table; alias: Alias }
    : { table: T; alias: never };

/**
 * Parse a column expression to extract column name and alias
 * Supports formats like "column as alias" and "column"
 */
export type ParseColumnExpression<T extends string> =
  T extends `${infer Column} as ${infer Alias}`
    ? { column: Column; alias: Alias }
    : { column: T; alias: never };

/**
 * Table expression types for type-safe table references
 * Now supports both regular table names and aliased expressions
 */
export type TableExpression<DB> =
  | (keyof DB & string)
  | `${keyof DB & string} as ${string}`;

/**
 * Extract the actual table name from a table expression (for schema validation)
 * This always returns a keyof DB to maintain compatibility with existing query builders
 */
export type ExtractTableAlias<DB, TE> = ParseTableExpression<
  TE & string
> extends {
  table: infer T;
}
  ? T extends keyof DB
    ? T
    : never
  : never;

/**
 * Extract the alias name from a table expression (for column references)
 * Returns the alias if present, otherwise returns the table name
 */
export type ExtractAliasName<DB, TE> = ParseTableExpression<
  TE & string
> extends {
  alias: infer A;
}
  ? A extends never
    ? ParseTableExpression<TE & string> extends { table: infer T }
      ? T extends keyof DB
        ? T
        : never
      : never
    : A
  : never;

/**
 * Extract the actual table name from a table expression (ignoring alias)
 * This is used internally for type checking against the database schema
 */
export type ExtractTableName<DB, TE> = ParseTableExpression<
  TE & string
> extends {
  table: infer T;
}
  ? T extends keyof DB
    ? T
    : never
  : never;

/**
 * Runtime utility to parse table expressions
 * Extracts table name and alias from expressions like "table as alias"
 */
export function parseTableExpression(expression: string): {
  table: string;
  alias?: string;
} {
  const trimmed = expression.trim();
  const asIndex = trimmed.toLowerCase().indexOf(" as ");

  if (asIndex === -1) {
    return { table: trimmed };
  }

  const table = trimmed.substring(0, asIndex).trim();
  const alias = trimmed.substring(asIndex + 4).trim();

  return { table, alias };
}

/**
 * Runtime utility to parse column expressions
 * Extracts column name and alias from expressions like "column as alias"
 * Handles quoted aliases like "column as \"My Alias\""
 */
export function parseColumnExpression(expression: string): {
  column: string;
  alias?: string;
} {
  const trimmed = expression.trim();
  const asIndex = trimmed.toLowerCase().indexOf(" as ");

  if (asIndex === -1) {
    return { column: trimmed };
  }

  const column = trimmed.substring(0, asIndex).trim();
  let alias = trimmed.substring(asIndex + 4).trim();

  // Remove surrounding quotes if present
  if (alias.startsWith('"') && alias.endsWith('"')) {
    alias = alias.slice(1, -1);
  } else if (alias.startsWith("'") && alias.endsWith("'")) {
    alias = alias.slice(1, -1);
  }

  return { column, alias };
}

/**
 * Alias-aware qualified column reference type
 * Generates column references using alias names instead of table names
 */
export type AliasedQualifiedColumnReference<
  DB,
  TE extends string,
  AliasName extends string
> = ExtractTableName<DB, TE> extends infer TableName
  ? TableName extends keyof DB
    ? `${AliasName}.${Extract<keyof DB[TableName], string>}`
    : never
  : never;

/**
 * Alias-aware column reference type that supports both simple and qualified names
 * Uses alias names for qualified references
 */
export type AliasedColumnReference<
  DB,
  TE extends string,
  AliasName extends string
> = ExtractTableName<DB, TE> extends infer TableName
  ? TableName extends keyof DB
    ? // Simple column names from the table
      | Extract<keyof DB[TableName], string>
        // Qualified column names using alias
        | AliasedQualifiedColumnReference<DB, TE, AliasName>
    : never
  : never;

/**
 * Multi-table expression type for tracking multiple aliased tables
 * This allows us to handle joins properly where we have multiple table expressions
 */
export type MultiTableExpression<DB> = readonly string[];

/**
 * Helper type to get column references from multiple table expressions
 * This combines columns from all tables in the multi-table expression
 * Also supports column aliases with "as" keyword
 */
export type GetMultiTableColumnReferences<
  DB,
  TEs extends readonly string[]
> = TEs extends readonly [infer First, ...infer Rest]
  ? First extends string
    ? Rest extends readonly string[]
      ? // Combine columns from first table with columns from rest
        GetColumnReferences<DB, First> | GetMultiTableColumnReferences<DB, Rest>
      : GetColumnReferences<DB, First>
    : never
  : never;

/**
 * Enhanced GetColumnReferences that works with both single and multi-table expressions
 * For single table: returns both qualified and unqualified columns
 * For multi-table: returns columns from all tables
 * CRITICAL: When using aliases, original table names are NOT allowed
 * Also supports column aliases with "as" keyword
 */
export type GetColumnReferences<
  DB,
  TE extends string | readonly string[]
> = TE extends readonly string[]
  ? GetMultiTableColumnReferences<DB, TE>
  : TE extends string
  ? ParseTableExpression<TE> extends {
      table: infer TableName;
      alias: infer AliasName;
    }
    ? TableName extends keyof DB
      ? AliasName extends never
        ? // NO ALIAS: Allow both table.column and column, plus column aliases
          | Extract<keyof DB[TableName], string> // Unqualified: id, name, email
            | `${TableName & string}.${Extract<keyof DB[TableName], string>}` // Qualified: users.id, users.name
            | `${Extract<keyof DB[TableName], string>} as ${string}` // Column aliases: name as user_name
            | `${TableName & string}.${Extract<
                keyof DB[TableName],
                string
              >} as ${string}` // Qualified column aliases: users.name as user_name
        : AliasName extends string
        ? // HAS ALIAS: Only allow alias.column and column (NOT table.column), plus column aliases
          | Extract<keyof DB[TableName], string> // Unqualified: id, name, email
            | `${AliasName}.${Extract<keyof DB[TableName], string>}` // Qualified: u.id, u.name (NOT users.id)
            | `${Extract<keyof DB[TableName], string>} as ${string}` // Column aliases: name as user_name
            | `${AliasName}.${Extract<
                keyof DB[TableName],
                string
              >} as ${string}` // Qualified column aliases: u.name as user_name
        : never
      : never
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
