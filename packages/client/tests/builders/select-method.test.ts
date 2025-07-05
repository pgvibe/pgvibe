import { expect, test, describe } from "bun:test";
import { pgvibe } from "../../src/query-builder";
import type { Database } from "../utils/test-types";

// Create pgvibe instance for SQL generation (no real DB connection needed)
const db = new pgvibe<Database>({
  host: "localhost",
  port: 5432,
  database: "test",
  user: "test",
  password: "test",
});

describe("Select Method Tests", () => {
  describe("Column Selection Patterns", () => {
    test("should support single column selection", () => {
      const query = db.selectFrom("users").select("id");
      const { sql } = query.toSQL();

      // Simple identifiers don't need quoting in PostgreSQL
      expect(sql).toBe("SELECT id FROM users");
    });

    test("should support multiple column array selection", () => {
      const query = db.selectFrom("users").select(["id", "name", "email"]);
      const { sql } = query.toSQL();

      expect(sql).toBe("SELECT id, name, email FROM users");
    });

    test("should support SELECT * (already working)", () => {
      const query = db.selectFrom("users");
      const { sql } = query.toSQL();

      expect(sql).toBe("SELECT * FROM users");
    });

    test("should support chaining select calls", () => {
      const query = db.selectFrom("users").select("id").select("name");
      const { sql } = query.toSQL();

      expect(sql).toBe("SELECT id, name FROM users");
    });
  });

  describe("Identifier Quoting (Smart Quoting Strategy)", () => {
    test("should quote reserved words when used as identifiers", () => {
      // Note: This would require us to create a table named 'select' in our schema
      // For now, we'll test the compiler behavior directly in other tests
      // But here we verify our smart quoting doesn't interfere with normal identifiers
      const query = db.selectFrom("users").select(["id", "name"]);
      const { sql } = query.toSQL();

      // Normal identifiers should NOT be quoted
      expect(sql).toBe("SELECT id, name FROM users");
      expect(sql).not.toContain('"');
    });

    test("should handle snake_case identifiers without quoting", () => {
      const query = db.selectFrom("users").select(["id", "created_at"]);
      const { sql } = query.toSQL();

      // Snake case identifiers are valid and don't need quoting
      expect(sql).toBe("SELECT id, created_at FROM users");
    });
  });

  describe("SQL Generation", () => {
    test("should generate correct SQL for complex column selections", () => {
      const query = db
        .selectFrom("posts")
        .select(["id", "title", "content"])
        .where("user_id", "=", 1);

      const { sql, parameters } = query.toSQL();

      expect(sql).toBe(
        "SELECT id, title, content FROM posts WHERE user_id = $1"
      );
      expect(parameters).toEqual([1]);
    });

    test("should handle nullable columns in selection", () => {
      const query = db
        .selectFrom("users")
        .select(["id", "name", "email"]) // email is nullable
        .where("id", "=", 1);

      const { sql, parameters } = query.toSQL();

      expect(sql).toBe("SELECT id, name, email FROM users WHERE id = $1");
      expect(parameters).toEqual([1]);
    });
  });
});
