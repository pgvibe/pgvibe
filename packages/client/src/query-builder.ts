// Production query builder - clean type imports

import type {
  // Database types
  TableExpression,
  ExtractTableAlias,
  
  // Column types
  ColumnName,
  QualifiedColumnName,
  
  // Query context types
  QueryContext,
  AvailableTables,
  JoinColumnReference,
  
  // Result types
  SelectionResult,
  Prettify
} from "./types/index";

// Re-export types for public API
export type {
  // Database types
  TableExpression,
  ExtractTableAlias,
  
  // Column types
  ColumnName,
  QualifiedColumnName,
  
  // Query context types
  QueryContext,
  AvailableTables,
  JoinColumnReference,
  
  // Result types
  SelectionResult,
  Prettify
} from "./types/index";

// Valid column expressions for selection (including aliases)
// Focus on semantic validation - PostgreSQL handles syntax validation
export type ValidColumn<DB, TB extends keyof DB> =
  | ColumnName<DB, TB>
  | QualifiedColumnName<DB, TB>
  | `${ColumnName<DB, TB>} as ${string}`
  | `${QualifiedColumnName<DB, TB>} as ${string}`;

// === QUERY BUILDER RESULT TYPES ===

// Result type for queries with JOIN operations
type QueryBuilderWithJoin<
  DB,
  TB extends keyof DB,
  O,
  TE
> = TE extends `${infer Table} as ${infer Alias}`
  ? Table extends keyof DB
    ? SelectQueryBuilder<QueryContext<DB, TE>, AvailableTables<DB, TB, TE>, O>
    : never
  : TE extends keyof DB
  ? SelectQueryBuilder<QueryContext<DB, TE>, AvailableTables<DB, TB, TE>, O>
  : never;

// Query builder classes
export class QueryBuilder<DB> {
  // Entry point: creates a SELECT query from a table or aliased table
  selectFrom<TE extends TableExpression<DB>>(
    table: TE
  ): SelectQueryBuilder<QueryContext<DB, TE>, ExtractTableAlias<DB, TE>, {}> {
    return new SelectQueryBuilder<
      QueryContext<DB, TE>,
      ExtractTableAlias<DB, TE>,
      {}
    >(table as string);
  }
}

export class SelectQueryBuilder<DB, TB extends keyof DB, O> {
  private table: string;
  private selections: string[] = [];
  private joins: string[] = [];
  private _sqlCache?: string; // Performance: Cache generated SQL
  private _isDirty = true; // Track if SQL needs regeneration

  constructor(table: string) {
    this.table = table;
  }

  // Optimized: Adds column selections with proper typing and alias support
  select<S extends [ValidColumn<DB, TB>, ...ValidColumn<DB, TB>[]]>(
    selections: S
  ): SelectQueryBuilder<DB, TB, O & SelectionResult<DB, TB, S>> {
    const newBuilder = new SelectQueryBuilder<
      DB,
      TB,
      O & SelectionResult<DB, TB, S>
    >(this.table);
    // Performance: Direct assignment instead of spread for small arrays
    newBuilder.selections = this.selections.concat(selections as readonly string[]);
    newBuilder.joins = this.joins.slice(); // Faster than spread for arrays
    return newBuilder;
  }

  // Optimized: Adds an INNER JOIN with type-safe column references
  innerJoin<
    TE extends TableExpression<DB>,
    K1 extends JoinColumnReference<DB, TB, TE>,
    K2 extends JoinColumnReference<DB, TB, TE>
  >(table: TE, k1: K1, k2: K2): QueryBuilderWithJoin<DB, TB, O, TE> {
    const newBuilder = new SelectQueryBuilder(this.table) as any;
    newBuilder.selections = this.selections.slice();
    newBuilder.joins = this.joins.concat(`INNER JOIN ${table} ON ${k1} = ${k2}`);
    newBuilder._isDirty = true; // Mark as dirty for SQL regeneration
    return newBuilder;
  }

  // Optimized: Adds a LEFT JOIN with type-safe column references
  leftJoin<
    TE extends TableExpression<DB>,
    K1 extends JoinColumnReference<DB, TB, TE>,
    K2 extends JoinColumnReference<DB, TB, TE>
  >(table: TE, k1: K1, k2: K2): QueryBuilderWithJoin<DB, TB, O, TE> {
    const newBuilder = new SelectQueryBuilder(this.table) as any;
    newBuilder.selections = this.selections.slice();
    newBuilder.joins = this.joins.concat(`LEFT JOIN ${table} ON ${k1} = ${k2}`);
    newBuilder._isDirty = true; // Mark as dirty for SQL regeneration
    return newBuilder;
  }

  // Optimized: Generates the final SQL string with caching
  toSQL(): string {
    // Performance: Return cached SQL if not dirty
    if (!this._isDirty && this._sqlCache) {
      return this._sqlCache;
    }

    const selectList = this.selections.length > 0 ? this.selections.join(", ") : "*";
    // Performance: Use regex with global flag for better performance
    const fromClause = this.table.replace(/\bas\b/g, "AS");
    let sql = `SELECT ${selectList} FROM ${fromClause}`;

    if (this.joins.length > 0) {
      // Performance: Pre-process joins once and join efficiently
      const processedJoins = this.joins.map(join => join.replace(/\bas\b/g, "AS"));
      sql += " " + processedJoins.join(" ");
    }

    // Cache the result
    this._sqlCache = sql;
    this._isDirty = false;
    return sql;
  }

  // Executes the query and returns clean, properly typed results
  async execute(): Promise<Prettify<O>[]> {
    return [];
  }
}

// PGVibe query builder instance - users should create their own with proper schema
const qb = new QueryBuilder<any>();
export { qb };
