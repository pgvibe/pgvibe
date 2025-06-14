// INSERT query builder implementation
// Provides fluent API for building type-safe PostgreSQL INSERT queries

import { InsertQueryNode } from "../ast/insert-query-node";
import type { PostgreSQL } from "../postgres/postgres-dialect";
import type { ColumnReference } from "./select-query-builder";
import type { InsertType, ExtractBaseType } from "../types/utility-types";
import type { Prettify } from "../types/select-result";

/**
 * Result type for INSERT operations without RETURNING clause
 */
export interface InsertResult {
  readonly affectedRows: number;
}

/**
 * Prettified result type for INSERT operations
 */
export type PrettifiedInsertResult = Prettify<InsertResult>;

/**
 * Result type for INSERT operations with RETURNING clause
 */
export type InsertReturningResult<
  DB,
  TB extends keyof DB,
  K extends readonly ColumnReference<DB, TB>[]
> = Prettify<
  {
    [P in K[number] as P extends `${infer Table}.${infer Column}`
      ? Column
      : P]: P extends `${infer Table}.${infer Column}`
      ? Table extends TB
        ? Column extends keyof DB[Table]
          ? ExtractBaseType<DB[Table][Column]>
          : never
        : never
      : P extends keyof DB[TB]
      ? ExtractBaseType<DB[TB][P]>
      : never;
  }[]
>;

/**
 * Result type for INSERT operations with RETURNING *
 */
export type InsertReturningAllResult<DB, TB extends keyof DB> = Prettify<
  {
    [K in keyof DB[TB]]: ExtractBaseType<DB[TB][K]>;
  }[]
>;

/**
 * Insert value type for a specific table
 * Uses the new utility type system to provide operation-aware types:
 * - Generated columns (marked with Generated<T>) are optional
 * - Columns with defaults (marked with WithDefault<T>) are optional
 * - Nullable columns (marked with Nullable<T>) are optional
 * - All other columns are required
 */
export type InsertObject<DB, TB extends keyof DB> = InsertType<DB[TB]>;

/**
 * OnConflict builder interface for building conflict resolution clauses
 */
export interface OnConflictBuilder<DB, TB extends keyof DB> {
  column(column: keyof DB[TB] & string): OnConflictColumnBuilder<DB, TB>;
  columns(columns: (keyof DB[TB] & string)[]): OnConflictColumnBuilder<DB, TB>;
  constraint(constraint: string): OnConflictConstraintBuilder<DB, TB>;
}

/**
 * OnConflict column builder for specific conflict actions
 */
export interface OnConflictColumnBuilder<DB, TB extends keyof DB> {
  doNothing(): InsertQueryBuilder<DB, TB, PrettifiedInsertResult>;
  doUpdate(
    updates: Partial<InsertObject<DB, TB>>
  ): InsertQueryBuilder<DB, TB, PrettifiedInsertResult>;
}

/**
 * OnConflict constraint builder for constraint-based conflicts
 */
export interface OnConflictConstraintBuilder<DB, TB extends keyof DB> {
  doNothing(): InsertQueryBuilder<DB, TB, PrettifiedInsertResult>;
  doUpdate(
    updates: Partial<InsertObject<DB, TB>>
  ): InsertQueryBuilder<DB, TB, PrettifiedInsertResult>;
}

/**
 * INSERT query builder interface
 */
export interface InsertQueryBuilder<DB, TB extends keyof DB, O> {
  /**
   * Add values to insert (single object or array for bulk insert)
   */
  values(
    values: InsertObject<DB, TB> | readonly InsertObject<DB, TB>[]
  ): InsertQueryBuilder<DB, TB, PrettifiedInsertResult>;

  /**
   * Add RETURNING clause for specific columns
   */
  returning<K extends readonly ColumnReference<DB, TB>[]>(
    columns: K
  ): InsertQueryBuilder<DB, TB, InsertReturningResult<DB, TB, K>>;

  /**
   * Add RETURNING * clause
   */
  returningAll(): InsertQueryBuilder<DB, TB, InsertReturningAllResult<DB, TB>>;

  /**
   * Add ON CONFLICT clause for conflict resolution
   */
  onConflict(
    builder: (oc: OnConflictBuilder<DB, TB>) => OnConflictColumnBuilder<DB, TB>
  ): InsertQueryBuilder<DB, TB, O>;

  /**
   * Convert to AST node for compilation
   */
  toOperationNode(): InsertQueryNode;

  /**
   * Compile to SQL with parameters
   */
  compile(): { sql: string; parameters: any[] };

  /**
   * Get compiled SQL for inspection (alias for compile)
   */
  toSQL(): { sql: string; parameters: any[] };

  /**
   * Execute the query
   */
  execute(): Promise<O>;
}

/**
 * Implementation of OnConflictBuilder
 */
class OnConflictBuilderImpl<DB, TB extends keyof DB>
  implements OnConflictBuilder<DB, TB>
{
  constructor(private insertBuilder: InsertQueryBuilderImpl<DB, TB, any>) {}

  column(column: keyof DB[TB] & string): OnConflictColumnBuilder<DB, TB> {
    return new OnConflictColumnBuilderImpl([column], this.insertBuilder);
  }

  columns(columns: (keyof DB[TB] & string)[]): OnConflictColumnBuilder<DB, TB> {
    return new OnConflictColumnBuilderImpl(columns, this.insertBuilder);
  }

  constraint(constraint: string): OnConflictConstraintBuilder<DB, TB> {
    return new OnConflictConstraintBuilderImpl(constraint, this.insertBuilder);
  }
}

/**
 * Implementation of OnConflictColumnBuilder
 */
class OnConflictColumnBuilderImpl<DB, TB extends keyof DB>
  implements OnConflictColumnBuilder<DB, TB>
{
  constructor(
    private columns: string[],
    private builder: InsertQueryBuilderImpl<DB, TB, any>
  ) {}

  doNothing(): InsertQueryBuilder<DB, TB, PrettifiedInsertResult> {
    const onConflictNode = InsertQueryNode.createOnConflictDoNothingNode(
      this.columns
    );
    const newNode = InsertQueryNode.cloneWithOnConflict(
      this.builder.node,
      onConflictNode
    );
    return new InsertQueryBuilderImpl<DB, TB, PrettifiedInsertResult>(
      this.builder.tableName,
      this.builder.postgres,
      newNode
    );
  }

  doUpdate(
    updates: Partial<InsertObject<DB, TB>>
  ): InsertQueryBuilder<DB, TB, PrettifiedInsertResult> {
    const onConflictNode = InsertQueryNode.createOnConflictDoUpdateNode(
      this.columns,
      updates as Record<string, unknown>
    );
    const newNode = InsertQueryNode.cloneWithOnConflict(
      this.builder.node,
      onConflictNode
    );
    return new InsertQueryBuilderImpl<DB, TB, PrettifiedInsertResult>(
      this.builder.tableName,
      this.builder.postgres,
      newNode
    );
  }
}

/**
 * Implementation of OnConflictConstraintBuilder
 */
class OnConflictConstraintBuilderImpl<DB, TB extends keyof DB>
  implements OnConflictConstraintBuilder<DB, TB>
{
  constructor(
    private constraint: string,
    private builder: InsertQueryBuilderImpl<DB, TB, any>
  ) {}

  doNothing(): InsertQueryBuilder<DB, TB, PrettifiedInsertResult> {
    // Create constraint-based conflict node
    const onConflictNode = {
      kind: "OnConflictNode" as const,
      constraint: this.constraint,
      doNothing: true,
    };
    const newNode = InsertQueryNode.cloneWithOnConflict(
      this.builder.node,
      onConflictNode
    );
    return new InsertQueryBuilderImpl<DB, TB, PrettifiedInsertResult>(
      this.builder.tableName,
      this.builder.postgres,
      newNode
    );
  }

  doUpdate(
    updates: Partial<InsertObject<DB, TB>>
  ): InsertQueryBuilder<DB, TB, PrettifiedInsertResult> {
    // Create constraint-based conflict with updates
    const updateNodes = Object.entries(updates).map(([column, value]) => ({
      kind: "ColumnUpdateNode" as const,
      column,
      value: {
        kind: "ValueNode" as const,
        value,
        isParameter: true,
      },
    }));

    const onConflictNode = {
      kind: "OnConflictNode" as const,
      constraint: this.constraint,
      updates: updateNodes,
    };
    const newNode = InsertQueryNode.cloneWithOnConflict(
      this.builder.node,
      onConflictNode
    );
    return new InsertQueryBuilderImpl<DB, TB, PrettifiedInsertResult>(
      this.builder.tableName,
      this.builder.postgres,
      newNode
    );
  }
}

/**
 * INSERT query builder implementation
 */
export class InsertQueryBuilderImpl<DB, TB extends keyof DB, O>
  implements InsertQueryBuilder<DB, TB, O>
{
  public node: InsertQueryNode;
  public tableName: TB;
  public postgres: PostgreSQL;

  constructor(
    tableName: TB,
    postgres: PostgreSQL,
    node: InsertQueryNode = InsertQueryNode.createWithInto(tableName as string)
  ) {
    this.tableName = tableName;
    this.postgres = postgres;
    this.node = node;
  }

  values(
    values: InsertObject<DB, TB> | readonly InsertObject<DB, TB>[]
  ): InsertQueryBuilder<DB, TB, PrettifiedInsertResult> {
    // Normalize to array for consistent handling
    const valuesArray = Array.isArray(values) ? values : [values];

    // Create VALUES node from the data
    const valuesNode = InsertQueryNode.createValuesNode(
      valuesArray as Record<string, unknown>[]
    );

    // Clone the current node with the new VALUES clause
    const newNode = InsertQueryNode.cloneWithValues(this.node, valuesNode);

    return new InsertQueryBuilderImpl<DB, TB, PrettifiedInsertResult>(
      this.tableName,
      this.postgres,
      newNode
    );
  }

  returning<K extends readonly ColumnReference<DB, TB>[]>(
    columns: K
  ): InsertQueryBuilder<DB, TB, InsertReturningResult<DB, TB, K>> {
    const returningNode = InsertQueryNode.createReturningNode([
      ...columns,
    ] as string[]);
    const newNode = InsertQueryNode.cloneWithReturning(
      this.node,
      returningNode
    );

    return new InsertQueryBuilderImpl<DB, TB, InsertReturningResult<DB, TB, K>>(
      this.tableName,
      this.postgres,
      newNode
    );
  }

  returningAll(): InsertQueryBuilder<DB, TB, InsertReturningAllResult<DB, TB>> {
    const returningNode = InsertQueryNode.createReturningAllNode();
    const newNode = InsertQueryNode.cloneWithReturning(
      this.node,
      returningNode
    );

    return new InsertQueryBuilderImpl<DB, TB, InsertReturningAllResult<DB, TB>>(
      this.tableName,
      this.postgres,
      newNode
    );
  }

  onConflict(
    builder: (oc: OnConflictBuilder<DB, TB>) => OnConflictColumnBuilder<DB, TB>
  ): InsertQueryBuilder<DB, TB, O> {
    const onConflictBuilder = new OnConflictBuilderImpl<DB, TB>(this);
    const result = builder(onConflictBuilder);
    return result as any; // The result is already the proper builder instance
  }

  toOperationNode(): InsertQueryNode {
    return this.node;
  }

  compile(): { sql: string; parameters: any[] } {
    const compiler = this.postgres.getQueryCompiler();
    const compiledQuery = compiler.compileQuery(this.node);
    return {
      sql: compiledQuery.sql,
      parameters: compiledQuery.parameters as any[],
    };
  }

  toSQL(): { sql: string; parameters: any[] } {
    return this.compile();
  }

  async execute(): Promise<O> {
    const compiledQuery = this.compile();
    console.log(
      `Executing: ${compiledQuery.sql} with parameters:`,
      compiledQuery.parameters
    );

    const driver = this.postgres.getDriver();
    const connection = await driver.acquireConnection();

    try {
      const result = await connection.executeQuery({
        sql: compiledQuery.sql,
        parameters: compiledQuery.parameters,
        query: this.node,
      });

      // Handle return type based on whether RETURNING clause is present
      if (this.node.returning) {
        return result.rows as O;
      } else {
        return { affectedRows: result.rowCount } as O;
      }
    } finally {
      connection.release();
    }
  }
}

/**
 * Type helper for creating INSERT query builders
 */
export type CreateInsertQueryBuilder<
  DB,
  TB extends keyof DB
> = InsertQueryBuilder<DB, TB, never>; // Never until values() is called

/**
 * Factory function for creating INSERT query builders
 */
export function createInsertQueryBuilder<DB, TB extends keyof DB>(
  postgres: PostgreSQL,
  table: TB & string
): CreateInsertQueryBuilder<DB, TB> {
  return new InsertQueryBuilderImpl<DB, TB, never>(table as TB, postgres);
}
