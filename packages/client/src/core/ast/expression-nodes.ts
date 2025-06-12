// Expression node definitions
// Defines all types of expressions that can appear in SQL queries

import type { OperationNode } from "./operation-node";
import type { ExpressionNode } from "./select-query-node";
import { freeze } from "./utilities";

/**
 * Binary operation node for comparisons and logical operations
 */
export interface BinaryOperationNode extends ExpressionNode {
  readonly kind: "BinaryOperationNode";
  readonly leftOperand: ExpressionNode;
  readonly operator: OperatorNode;
  readonly rightOperand: ExpressionNode;
}

/**
 * Logical operation node for AND/OR combinations
 */
export interface LogicalOperationNode extends ExpressionNode {
  readonly kind: "LogicalOperationNode";
  readonly leftOperand: ExpressionNode;
  readonly operator: LogicalOperatorNode;
  readonly rightOperand: ExpressionNode;
}

/**
 * NOT operation node for logical negation
 */
export interface NotOperationNode extends ExpressionNode {
  readonly kind: "NotOperationNode";
  readonly operand: ExpressionNode;
}

/**
 * Parentheses node for grouping expressions
 */
export interface ParensNode extends ExpressionNode {
  readonly kind: "ParensNode";
  readonly expression: ExpressionNode;
}

/**
 * Reference node for column/table references
 */
export interface ReferenceNode extends ExpressionNode {
  readonly kind: "ReferenceNode";
  readonly table?: string;
  readonly column: string;
}

/**
 * Value node for literal values and parameters
 */
export interface ValueNode extends ExpressionNode {
  readonly kind: "ValueNode";
  readonly value: unknown;
  readonly isParameter?: boolean;
}

/**
 * Array value node for IN clauses
 */
export interface ArrayValueNode extends ExpressionNode {
  readonly kind: "ArrayValueNode";
  readonly values: unknown[];
  readonly isParameter?: boolean;
}

/**
 * Null value node for IS NULL / IS NOT NULL checks
 */
export interface NullValueNode extends ExpressionNode {
  readonly kind: "NullValueNode";
}

/**
 * Raw SQL expression node
 */
export interface RawNode extends ExpressionNode {
  readonly kind: "RawNode";
  readonly sql: string;
  readonly parameters: readonly unknown[];
}

/**
 * Operator node for comparison operators
 */
export interface OperatorNode extends OperationNode {
  readonly kind: "OperatorNode";
  readonly operator: string;
}

/**
 * Logical operator node for AND/OR
 */
export interface LogicalOperatorNode extends OperationNode {
  readonly kind: "LogicalOperatorNode";
  readonly operator: "AND" | "OR";
}

/**
 * Factory for creating expression nodes
 */
export class ExpressionNodeFactory {
  /**
   * Create a reference node for column access
   */
  static createReference(column: string, table?: string): ReferenceNode {
    const base: any = {
      kind: "ReferenceNode" as const,
      column,
    };

    if (table) {
      base.table = table;
    }

    return freeze(base) as ReferenceNode;
  }

  /**
   * Create a value node for parameters and literals
   */
  static createValue(value: unknown, isParameter?: boolean): ValueNode {
    const base: any = {
      kind: "ValueNode" as const,
      value,
    };

    if (isParameter === true) {
      base.isParameter = true;
    }

    return freeze(base) as ValueNode;
  }

  /**
   * Create an array value node for IN clauses
   */
  static createArrayValue(
    values: unknown[],
    isParameter: boolean = true
  ): ArrayValueNode {
    return freeze({
      kind: "ArrayValueNode" as const,
      values,
      isParameter,
    });
  }

  /**
   * Create a null value node for IS NULL checks
   */
  static createNull(): NullValueNode {
    return freeze({
      kind: "NullValueNode" as const,
    });
  }

  /**
   * Create a binary operation node
   */
  static createBinaryOperation(
    left: ExpressionNode,
    operator: string,
    right: ExpressionNode
  ): BinaryOperationNode {
    return freeze({
      kind: "BinaryOperationNode" as const,
      leftOperand: left,
      operator: freeze({
        kind: "OperatorNode" as const,
        operator,
      }) as OperatorNode,
      rightOperand: right,
    });
  }

  /**
   * Create a logical operation node (AND/OR)
   */
  static createLogicalOperation(
    left: ExpressionNode,
    operator: "AND" | "OR",
    right: ExpressionNode
  ): LogicalOperationNode {
    return freeze({
      kind: "LogicalOperationNode" as const,
      leftOperand: left,
      operator: freeze({
        kind: "LogicalOperatorNode" as const,
        operator,
      }) as LogicalOperatorNode,
      rightOperand: right,
    });
  }

  /**
   * Create a raw SQL expression node
   */
  static createRaw(sql: string, parameters: readonly unknown[] = []): RawNode {
    return freeze({
      kind: "RawNode" as const,
      sql,
      parameters,
    });
  }

  /**
   * Create an operator node
   */
  static createOperator(operator: string): OperatorNode {
    return freeze({
      kind: "OperatorNode" as const,
      operator,
    });
  }

  /**
   * Create a logical operator node
   */
  static createLogicalOperator(operator: "AND" | "OR"): LogicalOperatorNode {
    return freeze({
      kind: "LogicalOperatorNode" as const,
      operator,
    });
  }

  /**
   * Create a NOT operation node
   */
  static createNotOperation(operand: ExpressionNode): NotOperationNode {
    return freeze({
      kind: "NotOperationNode" as const,
      operand,
    });
  }

  /**
   * Create a parentheses node for grouping expressions
   */
  static createParens(expression: ExpressionNode): ParensNode {
    return freeze({
      kind: "ParensNode" as const,
      expression,
    });
  }
}

// Common comparison operators
export const OPERATORS = {
  EQUALS: "=",
  NOT_EQUALS: "!=",
  LESS_THAN: "<",
  LESS_THAN_OR_EQUAL: "<=",
  GREATER_THAN: ">",
  GREATER_THAN_OR_EQUAL: ">=",
  LIKE: "LIKE",
  IN: "IN",
  NOT_IN: "NOT IN",
  IS_NULL: "IS NULL",
  IS_NOT_NULL: "IS NOT NULL",
  AND: "AND",
  OR: "OR",
} as const;

export type ComparisonOperator = (typeof OPERATORS)[keyof typeof OPERATORS];
