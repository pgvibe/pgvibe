// Query context and result types

import type { ExtractTableAlias } from "./columns.js";

// === UTILITY TYPES ===

/**
 * Ensures proper type distribution for union types
 */
export type NormalizeUnion<T> = [T] extends [unknown] ? T : never;

/**
 * Creates a shallow record with normalized keys
 */
export type NormalizeRecord<K extends keyof any, T> = NormalizeUnion<{
  [P in K]: T;
}>;

// === QUERY CONTEXT TYPES ===

/**
 * Extracts the row type for a given table expression and alias
 */
type ExtractTableRowType<
  DB,
  TE,
  A extends keyof any
> = TE extends `${infer Table} as ${infer Alias}`
  ? Alias extends A
    ? Table extends keyof DB
      ? DB[Table]
      : never
    : never
  : TE extends A
  ? TE extends keyof DB
    ? DB[TE]
    : never
  : never;

/**
 * Represents available tables/aliases in the current query context
 */
export type QueryContext<DB, TE> = NormalizeUnion<{
  [C in keyof DB | ExtractTableAlias<DB, TE>]: C extends ExtractTableAlias<
    DB,
    TE
  >
    ? ExtractTableRowType<DB, TE, C>
    : C extends keyof DB
    ? DB[C]
    : never;
}>;

/**
 * Union of all available table identifiers in the query
 */
export type AvailableTables<DB, TB extends keyof DB, TE> = NormalizeUnion<
  TB | ExtractTableAlias<DB, TE>
>;

// === JOIN TYPES ===

import type { ColumnName, QualifiedColumnName } from "./columns.js";

/**
 * Valid column references for JOIN conditions
 */
export type JoinColumnReference<DB, TB extends keyof DB, TE> = 
  JoinColumn<DB, TB, TE> | JoinQualifiedColumn<DB, TB, TE>;

type JoinColumn<DB, TB extends keyof DB, TE> = ColumnName<
  QueryContext<DB, TE>,
  AvailableTables<DB, TB, TE>
>;

type JoinQualifiedColumn<DB, TB extends keyof DB, TE> = QualifiedColumnName<
  QueryContext<DB, TE>,
  AvailableTables<DB, TB, TE>
>;