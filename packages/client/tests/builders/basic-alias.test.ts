import { describe, it, expect } from "bun:test";
import { pgvibe } from "../../src/query-builder";
import type { Database } from "../../src/core/shared-types";

describe("Basic Alias Support", () => {
  const db = new pgvibe<Database>({
    connectionString: "postgresql://test:test@localhost:5432/test",
  });

  describe("Table Expression Parsing", () => {
    it("should create query builders for normal table expressions", () => {
      const query = db.selectFrom("users");
      expect(query).toBeDefined();
    });

    it("should create query builders for aliased table expressions", () => {
      const query = db.selectFrom("users as u");
      expect(query).toBeDefined();
    });

    it("should create query builders for different tables with aliases", () => {
      const usersQuery = db.selectFrom("users as u");
      const postsQuery = db.selectFrom("posts as p");
      const commentsQuery = db.selectFrom("comments as c");

      expect(usersQuery).toBeDefined();
      expect(postsQuery).toBeDefined();
      expect(commentsQuery).toBeDefined();
    });
  });

  describe("Basic Select Operations", () => {
    it("should support basic select with aliases", () => {
      const query = db.selectFrom("users as u");
      const selectedQuery = query.select(["id", "name", "email"]);
      expect(selectedQuery).toBeDefined();
    });

    it("should support selectAll with aliases", () => {
      const query = db.selectFrom("users as u");
      const selectedQuery = query.selectAll();
      expect(selectedQuery).toBeDefined();
    });
  });

  describe("Runtime Parsing", () => {
    it("should parse table expressions correctly", () => {
      // Test our parseTableExpression function
      const { parseTableExpression } = require("../../src/core/shared-types");

      const parsed1 = parseTableExpression("users as u");
      expect(parsed1.table).toBe("users");
      expect(parsed1.alias).toBe("u");

      const parsed2 = parseTableExpression("users");
      expect(parsed2.table).toBe("users");
      expect(parsed2.alias).toBeUndefined();

      const parsed3 = parseTableExpression("posts as p");
      expect(parsed3.table).toBe("posts");
      expect(parsed3.alias).toBe("p");
    });

    it("should parse column expressions correctly", () => {
      const { parseColumnExpression } = require("../../src/core/shared-types");

      const parsed1 = parseColumnExpression("name as user_name");
      expect(parsed1.column).toBe("name");
      expect(parsed1.alias).toBe("user_name");

      const parsed2 = parseColumnExpression("email");
      expect(parsed2.column).toBe("email");
      expect(parsed2.alias).toBeUndefined();
    });
  });

  describe("Method Chaining", () => {
    it("should allow method chaining with aliases", () => {
      const query = db
        .selectFrom("users as u")
        .select(["id", "name"])
        .limit(10)
        .offset(5);

      expect(query).toBeDefined();
    });
  });
});
