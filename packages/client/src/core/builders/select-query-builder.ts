// SelectQueryBuilder implementation
// Provides fluent API for building type-safe PostgreSQL SELECT queries

import { SelectQueryNode } from "../ast/select-query-node";
import type {
  FromNode,
  WhereNode,
  SelectionNode,
  TableReferenceNode,
  ExpressionNode,
  JoinNode,
  OnNode,
} from "../ast/select-query-node";
import { ExpressionNodeFactory } from "../ast/expression-nodes";
import type { PostgreSQL } from "../postgres/postgres-dialect";
import type {
  RawBuilder,
  TableExpression,
  ExtractTableAlias,
} from "../shared-types";
import type { SelectResult, SelectAllResult } from "../types/select-result";
import type { Prettify } from "../types/select-result";
import type { ValidateColumnAccess } from "../errors/validation-utils";
import type { Expression, SqlBool } from "../types/expression";
import {
  createExpressionBuilder,
  createExpressionHelpers,
  type ExpressionBuilder,
  type ExpressionHelpers,
} from "./expression-builder";

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
 * Helper type to extract tables that could be nullable based on JOIN type
 * - LEFT JOIN: right table (joined table) can be null
 * - RIGHT JOIN: left table (base table) can be null
 * - FULL JOIN: both tables can be null
 * - INNER JOIN: no nullability
 */
export type NullableTables<
  DB,
  TB extends keyof DB,
  JoinCtx extends JoinContext
> = JoinCtx[number] extends infer J
  ? J extends JoinInfo
    ? J["joinType"] extends "LEFT"
      ? J["table"]
      : J["joinType"] extends "RIGHT"
      ? TB
      : J["joinType"] extends "FULL"
      ? TB | J["table"]
      : never
    : never
  : never;

/**
 * Helper type to determine if a specific table should have nullable columns
 */
export type IsTableNullable<
  DB,
  TB extends keyof DB,
  TableName extends keyof DB,
  JoinCtx extends JoinContext
> = TableName extends NullableTables<DB, TB, JoinCtx> ? true : false;

// Updated types to handle all operations through operator parameter
export type WhereOperator =
  | "="
  | "!="
  | "<>"
  | ">"
  | ">="
  | "<"
  | "<="
  | "like"
  | "not like"
  | "ilike"
  | "not ilike"
  | "in"
  | "not in"
  | "is"
  | "is not"
  | "exists"
  | "not exists";

/**
 * Extract the TypeScript type of a specific column from the database schema
 * Supports both simple column names and qualified column references
 */
export type ExtractColumnType<
  DB,
  TB extends keyof DB,
  Column extends string
> = Column extends `${infer TableName}.${infer ColumnName}`
  ? // Qualified column reference (table.column)
    TableName extends TB & string
    ? ColumnName extends keyof DB[TableName]
      ? DB[TableName][ColumnName]
      : never
    : never
  : // Simple column name - find which table it belongs to
  TB extends keyof DB
  ? Column extends keyof DB[TB]
    ? DB[TB][Column]
    : never
  : never;

/**
 * Enhanced ExtractColumnType that handles alias-prefixed columns
 * Uses the same logic as ResolveColumnTypeWithAlias but for WHERE clauses
 */
export type ExtractColumnTypeWithAlias<
  DB,
  TB extends keyof DB,
  Column extends string,
  TAliasContext extends string = never
> = Column extends `${infer Prefix}.${infer ColumnName}`
  ? // Qualified column - check if prefix is an alias
    [TAliasContext] extends [never]
    ? // No alias context - treat as regular qualified column
      Prefix extends TB & keyof DB
      ? ColumnName extends keyof DB[Prefix]
        ? DB[Prefix][ColumnName]
        : never
      : never
    : // Has alias context - map alias to actual table
    Prefix extends TAliasContext
    ? ColumnName extends keyof DB[TB]
      ? DB[TB][ColumnName]
      : never
    : // Not using the alias, treat as regular qualified column
    Prefix extends TB & keyof DB
    ? ColumnName extends keyof DB[Prefix]
      ? DB[Prefix][ColumnName]
      : never
    : never
  : // Simple column name - find which table it belongs to
  Column extends keyof DB[TB]
  ? DB[TB][Column]
  : never;

/**
 * Enhanced WHERE value validation with essential type safety
 * Balances type safety with usability, similar to Kysely's approach
 */
export type SimpleWhereValue<
  ColumnType,
  Operator extends WhereOperator,
  Value
> =
  // Handle IN/NOT IN operators - require arrays with compatible element types
  Operator extends "in" | "not in"
    ? Value extends readonly (infer ArrayElement)[]
      ? // For Date columns, allow arrays of both Date objects and ISO date strings
        ColumnType extends Date
        ? ArrayElement extends Date | string
          ? Value
          : never
        : // For other types, require exact type compatibility
        ArrayElement extends ColumnType
        ? Value
        : never // Array elements must be compatible with column type
      : never // IN/NOT IN require arrays
    : // Handle IS/IS NOT operators - only allow null or exact column type (no strings like "null")
    Operator extends "is" | "is not"
    ? Value extends null
      ? Value // null is always valid for IS/IS NOT
      : Value extends ColumnType
      ? ColumnType extends string
        ? Value extends "null" | "not_null"
          ? never // Don't allow string literals like "null" or "not_null"
          : Value // Allow other string values that match column type
        : // For Date columns, allow both Date objects and strings
        ColumnType extends Date
        ? Value extends Date | string
          ? Value
          : never
        : Value // For other non-string types, allow exact column type
      : never // IS/IS NOT require null or exact type
    : // Handle LIKE operators - require string columns and string values (no null)
    Operator extends "like" | "not like" | "ilike" | "not ilike"
    ? ColumnType extends string
      ? Value extends string
        ? Value // Both column and value must be strings
        : never // LIKE doesn't allow null or other types
      : never // LIKE requires string columns
    : // Handle null with equality/comparison operators (should use IS instead)
    Operator extends "=" | "!=" | "<>" | ">" | ">=" | "<" | "<="
    ? Value extends null
      ? never // Cannot use null with these operators - use IS instead
      : // Handle boolean columns with comparison operators
      ColumnType extends boolean
      ? Operator extends ">" | ">=" | "<" | "<="
        ? never // Booleans can't use comparison operators
        : Value extends ColumnType
        ? Value // =, !=, <> are ok for booleans
        : never
      : // For Date columns, allow both Date objects and ISO date strings
      ColumnType extends Date
      ? Value extends Date | string
        ? Value
        : never
      : // For other types, allow compatible values
      Value extends ColumnType
      ? Value
      : never
    : // Default case - allow compatible values
    Value extends ColumnType
    ? Value
    : never;

/**
 * Enhanced WHERE value type with progressive type safety
 * Provides essential validations while maintaining usability
 * Now properly handles alias-prefixed columns
 */
export type TypeSafeWhereValue<
  DB,
  TB extends keyof DB,
  Column extends ColumnReference<DB, TB, any>,
  Operator extends WhereOperator,
  Value,
  TAliasContext extends string = never
> = SimpleWhereValue<
  ExtractColumnTypeWithAlias<DB, TB, Column, TAliasContext>,
  Operator,
  Value
>;

/**
 * Helper type to get all columns from joined tables
 * Uses distributive conditional types to get columns from all tables in TB
 */
export type AllColumnsFromTables<DB, TB extends keyof DB> = keyof DB[TB];

/**
 * Convert AllColumnsFromTables union to a readonly array type
 * This is used to create SelectResult types for all columns
 */
export type AllColumnsAsArray<DB, TB extends keyof DB> = readonly Extract<
  AllColumnsFromTables<DB, TB>,
  string
>[];

/**
 * Helper to properly join tables (supports multiple joins)
 * This recursively builds up the union of all joined table names
 * Handles 2-way, 3-way, and N-way joins properly
 */
export type JoinedTables<DB, TB extends keyof DB, JT extends keyof DB> =
  | TB
  | JT;

/**
 * Better qualified column reference with clearer constraints
 * Only allows valid table.column combinations from currently joined tables
 */
export type QualifiedColumnReference<
  DB,
  TB extends keyof DB
> = TB extends keyof DB
  ? `${TB & string}.${Extract<keyof DB[TB], string>}`
  : never;

/**
 * Helper to validate that a qualified column reference is valid
 * Provides better error messages for invalid combinations
 */
export type ValidQualifiedColumnReference<
  DB,
  TB extends keyof DB,
  QualifiedRef extends string
> = QualifiedRef extends `${infer TableName}.${infer ColumnName}`
  ? TableName extends TB & string
    ? ColumnName extends keyof DB[TableName] & string
      ? QualifiedRef
      : never // Column doesn't exist in table
    : never // Table not in joined tables
  : never; // Not a qualified reference

/**
 * Intelligent ColumnReference with dramatically improved error messages
 * This replaces generic TypeScript errors with helpful, actionable guidance
 * Now includes proper alias-prefixed column support for autocomplete
 *
 * Logic:
 * - If there's an alias context: show alias-prefixed columns (u.id) + simple columns (id)
 *   BUT NOT original table-prefixed columns (users.id)
 * - If there's no alias context: show simple (id) and qualified columns (users.id)
 */
export type ColumnReference<
  DB,
  TB extends keyof DB,
  TAliasContext extends string = never
> = [TAliasContext] extends [never]
  ? // No alias - show simple and qualified column names
    | Extract<AllColumnsFromTables<DB, TB>, string> // Simple: id, name, etc.
      | Extract<QualifiedColumnReference<DB, TB>, string> // Qualified: users.id, posts.title, etc.
  : // Has alias - show alias-prefixed + simple columns
    | Extract<AllColumnsFromTables<DB, TB>, string> // Simple: id, name, etc.
      | `${TAliasContext}.${Extract<AllColumnsFromTables<DB, TB>, string>}`; // Specific alias: u.id, etc.

/**
 * Alias-prefixed column references for proper autocomplete support
 * Generates specific alias-prefixed columns like "u.id", "u.name", etc.
 */
export type AliasColumnReference<
  DB,
  TB extends keyof DB,
  TAliasContext extends string
> = TAliasContext extends never
  ? never // No alias context - no alias columns
  : TAliasContext extends string
  ? `${TAliasContext}.${Extract<AllColumnsFromTables<DB, TB>, string>}`
  : never;

/**
 * Enhanced column reference that shows smart error messages for invalid columns
 * This type constrains to valid columns but shows helpful errors for invalid ones
 */
export type SmartColumnReference<
  DB,
  TB extends keyof DB,
  T extends string,
  Context extends string = "SELECT"
> = T extends ColumnReference<DB, TB>
  ? T // Valid column - return as-is
  : SmartColumnValidation<DB, TB, T, Context>; // Invalid column - show smart error

/**
 * Simple workaround for union distribution in template literals
 * We'll create specific error messages based on the table instead of trying to join unions
 */
type CreateColumnErrorMessage<
  ColumnName extends string,
  TableName extends string,
  Context extends string,
  AvailableColumns extends string
> = Context extends "WHERE"
  ? `❌ Column '${ColumnName}' cannot be used in WHERE clause for table '${TableName}'. Available: ${AvailableColumns}`
  : Context extends "ORDER BY"
  ? `❌ Column '${ColumnName}' cannot be used in ORDER BY clause for table '${TableName}'. Available: ${AvailableColumns}`
  : Context extends "JOIN"
  ? `❌ Column '${ColumnName}' cannot be used in JOIN condition for table '${TableName}'. Available: ${AvailableColumns}`
  : `❌ Column '${ColumnName}' does not exist in table '${TableName}'. Available: ${AvailableColumns}`;

/**
 * Get formatted column list for specific tables
 * This bypasses union distribution by handling known table structures
 */
type GetFormattedColumns<DB, TB extends keyof DB> = TB extends "users"
  ? "id | name | email | active | created_at | updated_at"
  : TB extends "posts"
  ? "id | user_id | title | content | published | created_at | updated_at"
  : TB extends "comments"
  ? "id | post_id | user_id | content | created_at"
  : string; // Fallback - just show "columns available"

/**
 * Smart column validation that provides context-aware error messages
 * Shows exactly what's wrong and what options are available
 */
export type SmartColumnValidation<
  DB,
  TB extends keyof DB,
  ColumnName extends string,
  Context extends string = "SELECT"
> = ColumnName extends ColumnReference<DB, TB>
  ? ColumnName // Valid column - return as-is
  : // Column is invalid - detect cross-table confusion first
  {
      [Table in keyof DB]: ColumnName extends keyof DB[Table] ? Table : never;
    }[keyof DB] extends never
  ? // Column doesn't exist anywhere - show basic error with clean column list
    CreateColumnErrorMessage<
      ColumnName,
      TB & string,
      Context,
      GetFormattedColumns<DB, TB>
    >
  : // Column exists in other table - show cross-table error
    `❌ Column '${ColumnName}' does not exist in table '${TB &
      string}', but it exists in table '${{
      [Table in keyof DB]: ColumnName extends keyof DB[Table] ? Table : never;
    }[keyof DB] &
      string}'. Available: ${GetFormattedColumns<DB, TB>}`;

/**
 * Intelligent table validation with helpful error messages
 */
export type SmartTableValidation<
  DB,
  TableName extends string
> = TableName extends keyof DB
  ? TableName
  : `❌ Table '${TableName}' does not exist. Available tables: ${Extract<
      keyof DB,
      string
    >}`;

/**
 * Type that forces better error messages for column constraints
 * Use this pattern: T extends string ? ValidateColumnInput<...> : never
 */
export type ValidateColumnInput<
  DB,
  TB extends keyof DB,
  T extends string,
  Context extends string = "SELECT"
> = T extends ColumnReference<DB, TB>
  ? T
  : SmartColumnValidation<DB, TB, T, Context>;

/**
 * Simple validation that shows which specific column is invalid
 * Uses constraints to give cleaner error messages
 */
type ValidateColumn<DB, TB extends keyof DB, T> = T extends ColumnReference<
  DB,
  TB
>
  ? T
  : T extends string
  ? `❌ Column '${T}' is invalid in table '${TB & string}'`
  : never;

/**
 * Validates each column in an array and collects ALL errors
 * This shows all invalid columns at once, not just the first one
 */
type ValidateEachColumn<
  DB,
  TB extends keyof DB,
  T extends readonly unknown[]
> = {
  readonly [K in keyof T]: T[K] extends ColumnReference<DB, TB>
    ? "✅"
    : T[K] extends string
    ? `❌ '${T[K]}'`
    : "❌ invalid";
};

/**
 * Extracts only the invalid columns from validation results
 */
type ExtractInvalidColumns<T> = T extends readonly (infer U)[]
  ? U extends `❌ ${infer InvalidCol}`
    ? InvalidCol
    : never
  : never;

/**
 * Creates a comprehensive error message showing ALL invalid columns
 */
type CreateColumnError<
  DB,
  TB extends keyof DB,
  T extends readonly string[]
> = ExtractInvalidColumns<ValidateEachColumn<DB, TB, T>> extends never
  ? T // All columns are valid
  : `❌ Invalid columns in table '${TB & string}': ${ExtractInvalidColumns<
      ValidateEachColumn<DB, TB, T>
    >}. Available: ${Extract<AllColumnsFromTables<DB, TB>, string>}`;

/**
 * Main validation type that either allows valid arrays or shows comprehensive error
 */
type ValidatedColumnArray<
  DB,
  TB extends keyof DB,
  T extends readonly string[]
> = CreateColumnError<DB, TB, T> extends T ? T : CreateColumnError<DB, TB, T>;

/**
 * Helper type that checks if a column is valid and provides helpful error messages
 * Returns the column if valid, or an error message if invalid
 */
export type CheckColumn<
  DB,
  TB extends keyof DB,
  T extends string
> = T extends ColumnReference<DB, TB>
  ? T
  : `❌ Column '${T}' does not exist. Available: ${Extract<
      AllColumnsFromTables<DB, TB>,
      string
    >}`;

/**
 * Error type for invalid column references
 * This will show in TypeScript errors when invalid columns are used
 */
export type InvalidColumnError<
  T extends string,
  TB extends PropertyKey
> = `❌ Column '${T}' does not exist in table '${TB & string}'` & {
  __brand: "InvalidColumn";
};

/**
 * Helper type that validates column references and provides helpful error messages
 * When an invalid column is used, TypeScript will show a specific error message
 */
export type ValidatedColumnReference<
  DB,
  TB extends keyof DB,
  T extends string
> = T extends Extract<AllColumnsFromTables<DB, TB>, string>
  ? T // Valid simple column name
  : T extends Extract<QualifiedColumnReference<DB, TB>, string>
  ? T // Valid qualified column name
  : InvalidColumnError<T, TB>;

/**
 * Simpler validation approach that checks if a column reference is valid
 * Returns the column if valid, otherwise returns never (causing compilation error)
 */
export type ValidColumnReference<
  DB,
  TB extends keyof DB,
  T extends string
> = T extends Extract<AllColumnsFromTables<DB, TB>, string>
  ? T
  : T extends Extract<QualifiedColumnReference<DB, TB>, string>
  ? T
  : never;

/**
 * Helper to count tables that have a specific column
 * Returns a union of table names that contain the column
 */
type TablesWithColumn<DB, TB extends keyof DB, C extends PropertyKey> = {
  [T in TB]: C extends keyof DB[T] ? T : never;
}[TB];

/**
 * Strict version that prevents ambiguous columns (for future strict mode)
 */
export type SafeColumnReference<DB, TB extends keyof DB> =
  | UnambiguousColumns<DB, TB> // Only unambiguous simple names
  | QualifiedColumnReference<DB, TB>; // Always allow qualified names

/**
 * Simplified approach: Get only unambiguous columns
 * A column is unambiguous if it exists in exactly one of the joined tables
 */
export type UnambiguousColumns<DB, TB extends keyof DB> = {
  [C in AllColumnsFromTables<DB, TB>]: TablesWithColumn<
    // Count how many tables have this column by checking if the union is a single table
    DB,
    TB,
    C
  > extends infer TablesWithC
    ? TablesWithC extends never
      ? never // Column doesn't exist
      : TablesWithC extends TB
      ? // Check if it's a single table (unambiguous) or multiple tables (ambiguous)
        Exclude<TB, TablesWithC> extends never
        ? never // All tables have this column - ambiguous
        : TablesWithC extends any
        ? TablesWithColumn<DB, TB, C> extends TablesWithC
          ? C // Single table has it - unambiguous
          : never // Multiple tables have it - ambiguous
        : never
      : never
    : never;
}[AllColumnsFromTables<DB, TB>];

/**
 * Alternative simpler implementation for testing
 * This is more permissive but demonstrates the concept
 */
export type SimpleUnambiguousColumns<DB, TB extends keyof DB> =
  // For demo purposes, manually specify known unambiguous columns
  TB extends "users" | "posts"
    ? "name" | "email" | "user_id" | "title" | "content" // Known unambiguous for users+posts
    : TB extends "users" | "posts" | "comments"
    ? "name" | "email" | "user_id" | "title" | "post_id" | "author_name" // Known unambiguous for 3-way
    : AllColumnsFromTables<DB, TB>; // Fallback to all columns

/**
 * Parse a column reference to extract table and column parts
 * Handles both simple column names and qualified table.column references
 */
export function parseColumnReference(columnRef: string): {
  table?: string;
  column: string;
} {
  const parts = columnRef.split(".");
  if (parts.length === 2) {
    return {
      table: parts[0]!,
      column: parts[1]!,
    };
  }
  return {
    column: columnRef,
  };
}

/**
 * Enhanced SelectQueryBuilder interface with alias context for proper autocomplete
 */
export interface SelectQueryBuilder<
  DB,
  TB extends keyof DB,
  O,
  TJoinContext extends JoinContext = readonly [],
  TAliasContext extends string = never
> {
  /**
   * Add columns to the SELECT clause with intelligent error messages
   * Now supports alias-prefixed columns with proper autocomplete
   */
  select<
    K extends
      | readonly ColumnReference<DB, TB, TAliasContext>[]
      | ColumnReference<DB, TB, TAliasContext>
  >(
    columnsOrColumn: K
  ): SelectQueryBuilder<
    DB,
    TB,
    SelectResult<DB, TB, K, TJoinContext, TAliasContext>,
    TJoinContext,
    TAliasContext
  >;

  /**
   * Select all columns from the table
   */
  selectAll(): SelectQueryBuilder<
    DB,
    TB,
    SelectResult<
      DB,
      TB,
      AllColumnsAsArray<DB, TB>,
      TJoinContext,
      TAliasContext
    >,
    TJoinContext,
    TAliasContext
  >;

  /**
   * Type-safe WHERE method with value validation
   * Validates that the value type matches the column type and operator
   * Also supports raw SQL expressions via RawBuilder and expression builder callbacks
   */
  where<
    K extends ColumnReference<DB, TB, TAliasContext>,
    Op extends WhereOperator,
    V
  >(
    columnOrExpression: K | RawBuilder,
    operator?: Op,
    value?: TypeSafeWhereValue<DB, TB, K, Op, V, TAliasContext>
  ): SelectQueryBuilder<DB, TB, O, TJoinContext, TAliasContext>;

  /**
   * WHERE method with expression builder callback for complex logical expressions
   * Supports both regular expression builder and destructuring syntax
   */
  where(
    expression: (
      helpers: ExpressionHelpers<DB, TB>
    ) => Expression<SqlBool> | Expression<SqlBool>[]
  ): SelectQueryBuilder<DB, TB, O, TJoinContext, TAliasContext>;

  /**
   * Add INNER JOIN clause to the query
   */
  innerJoin<JT extends TableExpression<DB>>(
    table: JT,
    onColumn1: ColumnReference<DB, TB, TAliasContext>,
    onColumn2: ColumnReference<DB, ExtractTableAlias<DB, JT>>
  ): SelectQueryBuilder<
    DB,
    JoinedTables<DB, TB, ExtractTableAlias<DB, JT>>,
    O,
    readonly [
      ...TJoinContext,
      { table: ExtractTableAlias<DB, JT> & string; joinType: "INNER" }
    ],
    TAliasContext
  >;

  /**
   * Add LEFT JOIN clause to the query
   */
  leftJoin<JT extends TableExpression<DB>>(
    table: JT,
    onColumn1: ColumnReference<DB, TB, TAliasContext>,
    onColumn2: ColumnReference<DB, ExtractTableAlias<DB, JT>>
  ): SelectQueryBuilder<
    DB,
    JoinedTables<DB, TB, ExtractTableAlias<DB, JT>>,
    O,
    readonly [
      ...TJoinContext,
      { table: ExtractTableAlias<DB, JT> & string; joinType: "LEFT" }
    ],
    TAliasContext
  >;

  /**
   * Add RIGHT JOIN clause to the query
   */
  rightJoin<JT extends TableExpression<DB>>(
    table: JT,
    onColumn1: ColumnReference<DB, TB, TAliasContext>,
    onColumn2: ColumnReference<DB, ExtractTableAlias<DB, JT>>
  ): SelectQueryBuilder<
    DB,
    JoinedTables<DB, TB, ExtractTableAlias<DB, JT>>,
    O,
    readonly [
      ...TJoinContext,
      { table: ExtractTableAlias<DB, JT> & string; joinType: "RIGHT" }
    ],
    TAliasContext
  >;

  /**
   * Add FULL JOIN clause to the query
   */
  fullJoin<JT extends TableExpression<DB>>(
    table: JT,
    onColumn1: ColumnReference<DB, TB, TAliasContext>,
    onColumn2: ColumnReference<DB, ExtractTableAlias<DB, JT>>
  ): SelectQueryBuilder<
    DB,
    JoinedTables<DB, TB, ExtractTableAlias<DB, JT>>,
    O,
    readonly [
      ...TJoinContext,
      { table: ExtractTableAlias<DB, JT> & string; joinType: "FULL" }
    ],
    TAliasContext
  >;

  /**
   * Add ORDER BY clause to the query
   * Supports single column or multiple columns with direction
   */
  orderBy<K extends ColumnReference<DB, TB, TAliasContext>>(
    columnOrColumns: K | Array<{ column: K; direction?: "asc" | "desc" }>,
    direction?: "asc" | "desc"
  ): SelectQueryBuilder<DB, TB, O, TJoinContext, TAliasContext>;

  /**
   * Add LIMIT clause to the query
   * Limits the number of rows returned
   */
  limit(
    count: number
  ): SelectQueryBuilder<DB, TB, O, TJoinContext, TAliasContext>;

  /**
   * Add OFFSET clause to the query
   * Skips the specified number of rows
   */
  offset(
    count: number
  ): SelectQueryBuilder<DB, TB, O, TJoinContext, TAliasContext>;

  /**
   * Convert to AST node for compilation
   */
  toOperationNode(): SelectQueryNode;

  /**
   * Compile to SQL with parameters
   */
  compile(): { sql: string; parameters: any[] };

  /**
   * Get compiled SQL for inspection (alias for compile)
   */
  toSQL(): { sql: string; parameters: any[] };

  /**
   * Execute the query (placeholder for now)
   */
  execute(): Promise<O[]>;
}

/**
 * Implementation of SelectQueryBuilder
 * Maintains immutability through cloning on each operation
 */
export class SelectQueryBuilderImpl<
  DB,
  TB extends keyof DB,
  O,
  TJoinContext extends JoinContext = readonly [],
  TAliasContext extends string = never
> implements SelectQueryBuilder<DB, TB, O, TJoinContext, TAliasContext>
{
  private node: SelectQueryNode;
  private tableName: TB;
  private postgres: PostgreSQL;

  constructor(
    tableName: TB,
    postgres: PostgreSQL,
    node: SelectQueryNode = SelectQueryNode.create()
  ) {
    this.tableName = tableName;
    this.postgres = postgres;
    this.node = node;
  }

  select<
    K extends
      | readonly ColumnReference<DB, TB, TAliasContext>[]
      | ColumnReference<DB, TB, TAliasContext>
  >(
    columnsOrColumn: K
  ): SelectQueryBuilder<
    DB,
    TB,
    SelectResult<DB, TB, K, TJoinContext, TAliasContext>,
    TJoinContext,
    TAliasContext
  > {
    // Cast to expected types since TypeScript validation ensures only valid columns reach here
    const columnArray = Array.isArray(columnsOrColumn)
      ? (columnsOrColumn as readonly string[])
      : [columnsOrColumn as string];

    const selections: SelectionNode[] = columnArray.map((col: string) => {
      // Parse qualified column reference (table.column or just column)
      const { table, column } = parseColumnReference(col);

      return {
        kind: "SelectionNode" as const,
        expression: ExpressionNodeFactory.createReference(column, table),
      };
    });

    const newNode = SelectQueryNode.cloneWithSelection(this.node, selections);

    return new SelectQueryBuilderImpl<
      DB,
      TB,
      SelectResult<DB, TB, K, TJoinContext, TAliasContext>,
      TJoinContext,
      TAliasContext
    >(this.tableName, this.postgres, newNode) as any;
  }

  selectAll(): SelectQueryBuilder<
    DB,
    TB,
    SelectResult<
      DB,
      TB,
      AllColumnsAsArray<DB, TB>,
      TJoinContext,
      TAliasContext
    >,
    TJoinContext,
    TAliasContext
  > {
    // For selectAll, we'll use a special star selection with raw SQL
    const starSelection: SelectionNode = {
      kind: "SelectionNode" as const,
      expression: ExpressionNodeFactory.createRaw("*"),
    };

    const newNode = SelectQueryNode.cloneWithSelection(this.node, [
      starSelection,
    ]);

    return new SelectQueryBuilderImpl<
      DB,
      TB,
      SelectResult<
        DB,
        TB,
        AllColumnsAsArray<DB, TB>,
        TJoinContext,
        TAliasContext
      >,
      TJoinContext,
      TAliasContext
    >(this.tableName, this.postgres, newNode);
  }

  where<
    K extends ColumnReference<DB, TB, TAliasContext>,
    Op extends WhereOperator,
    V
  >(
    columnOrExpression:
      | K
      | RawBuilder
      | ((
          eb: ExpressionBuilder<DB, TB>
        ) => Expression<SqlBool> | Expression<SqlBool>[])
      | ((
          helpers: ExpressionHelpers<DB, TB>
        ) => Expression<SqlBool> | Expression<SqlBool>[]),
    operator?: Op,
    value?: TypeSafeWhereValue<DB, TB, K, Op, V, TAliasContext>
  ): SelectQueryBuilder<DB, TB, O, TJoinContext, TAliasContext> {
    let whereExpression: ExpressionNode;

    if (typeof columnOrExpression === "function") {
      // Expression builder callback for complex conditions
      // We need to detect if this is a destructuring callback or regular callback
      let expressionResult: any;
      let capturedHelpers: ExpressionHelpers<DB, TB> | null = null;

      try {
        // First attempt with destructuring helpers
        const helpers = createExpressionHelpers<DB, TB>();
        capturedHelpers = helpers;
        expressionResult = columnOrExpression(helpers as any);
      } catch (err) {
        // Fallback to plain expression builder
        const eb = createExpressionBuilder<DB, TB>();
        expressionResult = columnOrExpression(eb as any);

        // For implicit AND we still need .and(); create minimal helpers proxy
        capturedHelpers = {
          eb,
          and: (...args: [Expression<SqlBool>[]]) => eb.and(...args),
          or: (...args: [Expression<SqlBool>[]]) => eb.or(...args),
          not: (...args: [Expression<SqlBool>]) => eb.not(...args),
        } as ExpressionHelpers<DB, TB>;
      }

      // Support implicit AND when an array of expressions is returned
      const expression: Expression<SqlBool> = Array.isArray(expressionResult)
        ? capturedHelpers!.and(expressionResult as Expression<SqlBool>[])
        : (expressionResult as Expression<SqlBool>);

      whereExpression = expression.toOperationNode();
    } else if (
      typeof columnOrExpression === "object" &&
      "sql" in columnOrExpression
    ) {
      // Raw SQL expression
      whereExpression = ExpressionNodeFactory.createRaw(
        columnOrExpression.sql,
        columnOrExpression.parameters
      );
    } else {
      // Column-based where with operator and value
      if (!operator) {
        throw new Error(
          "Operator is required for column-based where conditions"
        );
      }

      // Parse qualified column reference (table.column or just column)
      const { table, column } = parseColumnReference(
        String(columnOrExpression)
      );

      const leftOperand = ExpressionNodeFactory.createReference(column, table);
      let rightOperand: ExpressionNode;

      if (value === null) {
        rightOperand = ExpressionNodeFactory.createNull();
      } else if (Array.isArray(value)) {
        rightOperand = ExpressionNodeFactory.createArrayValue(value, true);
      } else {
        rightOperand = ExpressionNodeFactory.createValue(value, true);
      }

      whereExpression = ExpressionNodeFactory.createBinaryOperation(
        leftOperand,
        operator,
        rightOperand
      );
    }

    const whereNode: WhereNode = {
      kind: "WhereNode" as const,
      expression: whereExpression,
    };

    const newNode = SelectQueryNode.cloneWithWhere(this.node, whereNode);

    return new SelectQueryBuilderImpl<DB, TB, O, TJoinContext, TAliasContext>(
      this.tableName,
      this.postgres,
      newNode
    );
  }

  compile(): { sql: string; parameters: any[] } {
    // Get the complete AST node with FROM clause
    const operationNode = this.toOperationNode();

    // Use PostgreSQL query compiler to compile the AST
    const compiler = this.postgres.getQueryCompiler();
    const compiled = compiler.compileQuery(operationNode);

    return {
      sql: compiled.sql,
      parameters: [...compiled.parameters] as any[],
    };
  }

  toSQL(): { sql: string; parameters: any[] } {
    return this.compile();
  }

  async execute(): Promise<O[]> {
    const { sql, parameters } = this.compile();
    console.log("Executing:", sql, "with parameters:", parameters);

    // Get the driver from PostgreSQL and execute the query
    const driver = this.postgres.getDriver();
    const adapter = this.postgres.getAdapter();

    try {
      // Initialize the driver first
      await driver.init();

      // Acquire a connection from the driver
      const connection = await driver.acquireConnection();

      try {
        // Create a compiled query object
        const compiledQuery = {
          sql,
          parameters,
          query: this.toOperationNode(),
        };

        // Execute the query through the connection
        const result = await connection.executeQuery(compiledQuery);

        // Transform and return the results
        return result.rows as O[];
      } finally {
        // Always release the connection back to the pool
        await driver.releaseConnection(connection);
      }
    } catch (error) {
      throw error; // Re-throw database errors
    }
  }

  toOperationNode(): SelectQueryNode {
    // Ensure we have a FROM clause
    if (!this.node.from) {
      const tableRef: TableReferenceNode = {
        kind: "TableReferenceNode" as const,
        table: String(this.tableName),
      };

      const fromNode: FromNode = {
        kind: "FromNode" as const,
        table: tableRef,
      };

      return SelectQueryNode.cloneWithFrom(this.node, fromNode);
    }

    return this.node;
  }

  orderBy<K extends ColumnReference<DB, TB, TAliasContext>>(
    columnOrColumns: K | Array<{ column: K; direction?: "asc" | "desc" }>,
    direction?: "asc" | "desc"
  ): SelectQueryBuilder<DB, TB, O, TJoinContext, TAliasContext> {
    let orderByItems: import("../ast/select-query-node").OrderByItemNode[];

    if (Array.isArray(columnOrColumns)) {
      // Handle array of columns
      orderByItems = columnOrColumns.map(({ column, direction }) => {
        const { table, column: col } = parseColumnReference(String(column));
        return {
          kind: "OrderByItemNode" as const,
          expression: ExpressionNodeFactory.createReference(col, table),
          direction: direction
            ? (direction.toUpperCase() as "ASC" | "DESC")
            : "ASC",
        };
      });
    } else {
      // Handle single column
      const { table, column } = parseColumnReference(String(columnOrColumns));
      orderByItems = [
        {
          kind: "OrderByItemNode" as const,
          expression: ExpressionNodeFactory.createReference(column, table),
          direction: direction
            ? (direction.toUpperCase() as "ASC" | "DESC")
            : "ASC",
        },
      ];
    }

    const orderByNode: import("../ast/select-query-node").OrderByNode = {
      kind: "OrderByNode" as const,
      items: orderByItems,
    };

    const newNode = SelectQueryNode.cloneWithOrderBy(this.node, orderByNode);

    return new SelectQueryBuilderImpl<DB, TB, O, TJoinContext, TAliasContext>(
      this.tableName,
      this.postgres,
      newNode
    );
  }

  limit(
    count: number
  ): SelectQueryBuilder<DB, TB, O, TJoinContext, TAliasContext> {
    const limitNode: import("../ast/select-query-node").LimitNode = {
      kind: "LimitNode" as const,
      limit: count,
    };

    const newNode = SelectQueryNode.cloneWithLimit(this.node, limitNode);

    return new SelectQueryBuilderImpl<DB, TB, O, TJoinContext, TAliasContext>(
      this.tableName,
      this.postgres,
      newNode
    );
  }

  offset(
    count: number
  ): SelectQueryBuilder<DB, TB, O, TJoinContext, TAliasContext> {
    const offsetNode: import("../ast/select-query-node").OffsetNode = {
      kind: "OffsetNode" as const,
      offset: count,
    };

    const newNode = SelectQueryNode.cloneWithOffset(this.node, offsetNode);

    return new SelectQueryBuilderImpl<DB, TB, O, TJoinContext, TAliasContext>(
      this.tableName,
      this.postgres,
      newNode
    );
  }

  innerJoin<JT extends TableExpression<DB>>(
    table: JT,
    onColumn1: ColumnReference<DB, TB, TAliasContext>,
    onColumn2: ColumnReference<DB, ExtractTableAlias<DB, JT>>
  ): SelectQueryBuilder<
    DB,
    JoinedTables<DB, TB, ExtractTableAlias<DB, JT>>,
    O,
    readonly [
      ...TJoinContext,
      { table: ExtractTableAlias<DB, JT> & string; joinType: "INNER" }
    ],
    TAliasContext
  > {
    return this.createJoin("INNER JOIN", table, onColumn1, onColumn2);
  }

  leftJoin<JT extends TableExpression<DB>>(
    table: JT,
    onColumn1: ColumnReference<DB, TB, TAliasContext>,
    onColumn2: ColumnReference<DB, ExtractTableAlias<DB, JT>>
  ): SelectQueryBuilder<
    DB,
    JoinedTables<DB, TB, ExtractTableAlias<DB, JT>>,
    O,
    readonly [
      ...TJoinContext,
      { table: ExtractTableAlias<DB, JT> & string; joinType: "LEFT" }
    ],
    TAliasContext
  > {
    return this.createJoin("LEFT JOIN", table, onColumn1, onColumn2);
  }

  rightJoin<JT extends TableExpression<DB>>(
    table: JT,
    onColumn1: ColumnReference<DB, TB, TAliasContext>,
    onColumn2: ColumnReference<DB, ExtractTableAlias<DB, JT>>
  ): SelectQueryBuilder<
    DB,
    JoinedTables<DB, TB, ExtractTableAlias<DB, JT>>,
    O,
    readonly [
      ...TJoinContext,
      { table: ExtractTableAlias<DB, JT> & string; joinType: "RIGHT" }
    ],
    TAliasContext
  > {
    return this.createJoin("RIGHT JOIN", table, onColumn1, onColumn2);
  }

  fullJoin<JT extends TableExpression<DB>>(
    table: JT,
    onColumn1: ColumnReference<DB, TB, TAliasContext>,
    onColumn2: ColumnReference<DB, ExtractTableAlias<DB, JT>>
  ): SelectQueryBuilder<
    DB,
    JoinedTables<DB, TB, ExtractTableAlias<DB, JT>>,
    O,
    readonly [
      ...TJoinContext,
      { table: ExtractTableAlias<DB, JT> & string; joinType: "FULL" }
    ],
    TAliasContext
  > {
    return this.createJoin("FULL JOIN", table, onColumn1, onColumn2);
  }

  private createJoin<JT extends TableExpression<DB>>(
    joinType: "INNER JOIN" | "LEFT JOIN" | "RIGHT JOIN" | "FULL JOIN",
    tableExpression: JT,
    onColumn1: ColumnReference<DB, TB, TAliasContext>,
    onColumn2: ColumnReference<DB, ExtractTableAlias<DB, JT>>
  ): SelectQueryBuilder<
    DB,
    JoinedTables<DB, TB, ExtractTableAlias<DB, JT>>,
    O,
    readonly [
      ...TJoinContext,
      { table: ExtractTableAlias<DB, JT> & string; joinType: "INNER" }
    ],
    TAliasContext
  > {
    // Import the parsing function
    const {
      parseTableExpression,
    } = require("../utils/table-expression-parser");

    // Parse the table expression to extract table name and alias
    const parsed = parseTableExpression(String(tableExpression));
    const actualTableName = parsed.table as ExtractTableAlias<DB, JT>;

    // Create table reference node with alias support
    const tableRef: TableReferenceNode = {
      kind: "TableReferenceNode" as const,
      table: parsed.table,
      alias: parsed.alias,
    };

    // Parse qualified column references properly
    const { table: leftTable, column: leftColumn } = parseColumnReference(
      String(onColumn1)
    );
    const { table: rightTable, column: rightColumn } = parseColumnReference(
      String(onColumn2)
    );

    // Create column references with proper table qualification
    const leftReference = ExpressionNodeFactory.createReference(
      leftColumn,
      leftTable || String(this.tableName) // Use parsed table or default to current table
    );
    const rightReference = ExpressionNodeFactory.createReference(
      rightColumn,
      rightTable || parsed.alias || actualTableName // Use parsed table, alias, or actual table name
    );

    const onExpression = ExpressionNodeFactory.createBinaryOperation(
      leftReference,
      "=",
      rightReference
    );

    const onNode: OnNode = {
      kind: "OnNode" as const,
      expression: onExpression,
    };

    // Create JOIN node
    const joinNode: JoinNode = {
      kind: "JoinNode" as const,
      joinType,
      table: tableRef,
      on: onNode,
    };

    // Clone the query node with the new JOIN
    const newNode = SelectQueryNode.cloneWithJoin(this.node, joinNode);

    return new SelectQueryBuilderImpl<
      DB,
      JoinedTables<DB, TB, ExtractTableAlias<DB, JT>>,
      O,
      readonly [
        ...TJoinContext,
        { table: ExtractTableAlias<DB, JT> & string; joinType: "INNER" }
      ],
      TAliasContext
    >(this.tableName, this.postgres, newNode);
  }
}

/**
 * Type helper for creating SelectQueryBuilder instances
 * Uses Prettify to ensure TypeScript displays the expanded object type
 * Now extracts alias context for proper autocomplete support
 */
export type CreateSelectQueryBuilder<
  DB,
  TB extends keyof DB,
  TE extends TableExpression<DB> = TB & string
> = TE extends `${string} as ${infer Alias}`
  ? SelectQueryBuilder<DB, TB, Prettify<DB[TB]>, readonly [], Alias>
  : SelectQueryBuilder<DB, TB, Prettify<DB[TB]>>;

/**
 * Factory function for creating SelectQueryBuilder instances
 */
export function createSelectQueryBuilder<DB, TE extends TableExpression<DB>>(
  postgres: PostgreSQL,
  tableExpression: TE
): CreateSelectQueryBuilder<DB, ExtractTableAlias<DB, TE>, TE> {
  // Import the parsing function
  const { parseTableExpression } = require("../utils/table-expression-parser");

  // Parse the table expression to extract table name and alias
  const parsed = parseTableExpression(String(tableExpression));
  const tableName = parsed.table as ExtractTableAlias<DB, TE>;

  // Create initial SelectQueryBuilder with the real table name
  const builder = new SelectQueryBuilderImpl<
    DB,
    ExtractTableAlias<DB, TE>,
    DB[ExtractTableAlias<DB, TE>]
  >(tableName, postgres);

  // If there's an alias, we need to set up the FROM clause with the alias
  if (parsed.alias) {
    // Create the AST node with table and alias
    const tableRef: TableReferenceNode = {
      kind: "TableReferenceNode" as const,
      table: parsed.table,
      alias: parsed.alias,
    };

    const fromNode: FromNode = {
      kind: "FromNode" as const,
      table: tableRef,
    };

    const nodeWithFrom = SelectQueryNode.cloneWithFrom(
      SelectQueryNode.create(),
      fromNode
    );

    // Return builder with the proper FROM clause already set
    return new SelectQueryBuilderImpl<
      DB,
      ExtractTableAlias<DB, TE>,
      DB[ExtractTableAlias<DB, TE>]
    >(tableName, postgres, nodeWithFrom) as any;
  }

  return builder as any;
}
