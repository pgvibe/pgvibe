// INSERT query node definition
// Represents an INSERT query in the AST with all its clauses

import type { OperationNode } from "./operation-node";
import { freeze, cloneWith } from "./utilities";
import type { ExpressionNode } from "./select-query-node";

/**
 * Represents an INSERT query in the AST.
 * Contains all possible clauses for an INSERT statement.
 */
export interface InsertQueryNode extends OperationNode {
  readonly kind: "InsertQueryNode";
  readonly into?: IntoNode;
  readonly values?: ValuesNode;
  readonly returning?: ReturningNode;
  readonly onConflict?: OnConflictNode;
}

/**
 * INTO clause node for specifying the target table
 * Now supports table aliases for enhanced INSERT operations
 */
export interface IntoNode extends OperationNode {
  readonly kind: "IntoNode";
  readonly table: string;
  readonly alias?: string; // Optional alias for the table (e.g., "users as u")
}

/**
 * VALUES clause node for specifying the data to insert
 * Supports both single-row and bulk inserts
 */
export interface ValuesNode extends OperationNode {
  readonly kind: "ValuesNode";
  readonly values: ValueRowNode[];
}

/**
 * Individual row of values for INSERT
 */
export interface ValueRowNode extends OperationNode {
  readonly kind: "ValueRowNode";
  readonly values: ColumnValueNode[];
}

/**
 * Column-value pair for INSERT
 */
export interface ColumnValueNode extends OperationNode {
  readonly kind: "ColumnValueNode";
  readonly column: string;
  readonly value: ExpressionNode;
}

/**
 * RETURNING clause node for specifying what to return from INSERT
 */
export interface ReturningNode extends OperationNode {
  readonly kind: "ReturningNode";
  readonly selections: ExpressionNode[];
}

/**
 * ON CONFLICT clause node for conflict resolution
 */
export interface OnConflictNode extends OperationNode {
  readonly kind: "OnConflictNode";
  readonly columns?: string[];
  readonly constraint?: string;
  readonly indexExpression?: ExpressionNode;
  readonly indexWhere?: ExpressionNode;
  readonly updates?: ColumnUpdateNode[];
  readonly updateWhere?: ExpressionNode;
  readonly doNothing?: boolean;
}

/**
 * Column update for ON CONFLICT DO UPDATE
 */
export interface ColumnUpdateNode extends OperationNode {
  readonly kind: "ColumnUpdateNode";
  readonly column: string;
  readonly value: ExpressionNode;
}

/**
 * Factory and utility methods for InsertQueryNode
 */
export class InsertQueryNode {
  /**
   * Creates a new empty INSERT query node
   */
  static create(): InsertQueryNode {
    return freeze({
      kind: "InsertQueryNode" as const,
    });
  }

  /**
   * Creates a new INSERT query node with INTO clause
   * Now supports table aliases
   */
  static createWithInto(table: string, alias?: string): InsertQueryNode {
    const intoNode: IntoNode = freeze({
      kind: "IntoNode" as const,
      table,
      ...(alias && { alias }), // Include alias only if provided
    });

    return freeze({
      kind: "InsertQueryNode" as const,
      into: intoNode,
    });
  }

  /**
   * Clones an INSERT query node with VALUES clause
   */
  static cloneWithValues(
    node: InsertQueryNode,
    values: ValuesNode
  ): InsertQueryNode {
    return cloneWith(node, { values });
  }

  /**
   * Clones an INSERT query node with RETURNING clause
   */
  static cloneWithReturning(
    node: InsertQueryNode,
    returning: ReturningNode
  ): InsertQueryNode {
    return cloneWith(node, { returning });
  }

  /**
   * Clones an INSERT query node with ON CONFLICT clause
   */
  static cloneWithOnConflict(
    node: InsertQueryNode,
    onConflict: OnConflictNode
  ): InsertQueryNode {
    return cloneWith(node, { onConflict });
  }

  /**
   * Creates a VALUES node from data objects
   */
  static createValuesNode(data: Record<string, unknown>[]): ValuesNode {
    if (data.length === 0) {
      throw new Error("Cannot create VALUES node with empty data array");
    }

    // Get column names from the first object
    const columns = Object.keys(data[0]!);

    const valueRows = data.map((row): ValueRowNode => {
      const values = columns.map(
        (column): ColumnValueNode => ({
          kind: "ColumnValueNode" as const,
          column,
          value: {
            kind: "ValueNode" as const,
            value: row[column],
            isParameter: true,
          } as ExpressionNode,
        })
      );

      return freeze({
        kind: "ValueRowNode" as const,
        values,
      });
    });

    return freeze({
      kind: "ValuesNode" as const,
      values: valueRows,
    });
  }

  /**
   * Creates a RETURNING node for specific columns
   * Now supports alias-qualified column references (e.g., "u.id", "users.name")
   */
  static createReturningNode(columns: string[]): ReturningNode {
    const selections = columns.map((column): ExpressionNode => {
      // Parse column reference to handle table.column format
      const dotIndex = column.indexOf(".");
      if (dotIndex > 0) {
        const table = column.substring(0, dotIndex);
        const columnName = column.substring(dotIndex + 1);
        return {
          kind: "ReferenceNode" as const,
          table,
          column: columnName,
        } as ExpressionNode;
      } else {
        return {
          kind: "ReferenceNode" as const,
          column,
        } as ExpressionNode;
      }
    });

    return freeze({
      kind: "ReturningNode" as const,
      selections,
    });
  }

  /**
   * Creates a RETURNING node for all columns (*)
   */
  static createReturningAllNode(): ReturningNode {
    return freeze({
      kind: "ReturningNode" as const,
      selections: [
        {
          kind: "ReferenceNode" as const,
          column: "*",
        } as ExpressionNode,
      ],
    });
  }

  /**
   * Creates an ON CONFLICT DO NOTHING node
   */
  static createOnConflictDoNothingNode(columns: string[]): OnConflictNode {
    return freeze({
      kind: "OnConflictNode" as const,
      columns,
      doNothing: true,
    });
  }

  /**
   * Creates an ON CONFLICT DO UPDATE node
   */
  static createOnConflictDoUpdateNode(
    columns: string[],
    updates: Record<string, unknown>
  ): OnConflictNode {
    const updateNodes = Object.entries(updates).map(
      ([column, value]): ColumnUpdateNode =>
        freeze({
          kind: "ColumnUpdateNode" as const,
          column,
          value: {
            kind: "ValueNode" as const,
            value,
            isParameter: true,
          } as ExpressionNode,
        })
    );

    return freeze({
      kind: "OnConflictNode" as const,
      columns,
      updates: updateNodes,
    });
  }
}
