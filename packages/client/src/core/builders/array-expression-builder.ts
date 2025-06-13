// Array Expression Builder
// Provides fluent API for PostgreSQL array operations with type safety

import type { Expression, SqlBool } from "../types/expression";
import type { ExpressionNode } from "../ast/select-query-node";
import type { ReferenceNode } from "../ast/expression-nodes";
import type {
  ArrayContainmentNode,
  ArrayOverlapNode,
  ArrayScalarNode,
} from "../ast/array-nodes";
import { ExpressionNodeFactory } from "../ast/expression-nodes";
import type {
  ArrayType,
  ArrayElementType,
  ArrayColumnOf,
  ValidArrayValue,
  ValidArrayElement,
} from "../types/array";

/**
 * Array Expression Builder
 *
 * Provides a fluent API for PostgreSQL array operations with full type safety.
 * This builder is returned by the array() helper function and enables chaining
 * of array-specific operations.
 *
 * All operations return Expression<SqlBool> which can be used in WHERE clauses
 * and combined with logical operators (AND, OR, NOT).
 */
export class ArrayExpressionBuilder<
  DB,
  TB extends keyof DB,
  K extends ArrayColumnOf<DB, TB>
> implements Expression<SqlBool>
{
  readonly expressionType?: SqlBool = undefined;

  constructor(private readonly column: ReferenceNode) {}

  /**
   * Convert to AST operation node
   * Note: This should not be called directly - individual operations create their own nodes
   */
  toOperationNode(): ExpressionNode {
    throw new Error(
      "ArrayExpressionBuilder should not be converted to operation node directly. Use specific operations like contains(), overlaps(), etc."
    );
  }

  /**
   * Array contains operation (@>)
   *
   * Tests if the array column contains all elements from the provided array.
   * In PostgreSQL: `column @> ARRAY[values]`
   *
   * @param values - Array of values that should all be contained in the column
   * @returns Expression that can be used in WHERE clauses
   *
   * @example
   * ```typescript
   * // Find users whose tags contain both 'typescript' and 'nodejs'
   * db.selectFrom("users")
   *   .where(({ array }) => array("tags").contains(["typescript", "nodejs"]))
   *   .selectAll()
   *   .execute();
   * ```
   */
  contains(
    values: DB[TB][K] extends ArrayType<infer U>
      ? U extends readonly (infer E)[]
        ? readonly E[]
        : never
      : DB[TB][K] extends readonly (infer E)[]
      ? readonly E[]
      : never
  ): Expression<SqlBool> {
    return new ArrayContainmentExpression(
      this.column,
      "@>",
      ExpressionNodeFactory.createArrayValue([[...values] as unknown[]], true)
    );
  }

  /**
   * Array contained by operation (<@)
   *
   * Tests if all elements of the array column are contained in the provided array.
   * In PostgreSQL: `column <@ ARRAY[values]`
   *
   * @param values - Array that should contain all elements from the column
   * @returns Expression that can be used in WHERE clauses
   *
   * @example
   * ```typescript
   * // Find users whose tags are all contained in a specific set
   * db.selectFrom("users")
   *   .where(({ array }) =>
   *     array("tags").isContainedBy(["frontend", "backend", "database"])
   *   )
   *   .selectAll()
   *   .execute();
   * ```
   */
  isContainedBy(
    values: DB[TB][K] extends ArrayType<infer U>
      ? U extends readonly (infer E)[]
        ? readonly E[]
        : never
      : DB[TB][K] extends readonly (infer E)[]
      ? readonly E[]
      : never
  ): Expression<SqlBool> {
    return new ArrayContainmentExpression(
      this.column,
      "<@",
      ExpressionNodeFactory.createArrayValue([[...values] as unknown[]], true)
    );
  }

  /**
   * Array overlap operation (&&)
   *
   * Tests if the arrays have at least one element in common.
   * In PostgreSQL: `column && ARRAY[values]`
   *
   * @param values - Array to check for overlap with the column
   * @returns Expression that can be used in WHERE clauses
   *
   * @example
   * ```typescript
   * // Find users who have at least one skill from a specific set
   * db.selectFrom("users")
   *   .where(({ array }) => array("skills").overlaps(["react", "vue", "angular"]))
   *   .selectAll()
   *   .execute();
   * ```
   */
  overlaps(
    values: DB[TB][K] extends ArrayType<infer U>
      ? U extends readonly (infer E)[]
        ? readonly E[]
        : never
      : DB[TB][K] extends readonly (infer E)[]
      ? readonly E[]
      : never
  ): Expression<SqlBool> {
    return new ArrayOverlapExpression(
      this.column,
      ExpressionNodeFactory.createArrayValue([[...values] as unknown[]], true)
    );
  }

  /**
   * Array ANY operation
   *
   * Tests if the provided value equals at least one element in the array.
   * In PostgreSQL: `value = ANY(column)`
   *
   * @param value - Value to check for existence in the array
   * @returns Expression that can be used in WHERE clauses
   *
   * @example
   * ```typescript
   * // Find users who have 'admin' permission
   * db.selectFrom("users")
   *   .where(({ array }) => array("permissions").hasAny("admin"))
   *   .selectAll()
   *   .execute();
   * ```
   */
  hasAny(
    value: DB[TB][K] extends ArrayType<infer U>
      ? U extends readonly (infer E)[]
        ? E
        : never
      : DB[TB][K] extends readonly (infer E)[]
      ? E
      : never
  ): Expression<SqlBool> {
    return new ArrayScalarExpression(
      ExpressionNodeFactory.createValue(value, true),
      "ANY",
      this.column
    );
  }

  /**
   * Array ALL operation
   *
   * Tests if the provided value equals all elements in the array.
   * In PostgreSQL: `value = ALL(column)`
   *
   * @param value - Value to check against all array elements
   * @returns Expression that can be used in WHERE clauses
   *
   * @example
   * ```typescript
   * // Find records where all scores equal a specific value
   * db.selectFrom("tests")
   *   .where(({ array }) => array("scores").hasAll(100))
   *   .selectAll()
   *   .execute();
   * ```
   */
  hasAll(
    value: DB[TB][K] extends ArrayType<infer U>
      ? U extends readonly (infer E)[]
        ? E
        : never
      : DB[TB][K] extends readonly (infer E)[]
      ? E
      : never
  ): Expression<SqlBool> {
    return new ArrayScalarExpression(
      ExpressionNodeFactory.createValue(value, true),
      "ALL",
      this.column
    );
  }
}

/**
 * Array Containment Expression
 * Handles @> and <@ operations
 */
class ArrayContainmentExpression implements Expression<SqlBool> {
  readonly expressionType?: SqlBool = undefined;

  constructor(
    private readonly column: ReferenceNode,
    private readonly operator: "@>" | "<@",
    private readonly values: import("../ast/expression-nodes").ArrayValueNode
  ) {}

  toOperationNode(): ArrayContainmentNode {
    return {
      kind: "ArrayContainmentNode",
      column: this.column,
      operator: this.operator,
      values: this.values,
    };
  }
}

/**
 * Array Overlap Expression
 * Handles && operations
 */
class ArrayOverlapExpression implements Expression<SqlBool> {
  readonly expressionType?: SqlBool = undefined;

  constructor(
    private readonly column: ReferenceNode,
    private readonly values: import("../ast/expression-nodes").ArrayValueNode
  ) {}

  toOperationNode(): ArrayOverlapNode {
    return {
      kind: "ArrayOverlapNode",
      column: this.column,
      values: this.values,
    };
  }
}

/**
 * Array Scalar Expression
 * Handles ANY() and ALL() operations
 */
class ArrayScalarExpression implements Expression<SqlBool> {
  readonly expressionType?: SqlBool = undefined;

  constructor(
    private readonly value: import("../ast/expression-nodes").ValueNode,
    private readonly operator: "ANY" | "ALL",
    private readonly column: ReferenceNode
  ) {}

  toOperationNode(): ArrayScalarNode {
    return {
      kind: "ArrayScalarNode",
      value: this.value,
      operator: this.operator,
      column: this.column,
    };
  }
}
