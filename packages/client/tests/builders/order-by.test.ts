import { describe, it, expect } from "bun:test";
import { ZenQ } from "../../src/query-builder";
import type { Database } from "../utils/test-types";
import { createTestDatabase } from "../utils/test-config";

describe("ORDER BY Operations", () => {
  const db = createTestDatabase();

  describe("SQL Generation", () => {
    it("should generate ORDER BY for single column ASC", () => {
      const { sql, parameters } = db
        .selectFrom("users")
        .orderBy("name", "asc")
        .toSQL();

      expect(sql).toBe("SELECT * FROM users ORDER BY name ASC");
      expect(parameters).toEqual([]);
    });

    it("should generate ORDER BY for single column DESC", () => {
      const { sql, parameters } = db
        .selectFrom("users")
        .orderBy("created_at", "desc")
        .toSQL();

      expect(sql).toBe("SELECT * FROM users ORDER BY created_at DESC");
      expect(parameters).toEqual([]);
    });

    it("should default to ASC when no direction specified", () => {
      const { sql, parameters } = db
        .selectFrom("users")
        .orderBy("name")
        .toSQL();

      expect(sql).toBe("SELECT * FROM users ORDER BY name ASC");
      expect(parameters).toEqual([]);
    });

    it("should generate ORDER BY for multiple columns", () => {
      const { sql, parameters } = db
        .selectFrom("users")
        .orderBy([
          { column: "active", direction: "desc" },
          { column: "name", direction: "asc" },
          { column: "created_at" }, // Should default to ASC
        ])
        .toSQL();

      expect(sql).toBe(
        "SELECT * FROM users ORDER BY active DESC, name ASC, created_at ASC"
      );
      expect(parameters).toEqual([]);
    });

    it("should work with WHERE and ORDER BY", () => {
      const { sql, parameters } = db
        .selectFrom("users")
        .where("active", "=", true)
        .orderBy("name", "asc")
        .toSQL();

      expect(sql).toBe(
        "SELECT * FROM users WHERE active = $1 ORDER BY name ASC"
      );
      expect(parameters).toEqual([true]);
    });

    it("should work with SELECT and ORDER BY", () => {
      const { sql, parameters } = db
        .selectFrom("users")
        .select(["id", "name"])
        .orderBy("name", "desc")
        .toSQL();

      expect(sql).toBe("SELECT id, name FROM users ORDER BY name DESC");
      expect(parameters).toEqual([]);
    });
  });

  describe("Real Database Execution", () => {
    it("should execute ORDER BY ASC correctly", async () => {
      const users = await db
        .selectFrom("users")
        .select(["id", "name"])
        .orderBy("name", "asc")
        .execute();

      expect(users).toHaveLength(5);
      // Should be ordered: Alice Wilson, Bob Johnson, Charlie Brown, Jane Smith, John Doe
      expect(users[0].name).toBe("Alice Wilson");
      expect(users[1].name).toBe("Bob Johnson");
      expect(users[2].name).toBe("Charlie Brown");
      expect(users[3].name).toBe("Jane Smith");
      expect(users[4].name).toBe("John Doe");
    });

    it("should execute ORDER BY DESC correctly", async () => {
      const users = await db
        .selectFrom("users")
        .select(["id", "name"])
        .orderBy("name", "desc")
        .execute();

      expect(users).toHaveLength(5);
      // Should be ordered: John Doe, Jane Smith, Charlie Brown, Bob Johnson, Alice Wilson
      expect(users[0].name).toBe("John Doe");
      expect(users[1].name).toBe("Jane Smith");
      expect(users[2].name).toBe("Charlie Brown");
      expect(users[3].name).toBe("Bob Johnson");
      expect(users[4].name).toBe("Alice Wilson");
    });

    it("should execute multiple column ORDER BY correctly", async () => {
      const users = await db
        .selectFrom("users")
        .select(["id", "name", "active"])
        .orderBy([
          { column: "active", direction: "desc" }, // Active users first
          { column: "name", direction: "asc" }, // Then by name
        ])
        .execute();

      expect(users).toHaveLength(5);
      // Should be: Active users first (Alice, Charlie, Jane, John), then inactive (Bob)
      expect(users[0].name).toBe("Alice Wilson");
      expect(users[0].active).toBe(true);
      expect(users[1].name).toBe("Charlie Brown");
      expect(users[1].active).toBe(true);
      expect(users[2].name).toBe("Jane Smith");
      expect(users[2].active).toBe(true);
      expect(users[3].name).toBe("John Doe");
      expect(users[3].active).toBe(true);
      expect(users[4].name).toBe("Bob Johnson");
      expect(users[4].active).toBe(false);
    });

    it("should work with WHERE and ORDER BY in real query", async () => {
      const activeUsers = await db
        .selectFrom("users")
        .where("active", "=", true)
        .orderBy("name", "desc")
        .execute();

      expect(activeUsers).toHaveLength(4);
      expect(activeUsers[0].name).toBe("John Doe");
      expect(activeUsers[1].name).toBe("Jane Smith");
      expect(activeUsers[2].name).toBe("Charlie Brown");
      expect(activeUsers[3].name).toBe("Alice Wilson");
      activeUsers.forEach((user) => expect(user.active).toBe(true));
    });
  });

  describe("Type Safety", () => {
    it("should maintain type safety with ORDER BY", () => {
      const query = db
        .selectFrom("users")
        .select(["id", "name"])
        .orderBy("name", "asc");

      // TypeScript should know the result type
      type ResultType = Awaited<ReturnType<typeof query.execute>>;

      // This test passes if TypeScript compilation succeeds - just check that we get an array
      expect(Array.isArray([] as ResultType)).toBe(true);
    });

    it("should only allow ordering by existing columns", () => {
      // This should compile fine
      db.selectFrom("users").orderBy("name", "asc");
      db.selectFrom("users").orderBy("id", "desc");
      db.selectFrom("users").orderBy("active");

      // These would cause TypeScript errors (uncomment to test):
      // db.selectFrom("users").orderBy("nonexistent_column", "asc");
      // db.selectFrom("posts").orderBy("email", "asc"); // email is not on posts table

      expect(true).toBe(true);
    });
  });

  describe("Edge Cases", () => {
    it("should handle ordering by nullable columns", () => {
      const { sql, parameters } = db
        .selectFrom("users")
        .orderBy("email", "asc")
        .toSQL();

      expect(sql).toBe("SELECT * FROM users ORDER BY email ASC");
      expect(parameters).toEqual([]);
    });

    it("should combine with LIMIT correctly", () => {
      const { sql, parameters } = db
        .selectFrom("users")
        .orderBy("name", "desc")
        .limit(3)
        .toSQL();

      expect(sql).toBe("SELECT * FROM users ORDER BY name DESC LIMIT 3");
      expect(parameters).toEqual([]);
    });
  });
});
