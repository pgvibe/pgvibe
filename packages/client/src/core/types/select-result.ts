// SelectResult type utilities for clean query result types
// Replaces broken intersection types with proper column selection

import type {
  ExtractColumnName,
  ExtractTableName,
  ResolveColumnType,
  ValidateColumnAccess,
  AllColumnsFromTables,
} from "../errors/validation-utils";

/**
 * Type to track JOIN information for nullability
 */
export type JoinInfo = {
  table: string;
  joinType: "INNER" | "LEFT" | "RIGHT" | "FULL";
};

/**
 * Type to represent a collection of JOIN information
 */
export type JoinContext = readonly JoinInfo[];

/**
 * Helper type to convert union types to intersection types for joined tables
 * This is essential for resolving column types from multiple joined tables
 */
export type UnionToIntersection<U> = (
  U extends any ? (k: U) => void : never
) extends (k: infer I) => void
  ? I
  : never;

/**
 * Type utility that forces TypeScript to fully expand and resolve types
 * This makes hover tooltips show the actual object structure instead of type aliases
 */
export type Prettify<T> = {
  [K in keyof T]: T[K];
} & {};

/**
 * Enhanced SelectResult type that creates clean result objects from column selections
 * Now supports JOIN context for proper nullability handling and alias context for alias resolution
 * Uses Prettify to ensure TypeScript displays the expanded object type
 */
export type SelectResult<
  TDatabase,
  TTables extends keyof TDatabase,
  TColumns,
  TJoinContext extends JoinContext = readonly [],
  TAliasContext extends string = never
> = TColumns extends readonly string[]
  ? Prettify<{
      [K in TColumns[number] as ExtractColumnName<K>]: ResolveColumnTypeWithJoins<
        TDatabase,
        TTables,
        K,
        TJoinContext,
        TAliasContext
      >;
    }>
  : TColumns extends string
  ? Prettify<{
      [K in ExtractColumnName<TColumns>]: ResolveColumnTypeWithJoins<
        TDatabase,
        TTables,
        TColumns,
        TJoinContext,
        TAliasContext
      >;
    }>
  : never;

/**
 * Enhanced ResolveColumnType that considers JOIN nullability and alias context
 */
export type ResolveColumnTypeWithJoins<
  TDatabase,
  TTables extends keyof TDatabase,
  TColumn extends string,
  TJoinContext extends JoinContext,
  TAliasContext extends string = never
> = ResolveColumnTypeWithAlias<
  TDatabase,
  TTables,
  TColumn,
  TAliasContext
> extends infer BaseType
  ? IsColumnFromNullableTable<
      TDatabase,
      TTables,
      TColumn,
      TJoinContext
    > extends true
    ? BaseType | null
    : BaseType
  : never;

/**
 * Resolve column type with alias awareness
 * Maps alias-prefixed columns (u.id) to actual table columns (users.id)
 */
export type ResolveColumnTypeWithAlias<
  TDatabase,
  TTables extends keyof TDatabase,
  TColumn extends string,
  TAliasContext extends string = never
> = TColumn extends `${infer Prefix}.${infer ColumnName}`
  ? // Qualified column - check if prefix is an alias
    [TAliasContext] extends [never]
    ? // No alias context - treat as regular qualified column
      Prefix extends TTables & keyof TDatabase
      ? ColumnName extends keyof TDatabase[Prefix]
        ? TDatabase[Prefix][ColumnName]
        : never
      : never
    : // Has alias context - map alias to actual table
    Prefix extends TAliasContext
    ? ColumnName extends keyof TDatabase[TTables]
      ? TDatabase[TTables][ColumnName]
      : never
    : // Not using the alias, treat as regular qualified column
    Prefix extends TTables & keyof TDatabase
    ? ColumnName extends keyof TDatabase[Prefix]
      ? TDatabase[Prefix][ColumnName]
      : never
    : never
  : // Simple column name - find which table it belongs to using distributive conditional
  FindColumnTable<TDatabase, TTables, TColumn> extends infer FoundTable
  ? FoundTable extends keyof TDatabase
    ? TColumn extends keyof TDatabase[FoundTable]
      ? TDatabase[FoundTable][TColumn]
      : never
    : never
  : never;

/**
 * Determine if a column comes from a table that could be null due to JOINs
 */
export type IsColumnFromNullableTable<
  TDatabase,
  TTables extends keyof TDatabase,
  TColumn extends string,
  TJoinContext extends JoinContext
> = ExtractTableName<TColumn> extends string
  ? // Qualified column - check if the specific table is nullable
    IsTableNullableInContext<ExtractTableName<TColumn>, TTables, TJoinContext>
  : // Simple column - need to find which table it belongs to and check if that's nullable
  FindColumnTable<TDatabase, TTables, TColumn> extends infer ColumnTable
  ? ColumnTable extends keyof TDatabase
    ? IsTableNullableInContext<ColumnTable, TTables, TJoinContext>
    : false
  : false;

/**
 * Find which table a simple column belongs to
 */
export type FindColumnTable<
  TDatabase,
  TTables extends keyof TDatabase,
  TColumn extends string
> = {
  [T in TTables]: TColumn extends keyof TDatabase[T] ? T : never;
}[TTables];

/**
 * Check if a specific table is nullable in the JOIN context
 * Simplified approach using mapped types to check all JOINs at once
 */
export type IsTableNullableInContext<
  TableName,
  TTables,
  TJoinContext extends JoinContext
> = TJoinContext extends readonly []
  ? // No JOINs - no columns should be nullable
    false
  : // Check if any JOIN makes this table nullable using union distribution
  true extends {
      [K in keyof TJoinContext]: TJoinContext[K] extends JoinInfo
        ? TJoinContext[K]["joinType"] extends "LEFT"
          ? TableName extends TJoinContext[K]["table"]
            ? true
            : false
          : TJoinContext[K]["joinType"] extends "RIGHT"
          ? TableName extends TJoinContext[K]["table"]
            ? false // Joined table is not nullable
            : true // Base table is nullable
          : TJoinContext[K]["joinType"] extends "FULL"
          ? TableName extends TJoinContext[K]["table"] | TTables
            ? true
            : false
          : false
        : false;
    }[keyof TJoinContext]
  ? true
  : false;

/**
 * Utility for SelectAll operations
 * Returns the full table schema for single table, or intersection for joined tables
 */
export type SelectAllResult<
  TDatabase,
  TTables extends keyof TDatabase
> = UnionToIntersection<TDatabase[TTables]>;

/**
 * Smart column reference type that includes error validation
 * This replaces the existing ColumnReference with error-aware validation
 */
export type ValidatedColumnReference<
  TDatabase,
  TTables extends keyof TDatabase,
  TColumn extends string
> = ValidateColumnAccess<TDatabase, TTables, TColumn>;

/**
 * Type for multiple validated column references
 */
export type ValidatedColumnReferences<
  TDatabase,
  TTables extends keyof TDatabase,
  TColumns extends readonly string[]
> = {
  [K in keyof TColumns]: TColumns[K] extends string
    ? ValidatedColumnReference<TDatabase, TTables, TColumns[K]>
    : never;
};

/**
 * Helper to determine if all column validations passed (no errors)
 */
export type AllColumnsValid<
  TDatabase,
  TTables extends keyof TDatabase,
  TColumns extends readonly string[]
> = ValidatedColumnReferences<TDatabase, TTables, TColumns> extends TColumns
  ? true
  : false;
