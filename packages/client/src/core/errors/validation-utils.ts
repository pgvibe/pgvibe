// Universal column validation utilities
// These types validate column access and return helpful error messages

import type {
  ColumnNotFoundError,
  TableNotJoinedError,
  QualifiedColumnError,
  AmbiguousColumnError,
  DuplicatePropertyError,
  ColumnValidationError,
} from "./column-errors";
import type { ExtractGenerated } from "../types/utility-types";

/**
 * Extract table name from qualified column reference (e.g., "users.id" -> "users")
 */
export type ExtractTableName<T extends string> =
  T extends `${infer Table}.${string}` ? Table : never;

/**
 * Extract column name from qualified column reference (e.g., "users.id" -> "id")
 */
export type ExtractColumnName<T extends string> =
  T extends `${string}.${infer Column}` ? Column : T;

/**
 * Check if a string is a qualified column reference (contains a dot)
 */
export type IsQualifiedColumn<T extends string> =
  T extends `${string}.${string}` ? true : false;

/**
 * Get all columns from specified tables
 */
export type AllColumnsFromTables<
  TDatabase,
  TTables extends keyof TDatabase
> = keyof TDatabase[TTables];

/**
 * Get tables that contain a specific column
 */
export type TablesWithColumn<
  TDatabase,
  TTables extends keyof TDatabase,
  TColumn extends string
> = {
  [K in TTables]: TColumn extends keyof TDatabase[K] ? K : never;
}[TTables];

/**
 * Check if a column exists in multiple tables (is ambiguous)
 */
export type IsAmbiguousColumn<
  TDatabase,
  TTables extends keyof TDatabase,
  TColumn extends string
> = TablesWithColumn<TDatabase, TTables, TColumn> extends infer Tables
  ? Tables extends never
    ? false
    : [Tables] extends [keyof TDatabase]
    ? false // Single table
    : true // Multiple tables
  : false;

/**
 * Format table names for error messages
 */
export type FormatTableList<T> = T extends readonly (infer U)[]
  ? U extends string
    ? T extends readonly [infer Only]
      ? Only
      : T extends readonly [infer First, infer Second]
      ? `${First & string}, ${Second & string}`
      : T extends readonly [infer First, infer Second, infer Third]
      ? `${First & string}, ${Second & string}, ${Third & string}`
      : string
    : string
  : T extends string
  ? T
  : string;

/**
 * Universal column access validator
 * Returns the column if valid, or an error type with helpful message
 */
export type ValidateColumnAccess<
  TDatabase,
  TTables extends keyof TDatabase,
  TColumn extends string
> = IsQualifiedColumn<TColumn> extends true
  ? // Qualified column validation
    ExtractTableName<TColumn> extends TTables
    ? ExtractColumnName<TColumn> extends keyof TDatabase[ExtractTableName<TColumn>]
      ? TColumn // Valid qualified column
      : ColumnNotFoundError<
          ExtractColumnName<TColumn>,
          FormatTableList<TTables>
        >
    : TableNotJoinedError<ExtractTableName<TColumn>, ExtractColumnName<TColumn>>
  : // Simple column validation
  TColumn extends AllColumnsFromTables<TDatabase, TTables>
  ? IsAmbiguousColumn<TDatabase, TTables, TColumn> extends true
    ? AmbiguousColumnError<
        TColumn,
        FormatTableList<TablesWithColumn<TDatabase, TTables, TColumn>>
      >
    : TColumn // Valid simple column
  : ColumnNotFoundError<TColumn, FormatTableList<TTables>>;

/**
 * Validate multiple columns at once
 */
export type ValidateColumnsAccess<
  TDatabase,
  TTables extends keyof TDatabase,
  TColumns extends readonly string[]
> = {
  [K in keyof TColumns]: ValidateColumnAccess<
    TDatabase,
    TTables,
    TColumns[K] & string
  >;
};

/**
 * Check if any column validation resulted in an error
 */
export type HasColumnErrors<T> = T extends readonly (infer U)[]
  ? U extends ColumnValidationError
    ? true
    : false
  : T extends ColumnValidationError
  ? true
  : false;

/**
 * Extract only the error types from column validation results
 */
export type ExtractColumnErrors<T> = T extends readonly (infer U)[]
  ? U extends ColumnValidationError
    ? U
    : never
  : T extends ColumnValidationError
  ? T
  : never;

/**
 * Detect duplicate property names that would be created from qualified columns
 * e.g., ["users.id", "posts.id"] both create "id" property
 */
export type DetectDuplicateProperties<TColumns extends readonly string[]> =
  TColumns extends readonly [infer First, ...infer Rest]
    ? First extends string
      ? Rest extends readonly string[]
        ? ExtractColumnName<First> extends ExtractColumnName<Rest[number]>
          ? DuplicatePropertyError<ExtractColumnName<First>>
          : DetectDuplicateProperties<Rest>
        : never
      : never
    : never;

/**
 * Resolve the actual database column type for a given column reference
 * Handles both simple and qualified column names
 * Fixed to handle single table case correctly
 * Now properly unwraps Generated<> types for SELECT operations
 */
export type ResolveColumnType<
  TDatabase,
  TTables extends keyof TDatabase,
  TColumn extends string
> = IsQualifiedColumn<TColumn> extends true
  ? // Qualified column: "table.column"
    ExtractTableName<TColumn> extends TTables & keyof TDatabase
    ? ExtractColumnName<TColumn> extends keyof TDatabase[ExtractTableName<TColumn>]
      ? ExtractGenerated<
          TDatabase[ExtractTableName<TColumn>][ExtractColumnName<TColumn>]
        >
      : never
    : never
  : // Simple column name - handle single vs multiple tables
  TTables extends keyof TDatabase
  ? TColumn extends keyof TDatabase[TTables]
    ? ExtractGenerated<TDatabase[TTables][TColumn]>
    : never
  : never;

/**
 * Helper type to convert union types to intersection types
 * Used for joined table column resolution
 */
export type UnionToIntersection<U> = (
  U extends any ? (k: U) => void : never
) extends (k: infer I) => void
  ? I
  : never;
