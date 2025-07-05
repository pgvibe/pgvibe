// Main pgvibe query builder class
// Entry point for the fluent API that provides PostgreSQL-native query building

import type {
  TableExpression,
  ExtractTableAlias,
  Database,
  UserTable,
  PostTable,
  CommentTable,
  RawBuilder,
  ExtractAliasName,
} from "./core/shared-types";
import {
  PostgreSQL,
  type PostgreSQLConfig,
} from "./core/postgres/postgres-dialect";
import {
  createSelectQueryBuilder,
  type CreateSelectQueryBuilder,
  createAliasedSelectQueryBuilder,
  type CreateAliasedSelectQueryBuilder,
  type SelectQueryBuilder,
  type AliasedSelectQueryBuilder,
  type MultiTableAliasedSelectQueryBuilder,
  MultiTableAliasedSelectQueryBuilderImpl,
} from "./core/builders/select-query-builder";
import {
  createInsertQueryBuilder,
  type CreateInsertQueryBuilder,
  type InsertQueryBuilder,
  createAliasedInsertQueryBuilder,
  type CreateAliasedInsertQueryBuilder,
  type AliasedInsertQueryBuilder,
} from "./core/builders/insert-query-builder";
import { parseTableExpression } from "./core/shared-types";

// Export utility types for operation-aware type system
export type {
  Generated,
  InsertType,
  UpdateType,
  SelectType,
  ExtractGenerated,
  IsGenerated,
  // Legacy exports for backward compatibility
  WithDefault,
  Nullable,
} from "./core/types/utility-types";

/**
 * Raw SQL query result interface
 */
export interface RawQueryResult<T = any> {
  rows: T[];
  rowCount: number;
  command: string;
}

/**
 * Main pgvibe class for PostgreSQL database queries
 * Provides the starting point for all query building operations
 *
 * @example
 * ```typescript
 * const db = new pgvibe<Database>({
 *   connectionString: 'postgresql://user:password@localhost:5432/mydb'
 * });
 *
 * const users = await db
 *   .selectFrom('users')
 *   .where('active', '=', true)
 *   .execute();
 * ```
 */
export class pgvibe<DB> {
  private readonly postgres: PostgreSQL;

  constructor(config: PostgreSQLConfig) {
    this.postgres = new PostgreSQL(config);
  }

  /**
   * Start building a SELECT query from the specified table with intelligent error messages
   * Now supports table aliases with full type safety and proper join support
   *
   * @param table - The table name to select from, optionally with alias (e.g., "users as u")
   * @returns A SelectQueryBuilder with superior error messages for invalid columns
   */
  selectFrom<TE extends TableExpression<DB>>(
    table: TE
  ): ExtractAliasName<DB, TE> extends ExtractTableAlias<DB, TE>
    ? CreateSelectQueryBuilder<DB, ExtractTableAlias<DB, TE>>
    : MultiTableAliasedSelectQueryBuilder<
        DB,
        readonly [TE],
        ExtractTableAlias<DB, TE>,
        any
      > {
    // Parse the table expression to get the actual table name and alias
    const { table: tableName, alias } = parseTableExpression(table);

    // If no alias is present, use the traditional query builder
    if (!alias) {
      return createSelectQueryBuilder<DB, ExtractTableAlias<DB, TE>>(
        this.postgres,
        tableName as ExtractTableAlias<DB, TE> & string
      ) as any;
    }

    // If alias is present, use the multi-table alias-aware query builder
    return new MultiTableAliasedSelectQueryBuilderImpl<
      DB,
      readonly [TE],
      ExtractTableAlias<DB, TE>,
      any
    >(
      tableName as ExtractTableAlias<DB, TE>,
      [table] as readonly [TE],
      this.postgres
    ) as any;
  }

  /**
   * Start building an INSERT query for the specified table with type-safe column validation
   * Now supports table aliases with full type safety and alias-qualified column references
   *
   * @param table - The table name to insert into, optionally with alias (e.g., "users as u")
   * @returns An InsertQueryBuilder with type-safe value validation and alias support
   */
  insertInto<TE extends TableExpression<DB>>(
    table: TE
  ): ExtractAliasName<DB, TE> extends ExtractTableAlias<DB, TE>
    ? CreateInsertQueryBuilder<DB, ExtractTableAlias<DB, TE>>
    : CreateAliasedInsertQueryBuilder<DB, TE, ExtractTableAlias<DB, TE>> {
    // Parse the table expression to get the actual table name and alias
    const { table: tableName, alias } = parseTableExpression(table);

    // If no alias is present, use the traditional INSERT query builder
    if (!alias) {
      return createInsertQueryBuilder<DB, ExtractTableAlias<DB, TE>>(
        this.postgres,
        tableName as ExtractTableAlias<DB, TE> & string
      ) as any;
    }

    // If alias is present, use the alias-aware INSERT query builder
    return createAliasedInsertQueryBuilder<DB, TE, ExtractTableAlias<DB, TE>>(
      this.postgres,
      tableName as ExtractTableAlias<DB, TE> & string,
      table
    ) as any;
  }

  /**
   * Execute raw SQL with parameters (similar to node-postgres)
   *
   * @param sql - Raw SQL string with parameter placeholders ($1, $2, etc.)
   * @param parameters - Array of parameter values
   * @returns Promise with query results
   *
   * @example
   * ```typescript
   * // Execute raw SQL with parameters
   * await db.query('INSERT INTO users (name, email) VALUES ($1, $2)', ['John', 'john@example.com']);
   *
   * // Execute DDL statements
   * await db.query('CREATE TABLE test_table (id SERIAL PRIMARY KEY, name VARCHAR(255))');
   *
   * // Execute complex queries
   * const result = await db.query('SELECT * FROM users WHERE created_at > $1', [new Date('2024-01-01')]);
   * ```
   */
  async query<T = any>(
    sql: string,
    parameters: unknown[] = []
  ): Promise<RawQueryResult<T>> {
    console.log(
      `Executing raw SQL: ${sql}`,
      parameters.length > 0 ? `with parameters:` : "",
      parameters
    );

    const driver = this.postgres.getDriver();

    // Ensure driver is initialized before acquiring connection
    await driver.init();

    const connection = await driver.acquireConnection();

    try {
      const result = await connection.executeQuery({
        sql,
        parameters,
        query: null, // Raw queries don't have AST nodes
      });

      return {
        rows: result.rows as T[],
        rowCount: result.rowCount,
        command: sql.trim().split(/\s+/)[0]?.toUpperCase() || "UNKNOWN",
      };
    } finally {
      connection.release();
    }
  }

  /**
   * Execute raw SQL from a template literal with automatic parameterization
   *
   * @param strings - Template literal strings
   * @param values - Template literal values (automatically parameterized)
   * @returns Promise with query results
   *
   * @example
   * ```typescript
   * const userId = 123;
   * const status = 'active';
   *
   * // This gets converted to: SELECT * FROM users WHERE id = $1 AND status = $2
   * const users = await db.sql`SELECT * FROM users WHERE id = ${userId} AND status = ${status}`;
   * ```
   */
  async sql<T = any>(
    strings: TemplateStringsArray,
    ...values: unknown[]
  ): Promise<RawQueryResult<T>> {
    // Convert template literal to parameterized SQL
    let sql = "";
    const parameters: unknown[] = [];

    for (let i = 0; i < strings.length; i++) {
      sql += strings[i];
      if (i < values.length) {
        parameters.push(values[i]);
        sql += `$${parameters.length}`;
      }
    }

    return this.query<T>(sql, parameters);
  }

  /**
   * Get the underlying PostgreSQL instance for advanced usage
   */
  getPostgreSQL(): PostgreSQL {
    return this.postgres;
  }

  /**
   * Destroy the pgvibe instance and clean up database connections
   * Call this to allow your script to exit cleanly
   *
   * @example
   * ```typescript
   * const db = new pgvibe<Database>({
   *   connectionString: 'postgresql://user:password@localhost:5432/mydb'
   * });
   *
   * // ... run queries ...
   *
   * await db.destroy(); // Clean shutdown
   * ```
   */
  async destroy(): Promise<void> {
    // Get the driver instance and destroy it
    const driver = this.postgres.getDriver();
    await driver.destroy();
  }
}

// Re-export types for convenience
export type {
  Database,
  UserTable,
  PostTable,
  CommentTable,
  RawBuilder,
} from "./core/shared-types";

export type {
  SelectQueryBuilder,
  CreateSelectQueryBuilder,
  AliasedSelectQueryBuilder,
} from "./core/builders/select-query-builder";

export type {
  InsertQueryBuilder,
  CreateInsertQueryBuilder,
  AliasedInsertQueryBuilder,
  CreateAliasedInsertQueryBuilder,
  InsertResult,
  PrettifiedInsertResult,
  InsertReturningResult,
  InsertReturningAllResult,
  InsertObject,
} from "./core/builders/insert-query-builder";

export type { PostgreSQLConfig } from "./core/postgres/postgres-dialect";

export type {
  PostgreSQLCompiledQuery,
  PostgreSQLQueryResult,
  PostgreSQLConnection,
} from "./core/postgres/postgres-driver";

export type {
  PostgreSQLFieldInfo,
  PostgreSQLDatabaseError,
  PostgreSQLTypeMappings,
} from "./core/postgres/postgres-adapter";

// Re-export PostgreSQL implementation
export { PostgreSQL } from "./core/postgres/postgres-dialect";

// Re-export for advanced usage
export { SelectQueryNode } from "./core/ast/select-query-node";
export { InsertQueryNode } from "./core/ast/insert-query-node";
export { ExpressionNodeFactory } from "./core/ast/expression-nodes";

// Re-export raw SQL template literals
export { sql, raw } from "./raw-sql";
