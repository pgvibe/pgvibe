// PostgreSQL query compiler implementation
// Direct PostgreSQL SQL generation without base class abstraction

import type { RootOperationNode, OperationNode } from "../ast/operation-node";
import type {
  SelectQueryNode,
  FromNode,
  SelectionNode,
  WhereNode,
  TableReferenceNode,
  OrderByNode,
  OrderByItemNode,
  LimitNode,
  OffsetNode,
  JoinNode,
  OnNode,
} from "../ast/select-query-node";
import type {
  InsertQueryNode,
  IntoNode,
  ValuesNode,
  ValueRowNode,
  ColumnValueNode,
  ReturningNode,
  OnConflictNode,
  ColumnUpdateNode,
} from "../ast/insert-query-node";
import type {
  BinaryOperationNode,
  ReferenceNode,
  ValueNode,
  RawNode,
  OperatorNode,
} from "../ast/expression-nodes";
import type {
  LogicalOperationNode,
  ArrayValueNode,
  NullValueNode,
  LogicalOperatorNode,
} from "../ast/expression-nodes";
import type {
  ArrayContainmentNode,
  ArrayOverlapNode,
  ArrayScalarNode,
} from "../ast/array-nodes";
import type { PostgreSQLCompiledQuery } from "./postgres-driver";

/**
 * Direct PostgreSQL query compiler
 * Optimized for PostgreSQL without generic abstractions
 */
export class PostgresQueryCompiler {
  private sql: string[] = [];
  private parameters: unknown[] = [];

  /**
   * Compile an AST node into PostgreSQL SQL with parameters
   */
  compileQuery<R = unknown>(
    node: RootOperationNode
  ): PostgreSQLCompiledQuery<R> {
    // Reset state
    this.sql = [];
    this.parameters = [];

    // Visit the root node
    this.visitNode(node);

    return {
      sql: this.sql.join(""),
      parameters: [...this.parameters],
      query: node,
    };
  }

  /**
   * Main visitor method - dispatches to specific visit methods
   */
  private visitNode(node: OperationNode): void {
    switch (node.kind) {
      case "SelectQueryNode":
        this.visitSelectQuery(node as SelectQueryNode);
        break;
      case "InsertQueryNode":
        this.visitInsertQuery(node as InsertQueryNode);
        break;
      case "FromNode":
        this.visitFrom(node as FromNode);
        break;
      case "IntoNode":
        this.visitInto(node as IntoNode);
        break;
      case "ValuesNode":
        this.visitValues(node as ValuesNode);
        break;
      case "ValueRowNode":
        this.visitValueRow(node as ValueRowNode);
        break;
      case "ColumnValueNode":
        this.visitColumnValue(node as ColumnValueNode);
        break;
      case "ReturningNode":
        this.visitReturning(node as ReturningNode);
        break;
      case "OnConflictNode":
        this.visitOnConflict(node as OnConflictNode);
        break;
      case "ColumnUpdateNode":
        this.visitColumnUpdate(node as ColumnUpdateNode);
        break;
      case "SelectionNode":
        this.visitSelection(node as SelectionNode);
        break;
      case "WhereNode":
        this.visitWhere(node as WhereNode);
        break;
      case "OrderByNode":
        this.visitOrderBy(node as OrderByNode);
        break;
      case "OrderByItemNode":
        this.visitOrderByItem(node as OrderByItemNode);
        break;
      case "LimitNode":
        this.visitLimit(node as LimitNode);
        break;
      case "OffsetNode":
        this.visitOffset(node as OffsetNode);
        break;
      case "JoinNode":
        this.visitJoin(node as JoinNode);
        break;
      case "OnNode":
        this.visitOn(node as OnNode);
        break;
      case "TableReferenceNode":
        this.visitTableReference(node as TableReferenceNode);
        break;
      case "BinaryOperationNode":
        this.visitBinaryOperation(node as BinaryOperationNode);
        break;
      case "LogicalOperationNode":
        this.visitLogicalOperation(node as LogicalOperationNode);
        break;
      case "ReferenceNode":
        this.visitReference(node as ReferenceNode);
        break;
      case "ValueNode":
        this.visitValue(node as ValueNode);
        break;
      case "ArrayValueNode":
        this.visitArrayValue(node as ArrayValueNode);
        break;
      case "NullValueNode":
        this.visitNullValue(node as NullValueNode);
        break;
      case "RawNode":
        this.visitRaw(node as RawNode);
        break;
      case "OperatorNode":
        this.visitOperator(node as OperatorNode);
        break;
      case "LogicalOperatorNode":
        this.visitLogicalOperator(node as LogicalOperatorNode);
        break;
      case "NotOperationNode":
        this.visitNotOperation(
          node as import("../ast/expression-nodes").NotOperationNode
        );
        break;
      case "ParensNode":
        this.visitParens(node as import("../ast/expression-nodes").ParensNode);
        break;
      case "ArrayContainmentNode":
        this.visitArrayContainment(node as ArrayContainmentNode);
        break;
      case "ArrayOverlapNode":
        this.visitArrayOverlap(node as ArrayOverlapNode);
        break;
      case "ArrayScalarNode":
        this.visitArrayScalar(node as ArrayScalarNode);
        break;
      default:
        throw new Error(`Unknown node kind: ${(node as any).kind}`);
    }
  }

  /**
   * Visit a SELECT query node
   */
  private visitSelectQuery(node: SelectQueryNode): void {
    this.append("SELECT ");

    if (node.distinct) {
      this.append("DISTINCT ");
    }

    // Handle selections
    if (node.selection && node.selection.length > 0) {
      this.visitNodeList(node.selection, ", ");
    } else {
      this.append("*");
    }

    // Handle FROM clause
    if (node.from) {
      this.append(" ");
      this.visitNode(node.from);
    }

    // Handle JOIN clauses
    if (node.joins) {
      for (const join of node.joins) {
        this.append(" ");
        this.visitNode(join);
      }
    }

    // Handle WHERE clause
    if (node.where) {
      this.append(" ");
      this.visitNode(node.where);
    }

    // Handle ORDER BY clause
    if (node.orderBy) {
      this.append(" ");
      this.visitNode(node.orderBy);
    }

    // Handle LIMIT clause
    if (node.limit) {
      this.append(" ");
      this.visitNode(node.limit);
    }

    // Handle OFFSET clause
    if (node.offset) {
      this.append(" ");
      this.visitNode(node.offset);
    }
  }

  /**
   * Visit a FROM clause node
   */
  private visitFrom(node: FromNode): void {
    this.append("FROM ");
    this.visitNode(node.table);
  }

  /**
   * Visit a selection node
   */
  private visitSelection(node: SelectionNode): void {
    this.visitNode(node.expression);
  }

  /**
   * Visit a WHERE clause node
   */
  private visitWhere(node: WhereNode): void {
    this.append("WHERE ");
    this.visitNode(node.expression);
  }

  /**
   * Visit an ORDER BY clause node
   */
  private visitOrderBy(node: OrderByNode): void {
    this.append("ORDER BY ");
    this.visitNodeList(node.items, ", ");
  }

  /**
   * Visit an ORDER BY item node
   */
  private visitOrderByItem(node: OrderByItemNode): void {
    this.visitNode(node.expression);
    if (node.direction) {
      this.append(` ${node.direction.toUpperCase()}`);
    }
  }

  /**
   * Visit a LIMIT clause node
   */
  private visitLimit(node: LimitNode): void {
    this.append("LIMIT ");
    this.append(node.limit.toString());
  }

  /**
   * Visit an OFFSET clause node
   */
  private visitOffset(node: OffsetNode): void {
    this.append("OFFSET ");
    this.append(node.offset.toString());
  }

  /**
   * Visit a JOIN clause node
   */
  private visitJoin(node: JoinNode): void {
    this.append(`${node.joinType} `);
    this.visitNode(node.table);
    if (node.on) {
      this.append(" ");
      this.visitNode(node.on);
    }
  }

  /**
   * Visit an ON clause node
   */
  private visitOn(node: OnNode): void {
    this.append("ON ");
    this.visitNode(node.expression);
  }

  /**
   * Visit a table reference node
   */
  private visitTableReference(node: TableReferenceNode): void {
    this.appendIdentifier(node.table);
    if (node.alias) {
      this.append(" AS ");
      this.appendIdentifier(node.alias);
    }
  }

  /**
   * Visit a binary operation node
   */
  private visitBinaryOperation(node: BinaryOperationNode): void {
    this.visitNode(node.leftOperand);
    this.append(" ");
    this.visitNode(node.operator);
    this.append(" ");

    // Special handling for IN and NOT IN operations - they need parentheses around array values
    if (
      node.operator.kind === "OperatorNode" &&
      (node.operator.operator.toUpperCase() === "IN" ||
        node.operator.operator.toUpperCase() === "NOT IN")
    ) {
      if (node.rightOperand.kind === "ArrayValueNode") {
        this.append("(");
        this.visitNode(node.rightOperand);
        this.append(")");
      } else {
        this.visitNode(node.rightOperand);
      }
    } else {
      this.visitNode(node.rightOperand);
    }
  }

  /**
   * Visit a logical operation node
   * Adds parentheses when needed for clarity and operator precedence
   */
  private visitLogicalOperation(node: LogicalOperationNode): void {
    const needsParens = this.shouldWrapLogicalOperation(node);

    if (needsParens) {
      this.append("(");
    }

    // Handle left operand
    this.visitLogicalOperand(node.leftOperand, node.operator.operator, "left");
    this.append(" ");
    this.visitNode(node.operator);
    this.append(" ");
    // Handle right operand
    this.visitLogicalOperand(
      node.rightOperand,
      node.operator.operator,
      "right"
    );

    if (needsParens) {
      this.append(")");
    }
  }

  /**
   * Visit an operand of a logical operation, adding parentheses if needed
   */
  private visitLogicalOperand(
    operand: import("../ast/select-query-node").ExpressionNode,
    parentOperator: "AND" | "OR",
    position: "left" | "right"
  ): void {
    // If operand is a logical operation with different operator, wrap in parentheses
    if (this.isLogicalOperation(operand)) {
      const logicalOperand = operand as LogicalOperationNode;
      if (logicalOperand.operator.operator !== parentOperator) {
        this.append("(");
        this.visitNode(operand);
        this.append(")");
        return;
      }
    }

    // Otherwise, visit normally
    this.visitNode(operand);
  }

  /**
   * Determine if a logical operation needs parentheses
   * We add parentheses for:
   * 1. Mixed AND/OR operations (for precedence clarity)
   * 2. Nested logical operations (for grouping clarity)
   * We skip parentheses for:
   * 1. Simple same-operator chains (e.g., a AND b AND c)
   */
  private shouldWrapLogicalOperation(node: LogicalOperationNode): boolean {
    const leftIsSimple = this.isSimpleBinaryOperation(node.leftOperand);
    const rightIsSimple = this.isSimpleBinaryOperation(node.rightOperand);
    const leftIsLogical = this.isLogicalOperation(node.leftOperand);
    const rightIsLogical = this.isLogicalOperation(node.rightOperand);

    // If both sides are simple binary operations, we can skip outer parentheses
    // This gives us clean: a = 1 AND b = 2 AND c = 3
    if (leftIsSimple && rightIsSimple) {
      return false;
    }

    // For left-hand logical operations combined with simple right-hand operations,
    // we need to check if the operators match to decide on parentheses
    if (leftIsLogical && rightIsSimple) {
      const leftLogical = node.leftOperand as LogicalOperationNode;
      // If same operator and left side is also simple operations, we can skip parens
      // This allows: (a = 1 AND b = 2) AND c = 3 -> a = 1 AND b = 2 AND c = 3
      if (
        leftLogical.operator === node.operator &&
        this.isSimpleBinaryOperation(leftLogical.leftOperand) &&
        this.isSimpleBinaryOperation(leftLogical.rightOperand)
      ) {
        return false;
      }
    }

    // Special case: if the right operand is a logical operation with different operator,
    // we need parentheses to preserve precedence
    // Example: active = 1 AND (id < 2 OR id > 3)
    if (leftIsSimple && rightIsLogical) {
      const rightLogical = node.rightOperand as LogicalOperationNode;
      // If operators are different, we need parentheses around the right side
      if (rightLogical.operator !== node.operator) {
        return true;
      }
    }

    // In all other cases (mixed operators, complex nesting), use parentheses
    return true;
  }

  /**
   * Check if an expression is a simple binary operation (column op value)
   */
  private isSimpleBinaryOperation(
    node: import("../ast/select-query-node").ExpressionNode
  ): boolean {
    return node.kind === "BinaryOperationNode";
  }

  /**
   * Check if an expression is a logical operation (AND/OR)
   */
  private isLogicalOperation(
    node: import("../ast/select-query-node").ExpressionNode
  ): boolean {
    return node.kind === "LogicalOperationNode";
  }

  /**
   * Visit a reference node (column/table reference)
   */
  private visitReference(node: ReferenceNode): void {
    if (node.table) {
      this.appendIdentifier(node.table);
      this.append(".");
    }
    this.appendIdentifier(node.column);
  }

  /**
   * Visit a value node (parameter)
   */
  private visitValue(node: ValueNode): void {
    if (node.isParameter) {
      this.appendParameter(node.value);
    } else {
      // For non-parameter values, convert directly to SQL
      if (typeof node.value === "string") {
        this.append(`'${node.value.replace(/'/g, "''")}'`);
      } else if (node.value === null) {
        this.append("NULL");
      } else {
        this.append(String(node.value));
      }
    }
  }

  /**
   * Visit an array value node
   */
  private visitArrayValue(node: ArrayValueNode): void {
    if (node.isParameter) {
      // Check if this is a single array parameter (new array operations style)
      if (node.values.length === 1 && Array.isArray(node.values[0])) {
        // Single array parameter - expand the array elements as individual parameters
        const arrayValue = node.values[0] as unknown[];

        // Handle empty arrays - they will be handled by the parent visitor
        if (arrayValue.length === 0) {
          // Empty array - no parameters to add, type casting handled by parent
          return;
        }

        for (let i = 0; i < arrayValue.length; i++) {
          if (i > 0) {
            this.append(", ");
          }
          this.appendParameter(arrayValue[i]);
        }
      } else {
        // Multiple individual parameters (legacy IN/NOT IN style)
        for (let i = 0; i < node.values.length; i++) {
          if (i > 0) {
            this.append(", ");
          }
          this.appendParameter(node.values[i]);
        }
      }
    } else {
      for (let i = 0; i < node.values.length; i++) {
        if (i > 0) {
          this.append(", ");
        }
        if (typeof node.values[i] === "string") {
          this.append(`'${String(node.values[i]).replace(/'/g, "''")}'`);
        } else {
          this.append(String(node.values[i]));
        }
      }
    }
  }

  /**
   * Visit a null value node
   */
  private visitNullValue(node: NullValueNode): void {
    this.append("NULL");
  }

  /**
   * Visit a raw SQL node
   */
  private visitRaw(node: RawNode): void {
    // Add all parameters from the raw node first
    const parameterOffset = this.parameters.length;
    for (const param of node.parameters) {
      this.parameters.push(param);
    }

    // Replace the parameter placeholders in the raw SQL to match our current parameter numbering
    let sql = node.sql;
    for (let i = 0; i < node.parameters.length; i++) {
      const oldPlaceholder = `$${i + 1}`;
      const newPlaceholder = `$${parameterOffset + i + 1}`;
      sql = sql.replace(oldPlaceholder, newPlaceholder);
    }

    this.append(sql);
  }

  /**
   * Visit an operator node
   */
  private visitOperator(node: OperatorNode): void {
    // Convert operators to uppercase for SQL standard compliance
    this.append(node.operator.toUpperCase());
  }

  /**
   * Visit a logical operator node
   */
  private visitLogicalOperator(node: LogicalOperatorNode): void {
    this.append(node.operator.toUpperCase());
  }

  /**
   * Visit a NOT operation node
   */
  private visitNotOperation(
    node: import("../ast/expression-nodes").NotOperationNode
  ): void {
    this.append("NOT (");
    this.visitNode(node.operand);
    this.append(")");
  }

  /**
   * Visit a parentheses node
   */
  private visitParens(
    node: import("../ast/expression-nodes").ParensNode
  ): void {
    this.append("(");
    this.visitNode(node.expression);
    this.append(")");
  }

  /**
   * Visit an array containment node (@> or <@ operators)
   */
  private visitArrayContainment(node: ArrayContainmentNode): void {
    this.visitNode(node.column);
    this.append(` ${node.operator} `);
    this.append("ARRAY[");
    this.visitNode(node.values);
    this.append("]");

    // Add type casting for empty arrays to avoid PostgreSQL type inference issues
    if (
      node.values.kind === "ArrayValueNode" &&
      (node.values.values.length === 0 ||
        (node.values.values.length === 1 &&
          Array.isArray(node.values.values[0]) &&
          node.values.values[0].length === 0))
    ) {
      this.append("::text[]");
    }
  }

  /**
   * Visit an array overlap node (&& operator)
   */
  private visitArrayOverlap(node: ArrayOverlapNode): void {
    this.visitNode(node.column);
    this.append(" && ");
    this.append("ARRAY[");
    this.visitNode(node.values);
    this.append("]");

    // Add type casting for empty arrays to avoid PostgreSQL type inference issues
    if (
      node.values.kind === "ArrayValueNode" &&
      (node.values.values.length === 0 ||
        (node.values.values.length === 1 &&
          Array.isArray(node.values.values[0]) &&
          node.values.values[0].length === 0))
    ) {
      this.append("::text[]");
    }
  }

  /**
   * Visit an array scalar node (ANY/ALL functions)
   */
  private visitArrayScalar(node: ArrayScalarNode): void {
    this.visitNode(node.value);
    this.append(" = ");
    this.append(`${node.operator}(`);
    this.visitNode(node.column);
    this.append(")");
  }

  /**
   * Visit a list of nodes with separator
   */
  private visitNodeList(
    nodes: (OperationNode | undefined)[],
    separator: string
  ): void {
    const validNodes = nodes.filter(
      (node): node is OperationNode => node !== undefined
    );

    for (let i = 0; i < validNodes.length; i++) {
      if (i > 0) {
        this.append(separator);
      }
      const node = validNodes[i];
      if (node) {
        this.visitNode(node);
      }
    }
  }

  /**
   * Append text to SQL
   */
  private append(text: string): void {
    this.sql.push(text);
  }

  /**
   * Add parameter and return placeholder
   */
  private appendParameter(value: unknown): void {
    this.parameters.push(value);
    this.append(this.getCurrentParameterPlaceholder());
  }

  /**
   * PostgreSQL uses $1, $2, etc. for parameter placeholders
   */
  private getCurrentParameterPlaceholder(): string {
    return `$${this.parameters.length}`;
  }

  /**
   * PostgreSQL uses double quotes for identifier quoting
   */
  private appendIdentifier(identifier: string): void {
    // Special case for * (wildcard) - never quote it
    if (identifier === "*") {
      this.append(identifier);
      return;
    }

    // Check if identifier needs quoting (contains spaces, reserved words, etc.)
    if (this.needsQuoting(identifier)) {
      this.append(`"${identifier.replace(/"/g, '""')}"`);
    } else {
      this.append(identifier);
    }
  }

  /**
   * Check if an identifier needs quoting in PostgreSQL
   */
  private needsQuoting(identifier: string): boolean {
    // Check for spaces, special characters, or reserved words
    if (/[^a-zA-Z0-9_]/.test(identifier)) {
      return true;
    }

    // Check if starts with digit
    if (/^[0-9]/.test(identifier)) {
      return true;
    }

    // Check for PostgreSQL reserved words (simplified list)
    const reservedWords = new Set([
      "select",
      "from",
      "where",
      "join",
      "inner",
      "left",
      "right",
      "outer",
      "on",
      "as",
      "and",
      "or",
      "not",
      "in",
      "exists",
      "between",
      "like",
      "is",
      "null",
      "true",
      "false",
      "case",
      "when",
      "then",
      "else",
      "end",
      "group",
      "by",
      "having",
      "order",
      "limit",
      "offset",
      "distinct",
      "union",
      "all",
      "except",
      "intersect",
      "with",
      "recursive",
      "insert",
      "into",
      "values",
      "update",
      "set",
      "delete",
      "create",
      "table",
      "alter",
      "drop",
      "index",
      "view",
      "trigger",
      "function",
      "procedure",
      "schema",
      "database",
      "user",
      "role",
      "grant",
      "revoke",
    ]);

    return reservedWords.has(identifier.toLowerCase());
  }

  /**
   * Visit an INSERT query node
   */
  private visitInsertQuery(node: InsertQueryNode): void {
    this.append("INSERT");

    // Handle INTO clause
    if (node.into) {
      this.append(" ");
      this.visitNode(node.into);
    }

    // Handle VALUES clause
    if (node.values) {
      this.append(" ");
      this.visitNode(node.values);
    }

    // Handle ON CONFLICT clause
    if (node.onConflict) {
      this.append(" ");
      this.visitNode(node.onConflict);
    }

    // Handle RETURNING clause
    if (node.returning) {
      this.append(" ");
      this.visitNode(node.returning);
    }
  }

  /**
   * Visit an INTO node
   */
  private visitInto(node: IntoNode): void {
    this.append("INTO ");
    this.appendIdentifier(node.table);
  }

  /**
   * Visit a VALUES node
   */
  private visitValues(node: ValuesNode): void {
    if (node.values.length === 0) {
      throw new Error("VALUES clause cannot be empty");
    }

    // Get column names from the first row
    const firstRow = node.values[0];
    if (!firstRow || firstRow.values.length === 0) {
      throw new Error("VALUE row cannot be empty");
    }

    // Generate column list
    this.append("(");
    const columnNames = firstRow.values.map((colVal) => colVal.column);
    columnNames.forEach((column, index) => {
      if (index > 0) this.append(", ");
      this.appendIdentifier(column);
    });
    this.append(") VALUES ");

    // Generate VALUES rows
    this.visitNodeList(node.values, ", ");
  }

  /**
   * Visit a VALUE ROW node
   */
  private visitValueRow(node: ValueRowNode): void {
    this.append("(");
    this.visitNodeList(
      node.values.map((colVal) => colVal.value),
      ", "
    );
    this.append(")");
  }

  /**
   * Visit a COLUMN VALUE node
   */
  private visitColumnValue(node: ColumnValueNode): void {
    // This shouldn't be called directly, as column values are handled in visitValueRow
    this.visitNode(node.value);
  }

  /**
   * Visit a RETURNING node
   */
  private visitReturning(node: ReturningNode): void {
    this.append("RETURNING ");
    this.visitNodeList(node.selections, ", ");
  }

  /**
   * Visit an ON CONFLICT node
   */
  private visitOnConflict(node: OnConflictNode): void {
    this.append("ON CONFLICT");

    // Handle conflict target
    if (node.columns && node.columns.length > 0) {
      this.append(" (");
      node.columns.forEach((column, index) => {
        if (index > 0) this.append(", ");
        this.appendIdentifier(column);
      });
      this.append(")");
    } else if (node.constraint) {
      this.append(" ON CONSTRAINT ");
      this.appendIdentifier(node.constraint);
    } else if (node.indexExpression) {
      this.append(" (");
      this.visitNode(node.indexExpression);
      this.append(")");
    }

    // Handle conflict action
    if (node.doNothing) {
      this.append(" DO NOTHING");
    } else if (node.updates && node.updates.length > 0) {
      this.append(" DO UPDATE SET ");
      this.visitNodeList(node.updates, ", ");

      if (node.updateWhere) {
        this.append(" WHERE ");
        this.visitNode(node.updateWhere);
      }
    }
  }

  /**
   * Visit a COLUMN UPDATE node
   */
  private visitColumnUpdate(node: ColumnUpdateNode): void {
    this.appendIdentifier(node.column);
    this.append(" = ");
    this.visitNode(node.value);
  }
}
