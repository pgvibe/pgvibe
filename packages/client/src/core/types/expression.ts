// Expression types for the query builder
// Defines the core interfaces for type-safe SQL expressions

import type { ExpressionNode } from "../ast/select-query-node";

/**
 * Boolean type for SQL expressions that evaluate to boolean values
 */
export type SqlBool = boolean;

/**
 * Base interface for all SQL expressions
 *
 * This interface represents an arbitrary SQL expression with a specific type.
 * All query builders and expression builders implement this interface.
 *
 * @template T - The TypeScript type that this expression evaluates to
 */
export interface Expression<T> {
  /**
   * Type marker property for expression type inference
   * This getter is needed for TypeScript's structural typing to work correctly.
   * It ensures that Expression<string> is not assignable to Expression<number>.
   *
   * Always return undefined from this getter.
   */
  readonly expressionType?: T;

  /**
   * Convert this expression to an AST operation node
   * This method is used internally by the query compiler to generate SQL.
   */
  toOperationNode(): ExpressionNode;
}
