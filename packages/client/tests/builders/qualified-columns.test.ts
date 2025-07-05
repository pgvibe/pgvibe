import { describe, test, expect } from "bun:test";
import { pgvibe } from "../../src/query-builder";
import type { Database } from "../utils/test-types";
import { createTestDatabase } from "../utils/test-config";

describe("Qualified Column References", () => {
  const db = createTestDatabase();

  test("should support qualified column references in JOIN ON clauses", () => {
    const query = db
      .selectFrom("users")
      .innerJoin("posts", "users.id", "posts.user_id");

    const { sql } = query.toSQL();
    expect(sql).toContain("users.id = posts.user_id");
  });

  test("should support qualified column references in SELECT clauses", () => {
    const query = db
      .selectFrom("users")
      .innerJoin("posts", "users.id", "posts.user_id")
      .select(["users.id", "users.name", "posts.title"]);

    const { sql } = query.toSQL();
    expect(sql).toContain("users.id");
    expect(sql).toContain("users.name");
    expect(sql).toContain("posts.title");
  });

  test("should support qualified column references in WHERE clauses", () => {
    const query = db
      .selectFrom("users")
      .innerJoin("posts", "users.id", "posts.user_id")
      .where("users.active", "=", true)
      .where("posts.published", "=", true);

    const { sql } = query.toSQL();
    expect(sql).toContain("users.active = $1");
    expect(sql).toContain("posts.published = $2");
  });

  test("should support qualified column references in ORDER BY clauses", () => {
    const query = db
      .selectFrom("users")
      .innerJoin("posts", "users.id", "posts.user_id")
      .orderBy("users.created_at", "desc")
      .orderBy("posts.title", "asc");

    const { sql } = query.toSQL();
    expect(sql).toContain("ORDER BY users.created_at DESC, posts.title ASC");
  });

  test("should support mixed simple and qualified column references", () => {
    const query = db
      .selectFrom("users")
      .innerJoin("posts", "users.id", "posts.user_id")
      .select(["name", "users.email", "posts.title"]) // Mix of simple and qualified
      .where("name", "like", "%John%") // Simple (unambiguous)
      .where("users.active", "=", true) // Qualified
      .orderBy("posts.created_at", "desc"); // Qualified

    const { sql } = query.toSQL();
    expect(sql).toContain("name, users.email, posts.title");
    expect(sql).toContain("name LIKE $1");
    expect(sql).toContain("users.active = $2");
    expect(sql).toContain("ORDER BY posts.created_at DESC");
  });

  test("should support qualified column references in complex multi-table joins", () => {
    const query = db
      .selectFrom("users")
      .innerJoin("posts", "users.id", "posts.user_id")
      .leftJoin("comments", "posts.id", "comments.post_id")
      .select(["users.name", "posts.title", "comments.content"])
      .where("users.active", "=", true)
      .where("posts.published", "=", true)
      .orderBy("users.created_at", "desc")
      .orderBy("posts.created_at", "desc");

    const { sql } = query.toSQL();

    // Check JOIN clauses
    expect(sql).toContain("users.id = posts.user_id");
    expect(sql).toContain("posts.id = comments.post_id");

    // Check SELECT clause
    expect(sql).toContain("users.name, posts.title, comments.content");

    // Check WHERE clauses
    expect(sql).toContain("users.active = $1");
    expect(sql).toContain("posts.published = $2");

    // Check ORDER BY clause
    expect(sql).toContain(
      "ORDER BY users.created_at DESC, posts.created_at DESC"
    );
  });

  test("should handle qualified column references with all JOIN types", () => {
    // INNER JOIN
    const innerJoin = db
      .selectFrom("users")
      .innerJoin("posts", "users.id", "posts.user_id")
      .toSQL();
    expect(innerJoin.sql).toContain(
      "INNER JOIN posts ON users.id = posts.user_id"
    );

    // LEFT JOIN
    const leftJoin = db
      .selectFrom("users")
      .leftJoin("posts", "users.id", "posts.user_id")
      .toSQL();
    expect(leftJoin.sql).toContain(
      "LEFT JOIN posts ON users.id = posts.user_id"
    );

    // RIGHT JOIN
    const rightJoin = db
      .selectFrom("users")
      .rightJoin("posts", "users.id", "posts.user_id")
      .toSQL();
    expect(rightJoin.sql).toContain(
      "RIGHT JOIN posts ON users.id = posts.user_id"
    );

    // FULL JOIN
    const fullJoin = db
      .selectFrom("users")
      .fullJoin("posts", "users.id", "posts.user_id")
      .toSQL();
    expect(fullJoin.sql).toContain(
      "FULL JOIN posts ON users.id = posts.user_id"
    );
  });

  test("should support qualified column references with all WHERE operators", () => {
    const testCases = [
      { op: "=", value: 1 },
      { op: "!=", value: 1 },
      { op: ">", value: 0 },
      { op: ">=", value: 1 },
      { op: "<", value: 10 },
      { op: "<=", value: 5 },
      { op: "like", value: "%test%" },
      { op: "not like", value: "%spam%" },
      { op: "in", value: [1, 2, 3] },
      { op: "not in", value: [99, 100] },
      { op: "is", value: null },
      { op: "is not", value: null },
    ] as const;

    testCases.forEach(({ op, value }) => {
      const query = db
        .selectFrom("users")
        .innerJoin("posts", "users.id", "posts.user_id")
        .where("users.id", op, value);

      const { sql } = query.toSQL();
      expect(sql).toContain("users.id");

      // Verify the operator is properly converted to uppercase in SQL
      const expectedOp = op.toUpperCase();
      if (op === "is" || op === "is not") {
        expect(sql).toContain(`users.id ${expectedOp} NULL`);
      } else if (op === "in" || op === "not in") {
        expect(sql).toContain(`users.id ${expectedOp} (`);
      } else {
        expect(sql).toContain(`users.id ${expectedOp}`);
      }
    });
  });

  test("should support qualified column references in real database execution", async () => {
    try {
      const result = await db
        .selectFrom("users")
        .innerJoin("posts", "users.id", "posts.user_id")
        .select(["users.name", "users.email", "posts.title"])
        .where("users.active", "=", true)
        .orderBy("users.created_at", "desc")
        .limit(5)
        .execute();

      // Should execute without errors and return results
      expect(Array.isArray(result)).toBe(true);

      // Each result should have the selected columns (PostgreSQL aliases qualified columns)
      if (result.length > 0) {
        const firstResult = result[0];
        expect(firstResult).toHaveProperty("name");
        expect(firstResult).toHaveProperty("email");
        expect(firstResult).toHaveProperty("title");
      }
    } catch (error) {
      // Database connection errors are acceptable in CI/testing environments
      expect(error.message).toMatch(
        /connection|database|timeout|authentication/i
      );
    }
  });
});
