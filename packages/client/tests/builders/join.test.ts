import { describe, test, expect, beforeAll, afterAll } from "bun:test";
import { pgvibe } from "../../src/query-builder";
import type { Database } from "../utils/test-types";
import { createTestDatabase, waitForDatabase } from "../utils/test-config";

describe("JOIN Operations", () => {
  let db: pgvibe<Database>;

  beforeAll(async () => {
    db = createTestDatabase();

    // Wait for database to be ready
    await waitForDatabase();
  });

  afterAll(async () => {
    if (db && typeof (db as any).destroy === "function") {
      await (db as any).destroy();
    }
  });

  describe("SQL Generation", () => {
    test("INNER JOIN generates correct SQL", () => {
      const { sql, parameters } = db
        .selectFrom("users")
        .innerJoin("posts", "id", "user_id")
        .compile();

      expect(sql).toBe(
        "SELECT * FROM users INNER JOIN posts ON users.id = posts.user_id"
      );
      expect(parameters).toEqual([]);
    });

    test("LEFT JOIN generates correct SQL", () => {
      const { sql, parameters } = db
        .selectFrom("users")
        .leftJoin("posts", "id", "user_id")
        .compile();

      expect(sql).toBe(
        "SELECT * FROM users LEFT JOIN posts ON users.id = posts.user_id"
      );
      expect(parameters).toEqual([]);
    });

    test("RIGHT JOIN generates correct SQL", () => {
      const { sql, parameters } = db
        .selectFrom("users")
        .rightJoin("posts", "id", "user_id")
        .compile();

      expect(sql).toBe(
        "SELECT * FROM users RIGHT JOIN posts ON users.id = posts.user_id"
      );
      expect(parameters).toEqual([]);
    });

    test("FULL JOIN generates correct SQL", () => {
      const { sql, parameters } = db
        .selectFrom("users")
        .fullJoin("posts", "id", "user_id")
        .compile();

      expect(sql).toBe(
        "SELECT * FROM users FULL JOIN posts ON users.id = posts.user_id"
      );
      expect(parameters).toEqual([]);
    });

    test("Multiple JOINs generate correct SQL", () => {
      const { sql, parameters } = db
        .selectFrom("users")
        .innerJoin("posts", "id", "user_id")
        .leftJoin("comments", "id", "user_id")
        .compile();

      expect(sql).toBe(
        "SELECT * FROM users INNER JOIN posts ON users.id = posts.user_id LEFT JOIN comments ON users.id = comments.user_id"
      );
      expect(parameters).toEqual([]);
    });

    test("JOIN with WHERE clause generates correct SQL", () => {
      const { sql, parameters } = db
        .selectFrom("users")
        .innerJoin("posts", "id", "user_id")
        .where("active", "=", true)
        .compile();

      expect(sql).toBe(
        "SELECT * FROM users INNER JOIN posts ON users.id = posts.user_id WHERE active = $1"
      );
      expect(parameters).toEqual([true]);
    });

    test("JOIN with ORDER BY generates correct SQL", () => {
      const { sql, parameters } = db
        .selectFrom("users")
        .innerJoin("posts", "id", "user_id")
        .orderBy("name", "asc")
        .compile();

      expect(sql).toBe(
        "SELECT * FROM users INNER JOIN posts ON users.id = posts.user_id ORDER BY name ASC"
      );
      expect(parameters).toEqual([]);
    });

    test("JOIN with LIMIT and OFFSET generates correct SQL", () => {
      const { sql, parameters } = db
        .selectFrom("users")
        .innerJoin("posts", "id", "user_id")
        .limit(10)
        .offset(5)
        .compile();

      expect(sql).toBe(
        "SELECT * FROM users INNER JOIN posts ON users.id = posts.user_id LIMIT 10 OFFSET 5"
      );
      expect(parameters).toEqual([]);
    });

    test("Complex JOIN with multiple clauses generates correct SQL", () => {
      const { sql, parameters } = db
        .selectFrom("users")
        .select(["name", "email"])
        .innerJoin("posts", "id", "user_id")
        .leftJoin("comments", "id", "post_id")
        .where("active", "=", true)
        .where("posts.published", "=", true)
        .orderBy("created_at", "desc")
        .limit(20)
        .compile();

      expect(sql).toBe(
        "SELECT name, email FROM users INNER JOIN posts ON users.id = posts.user_id LEFT JOIN comments ON users.id = comments.post_id WHERE active = $1 AND posts.published = $2 ORDER BY created_at DESC LIMIT 20"
      );
      expect(parameters).toEqual([true, true]);
    });
  });

  describe("Database Integration", () => {
    test("INNER JOIN executes and returns results", async () => {
      const results = await db
        .selectFrom("users")
        .select(["name", "email"])
        .innerJoin("posts", "id", "user_id")
        .where("active", "=", true)
        .execute();

      expect(Array.isArray(results)).toBe(true);
      expect(results.length).toBeGreaterThan(0);

      // Check that we have user data for each result
      for (const result of results) {
        expect(result).toHaveProperty("name");
        expect(result).toHaveProperty("email");
        expect(typeof result.name).toBe("string");
      }
    });

    test("LEFT JOIN includes users without posts", async () => {
      // First, ensure we have a user without posts by checking data
      const allUsers = await db.selectFrom("users").execute();
      const userPosts = await db.selectFrom("posts").execute();

      const usersWithPosts = new Set(userPosts.map((p) => p.user_id));
      const usersWithoutPosts = allUsers.filter(
        (u) => !usersWithPosts.has(u.id)
      );

      const leftJoinResults = await db
        .selectFrom("users")
        .select(["name", "email"]) // Use columns that are unique to users table
        .leftJoin("posts", "id", "user_id")
        .execute();

      const innerJoinResults = await db
        .selectFrom("users")
        .select(["name", "email"]) // Use columns that are unique to users table
        .innerJoin("posts", "id", "user_id")
        .execute();

      // LEFT JOIN should include more or equal rows than INNER JOIN
      expect(leftJoinResults.length).toBeGreaterThanOrEqual(
        innerJoinResults.length
      );
    });

    test("JOIN with WHERE clause filters correctly", async () => {
      const results = await db
        .selectFrom("users")
        .innerJoin("posts", "id", "user_id")
        .select(["name", "published"]) // Select published column explicitly
        .where("posts.published", "=", true)
        .execute();

      expect(Array.isArray(results)).toBe(true);

      // If we have results, verify they match the filter
      for (const result of results) {
        expect(result.published).toBe(true);
      }
    });

    test("Multiple JOINs work correctly", async () => {
      const results = await db
        .selectFrom("users")
        .select(["name"])
        .innerJoin("posts", "id", "user_id")
        .innerJoin("comments", "id", "user_id")
        .limit(5)
        .execute();

      expect(Array.isArray(results)).toBe(true);

      // Each result should have a name property
      for (const result of results) {
        expect(result).toHaveProperty("name");
        expect(typeof result.name).toBe("string");
      }
    });

    test("JOIN with ORDER BY returns sorted results", async () => {
      const results = await db
        .selectFrom("users")
        .select(["name"])
        .innerJoin("posts", "id", "user_id")
        .orderBy("name", "asc")
        .limit(3)
        .execute();

      expect(Array.isArray(results)).toBe(true);

      if (results.length > 1) {
        // Check that results are sorted by name
        for (let i = 1; i < results.length; i++) {
          expect(results[i].name >= results[i - 1].name).toBe(true);
        }
      }
    });
  });

  describe("Type Safety", () => {
    test("JOIN allows access to columns from joined tables", () => {
      // This test is mainly about TypeScript compilation
      const query = db
        .selectFrom("users")
        .innerJoin("posts", "id", "user_id")
        .select(["name", "title"]) // name from users, title from posts
        .where("active", "=", true) // active from users
        .where("posts.published", "=", true); // published from posts

      expect(query).toBeDefined();

      const { sql } = query.compile();
      expect(sql).toContain("SELECT name, title");
      expect(sql).toContain("INNER JOIN posts");
      expect(sql).toContain("WHERE active");
      expect(sql).toContain("AND posts.published");
    });
  });

  describe("Edge Cases", () => {
    test("JOIN without WHERE clause works", () => {
      const { sql, parameters } = db
        .selectFrom("users")
        .innerJoin("posts", "id", "user_id")
        .compile();

      expect(sql).toBe(
        "SELECT * FROM users INNER JOIN posts ON users.id = posts.user_id"
      );
      expect(parameters).toEqual([]);
    });

    test("Multiple same-type JOINs work", () => {
      const { sql, parameters } = db
        .selectFrom("users")
        .leftJoin("posts", "id", "user_id")
        .leftJoin("comments", "id", "user_id")
        .compile();

      expect(sql).toBe(
        "SELECT * FROM users LEFT JOIN posts ON users.id = posts.user_id LEFT JOIN comments ON users.id = comments.user_id"
      );
      expect(parameters).toEqual([]);
    });

    test("JOIN with complex WHERE conditions", () => {
      const { sql, parameters } = db
        .selectFrom("users")
        .innerJoin("posts", "id", "user_id")
        .where("active", "=", true)
        .where("created_at", ">", new Date("2023-01-01"))
        .where("title", "like", "%test%")
        .compile();

      expect(sql).toBe(
        "SELECT * FROM users INNER JOIN posts ON users.id = posts.user_id WHERE (active = $1 AND created_at > $2 AND title LIKE $3)"
      );
      expect(parameters).toEqual([true, new Date("2023-01-01"), "%test%"]);
    });
  });
});
