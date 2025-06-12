// Main ZenQ query builder class
// Entry point for the fluent API that provides PostgreSQL-native query building

import type {
  TableExpression,
  ExtractTableAlias,
  Database,
  UserTable,
  PostTable,
  CommentTable,
} from "./core/shared-types";
import {
  PostgreSQL,
  type PostgreSQLConfig,
} from "./core/postgres/postgres-dialect";
import {
  createSelectQueryBuilder,
  type CreateSelectQueryBuilder,
} from "./core/builders/select-query-builder";

/**
 * Main ZenQ class for PostgreSQL database queries
 * Provides the starting point for all query building operations
 *
 * @example
 * ```typescript
 * const db = new ZenQ<Database>({
 *   connectionString: 'postgresql://user:password@localhost:5432/mydb'
 * });
 *
 * const users = await db
 *   .selectFrom('users')
 *   .where('active', '=', true)
 *   .execute();
 * ```
 */
export class ZenQ<DB> {
  private readonly postgres: PostgreSQL;

  constructor(config: PostgreSQLConfig) {
    this.postgres = new PostgreSQL(config);
  }

  /**
   * Start building a SELECT query from the specified table with intelligent error messages
   *
   * @param table - The table name to select from
   * @returns A SelectQueryBuilder with superior error messages for invalid columns
   */
  selectFrom<TE extends TableExpression<DB>>(
    table: TE
  ): CreateSelectQueryBuilder<DB, ExtractTableAlias<DB, TE>> {
    // Create the query builder with intelligent error messages
    return createSelectQueryBuilder<DB, ExtractTableAlias<DB, TE>>(
      this.postgres,
      table as ExtractTableAlias<DB, TE> & string
    );
  }

  /**
   * Get the underlying PostgreSQL instance for advanced usage
   */
  getPostgreSQL(): PostgreSQL {
    return this.postgres;
  }

  /**
   * Destroy the ZenQ instance and clean up database connections
   * Call this to allow your script to exit cleanly
   *
   * @example
   * ```typescript
   * const db = new ZenQ<Database>({
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
  TableExpression,
  ExtractTableAlias,
  RawBuilder,
} from "./core/shared-types";

export type {
  SelectQueryBuilder,
  CreateSelectQueryBuilder,
} from "./core/builders/select-query-builder";

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
export { ExpressionNodeFactory } from "./core/ast/expression-nodes";

// Re-export raw SQL template literals
export { sql, raw } from "./raw-sql";
