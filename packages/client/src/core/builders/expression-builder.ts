// Expression Builder implementation
// Provides a fluent API for building complex SQL expressions with logical operators

import type { Expression, SqlBool } from "../types/expression";
import type { ExpressionNode } from "../ast/select-query-node";
import {
  ExpressionNodeFactory,
  type NotOperationNode,
  type LogicalOperationNode,
  type ParensNode,
} from "../ast/expression-nodes";
import type { ArrayColumnOf } from "../types/array";
import { ArrayExpressionBuilder } from "./array-expression-builder";
import type {
  WhereOperator,
  ColumnReference,
  TypeSafeWhereValue,
  ExtractColumnType,
} from "./select-query-builder";

// =============================================================================
// JSONB Type Definitions
// =============================================================================

/**
 * PostgreSQL JSONB type representation
 */
export interface JsonbType<T = any> {
  readonly __jsonbBrand: unique symbol;
  readonly __jsonbValue: T;
}

/**
 * JSON value types
 */
export type JsonValue =
  | string
  | number
  | boolean
  | null
  | JsonObject
  | JsonArray;

export interface JsonObject {
  [key: string]: JsonValue;
}

export interface JsonArray extends Array<JsonValue> {}

/**
 * JSON primitive types (non-object/array)
 */
export type JsonPrimitive = string | number | boolean | null;

/**
 * JSON path representation
 */
export type JsonPath = readonly string[];

/**
 * PostgreSQL JSONB operators (legacy - for backward compatibility)
 */
export type JsonbOperator =
  | "@>" // contains
  | "<@" // contained by
  | "?" // key/element exists
  | "?|" // any key exists
  | "?&" // all keys exist
  | "&&" // array overlap
  | "->" // extract JSON field as JSONB
  | "->>" // extract JSON field as text
  | "#>" // extract at path as JSONB
  | "#>>" // extract at path as text
  | "||" // concatenate
  | "-" // remove key/element
  | "#-"; // remove at path

/**
 * Helper type to get only JSONB columns from a table
 */
type JsonbColumnOf<DB, TB extends keyof DB> = {
  [K in keyof DB[TB]]: DB[TB][K] extends JsonbType<any> ? K & string : never;
}[keyof DB[TB]];

/**
 * Type validation for JSONB values based on operator (legacy)
 */
type ValidJsonbValue<
  DB,
  TB extends keyof DB,
  K extends JsonbColumnOf<DB, TB>,
  Op extends JsonbOperator,
  V
> = Op extends "@>" | "<@" | "||"
  ? V extends JsonValue
    ? V
    : never
  : Op extends "?" | "-"
  ? V extends string
    ? V
    : never
  : Op extends "?|" | "?&"
  ? V extends readonly string[]
    ? V
    : never
  : Op extends "&&"
  ? V extends readonly any[]
    ? V
    : never
  : Op extends "->" | "->>" | "#>" | "#>>" | "#-"
  ? V extends string | readonly string[]
    ? V
    : never
  : never;

// =============================================================================
// NEW FLUENT JSONB API INTERFACES
// =============================================================================

/**
 * Main JSONB expression builder interface
 * Provides type-safe access to PostgreSQL JSONB operations through fluent API
 */
export interface JsonbExpressionBuilder<
  DB,
  TB extends keyof DB,
  K extends JsonbColumnOf<DB, TB>
> {
  // Core containment operations
  contains(value: JsonValue): Expression<SqlBool>;
  containedBy(value: JsonValue): Expression<SqlBool>;

  // Key existence operations
  hasKey(key: string): Expression<SqlBool>;
  hasAnyKey(keys: readonly string[]): Expression<SqlBool>;
  hasAllKeys(keys: readonly string[]): Expression<SqlBool>;

  // Field access operations (returns new builder for chaining)
  field(field: string): JsonbFieldExpression<DB, TB, K>;

  // Path-based operations
  path(path: JsonPath): JsonbPathExpression<DB, TB, K>;
}

/**
 * Field-specific expression builder for chained operations
 */
export interface JsonbFieldExpression<
  DB,
  TB extends keyof DB,
  K extends JsonbColumnOf<DB, TB>
> {
  // Value comparison
  equals(value: JsonPrimitive): Expression<SqlBool>;
  notEquals(value: JsonPrimitive): Expression<SqlBool>;

  // Containment for objects/arrays
  contains(value: JsonValue): Expression<SqlBool>;
  containedBy(value: JsonValue): Expression<SqlBool>;

  // Existence checks
  exists(): Expression<SqlBool>;
  isNull(): Expression<SqlBool>;

  // Nested field access
  field(field: string): JsonbFieldExpression<DB, TB, K>;
}

/**
 * Path-specific expression builder
 */
export interface JsonbPathExpression<
  DB,
  TB extends keyof DB,
  K extends JsonbColumnOf<DB, TB>
> {
  equals(value: JsonPrimitive): Expression<SqlBool>;
  contains(value: JsonValue): Expression<SqlBool>;
  exists(): Expression<SqlBool>;

  // Extract as text
  asText(): JsonbTextExpression<DB, TB, K>;
}

/**
 * Text-extracted JSONB expression builder
 */
export interface JsonbTextExpression<
  DB,
  TB extends keyof DB,
  K extends JsonbColumnOf<DB, TB>
> {
  equals(value: string): Expression<SqlBool>;
  notEquals(value: string): Expression<SqlBool>;
}

// =============================================================================
// FLUENT JSONB API IMPLEMENTATIONS
// =============================================================================

/**
 * Implementation of JsonbExpressionBuilder
 */
export class JsonbExpressionBuilderImpl<
  DB,
  TB extends keyof DB,
  K extends JsonbColumnOf<DB, TB>
> implements JsonbExpressionBuilder<DB, TB, K>
{
  constructor(private column: K) {}

  contains(value: JsonValue): Expression<SqlBool> {
    return createJsonbExpression(this.column, "@>", value);
  }

  containedBy(value: JsonValue): Expression<SqlBool> {
    return createJsonbExpression(this.column, "<@", value);
  }

  hasKey(key: string): Expression<SqlBool> {
    return createJsonbExpression(this.column, "?", key);
  }

  hasAnyKey(keys: readonly string[]): Expression<SqlBool> {
    return createJsonbExpression(this.column, "?|", keys);
  }

  hasAllKeys(keys: readonly string[]): Expression<SqlBool> {
    return createJsonbExpression(this.column, "?&", keys);
  }

  field(field: string): JsonbFieldExpression<DB, TB, K> {
    return new JsonbFieldExpressionImpl(this.column, [field]);
  }

  path(path: JsonPath): JsonbPathExpression<DB, TB, K> {
    return new JsonbPathExpressionImpl(this.column, path);
  }
}

/**
 * Implementation of JsonbFieldExpression
 */
export class JsonbFieldExpressionImpl<
  DB,
  TB extends keyof DB,
  K extends JsonbColumnOf<DB, TB>
> implements JsonbFieldExpression<DB, TB, K>
{
  constructor(private column: K, private fieldPath: string[]) {}

  equals(value: JsonPrimitive): Expression<SqlBool> {
    return this.createFieldComparisonExpression("=", value);
  }

  notEquals(value: JsonPrimitive): Expression<SqlBool> {
    return this.createFieldComparisonExpression("!=", value);
  }

  contains(value: JsonValue): Expression<SqlBool> {
    return this.createFieldComparisonExpression("@>", value);
  }

  containedBy(value: JsonValue): Expression<SqlBool> {
    return this.createFieldComparisonExpression("<@", value);
  }

  exists(): Expression<SqlBool> {
    // For single field, use ? operator
    if (this.fieldPath.length === 1) {
      return createJsonbExpression(this.column, "?", this.fieldPath[0]!);
    }
    // For nested fields, use #> IS NOT NULL
    return this.createFieldExistenceExpression();
  }

  isNull(): Expression<SqlBool> {
    return this.createFieldNullExpression();
  }

  field(field: string): JsonbFieldExpression<DB, TB, K> {
    return new JsonbFieldExpressionImpl(this.column, [
      ...this.fieldPath,
      field,
    ]);
  }

  private createFieldComparisonExpression(
    operator: string,
    value: JsonValue
  ): Expression<SqlBool> {
    // For primitive values (string, number, boolean), use ->> to extract as text
    // For objects/arrays, use -> to extract as JSON
    const isPrimitive =
      typeof value === "string" ||
      typeof value === "number" ||
      typeof value === "boolean" ||
      value === null;

    if (this.fieldPath.length === 1) {
      // Single field: column ->> 'field' = value (for primitives) or column -> 'field' = value (for objects)
      const extractOperator = isPrimitive ? "->>" : "->";
      return createJsonbChainExpression(
        this.column,
        extractOperator,
        this.fieldPath[0]!,
        operator,
        value
      );
    } else {
      // Multiple fields: use chained operators
      return createJsonbChainedFieldExpression(
        this.column,
        this.fieldPath,
        operator,
        value,
        isPrimitive
      );
    }
  }

  private createFieldExistenceExpression(): Expression<SqlBool> {
    // column #> '{field1,field2}' IS NOT NULL
    return createJsonbPathExistenceExpression(this.column, this.fieldPath);
  }

  private createFieldNullExpression(): Expression<SqlBool> {
    if (this.fieldPath.length === 1) {
      // Single field: column -> 'field' IS NULL
      return createJsonbFieldNullExpression(this.column, this.fieldPath);
    } else {
      // Multiple fields: column -> 'field1' -> 'field2' IS NULL (chained -> operators)
      return createJsonbChainedFieldNullExpression(this.column, this.fieldPath);
    }
  }
}

/**
 * Implementation of JsonbPathExpression
 */
export class JsonbPathExpressionImpl<
  DB,
  TB extends keyof DB,
  K extends JsonbColumnOf<DB, TB>
> implements JsonbPathExpression<DB, TB, K>
{
  constructor(private column: K, private path: JsonPath) {}

  equals(value: JsonPrimitive): Expression<SqlBool> {
    return createJsonbChainExpression(this.column, "#>", this.path, "=", value);
  }

  contains(value: JsonValue): Expression<SqlBool> {
    return createJsonbChainExpression(
      this.column,
      "#>",
      this.path,
      "@>",
      value
    );
  }

  exists(): Expression<SqlBool> {
    return createJsonbPathExistenceExpression(this.column, this.path);
  }

  asText(): JsonbTextExpression<DB, TB, K> {
    return new JsonbTextExpressionImpl(this.column, this.path);
  }
}

/**
 * Implementation of JsonbTextExpression
 */
export class JsonbTextExpressionImpl<
  DB,
  TB extends keyof DB,
  K extends JsonbColumnOf<DB, TB>
> implements JsonbTextExpression<DB, TB, K>
{
  constructor(private column: K, private path: JsonPath) {}

  equals(value: string): Expression<SqlBool> {
    return createJsonbChainExpression(
      this.column,
      "#>>",
      this.path,
      "=",
      value
    );
  }

  notEquals(value: string): Expression<SqlBool> {
    return createJsonbChainExpression(
      this.column,
      "#>>",
      this.path,
      "!=",
      value
    );
  }
}

// =============================================================================
// HELPER FUNCTIONS FOR FLUENT JSONB API
// =============================================================================

/**
 * Create a fluent JSONB expression builder
 */
function createFluentJsonbBuilder<
  DB,
  TB extends keyof DB,
  K extends JsonbColumnOf<DB, TB>
>(column: K): JsonbExpressionBuilder<DB, TB, K> {
  return new JsonbExpressionBuilderImpl<DB, TB, K>(column);
}

/**
 * Create a fluent Array expression builder
 */
function createArrayExpressionBuilder<
  DB,
  TB extends keyof DB,
  K extends ArrayColumnOf<DB, TB>
>(column: K): ArrayExpressionBuilder<any> {
  // Parse column reference to create ReferenceNode
  const columnStr = column as string;
  const parts = columnStr.includes(".")
    ? columnStr.split(".")
    : [undefined, columnStr];
  const [table, columnName] =
    parts.length === 2 ? [parts[0], parts[1]] : [undefined, parts[0]];

  // Create column reference node
  const columnNode = ExpressionNodeFactory.createReference(columnName!, table);

  return new ArrayExpressionBuilder(columnNode);
}

/**
 * Create a chained JSONB expression: column -> field = value or column #> path = value
 */
function createJsonbChainExpression<K extends string>(
  column: K,
  extractOperator: "->" | "->>" | "#>" | "#>>",
  pathOrField: string | readonly string[],
  compareOperator: string,
  value: JsonValue
): Expression<SqlBool> {
  // Parse column reference
  const columnStr = column as string;
  const parts = columnStr.includes(".")
    ? columnStr.split(".")
    : [undefined, columnStr];
  const [table, columnName] =
    parts.length === 2 ? [parts[0], parts[1]] : [undefined, parts[0]];

  // Create column reference node
  const columnNode = ExpressionNodeFactory.createReference(columnName!, table);

  // Create path/field node
  const pathNode = ExpressionNodeFactory.createValue(pathOrField, true);

  // Create extraction operation: column -> field or column #> path
  const extractionNode = ExpressionNodeFactory.createBinaryOperation(
    columnNode,
    extractOperator,
    pathNode
  );

  // Create value node for comparison
  const valueNode = ExpressionNodeFactory.createValue(value, true);

  // Create final comparison: (column -> field) = value
  const comparisonNode = ExpressionNodeFactory.createBinaryOperation(
    extractionNode,
    compareOperator,
    valueNode
  );

  return new ExpressionImpl<SqlBool>(comparisonNode);
}

/**
 * Create a chained field JSONB expression: column -> 'field1' -> 'field2' = value
 * This handles nested field access like jsonb("data").field("user").field("name").equals("John")
 */
function createJsonbChainedFieldExpression<K extends string>(
  column: K,
  fieldPath: readonly string[],
  compareOperator: string,
  value: JsonValue,
  isPrimitive: boolean = false
): Expression<SqlBool> {
  // Parse column reference
  const columnStr = column as string;
  const parts = columnStr.includes(".")
    ? columnStr.split(".")
    : [undefined, columnStr];
  const [table, columnName] =
    parts.length === 2 ? [parts[0], parts[1]] : [undefined, parts[0]];

  // Create column reference node
  let currentNode: ExpressionNode = ExpressionNodeFactory.createReference(
    columnName!,
    table
  );

  // Chain multiple -> operators: column -> 'field1' -> 'field2' -> ...
  // Use -> for all intermediate steps, and ->> for final step if dealing with primitives
  for (let i = 0; i < fieldPath.length; i++) {
    const field = fieldPath[i]!;
    const fieldNode = ExpressionNodeFactory.createValue(field, true);
    const isLastField = i === fieldPath.length - 1;
    const operator = isLastField && isPrimitive ? "->>" : "->";
    currentNode = ExpressionNodeFactory.createBinaryOperation(
      currentNode,
      operator,
      fieldNode
    );
  }

  // Create value node for comparison
  const valueNode = ExpressionNodeFactory.createValue(value, true);

  // Create final comparison: (column -> 'field1' -> 'field2') = value
  const comparisonNode = ExpressionNodeFactory.createBinaryOperation(
    currentNode,
    compareOperator,
    valueNode
  );

  return new ExpressionImpl<SqlBool>(comparisonNode);
}

/**
 * Create a path existence expression: column #> path IS NOT NULL
 */
function createJsonbPathExistenceExpression<K extends string>(
  column: K,
  path: readonly string[]
): Expression<SqlBool> {
  // Parse column reference
  const columnStr = column as string;
  const parts = columnStr.includes(".")
    ? columnStr.split(".")
    : [undefined, columnStr];
  const [table, columnName] =
    parts.length === 2 ? [parts[0], parts[1]] : [undefined, parts[0]];

  // Create column reference node
  const columnNode = ExpressionNodeFactory.createReference(columnName!, table);

  // Create path node
  const pathNode = ExpressionNodeFactory.createValue(path, true);

  // Create extraction operation: column #> path
  const extractionNode = ExpressionNodeFactory.createBinaryOperation(
    columnNode,
    "#>",
    pathNode
  );

  // Create NULL node
  const nullNode = ExpressionNodeFactory.createNull();

  // Create IS NOT NULL comparison
  const comparisonNode = ExpressionNodeFactory.createBinaryOperation(
    extractionNode,
    "is not",
    nullNode
  );

  return new ExpressionImpl<SqlBool>(comparisonNode);
}

/**
 * Create a field null expression: column -> field IS NULL
 */
function createJsonbFieldNullExpression<K extends string>(
  column: K,
  fieldPath: readonly string[]
): Expression<SqlBool> {
  // Parse column reference
  const columnStr = column as string;
  const parts = columnStr.includes(".")
    ? columnStr.split(".")
    : [undefined, columnStr];
  const [table, columnName] =
    parts.length === 2 ? [parts[0], parts[1]] : [undefined, parts[0]];

  // Create column reference node
  const columnNode = ExpressionNodeFactory.createReference(columnName!, table);

  // Create field/path extraction
  let extractionNode: ExpressionNode;
  if (fieldPath.length === 1) {
    // Single field: column -> 'field'
    const fieldNode = ExpressionNodeFactory.createValue(fieldPath[0]!, true);
    extractionNode = ExpressionNodeFactory.createBinaryOperation(
      columnNode,
      "->",
      fieldNode
    );
  } else {
    // Multiple fields: column #> '{field1,field2}'
    const pathNode = ExpressionNodeFactory.createValue(fieldPath, true);
    extractionNode = ExpressionNodeFactory.createBinaryOperation(
      columnNode,
      "#>",
      pathNode
    );
  }

  // Create NULL node
  const nullNode = ExpressionNodeFactory.createNull();

  // Create IS NULL comparison
  const comparisonNode = ExpressionNodeFactory.createBinaryOperation(
    extractionNode,
    "is",
    nullNode
  );

  return new ExpressionImpl<SqlBool>(comparisonNode);
}

/**
 * Create a chained field null expression: column -> 'field1' -> 'field2' IS NULL
 */
function createJsonbChainedFieldNullExpression<K extends string>(
  column: K,
  fieldPath: readonly string[]
): Expression<SqlBool> {
  // Parse column reference
  const columnStr = column as string;
  const parts = columnStr.includes(".")
    ? columnStr.split(".")
    : [undefined, columnStr];
  const [table, columnName] =
    parts.length === 2 ? [parts[0], parts[1]] : [undefined, parts[0]];

  // Create column reference node
  let currentNode: ExpressionNode = ExpressionNodeFactory.createReference(
    columnName!,
    table
  );

  // Chain multiple -> operators: column -> 'field1' -> 'field2' -> ...
  for (const field of fieldPath) {
    const fieldNode = ExpressionNodeFactory.createValue(field, true);
    currentNode = ExpressionNodeFactory.createBinaryOperation(
      currentNode,
      "->",
      fieldNode
    );
  }

  // Create NULL node
  const nullNode = ExpressionNodeFactory.createNull();

  // Create IS NULL comparison: (column -> 'field1' -> 'field2') IS NULL
  const comparisonNode = ExpressionNodeFactory.createBinaryOperation(
    currentNode,
    "is",
    nullNode
  );

  return new ExpressionImpl<SqlBool>(comparisonNode);
}

/**
 * Helper functions for destructuring in expression builder callbacks
 *
 * @template DB - Database schema type
 * @template TB - Table names union type
 */
export interface ExpressionHelpers<DB, TB extends keyof DB> {
  /**
   * The main expression builder instance
   */
  eb: ExpressionBuilder<DB, TB>;

  /**
   * Combine multiple expressions with logical AND
   */
  and: (expressions: Expression<SqlBool>[]) => Expression<SqlBool>;

  /**
   * Combine multiple expressions with logical OR
   */
  or: (expressions: Expression<SqlBool>[]) => Expression<SqlBool>;

  /**
   * Create a logical NOT expression
   */
  not: (expression: Expression<SqlBool>) => Expression<SqlBool>;

  /**
   * Create JSONB operations with fluent API
   *
   * NEW FLUENT API: Supports PostgreSQL's multi-step operations
   * - jsonb("settings").field("theme").equals("dark")  → settings -> 'theme' = 'dark'
   * - jsonb("data").path(["user", "prefs"]).exists()   → data #> '{user,prefs}' IS NOT NULL
   * - jsonb("metadata").contains({ premium: true })    → metadata @> '{"premium": true}'
   */
  jsonb: <K extends JsonbColumnOf<DB, TB>>(
    column: K
  ) => JsonbExpressionBuilder<DB, TB, K>;

  /**
   * Create PostgreSQL array operations with fluent API
   *
   * ARRAY API: Supports all PostgreSQL array operators with type safety
   * - array("tags").contains(["typescript", "nodejs"])     → tags @> ARRAY['typescript', 'nodejs']
   * - array("permissions").hasAny("admin")                 → 'admin' = ANY(permissions)
   * - array("skills").overlaps(["react", "vue"])           → skills && ARRAY['react', 'vue']
   * - array("scores").hasAll(100)                          → 100 = ALL(scores)
   * - array("categories").isContainedBy(["tech", "news"])  → categories <@ ARRAY['tech', 'news']
   */
  array: <K extends ArrayColumnOf<DB, TB>>(
    column: K
  ) => ArrayExpressionBuilder<any>;
}

/**
 * Interface for building SQL expressions with logical operators
 *
 * This interface provides methods for creating binary expressions (column comparisons)
 * and combining them with logical operators like AND, OR, and NOT.
 *
 * @template DB - Database schema type
 * @template TB - Table names union type
 */
export interface ExpressionBuilder<DB, TB extends keyof DB> {
  /**
   * Create a binary expression for column comparison with full type safety
   *
   * Type safety ensures:
   * - Column must exist in the database schema
   * - Value type must match the column type for the given operator
   * - Provides helpful error messages for type mismatches
   *
   * @param column - The column to compare
   * @param operator - The comparison operator
   * @param value - The value to compare against (type-checked against column type)
   * @returns Expression that evaluates to boolean
   */
  <K extends ColumnReference<DB, TB>, Op extends WhereOperator, V>(
    column: K,
    operator: Op,
    value: TypeSafeWhereValue<DB, TB, K, Op, V>
  ): Expression<SqlBool>;

  /**
   * Combine multiple expressions with logical AND
   *
   * @param expressions - Array of boolean expressions to combine
   * @returns Expression that evaluates to boolean
   */
  and(expressions: Expression<SqlBool>[]): Expression<SqlBool>;

  /**
   * Combine multiple expressions with logical OR
   *
   * @param expressions - Array of boolean expressions to combine
   * @returns Expression that evaluates to boolean
   */
  or(expressions: Expression<SqlBool>[]): Expression<SqlBool>;

  /**
   * Create a logical NOT expression
   *
   * @param expression - The boolean expression to negate
   * @returns Expression that evaluates to boolean
   */
  not(expression: Expression<SqlBool>): Expression<SqlBool>;
}

/**
 * Implementation of a SQL expression that wraps an operation node
 */
export class ExpressionImpl<T> implements Expression<T> {
  readonly expressionType?: T;

  constructor(private node: ExpressionNode) {}

  toOperationNode(): ExpressionNode {
    return this.node;
  }
}

/**
 * Create a binary operation expression (column operator value) with type safety
 */
function createBinaryExpression<
  DB,
  TB extends keyof DB,
  K extends ColumnReference<DB, TB>,
  Op extends WhereOperator,
  V
>(
  column: K,
  operator: Op,
  value: TypeSafeWhereValue<DB, TB, K, Op, V>
): Expression<SqlBool> {
  // Parse column reference
  const columnStr = column as string;
  const parts = columnStr.includes(".")
    ? columnStr.split(".")
    : [undefined, columnStr];
  const [table, columnName] =
    parts.length === 2 ? [parts[0], parts[1]] : [undefined, parts[0]];

  // Create column reference node
  const columnNode = ExpressionNodeFactory.createReference(columnName!, table);

  // Create value node - handle arrays, null, and regular values
  let valueNode: ExpressionNode;
  if (value === null) {
    valueNode = ExpressionNodeFactory.createNull();
  } else if (Array.isArray(value)) {
    // Handle arrays for IN/NOT IN operators
    valueNode = ExpressionNodeFactory.createArrayValue(value, true);
  } else {
    valueNode = ExpressionNodeFactory.createValue(value, true);
  }

  // Create binary operation
  const binaryNode = ExpressionNodeFactory.createBinaryOperation(
    columnNode,
    operator,
    valueNode
  );

  // Return expression implementation instance
  return new ExpressionImpl<SqlBool>(binaryNode);
}

/**
 * Create a JSONB operation expression with type safety
 */
function createJsonbExpression<
  DB,
  TB extends keyof DB,
  K extends JsonbColumnOf<DB, TB>,
  Op extends JsonbOperator,
  V
>(
  column: K,
  operator: Op,
  value: ValidJsonbValue<DB, TB, K, Op, V>
): Expression<SqlBool> {
  // Parse column reference
  const columnStr = column as string;
  const parts = columnStr.includes(".")
    ? columnStr.split(".")
    : [undefined, columnStr];
  const [table, columnName] =
    parts.length === 2 ? [parts[0], parts[1]] : [undefined, parts[0]];

  // Create column reference node
  const columnNode = ExpressionNodeFactory.createReference(columnName!, table);

  // Create value node - JSONB operators use different value handling
  const valueNode = ExpressionNodeFactory.createValue(value, true); // true = parameter

  // Create binary operation with JSONB operator
  const binaryNode = ExpressionNodeFactory.createBinaryOperation(
    columnNode,
    operator,
    valueNode
  );

  // Return expression implementation instance
  return new ExpressionImpl<SqlBool>(binaryNode);
}

/**
 * Combine expressions with a logical operator (AND/OR)
 */
function combineExpressions(
  expressions: Expression<SqlBool>[],
  operator: "AND" | "OR"
): Expression<SqlBool> {
  if (expressions.length === 0) {
    // Return true for empty AND, false for empty OR (following SQL conventions)
    const value = operator === "AND" ? true : false;
    const valueNode = ExpressionNodeFactory.createValue(value, false);
    return new ExpressionImpl<SqlBool>(valueNode);
  }

  if (expressions.length === 1) {
    return expressions[0]!;
  }

  // Combine expressions using binary tree structure (left-associative)
  let result = expressions[0]!;
  for (let i = 1; i < expressions.length; i++) {
    const leftNode = result.toOperationNode();
    const rightNode = expressions[i]!.toOperationNode();
    const logicalNode = ExpressionNodeFactory.createLogicalOperation(
      leftNode,
      operator,
      rightNode
    );
    result = new ExpressionImpl<SqlBool>(logicalNode);
  }

  return result;
}

/**
 * Implementation of the ExpressionBuilder interface
 */
export class ExpressionBuilderImpl<DB, TB extends keyof DB> {
  /**
   * Binary expression creation
   */
  call<K extends ColumnReference<DB, TB>, Op extends WhereOperator, V>(
    column: K,
    operator: Op,
    value: TypeSafeWhereValue<DB, TB, K, Op, V>
  ): Expression<SqlBool> {
    return createBinaryExpression<DB, TB, K, Op, V>(column, operator, value);
  }

  /**
   * Combine expressions with AND
   */
  and(expressions: Expression<SqlBool>[]): Expression<SqlBool> {
    return combineExpressions(expressions, "AND");
  }

  /**
   * Combine expressions with OR
   */
  or(expressions: Expression<SqlBool>[]): Expression<SqlBool> {
    return combineExpressions(expressions, "OR");
  }

  /**
   * Create NOT expression
   */
  not(expression: Expression<SqlBool>): Expression<SqlBool> {
    const operandNode = expression.toOperationNode();
    const notNode = ExpressionNodeFactory.createNotOperation(operandNode);
    return new ExpressionImpl<SqlBool>(notNode);
  }
}

/**
 * Create a new expression builder instance
 */
export function createExpressionBuilder<
  DB,
  TB extends keyof DB
>(): ExpressionBuilder<DB, TB> {
  const builder = new ExpressionBuilderImpl<DB, TB>();

  // Create the callable function that also has methods
  const callableBuilder = function <
    K extends ColumnReference<DB, TB>,
    Op extends WhereOperator,
    V
  >(
    column: K,
    operator: Op,
    value: TypeSafeWhereValue<DB, TB, K, Op, V>
  ): Expression<SqlBool> {
    return createBinaryExpression<DB, TB, K, Op, V>(column, operator, value);
  };

  // Add methods to the callable function
  callableBuilder.and = builder.and.bind(builder);
  callableBuilder.or = builder.or.bind(builder);
  callableBuilder.not = builder.not.bind(builder);

  return callableBuilder as ExpressionBuilder<DB, TB>;
}

/**
 * Create standalone helper functions for destructuring
 */
function createStandaloneHelpers<DB, TB extends keyof DB>(
  eb: ExpressionBuilder<DB, TB>
): Omit<ExpressionHelpers<DB, TB>, "eb"> {
  return {
    and: (expressions: Expression<SqlBool>[]) => eb.and(expressions),
    or: (expressions: Expression<SqlBool>[]) => eb.or(expressions),
    not: (expression: Expression<SqlBool>) => eb.not(expression),
    jsonb: <K extends JsonbColumnOf<DB, TB>>(column: K) =>
      createFluentJsonbBuilder(column),
    array: <K extends ArrayColumnOf<DB, TB>>(column: K) =>
      createArrayExpressionBuilder(column),
  };
}

/**
 * Create expression helpers that support destructuring
 */
export function createExpressionHelpers<
  DB,
  TB extends keyof DB
>(): ExpressionHelpers<DB, TB> {
  const eb = createExpressionBuilder<DB, TB>();
  const helpers = createStandaloneHelpers(eb);

  return {
    eb,
    ...helpers,
  };
}
