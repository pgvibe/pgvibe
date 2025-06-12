// Array AST Nodes
// Defines AST nodes for PostgreSQL array operations following the established pattern

import type { ExpressionNode } from "./select-query-node";
import type { ReferenceNode, ValueNode } from "./expression-nodes";

/**
 * Array containment operation node for @> and <@ operators
 *
 * Represents PostgreSQL array containment operations:
 * - @> (contains): left array contains all elements of right array
 * - <@ (contained by): left array elements are all contained in right array
 *
 * SQL Examples:
 * - tags @> ARRAY['postgresql', 'nodejs']
 * - permissions <@ ARRAY['read', 'write', 'admin']
 */
export interface ArrayContainmentNode extends ExpressionNode {
  readonly kind: "ArrayContainmentNode";
  readonly column: ReferenceNode;
  readonly operator: "@>" | "<@";
  readonly values: ValueNode;
}

/**
 * Array overlap operation node for && operator
 *
 * Represents PostgreSQL array overlap operation:
 * - && (overlaps): arrays have at least one element in common
 *
 * SQL Example:
 * - categories && ARRAY['tech', 'programming']
 */
export interface ArrayOverlapNode extends ExpressionNode {
  readonly kind: "ArrayOverlapNode";
  readonly column: ReferenceNode;
  readonly values: ValueNode;
}

/**
 * Array scalar operation node for ANY() and ALL() functions
 *
 * Represents PostgreSQL array scalar comparison operations:
 * - ANY(): scalar value equals at least one array element
 * - ALL(): scalar value equals all array elements
 *
 * SQL Examples:
 * - 'admin' = ANY(permissions)
 * - 100 = ALL(scores)
 */
export interface ArrayScalarNode extends ExpressionNode {
  readonly kind: "ArrayScalarNode";
  readonly value: ValueNode;
  readonly operator: "ANY" | "ALL";
  readonly column: ReferenceNode;
}
