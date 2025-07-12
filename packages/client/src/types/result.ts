// Result type definitions for query execution

import type { ColumnName } from "./columns";

/**
 * Maps selected columns to their result object type
 */
export type SelectionResult<
  DB,
  TB extends keyof DB,
  Selections extends string[]
> = {
  [K in Selections[number] as ExtractColumnAlias<K>]: ExtractColumnType<
    DB,
    TB,
    K
  >;
};

/**
 * Extracts the final property name from a column selection
 */
type ExtractColumnAlias<C extends string> =
  C extends `${string} as ${infer Alias}`
    ? Alias
    : C extends `${string}.${infer Col}`
    ? Col
    : C;

/**
 * Extracts the column reference from an aliased column
 */
type ExtractColumnRef<C extends string> = C extends `${infer Ref} as ${string}`
  ? Ref
  : C;

/**
 * Extracts the TypeScript type for a column selection
 */
type ExtractColumnType<
  DB,
  TB extends keyof DB,
  C extends string
> = C extends `${string} as ${string}`
  ? ExtractColumnType<DB, TB, ExtractColumnRef<C>>
  : C extends `${infer Table}.${infer Col}`
  ? Table extends TB
    ? Table extends keyof DB
      ? Col extends keyof DB[Table]
        ? DB[Table][Col]
        : never
      : never
    : never
  : C extends ColumnName<DB, TB>
  ? ExtractColumnTypeFromUnion<DB, TB, C>
  : never;

/**
 * Resolves column type from union of possible tables
 */
type ExtractColumnTypeFromUnion<DB, TB extends keyof DB, C extends string> = {
  [T in TB]: C extends keyof DB[T] ? DB[T][C] : never;
}[TB];

/**
 * Forces TypeScript to resolve complex intersections into clean object types
 */
export type Prettify<T> = {
  [K in keyof T]: T[K];
} & {};