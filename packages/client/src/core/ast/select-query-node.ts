// SELECT query node definition
// Represents a SELECT query in the AST with all its clauses

import type { OperationNode } from "./operation-node";
import { freeze, cloneWith } from "./utilities";

/**
 * Represents a SELECT query in the AST.
 * Contains all possible clauses for a SELECT statement.
 */
export interface SelectQueryNode extends OperationNode {
  readonly kind: "SelectQueryNode";
  readonly from?: FromNode;
  readonly joins?: JoinNode[];
  readonly selection?: SelectionNode[];
  readonly where?: WhereNode;
  readonly groupBy?: GroupByNode;
  readonly having?: HavingNode;
  readonly orderBy?: OrderByNode;
  readonly limit?: LimitNode;
  readonly offset?: OffsetNode;
  readonly distinct?: boolean;
}

/**
 * FROM clause node
 */
export interface FromNode extends OperationNode {
  readonly kind: "FromNode";
  readonly table: TableReferenceNode;
}

/**
 * Selection node for individual columns/expressions in SELECT clause
 */
export interface SelectionNode extends OperationNode {
  readonly kind: "SelectionNode";
  readonly expression: ExpressionNode;
  readonly alias?: string;
}

/**
 * WHERE clause node
 */
export interface WhereNode extends OperationNode {
  readonly kind: "WhereNode";
  readonly expression: ExpressionNode;
}

/**
 * Base interface for expressions (column refs, values, operations, etc.)
 */
export interface ExpressionNode extends OperationNode {
  // Will be extended by specific expression types
}

/**
 * Table reference node for referencing tables
 */
export interface TableReferenceNode extends OperationNode {
  readonly kind: "TableReferenceNode";
  readonly table: string;
  readonly alias?: string;
}

// Placeholder interfaces for future implementation
export interface GroupByNode extends OperationNode {
  readonly kind: "GroupByNode";
}

export interface HavingNode extends OperationNode {
  readonly kind: "HavingNode";
}

export interface OrderByNode extends OperationNode {
  readonly kind: "OrderByNode";
  readonly items: OrderByItemNode[];
}

export interface OrderByItemNode extends OperationNode {
  readonly kind: "OrderByItemNode";
  readonly expression: ExpressionNode;
  readonly direction?: "ASC" | "DESC";
}

export interface LimitNode extends OperationNode {
  readonly kind: "LimitNode";
  readonly limit: number;
}

export interface OffsetNode extends OperationNode {
  readonly kind: "OffsetNode";
  readonly offset: number;
}

/**
 * JOIN clause node
 */
export interface JoinNode extends OperationNode {
  readonly kind: "JoinNode";
  readonly joinType:
    | "INNER JOIN"
    | "LEFT JOIN"
    | "RIGHT JOIN"
    | "FULL JOIN"
    | "CROSS JOIN";
  readonly table: TableReferenceNode;
  readonly on?: OnNode;
}

/**
 * ON clause node for JOIN conditions
 */
export interface OnNode extends OperationNode {
  readonly kind: "OnNode";
  readonly expression: ExpressionNode;
}

/**
 * Factory and utility methods for SelectQueryNode
 */
export class SelectQueryNode {
  /**
   * Creates a new empty SELECT query node
   */
  static create(): SelectQueryNode {
    return freeze({
      kind: "SelectQueryNode" as const,
    });
  }

  /**
   * Creates a new SELECT query node with a FROM clause
   */
  static createWithFrom(table: string, alias?: string): SelectQueryNode {
    const tableRefBase: any = {
      kind: "TableReferenceNode" as const,
      table,
    };

    if (alias) {
      tableRefBase.alias = alias;
    }

    const fromNode: FromNode = freeze({
      kind: "FromNode" as const,
      table: freeze(tableRefBase) as TableReferenceNode,
    });

    return freeze({
      kind: "SelectQueryNode" as const,
      from: fromNode,
    });
  }

  /**
   * Clones a SELECT query node with additional selections
   */
  static cloneWithSelection(
    node: SelectQueryNode,
    selections: SelectionNode[]
  ): SelectQueryNode {
    return cloneWith(node, {
      selection: node.selection
        ? [...node.selection, ...selections]
        : selections,
    });
  }

  /**
   * Clones a SELECT query node with a WHERE clause
   * If there's already a WHERE clause, combines them with AND
   */
  static cloneWithWhere(
    node: SelectQueryNode,
    where: WhereNode
  ): SelectQueryNode {
    if (node.where) {
      // Combine existing WHERE with new WHERE using AND
      const andExpression: import("./expression-nodes").LogicalOperationNode = {
        kind: "LogicalOperationNode" as const,
        leftOperand: node.where.expression,
        operator: {
          kind: "LogicalOperatorNode" as const,
          operator: "AND",
        },
        rightOperand: where.expression,
      };

      const combinedWhere: WhereNode = {
        kind: "WhereNode" as const,
        expression: andExpression,
      };

      return cloneWith(node, { where: combinedWhere });
    } else {
      // No existing WHERE clause, just add the new one
      return cloneWith(node, { where });
    }
  }

  /**
   * Clones a SELECT query node with a FROM clause
   */
  static cloneWithFrom(node: SelectQueryNode, from: FromNode): SelectQueryNode {
    return cloneWith(node, { from });
  }

  /**
   * Clones a SELECT query node with an ORDER BY clause
   * If there's already an ORDER BY clause, appends the new items
   */
  static cloneWithOrderBy(
    node: SelectQueryNode,
    orderBy: OrderByNode
  ): SelectQueryNode {
    if (node.orderBy) {
      // Combine existing ORDER BY items with new items
      const combinedOrderBy: OrderByNode = {
        kind: "OrderByNode" as const,
        items: [...node.orderBy.items, ...orderBy.items],
      };
      return cloneWith(node, { orderBy: combinedOrderBy });
    } else {
      // No existing ORDER BY clause, just add the new one
      return cloneWith(node, { orderBy });
    }
  }

  /**
   * Clones a SELECT query node with a LIMIT clause
   */
  static cloneWithLimit(
    node: SelectQueryNode,
    limit: LimitNode
  ): SelectQueryNode {
    return cloneWith(node, { limit });
  }

  /**
   * Clones a SELECT query node with an OFFSET clause
   */
  static cloneWithOffset(
    node: SelectQueryNode,
    offset: OffsetNode
  ): SelectQueryNode {
    return cloneWith(node, { offset });
  }

  /**
   * Clones a SELECT query node with a JOIN clause
   */
  static cloneWithJoin(node: SelectQueryNode, join: JoinNode): SelectQueryNode {
    return cloneWith(node, {
      joins: node.joins ? [...node.joins, join] : [join],
    });
  }
}
