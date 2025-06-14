// INSERT query AST node tests
// Tests the AST node creation and manipulation for INSERT operations

import { describe, test, expect } from "bun:test";
import {
  InsertQueryNode,
  type IntoNode,
  type ValuesNode,
  type ReturningNode,
  type OnConflictNode,
  type ValueRowNode,
  type ColumnValueNode,
} from "../../src/core/ast/insert-query-node";

describe("INSERT Query AST Nodes", () => {
  describe("InsertQueryNode", () => {
    test("should create empty INSERT node", () => {
      const node = InsertQueryNode.create();

      expect(node.kind).toBe("InsertQueryNode");
      expect(node.into).toBeUndefined();
      expect(node.values).toBeUndefined();
      expect(node.returning).toBeUndefined();
      expect(node.onConflict).toBeUndefined();
    });

    test("should create INSERT node with INTO clause", () => {
      const node = InsertQueryNode.createWithInto("users");

      expect(node.kind).toBe("InsertQueryNode");
      expect(node.into).toBeDefined();
      expect(node.into?.kind).toBe("IntoNode");
      expect(node.into?.table).toBe("users");
    });

    test("should clone node with VALUES clause", () => {
      const baseNode = InsertQueryNode.createWithInto("users");
      const valuesNode = InsertQueryNode.createValuesNode([
        { name: "John", email: "john@example.com" },
      ]);

      const nodeWithValues = InsertQueryNode.cloneWithValues(
        baseNode,
        valuesNode
      );

      expect(nodeWithValues.into?.table).toBe("users");
      expect(nodeWithValues.values).toBeDefined();
      expect(nodeWithValues.values?.kind).toBe("ValuesNode");
      expect(nodeWithValues.values?.values).toHaveLength(1);
    });

    test("should clone node with RETURNING clause", () => {
      const baseNode = InsertQueryNode.createWithInto("users");
      const returningNode = InsertQueryNode.createReturningNode(["id", "name"]);

      const nodeWithReturning = InsertQueryNode.cloneWithReturning(
        baseNode,
        returningNode
      );

      expect(nodeWithReturning.returning).toBeDefined();
      expect(nodeWithReturning.returning?.kind).toBe("ReturningNode");
      expect(nodeWithReturning.returning?.selections).toHaveLength(2);
    });

    test("should clone node with ON CONFLICT clause", () => {
      const baseNode = InsertQueryNode.createWithInto("users");
      const onConflictNode = InsertQueryNode.createOnConflictDoNothingNode([
        "email",
      ]);

      const nodeWithConflict = InsertQueryNode.cloneWithOnConflict(
        baseNode,
        onConflictNode
      );

      expect(nodeWithConflict.onConflict).toBeDefined();
      expect(nodeWithConflict.onConflict?.kind).toBe("OnConflictNode");
      expect(nodeWithConflict.onConflict?.columns).toEqual(["email"]);
      expect(nodeWithConflict.onConflict?.doNothing).toBe(true);
    });
  });

  describe("ValuesNode creation", () => {
    test("should create ValuesNode from single object", () => {
      const data = [{ name: "John", email: "john@example.com", active: true }];
      const valuesNode = InsertQueryNode.createValuesNode(data);

      expect(valuesNode.kind).toBe("ValuesNode");
      expect(valuesNode.values).toHaveLength(1);

      const row = valuesNode.values[0];
      expect(row?.kind).toBe("ValueRowNode");
      expect(row?.values).toHaveLength(3);

      const columns = row?.values.map((cv) => cv.column);
      expect(columns).toEqual(["name", "email", "active"]);

      // Check that values are parameterized
      const firstValue = row?.values[0]?.value;
      expect(firstValue?.kind).toBe("ValueNode");
      expect((firstValue as any)?.isParameter).toBe(true);
      expect((firstValue as any)?.value).toBe("John");
    });

    test("should create ValuesNode from multiple objects", () => {
      const data = [
        { name: "John", email: "john@example.com" },
        { name: "Jane", email: "jane@example.com" },
      ];
      const valuesNode = InsertQueryNode.createValuesNode(data);

      expect(valuesNode.kind).toBe("ValuesNode");
      expect(valuesNode.values).toHaveLength(2);

      // First row
      const row1 = valuesNode.values[0];
      expect(row1?.values).toHaveLength(2);
      expect(row1?.values.map((cv) => cv.column)).toEqual(["name", "email"]);

      // Second row
      const row2 = valuesNode.values[1];
      expect(row2?.values).toHaveLength(2);
      expect(row2?.values.map((cv) => cv.column)).toEqual(["name", "email"]);
    });

    test("should throw error for empty data array", () => {
      expect(() => {
        InsertQueryNode.createValuesNode([]);
      }).toThrow("Cannot create VALUES node with empty data array");
    });

    test("should handle null and undefined values", () => {
      const data = [{ name: "John", email: null, active: undefined }];
      const valuesNode = InsertQueryNode.createValuesNode(data);

      const row = valuesNode.values[0];
      const emailValue = row?.values[1]?.value;
      const activeValue = row?.values[2]?.value;

      expect((emailValue as any)?.value).toBe(null);
      expect((activeValue as any)?.value).toBe(undefined);
      expect((emailValue as any)?.isParameter).toBe(true);
      expect((activeValue as any)?.isParameter).toBe(true);
    });
  });

  describe("ReturningNode creation", () => {
    test("should create ReturningNode for specific columns", () => {
      const returningNode = InsertQueryNode.createReturningNode([
        "id",
        "name",
        "email",
      ]);

      expect(returningNode.kind).toBe("ReturningNode");
      expect(returningNode.selections).toHaveLength(3);

      const columns = returningNode.selections.map(
        (sel) => (sel as any).column
      );
      expect(columns).toEqual(["id", "name", "email"]);

      returningNode.selections.forEach((sel) => {
        expect(sel.kind).toBe("ReferenceNode");
      });
    });

    test("should create ReturningNode for all columns (*)", () => {
      const returningNode = InsertQueryNode.createReturningAllNode();

      expect(returningNode.kind).toBe("ReturningNode");
      expect(returningNode.selections).toHaveLength(1);

      const selection = returningNode.selections[0];
      expect(selection?.kind).toBe("ReferenceNode");
      expect((selection as any)?.column).toBe("*");
    });
  });

  describe("OnConflictNode creation", () => {
    test("should create ON CONFLICT DO NOTHING node", () => {
      const onConflictNode = InsertQueryNode.createOnConflictDoNothingNode([
        "email",
      ]);

      expect(onConflictNode.kind).toBe("OnConflictNode");
      expect(onConflictNode.columns).toEqual(["email"]);
      expect(onConflictNode.doNothing).toBe(true);
      expect(onConflictNode.updates).toBeUndefined();
    });

    test("should create ON CONFLICT DO NOTHING node with multiple columns", () => {
      const onConflictNode = InsertQueryNode.createOnConflictDoNothingNode([
        "email",
        "name",
      ]);

      expect(onConflictNode.columns).toEqual(["email", "name"]);
      expect(onConflictNode.doNothing).toBe(true);
    });

    test("should create ON CONFLICT DO UPDATE node", () => {
      const updates = { name: "Updated Name", active: false };
      const onConflictNode = InsertQueryNode.createOnConflictDoUpdateNode(
        ["email"],
        updates
      );

      expect(onConflictNode.kind).toBe("OnConflictNode");
      expect(onConflictNode.columns).toEqual(["email"]);
      expect(onConflictNode.doNothing).toBeUndefined();
      expect(onConflictNode.updates).toHaveLength(2);

      const updateNodes = onConflictNode.updates!;
      expect(updateNodes[0]?.kind).toBe("ColumnUpdateNode");
      expect(updateNodes[0]?.column).toBe("name");
      expect((updateNodes[0]?.value as any)?.value).toBe("Updated Name");
      expect((updateNodes[0]?.value as any)?.isParameter).toBe(true);

      expect(updateNodes[1]?.column).toBe("active");
      expect((updateNodes[1]?.value as any)?.value).toBe(false);
      expect((updateNodes[1]?.value as any)?.isParameter).toBe(true);
    });
  });

  describe("Node immutability", () => {
    test("should create new instances when cloning", () => {
      const baseNode = InsertQueryNode.createWithInto("users");
      const valuesNode = InsertQueryNode.createValuesNode([{ name: "John" }]);
      const clonedNode = InsertQueryNode.cloneWithValues(baseNode, valuesNode);

      expect(clonedNode).not.toBe(baseNode);
      expect(clonedNode.into).toBeDefined();
      expect(baseNode.into).toBeDefined();
      expect(clonedNode.into!).toBe(baseNode.into!); // Should share INTO node
      expect(clonedNode.values).toBe(valuesNode); // Should have new VALUES node
    });
  });

  describe("Complex node combinations", () => {
    test("should create node with all clauses", () => {
      let node = InsertQueryNode.createWithInto("users");

      const valuesNode = InsertQueryNode.createValuesNode([
        { name: "John", email: "john@example.com" },
      ]);
      node = InsertQueryNode.cloneWithValues(node, valuesNode);

      const returningNode = InsertQueryNode.createReturningNode(["id", "name"]);
      node = InsertQueryNode.cloneWithReturning(node, returningNode);

      const onConflictNode = InsertQueryNode.createOnConflictDoUpdateNode(
        ["email"],
        { name: "Updated" }
      );
      node = InsertQueryNode.cloneWithOnConflict(node, onConflictNode);

      expect(node.into?.table).toBe("users");
      expect(node.values?.values).toHaveLength(1);
      expect(node.returning?.selections).toHaveLength(2);
      expect(node.onConflict?.columns).toEqual(["email"]);
      expect(node.onConflict?.updates).toHaveLength(1);
    });
  });
});
