// Unit tests for SelectQueryNode
import { test, expect } from "bun:test";
import {
  SelectQueryNode,
  ExpressionNodeFactory,
  freeze,
} from "../../src/core/ast";

test("SelectQueryNode - create empty query", () => {
  const node = SelectQueryNode.create();

  expect(node.kind).toBe("SelectQueryNode");
  expect(node.from).toBeUndefined();
  expect(node.selection).toBeUndefined();
  expect(node.where).toBeUndefined();
});

test("SelectQueryNode - create with FROM clause", () => {
  const node = SelectQueryNode.createWithFrom("users");

  expect(node.kind).toBe("SelectQueryNode");
  expect(node.from).toBeDefined();
  expect(node.from?.kind).toBe("FromNode");
  expect(node.from?.table.kind).toBe("TableReferenceNode");
  expect(node.from?.table.table).toBe("users");
  expect(node.from?.table.alias).toBeUndefined();
});

test("SelectQueryNode - create with FROM and alias", () => {
  const node = SelectQueryNode.createWithFrom("users", "u");

  expect(node.from?.table.table).toBe("users");
  expect(node.from?.table.alias).toBe("u");
});

test("SelectQueryNode - immutable updates", () => {
  const originalNode = SelectQueryNode.create();

  // Create a selection
  const selection = freeze({
    kind: "SelectionNode" as const,
    expression: ExpressionNodeFactory.createReference("name"),
  });

  const updatedNode = SelectQueryNode.cloneWithSelection(originalNode, [
    selection,
  ]);

  // Original node should be unchanged
  expect(originalNode.selection).toBeUndefined();

  // Updated node should have the selection
  expect(updatedNode.selection).toHaveLength(1);
  expect(updatedNode.selection?.[0].kind).toBe("SelectionNode");

  // Nodes should be different objects
  expect(originalNode).not.toBe(updatedNode);
});

test("SelectQueryNode - add multiple selections", () => {
  const baseQuery = SelectQueryNode.create();

  const selection1 = freeze({
    kind: "SelectionNode" as const,
    expression: ExpressionNodeFactory.createReference("name"),
  });

  const selection2 = freeze({
    kind: "SelectionNode" as const,
    expression: ExpressionNodeFactory.createReference("email"),
  });

  const queryWithOne = SelectQueryNode.cloneWithSelection(baseQuery, [
    selection1,
  ]);
  const queryWithTwo = SelectQueryNode.cloneWithSelection(queryWithOne, [
    selection2,
  ]);

  expect(queryWithTwo.selection).toHaveLength(2);
  expect(queryWithTwo.selection?.[0].expression.kind).toBe("ReferenceNode");
  expect(queryWithTwo.selection?.[1].expression.kind).toBe("ReferenceNode");
});

test("ExpressionNodeFactory - create reference node", () => {
  const ref = ExpressionNodeFactory.createReference("name");

  expect(ref.kind).toBe("ReferenceNode");
  expect(ref.column).toBe("name");
  expect(ref.table).toBeUndefined();
});

test("ExpressionNodeFactory - create reference with table", () => {
  const ref = ExpressionNodeFactory.createReference("name", "users");

  expect(ref.kind).toBe("ReferenceNode");
  expect(ref.column).toBe("name");
  expect(ref.table).toBe("users");
});

test("ExpressionNodeFactory - create value node", () => {
  const value = ExpressionNodeFactory.createValue("John");

  expect(value.kind).toBe("ValueNode");
  expect(value.value).toBe("John");
  expect(value.isParameter).toBeUndefined();
});

test("ExpressionNodeFactory - create parameter value", () => {
  const value = ExpressionNodeFactory.createValue("John", true);

  expect(value.kind).toBe("ValueNode");
  expect(value.value).toBe("John");
  expect(value.isParameter).toBe(true);
});

test("ExpressionNodeFactory - create binary operation", () => {
  const left = ExpressionNodeFactory.createReference("name");
  const right = ExpressionNodeFactory.createValue("John");
  const operation = ExpressionNodeFactory.createBinaryOperation(
    left,
    "=",
    right
  );

  expect(operation.kind).toBe("BinaryOperationNode");
  expect(operation.leftOperand).toBe(left);
  expect(operation.rightOperand).toBe(right);
  expect(operation.operator.kind).toBe("OperatorNode");
  expect(operation.operator.operator).toBe("=");
});
