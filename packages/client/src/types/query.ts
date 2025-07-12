// Query context and result types

import type { ExtractTableAlias } from "./columns";

// === UTILITY TYPES ===

/**
 * Optimized: Direct identity type - TypeScript 5.x handles union distribution well
 */
export type NormalizeUnion<T> = T;

/**
 * Optimized: Direct mapped type without normalization overhead
 */
export type NormalizeRecord<K extends keyof any, T> = {
  [P in K]: T;
};

// === QUERY CONTEXT TYPES ===

/**
 * Optimized: Flattened conditional logic for better performance
 */
type ExtractTableRowType<DB, TE, A extends keyof any> = 
  TE extends `${infer Table} as ${infer Alias}`
    ? Alias extends A
      ? Table extends keyof DB ? DB[Table] : never
      : never
    : TE extends A
      ? TE extends keyof DB ? DB[TE] : never  
      : never;

/**
 * Extracts the original table name from a table expression (for exclusion)
 */
type ExtractOriginalTableName<DB, TE> = TE extends `${infer Table} as ${string}`
  ? Table extends keyof DB
    ? Table
    : never
  : never;

/**
 * Represents available tables/aliases in the current query context
 * When a table is aliased, the original table name is excluded (alias exclusivity)
 */
export type QueryContext<DB, TE> = NormalizeUnion<{
  [C in Exclude<keyof DB, ExtractOriginalTableName<DB, TE>> | ExtractTableAlias<DB, TE>]: 
    C extends ExtractTableAlias<DB, TE>
      ? ExtractTableRowType<DB, TE, C>
      : C extends keyof DB
      ? DB[C]
      : never;
}>;

/**
 * Optimized: Direct union without normalization overhead
 * Excludes original table name when aliased (alias exclusivity)
 */
export type AvailableTables<DB, TB extends keyof DB, TE> = 
  Exclude<TB, ExtractOriginalTableName<DB, TE>> | ExtractTableAlias<DB, TE>;

// === JOIN TYPES ===

import type { ColumnName, QualifiedColumnName } from "./columns";

/**
 * Optimized: Direct union for JOIN table references
 * - Already selected tables (TB)
 * - The table being joined (ExtractTableAlias<DB, TE>)
 */
type JoinAvailableTables<DB, TB extends keyof DB, TE> = 
  TB | ExtractTableAlias<DB, TE>;

/**
 * Optimized: Direct mapped type for JOIN context
 */
type JoinQueryContext<DB, TB extends keyof DB, TE> = {
  [C in TB | ExtractTableAlias<DB, TE>]: 
    C extends ExtractTableAlias<DB, TE>
      ? ExtractTableRowType<DB, TE, C>
      : C extends keyof DB ? DB[C] : never;
};

/**
 * Valid column references for JOIN conditions
 */
export type JoinColumnReference<DB, TB extends keyof DB, TE> = 
  JoinColumn<DB, TB, TE> | JoinQualifiedColumn<DB, TB, TE>;

type JoinColumn<DB, TB extends keyof DB, TE> = ColumnName<
  JoinQueryContext<DB, TB, TE>,
  JoinAvailableTables<DB, TB, TE>
>;

type JoinQualifiedColumn<DB, TB extends keyof DB, TE> = QualifiedColumnName<
  JoinQueryContext<DB, TB, TE>,
  JoinAvailableTables<DB, TB, TE>
>;