// Database Execution Integration Tests
// Tests actual .execute() calls against real PostgreSQL database
// Extracted from builder tests to separate SQL generation from database execution

import { describe, test, expect, beforeAll } from "bun:test";
import { ZenQ } from "../../src/query-builder";
import type { Database } from "../utils/test-types";
import { createTestDatabase, waitForDatabase } from "../utils/test-config";

describe("Database Execution Integration Tests", () => {
  let db: ZenQ<Database>;

  beforeAll(async () => {
    // Create ZenQ instance with centralized test configuration
    db = createTestDatabase();

    // Wait for database to be ready
    await waitForDatabase();
  });

  describe("SELECT Method Execution", () => {
    test("should execute SELECT with specific columns", async () => {
      const users = await db
        .selectFrom("users")
        .select(["id", "name", "email"])
        .execute();

      expect(Array.isArray(users)).toBe(true);
      if (users.length > 0) {
        const user = users[0];
        expect(user).toHaveProperty("id");
        expect(user).toHaveProperty("name");
        expect(user).toHaveProperty("email");
        // Should not have other properties like 'active' or 'created_at'
        expect(user).not.toHaveProperty("active");
        expect(user).not.toHaveProperty("created_at");
      }
    });

    test("should execute SELECT with all columns", async () => {
      const users = await db
        .selectFrom("users")
        .select(["id", "name", "email", "active", "created_at"])
        .limit(1)
        .execute();

      expect(Array.isArray(users)).toBe(true);
      if (users.length > 0) {
        const user = users[0];
        expect(user).toHaveProperty("id");
        expect(user).toHaveProperty("name");
        expect(user).toHaveProperty("email");
        expect(user).toHaveProperty("active");
        expect(user).toHaveProperty("created_at");
      }
    });
  });

  describe("JOIN Execution", () => {
    test("should execute INNER JOIN", async () => {
      const result = await db
        .selectFrom("users")
        .innerJoin("posts", "users.id", "posts.user_id")
        .select(["users.name", "posts.title"])
        .execute();

      expect(Array.isArray(result)).toBe(true);
      result.forEach((row) => {
        expect(row).toHaveProperty("name");
        expect(row).toHaveProperty("title");
        expect(typeof row.name).toBe("string");
        expect(typeof row.title).toBe("string");
      });
    });

    test("should execute LEFT JOIN", async () => {
      const allUsers = await db.selectFrom("users").execute();
      const userPosts = await db.selectFrom("posts").execute();

      const result = await db
        .selectFrom("users")
        .leftJoin("posts", "users.id", "posts.user_id")
        .select(["users.name", "posts.title"])
        .execute();

      expect(Array.isArray(result)).toBe(true);
      // LEFT JOIN should return at least as many rows as there are users
      expect(result.length).toBeGreaterThanOrEqual(allUsers.length);
    });

    test("should execute RIGHT JOIN", async () => {
      const result = await db
        .selectFrom("users")
        .rightJoin("posts", "users.id", "posts.user_id")
        .select(["users.name", "posts.title"])
        .execute();

      expect(Array.isArray(result)).toBe(true);
      result.forEach((row) => {
        expect(row).toHaveProperty("name");
        expect(row).toHaveProperty("title");
        // In RIGHT JOIN, posts.title should never be null, but users.name might be
        expect(row.title).not.toBeNull();
      });
    });

    test("should execute complex multi-table JOIN", async () => {
      const result = await db
        .selectFrom("users")
        .innerJoin("posts", "users.id", "posts.user_id")
        .innerJoin("comments", "posts.id", "comments.post_id")
        .select(["users.name", "posts.title", "comments.content"])
        .execute();

      expect(Array.isArray(result)).toBe(true);
      result.forEach((row) => {
        expect(row).toHaveProperty("name");
        expect(row).toHaveProperty("title");
        expect(row).toHaveProperty("content");
      });
    });
  });

  describe("Advanced WHERE Execution", () => {
    test("should execute WHERE with multiple conditions", async () => {
      const result = await db
        .selectFrom("users")
        .select(["id", "name", "active"])
        .where("active", "=", true)
        .where("id", ">", 0)
        .execute();

      expect(Array.isArray(result)).toBe(true);
      result.forEach((user) => {
        expect(user.active).toBe(true);
        expect(user.id).toBeGreaterThan(0);
      });
    });

    test("should execute WHERE with IN operator", async () => {
      const result = await db
        .selectFrom("users")
        .select(["id", "name"])
        .where("id", "in", [1, 2, 3])
        .execute();

      expect(Array.isArray(result)).toBe(true);
      result.forEach((user) => {
        expect([1, 2, 3]).toContain(user.id);
      });
    });

    test("should execute WHERE with LIKE operator", async () => {
      const result = await db
        .selectFrom("users")
        .select(["name"])
        .where("name", "like", "J%")
        .execute();

      expect(Array.isArray(result)).toBe(true);
      result.forEach((user) => {
        expect(user.name.startsWith("J")).toBe(true);
      });
    });

    test("should execute WHERE with NULL checks", async () => {
      const result = await db
        .selectFrom("users")
        .select(["name", "email"])
        .where("email", "is not", null)
        .execute();

      expect(Array.isArray(result)).toBe(true);
      result.forEach((user) => {
        expect(user.email).not.toBeNull();
      });
    });

    test("should execute complex nested WHERE conditions", async () => {
      const result = await db
        .selectFrom("users")
        .select(["id", "name", "active"])
        .where(({ eb }) =>
          eb.and([
            eb.or([eb("active", "=", true), eb("name", "like", "Admin%")]),
            eb("id", ">", 0),
          ])
        )
        .execute();

      expect(Array.isArray(result)).toBe(true);
      result.forEach((user) => {
        expect(user.id).toBeGreaterThan(0);
        expect(user.active === true || user.name.startsWith("Admin")).toBe(
          true
        );
      });
    });
  });

  describe("ORDER BY Execution", () => {
    test("should execute ORDER BY single column", async () => {
      const result = await db
        .selectFrom("users")
        .select(["id", "name"])
        .orderBy("name", "asc")
        .execute();

      expect(Array.isArray(result)).toBe(true);
      if (result.length > 1) {
        // Check that names are in ascending order
        for (let i = 1; i < result.length; i++) {
          expect(result[i].name >= result[i - 1].name).toBe(true);
        }
      }
    });

    test("should execute ORDER BY multiple columns", async () => {
      const result = await db
        .selectFrom("users")
        .select(["id", "name", "active"])
        .orderBy([
          { column: "active", direction: "desc" },
          { column: "name", direction: "asc" },
        ])
        .execute();

      expect(Array.isArray(result)).toBe(true);
      // Should be ordered by active DESC, then name ASC
    });

    test("should execute ORDER BY with JOIN", async () => {
      const result = await db
        .selectFrom("users")
        .innerJoin("posts", "users.id", "posts.user_id")
        .select(["users.name", "posts.title", "posts.created_at"])
        .orderBy("posts.created_at", "desc")
        .execute();

      expect(Array.isArray(result)).toBe(true);
      if (result.length > 1) {
        // Check that posts are ordered by created_at DESC
        for (let i = 1; i < result.length; i++) {
          expect(result[i].created_at <= result[i - 1].created_at).toBe(true);
        }
      }
    });

    test("should execute ORDER BY with nullable columns", async () => {
      const result = await db
        .selectFrom("users")
        .select(["name", "email"])
        .orderBy("email", "desc")
        .execute();

      expect(Array.isArray(result)).toBe(true);
      // Should complete without errors even with null emails
    });
  });

  describe("LIMIT and OFFSET Execution", () => {
    test("should execute LIMIT", async () => {
      const result = await db
        .selectFrom("users")
        .select(["id", "name"])
        .limit(3)
        .execute();

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeLessThanOrEqual(3);
    });

    test("should execute OFFSET", async () => {
      const result = await db
        .selectFrom("users")
        .select(["id", "name"])
        .offset(2)
        .execute();

      expect(Array.isArray(result)).toBe(true);
      // Should skip first 2 records
    });

    test("should execute LIMIT with OFFSET", async () => {
      const result = await db
        .selectFrom("users")
        .select(["id", "name"])
        .limit(2)
        .offset(1)
        .execute();

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeLessThanOrEqual(2);
    });

    test("should execute LIMIT with ORDER BY", async () => {
      const result = await db
        .selectFrom("users")
        .select(["id", "name"])
        .orderBy("id", "asc")
        .limit(3)
        .execute();

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeLessThanOrEqual(3);
      if (result.length > 1) {
        // Should be ordered by ID
        for (let i = 1; i < result.length; i++) {
          expect(result[i].id >= result[i - 1].id).toBe(true);
        }
      }
    });

    test("should handle LIMIT 0", async () => {
      const users = await db.selectFrom("users").limit(0).execute();
      expect(Array.isArray(users)).toBe(true);
      expect(users.length).toBe(0);
    });

    test("should handle large LIMIT", async () => {
      const users = await db.selectFrom("users").limit(100).execute();
      expect(Array.isArray(users)).toBe(true);
    });

    test("should handle large OFFSET", async () => {
      const users = await db.selectFrom("users").offset(100).execute();
      expect(Array.isArray(users)).toBe(true);
    });
  });

  describe("Qualified Columns Execution", () => {
    test("should execute qualified columns in JOIN", async () => {
      const result = await db
        .selectFrom("users")
        .innerJoin("posts", "users.id", "posts.user_id")
        .select([
          "users.name",
          "posts.title",
          "users.active",
          "posts.published",
        ])
        .where("users.active", "=", true)
        .where("posts.published", "=", true)
        .execute();

      expect(Array.isArray(result)).toBe(true);
      result.forEach((row) => {
        expect(row).toHaveProperty("name");
        expect(row).toHaveProperty("title");
        expect(row).toHaveProperty("active");
        expect(row).toHaveProperty("published");
        expect(row.active).toBe(true);
        expect(row.published).toBe(true);
      });
    });
  });
});
