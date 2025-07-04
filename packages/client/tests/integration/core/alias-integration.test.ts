import { describe, it, expect, beforeAll } from "bun:test";
import { ZenQ } from "../../../src/query-builder";
import type { Database } from "../../../src/core/shared-types";
import { createTestDatabase, waitForDatabase } from "../utils/test-helpers";

describe("Alias Integration Tests", () => {
  let db: ZenQ<Database>;

  beforeAll(async () => {
    await waitForDatabase();
    db = createTestDatabase();
  });

  describe("Single Table Alias Operations", () => {
    it("should execute SELECT with table alias", async () => {
      const query = db
        .selectFrom("users as u")
        .select(["u.name", "u.email"])
        .limit(1);

      const compiled = query.compile();
      console.log("Single table alias SQL:", compiled.sql);

      expect(compiled.sql).toContain("FROM users AS u");
      expect(compiled.sql).toContain("u.name");
      expect(compiled.sql).toContain("u.email");
      expect(compiled.sql).toContain("LIMIT 1");

      // Test that the query can be executed without errors
      const result = await query.execute();
      expect(Array.isArray(result)).toBe(true);
    });

    it("should execute SELECT with mixed qualified and unqualified columns", async () => {
      const query = db
        .selectFrom("users as u")
        .select(["u.name", "email", "u.id"])
        .limit(1);

      const compiled = query.compile();
      console.log("Mixed columns SQL:", compiled.sql);

      expect(compiled.sql).toContain("FROM users AS u");
      expect(compiled.sql).toContain("u.name");
      expect(compiled.sql).toContain("email");
      expect(compiled.sql).toContain("u.id");

      // Test that the query can be executed without errors
      const result = await query.execute();
      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe("Multi-Table Alias Operations", () => {
    it("should execute INNER JOIN with table aliases", async () => {
      const query = db
        .selectFrom("users as u")
        .innerJoin("posts as p", "u.id", "p.user_id")
        .select(["u.name", "p.title"])
        .limit(1);

      const compiled = query.compile();
      console.log("INNER JOIN with aliases SQL:", compiled.sql);

      expect(compiled.sql).toContain("FROM users AS u");
      expect(compiled.sql).toContain("INNER JOIN posts AS p");
      expect(compiled.sql).toContain("ON u.id = p.user_id");
      expect(compiled.sql).toContain("u.name");
      expect(compiled.sql).toContain("p.title");

      // Test that the query can be executed without errors
      const result = await query.execute();
      expect(Array.isArray(result)).toBe(true);
    });

    it("should execute LEFT JOIN with table aliases", async () => {
      const query = db
        .selectFrom("users as u")
        .leftJoin("posts as p", "u.id", "p.user_id")
        .select(["u.name", "p.title"])
        .limit(1);

      const compiled = query.compile();
      console.log("LEFT JOIN with aliases SQL:", compiled.sql);

      expect(compiled.sql).toContain("FROM users AS u");
      expect(compiled.sql).toContain("LEFT JOIN posts AS p");
      expect(compiled.sql).toContain("ON u.id = p.user_id");

      // Test that the query can be executed without errors
      const result = await query.execute();
      expect(Array.isArray(result)).toBe(true);
    });

    it("should execute RIGHT JOIN with table aliases", async () => {
      const query = db
        .selectFrom("users as u")
        .rightJoin("posts as p", "u.id", "p.user_id")
        .select(["u.name", "p.title"])
        .limit(1);

      const compiled = query.compile();
      console.log("RIGHT JOIN with aliases SQL:", compiled.sql);

      expect(compiled.sql).toContain("FROM users AS u");
      expect(compiled.sql).toContain("RIGHT JOIN posts AS p");
      expect(compiled.sql).toContain("ON u.id = p.user_id");

      // Test that the query can be executed without errors
      const result = await query.execute();
      expect(Array.isArray(result)).toBe(true);
    });

    it("should execute complex multi-table JOIN with aliases", async () => {
      const query = db
        .selectFrom("users as u")
        .innerJoin("posts as p", "u.id", "p.user_id")
        .leftJoin("comments as c", "p.id", "c.post_id")
        .select(["u.name", "p.title", "c.content"])
        .limit(1);

      const compiled = query.compile();
      console.log("Complex multi-table JOIN SQL:", compiled.sql);

      expect(compiled.sql).toContain("FROM users AS u");
      expect(compiled.sql).toContain("INNER JOIN posts AS p");
      expect(compiled.sql).toContain("u.name");
      expect(compiled.sql).toContain("p.title");
      expect(compiled.sql).toContain("c.content");

      // Test that the query can be executed without errors
      const result = await query.execute();
      expect(Array.isArray(result)).toBe(true);
    });

    it("should execute query with mixed qualified and unqualified columns", async () => {
      const query = db
        .selectFrom("users as u")
        .innerJoin("posts as p", "u.id", "p.user_id")
        .select(["u.name", "title", "p.content", "email"])
        .limit(1);

      const compiled = query.compile();
      console.log("Mixed qualified/unqualified multi-table SQL:", compiled.sql);

      expect(compiled.sql).toContain("FROM users AS u");
      expect(compiled.sql).toContain("INNER JOIN posts AS p");
      expect(compiled.sql).toContain("u.name");
      expect(compiled.sql).toContain("title");
      expect(compiled.sql).toContain("p.content");
      expect(compiled.sql).toContain("email");

      // Test that the query can be executed without errors
      const result = await query.execute();
      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe("Self-Join Operations with Aliases", () => {
    it("should execute self-join with different aliases", async () => {
      const query = db
        .selectFrom("users as u1")
        .innerJoin("users as u2", "u1.id", "u2.id")
        .select(["u1.name", "u2.email"])
        .limit(1);

      const compiled = query.compile();
      console.log("Self-join with aliases SQL:", compiled.sql);

      expect(compiled.sql).toContain("FROM users AS u1");
      expect(compiled.sql).toContain("INNER JOIN users AS u2");
      expect(compiled.sql).toContain("ON u1.id = u2.id");
      expect(compiled.sql).toContain("u1.name");
      expect(compiled.sql).toContain("u2.email");

      // Test that the query can be executed without errors
      const result = await query.execute();
      expect(Array.isArray(result)).toBe(true);
    });

    it("should execute meaningful self-join with semantic aliases", async () => {
      const query = db
        .selectFrom("users as manager")
        .innerJoin("users as employee", "manager.id", "employee.id")
        .select(["manager.name", "employee.email"])
        .limit(1);

      const compiled = query.compile();
      console.log("Semantic self-join SQL:", compiled.sql);

      expect(compiled.sql).toContain("FROM users AS manager");
      expect(compiled.sql).toContain("INNER JOIN users AS employee");
      expect(compiled.sql).toContain("ON manager.id = employee.id");
      expect(compiled.sql).toContain("manager.name");
      expect(compiled.sql).toContain("employee.email");

      // Test that the query can be executed without errors
      const result = await query.execute();
      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe("Comparison with Non-Alias Queries", () => {
    it("should execute query without aliases (baseline)", async () => {
      const query = db
        .selectFrom("users")
        .select(["users.name", "users.email"])
        .limit(1);

      const compiled = query.compile();
      console.log("No alias baseline SQL:", compiled.sql);

      expect(compiled.sql).toContain("FROM users");
      expect(compiled.sql).not.toContain("AS");
      expect(compiled.sql).toContain("users.name");
      expect(compiled.sql).toContain("users.email");

      // Test that the query can be executed without errors
      const result = await query.execute();
      expect(Array.isArray(result)).toBe(true);
    });

    it("should execute JOIN without aliases (baseline)", async () => {
      const query = db
        .selectFrom("users")
        .innerJoin("posts", "users.id", "posts.user_id")
        .select(["users.name", "posts.title"])
        .limit(1);

      const compiled = query.compile();
      console.log("No alias JOIN baseline SQL:", compiled.sql);

      expect(compiled.sql).toContain("FROM users");
      expect(compiled.sql).toContain("INNER JOIN posts");
      expect(compiled.sql).toContain("ON users.id = posts.user_id");
      expect(compiled.sql).not.toContain("AS");
      expect(compiled.sql).toContain("users.name");
      expect(compiled.sql).toContain("posts.title");

      // Test that the query can be executed without errors
      const result = await query.execute();
      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe("Edge Cases and Error Handling", () => {
    it("should handle empty result sets with aliases", async () => {
      const query = db
        .selectFrom("users as u")
        .innerJoin("posts as p", "u.id", "p.user_id")
        .select(["u.name", "p.title"])
        .limit(0);

      const compiled = query.compile();
      console.log("Empty result set SQL:", compiled.sql);

      expect(compiled.sql).toContain("LIMIT 0");

      // Test that the query can be executed without errors
      const result = await query.execute();
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(0);
    });

    it("should handle large LIMIT with aliases", async () => {
      const query = db
        .selectFrom("users as u")
        .select(["u.name", "u.email"])
        .limit(1000);

      const compiled = query.compile();
      console.log("Large LIMIT SQL:", compiled.sql);

      expect(compiled.sql).toContain("LIMIT 1000");

      // Test that the query can be executed without errors
      const result = await query.execute();
      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe("Performance and Optimization", () => {
    it("should generate efficient SQL with aliases", async () => {
      const query = db
        .selectFrom("users as u")
        .innerJoin("posts as p", "u.id", "p.user_id")
        .select(["u.id", "u.name", "p.id", "p.title"])
        .limit(10);

      const compiled = query.compile();
      console.log("Efficient alias SQL:", compiled.sql);

      // Check that the SQL is clean and efficient
      expect(compiled.sql).toContain("FROM users AS u");
      expect(compiled.sql).toContain("INNER JOIN posts AS p");
      expect(compiled.sql).toContain("ON u.id = p.user_id");
      expect(compiled.sql).toContain("LIMIT 10");

      // Verify no unnecessary complexity
      expect(compiled.sql.split("AS").length).toBe(3); // Only 2 aliases + 1 for splitting
      expect(compiled.sql.split("SELECT").length).toBe(2); // Only 1 SELECT statement

      // Test execution
      const result = await query.execute();
      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe("Future Features - Documentation", () => {
    it("should document WHERE clause with aliases (not yet implemented)", async () => {
      // This test shows what should work in the future
      const query = db
        .selectFrom("users as u")
        .select(["u.name", "u.email"])
        .limit(1);

      // TODO: This should work in the future
      // .where(({ eb, or }) => [
      //   or([
      //     eb("u.active", "=", true),
      //     eb("u.name", "=", "johan"),
      //   ]),
      // ]);

      const compiled = query.compile();
      console.log("Future WHERE with aliases (current):", compiled.sql);

      // Currently works
      expect(compiled.sql).toContain("FROM users AS u");
      expect(compiled.sql).toContain("u.name");
      expect(compiled.sql).toContain("u.email");

      // TODO: Should contain WHERE clause
      // expect(compiled.sql).toContain("WHERE (u.active = $1 OR u.name = $2)");

      // Test execution
      const result = await query.execute();
      expect(Array.isArray(result)).toBe(true);
    });

    it("should document ORDER BY with aliases (not yet implemented)", async () => {
      // This test shows what should work in the future
      const query = db
        .selectFrom("users as u")
        .select(["u.name", "u.email"])
        .limit(1);

      // TODO: This should work in the future
      // .orderBy("u.created_at", "desc")
      // .orderBy("u.name", "asc");

      const compiled = query.compile();
      console.log("Future ORDER BY with aliases (current):", compiled.sql);

      // Currently works
      expect(compiled.sql).toContain("FROM users AS u");

      // TODO: Should contain ORDER BY clause
      // expect(compiled.sql).toContain("ORDER BY u.created_at DESC, u.name ASC");

      // Test execution
      const result = await query.execute();
      expect(Array.isArray(result)).toBe(true);
    });
  });
});
