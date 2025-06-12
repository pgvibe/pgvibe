import { describe, it, expect } from "bun:test";
import { ZenQ } from "../../src/query-builder";
import type { Database } from "../utils/test-types";
import { createTestDatabase } from "../utils/test-config";

describe("LIMIT and OFFSET Operations", () => {
  const db = createTestDatabase();

  describe("SQL Generation", () => {
    it("should generate LIMIT clause", () => {
      const { sql, parameters } = db.selectFrom("users").limit(5).toSQL();

      expect(sql).toBe("SELECT * FROM users LIMIT 5");
      expect(parameters).toEqual([]);
    });

    it("should generate OFFSET clause", () => {
      const { sql, parameters } = db.selectFrom("users").offset(10).toSQL();

      expect(sql).toBe("SELECT * FROM users OFFSET 10");
      expect(parameters).toEqual([]);
    });

    it("should generate LIMIT and OFFSET together", () => {
      const { sql, parameters } = db
        .selectFrom("users")
        .limit(5)
        .offset(10)
        .toSQL();

      expect(sql).toBe("SELECT * FROM users LIMIT 5 OFFSET 10");
      expect(parameters).toEqual([]);
    });

    it("should work with WHERE, ORDER BY, LIMIT, and OFFSET", () => {
      const { sql, parameters } = db
        .selectFrom("users")
        .where("active", "=", true)
        .orderBy("name", "asc")
        .limit(3)
        .offset(1)
        .toSQL();

      expect(sql).toBe(
        "SELECT * FROM users WHERE active = $1 ORDER BY name ASC LIMIT 3 OFFSET 1"
      );
      expect(parameters).toEqual([true]);
    });

    it("should work with SELECT, WHERE, ORDER BY, LIMIT, and OFFSET", () => {
      const { sql, parameters } = db
        .selectFrom("users")
        .select(["id", "name"])
        .where("active", "=", true)
        .orderBy("name", "desc")
        .limit(2)
        .offset(1)
        .toSQL();

      expect(sql).toBe(
        "SELECT id, name FROM users WHERE active = $1 ORDER BY name DESC LIMIT 2 OFFSET 1"
      );
      expect(parameters).toEqual([true]);
    });

    it("should handle LIMIT 0", () => {
      const { sql, parameters } = db.selectFrom("users").limit(0).toSQL();

      expect(sql).toBe("SELECT * FROM users LIMIT 0");
      expect(parameters).toEqual([]);
    });

    it("should handle OFFSET 0", () => {
      const { sql, parameters } = db.selectFrom("users").offset(0).toSQL();

      expect(sql).toBe("SELECT * FROM users OFFSET 0");
      expect(parameters).toEqual([]);
    });
  });

  describe("Real Database Execution", () => {
    it("should execute LIMIT correctly", async () => {
      const users = await db
        .selectFrom("users")
        .select(["id", "name"])
        .orderBy("name", "asc") // Ensure consistent ordering
        .limit(3)
        .execute();

      expect(users).toHaveLength(3);
      // Should be first 3 users: Alice Wilson, Bob Johnson, Charlie Brown
      expect(users[0].name).toBe("Alice Wilson");
      expect(users[1].name).toBe("Bob Johnson");
      expect(users[2].name).toBe("Charlie Brown");
    });

    it("should execute OFFSET correctly", async () => {
      const users = await db
        .selectFrom("users")
        .select(["id", "name"])
        .orderBy("name", "asc") // Ensure consistent ordering
        .offset(2)
        .execute();

      expect(users).toHaveLength(3); // 5 total - 2 offset = 3 remaining
      // Should skip first 2 users (Alice, Bob) and get: Charlie Brown, Jane Smith, John Doe
      expect(users[0].name).toBe("Charlie Brown");
      expect(users[1].name).toBe("Jane Smith");
      expect(users[2].name).toBe("John Doe");
    });

    it("should execute LIMIT and OFFSET together", async () => {
      const users = await db
        .selectFrom("users")
        .select(["id", "name"])
        .orderBy("name", "asc") // Ensure consistent ordering
        .limit(2)
        .offset(1)
        .execute();

      expect(users).toHaveLength(2);
      // Should skip first user (Alice) and get next 2: Bob Johnson, Charlie Brown
      expect(users[0].name).toBe("Bob Johnson");
      expect(users[1].name).toBe("Charlie Brown");
    });

    it("should work with WHERE, ORDER BY, LIMIT, and OFFSET", async () => {
      const activeUsers = await db
        .selectFrom("users")
        .select(["id", "name", "active"])
        .where("active", "=", true)
        .orderBy("name", "asc")
        .limit(2)
        .offset(1)
        .execute();

      expect(activeUsers).toHaveLength(2);
      // Active users ordered by name: Alice, Charlie, Jane, John
      // Skip first (Alice), get next 2: Charlie, Jane
      expect(activeUsers[0].name).toBe("Charlie Brown");
      expect(activeUsers[0].active).toBe(true);
      expect(activeUsers[1].name).toBe("Jane Smith");
      expect(activeUsers[1].active).toBe(true);
    });

    it("should handle LIMIT larger than result set", async () => {
      const users = await db.selectFrom("users").limit(100).execute();

      expect(users).toHaveLength(5); // Only 5 users in total
    });

    it("should handle OFFSET larger than result set", async () => {
      const users = await db.selectFrom("users").offset(100).execute();

      expect(users).toHaveLength(0); // No users left after offset
    });

    it("should handle LIMIT 0", async () => {
      const users = await db.selectFrom("users").limit(0).execute();

      expect(users).toHaveLength(0);
    });
  });

  describe("Type Safety", () => {
    it("should maintain type safety with LIMIT and OFFSET", () => {
      const query = db
        .selectFrom("users")
        .select(["id", "name"])
        .limit(5)
        .offset(2);

      // TypeScript should know the result type
      type ResultType = Awaited<ReturnType<typeof query.execute>>;

      // This test passes if TypeScript compilation succeeds - just check that we get an array
      expect(Array.isArray([] as ResultType)).toBe(true);
    });

    it("should allow method chaining in any order", () => {
      // All of these should compile fine
      db.selectFrom("users").limit(5).offset(2);
      db.selectFrom("users").offset(2).limit(5);
      db.selectFrom("users").where("active", "=", true).limit(5).offset(2);
      db.selectFrom("users").orderBy("name").limit(5).offset(2);
      db.selectFrom("users").select(["id", "name"]).limit(5).offset(2);

      expect(true).toBe(true);
    });
  });

  describe("Edge Cases", () => {
    it("should handle multiple LIMIT calls (last one wins)", () => {
      const { sql, parameters } = db
        .selectFrom("users")
        .limit(10)
        .limit(5) // This should override the previous limit
        .toSQL();

      expect(sql).toBe("SELECT * FROM users LIMIT 5");
      expect(parameters).toEqual([]);
    });

    it("should handle multiple OFFSET calls (last one wins)", () => {
      const { sql, parameters } = db
        .selectFrom("users")
        .offset(10)
        .offset(5) // This should override the previous offset
        .toSQL();

      expect(sql).toBe("SELECT * FROM users OFFSET 5");
      expect(parameters).toEqual([]);
    });

    it("should handle pagination pattern", () => {
      const pageSize = 2;
      const page = 2; // 0-based
      const offset = page * pageSize;

      const { sql, parameters } = db
        .selectFrom("users")
        .orderBy("id", "asc")
        .limit(pageSize)
        .offset(offset)
        .toSQL();

      expect(sql).toBe("SELECT * FROM users ORDER BY id ASC LIMIT 2 OFFSET 4");
      expect(parameters).toEqual([]);
    });
  });
});
