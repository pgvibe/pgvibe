// pgvibe main class tests
// Tests the core fluent API functionality

import { describe, test, expect } from "bun:test";
import { pgvibe, type Database } from "../../src/query-builder";
import { createTestDatabase, TEST_DATABASE_CONFIG } from "../utils/test-config";

describe("pgvibe Query Builder", () => {
  describe("pgvibe Class", () => {
    test("should create pgvibe instance with PostgreSQL config", () => {
      const db = new pgvibe<Database>(TEST_DATABASE_CONFIG);

      expect(db).toBeDefined();
      expect(db.getPostgreSQL()).toBeDefined();
    });

    test("should create SelectQueryBuilder from selectFrom", () => {
      const db = createTestDatabase();
      const builder = db.selectFrom("users");

      expect(builder).toBeDefined();
      expect(builder.toSQL).toBeDefined();
      expect(builder.where).toBeDefined();
      expect(builder.execute).toBeDefined();
    });
  });

  describe("SelectQueryBuilder", () => {
    const db = createTestDatabase();

    test("should generate simple SELECT query", () => {
      const builder = db.selectFrom("users");
      const { sql, parameters } = builder.toSQL();

      expect(sql).toBe("SELECT * FROM users");
      expect(parameters).toEqual([]);
    });

    test("should generate SELECT with WHERE clause", () => {
      const builder = db.selectFrom("users").where("id", "=", 123);
      const { sql, parameters } = builder.toSQL();

      expect(sql).toBe("SELECT * FROM users WHERE id = $1");
      expect(parameters).toEqual([123]);
    });

    test("should generate SELECT with multiple WHERE clauses", () => {
      const builder = db
        .selectFrom("users")
        .where("active", "=", true)
        .where("name", "=", "John");

      const { sql, parameters } = builder.toSQL();

      expect(sql).toBe("SELECT * FROM users WHERE active = $1 AND name = $2");
      expect(parameters).toEqual([true, "John"]);
    });

    test("should handle different value types", () => {
      const stringBuilder = db.selectFrom("users").where("name", "=", "John");
      const numberBuilder = db.selectFrom("users").where("id", "=", 42);
      const booleanBuilder = db.selectFrom("users").where("active", "=", true);

      expect(stringBuilder.toSQL().parameters).toEqual(["John"]);
      expect(numberBuilder.toSQL().parameters).toEqual([42]);
      expect(booleanBuilder.toSQL().parameters).toEqual([true]);
    });
  });
});
