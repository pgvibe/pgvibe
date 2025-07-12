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
 * Optimized: Flattened conditional logic and reduced nesting
 */
type ExtractColumnType<DB, TB extends keyof DB, C extends string> = 
  C extends `${string} as ${string}`
    ? ExtractColumnType<DB, TB, ExtractColumnRef<C>>
    : C extends `${infer Table}.${infer Col}`
      ? Table extends TB
        ? Table extends keyof DB
          ? Col extends keyof DB[Table] ? DB[Table][Col] : never
          : never
        : never
      : C extends ColumnName<DB, TB>
        ? ExtractColumnTypeFromUnion<DB, TB, C>
        : never;

/**
 * Optimized: Direct union extraction without mapped type overhead
 */
type ExtractColumnTypeFromUnion<DB, TB extends keyof DB, C extends string> = 
  TB extends keyof DB 
    ? C extends keyof DB[TB] ? DB[TB][C] : never 
    : never;

/**
 * Optimized: Forces TypeScript to resolve complex intersections into clean object types
 * Uses identity mapping for better performance in TypeScript 5.x
 */
export type Prettify<T> = {
  [K in keyof T]: T[K];
} & {};

/**
 * Advanced optimization: Lazy type resolution for complex selections
 */
export type LazySelectionResult<DB, TB extends keyof DB, S extends string[]> = 
  S extends readonly [infer First, ...infer Rest]
    ? First extends string
      ? Rest extends string[]
        ? { [K in ExtractColumnAlias<First>]: ExtractColumnType<DB, TB, First> } & 
          LazySelectionResult<DB, TB, Rest>
        : { [K in ExtractColumnAlias<First>]: ExtractColumnType<DB, TB, First> }
      : {}
    : {};

/**
 * Performance optimization: Cached column type resolution
 */
type CachedColumnType<DB, TB extends keyof DB, C extends string> = 
  C extends keyof TypeCache 
    ? TypeCache[C] 
    : ExtractColumnType<DB, TB, C>;

interface TypeCache {
  // This would be populated by commonly used column patterns
  [key: string]: any;
}