// PostgreSQL integration tests with real database
// Tests actual query execution against Docker PostgreSQL instance

import { describe, test, expect, beforeAll, afterAll } from "bun:test";
import { ZenQ } from "../../src/query-builder";
import type { Database } from "../utils/test-types";
import { createTestDatabase, waitForDatabase } from "../utils/test-config";

describe("PostgreSQL Integration Tests", () => {
  let db: ZenQ<Database>;

  beforeAll(async () => {
    // Create ZenQ instance with centralized test configuration
    db = createTestDatabase();

    // Wait for database to be ready
    await waitForDatabase();
  });

  describe("Basic Query Execution", () => {
    test("should execute simple SELECT * FROM users", async () => {
      const users = await db.selectFrom("users").execute();

      // Check that we get an array
      expect(Array.isArray(users)).toBe(true);

      // Check that we have test data (from init.sql)
      expect(users.length).toBeGreaterThan(0);

      // Check structure of first user
      const firstUser = users[0];
      expect(firstUser).toHaveProperty("id");
      expect(firstUser).toHaveProperty("name");
      expect(firstUser).toHaveProperty("email");
      expect(firstUser).toHaveProperty("active");
      expect(firstUser).toHaveProperty("created_at");

      // Check types
      expect(typeof firstUser.id).toBe("number");
      expect(typeof firstUser.name).toBe("string");
      expect(typeof firstUser.active).toBe("boolean");
      expect(firstUser.created_at).toBeInstanceOf(Date);
    });

    test("should execute SELECT with WHERE clause", async () => {
      const activeUsers = await db
        .selectFrom("users")
        .where("active", "=", true)
        .execute();

      expect(Array.isArray(activeUsers)).toBe(true);
      expect(activeUsers.length).toBeGreaterThan(0);

      // All users should be active
      activeUsers.forEach((user) => {
        expect(user.active).toBe(true);
      });
    });

    test("should execute SELECT with different WHERE conditions", async () => {
      // Test with string
      const johnUsers = await db
        .selectFrom("users")
        .where("name", "=", "John Doe")
        .execute();

      expect(johnUsers.length).toBeGreaterThanOrEqual(0);
      if (johnUsers.length > 0) {
        expect(johnUsers[0].name).toBe("John Doe");
      }

      // Test with number
      const userById = await db
        .selectFrom("users")
        .where("id", "=", 1)
        .execute();

      expect(userById.length).toBeLessThanOrEqual(1);
      if (userById.length > 0) {
        expect(userById[0].id).toBe(1);
      }
    });

    test("should execute SELECT from posts table", async () => {
      const posts = await db.selectFrom("posts").execute();

      expect(Array.isArray(posts)).toBe(true);

      if (posts.length > 0) {
        const firstPost = posts[0];
        expect(firstPost).toHaveProperty("id");
        expect(firstPost).toHaveProperty("user_id");
        expect(firstPost).toHaveProperty("title");
        expect(firstPost).toHaveProperty("content");
        expect(firstPost).toHaveProperty("published");
        expect(firstPost).toHaveProperty("created_at");

        expect(typeof firstPost.id).toBe("number");
        expect(typeof firstPost.user_id).toBe("number");
        expect(typeof firstPost.title).toBe("string");
        expect(typeof firstPost.published).toBe("boolean");
      }
    });
  });

  describe("Expression Builder WHERE Clauses", () => {
    test("should execute basic expression builder WHERE conditions", async () => {
      // Basic eb() function usage
      const activeUsers = await db
        .selectFrom("users")
        .where(({ eb }) => eb("active", "=", true))
        .execute();

      expect(Array.isArray(activeUsers)).toBe(true);
      expect(activeUsers.length).toBeGreaterThan(0);

      // All users should be active
      activeUsers.forEach((user) => {
        expect(user.active).toBe(true);
      });
    });

    test("should execute expression builder with different data types", async () => {
      // Number comparison
      const userById = await db
        .selectFrom("users")
        .where(({ eb }) => eb("id", ">=", 1))
        .execute();

      expect(Array.isArray(userById)).toBe(true);
      userById.forEach((user) => {
        expect(user.id).toBeGreaterThanOrEqual(1);
      });

      // String comparison
      const johnUsers = await db
        .selectFrom("users")
        .where(({ eb }) => eb("name", "=", "John Doe"))
        .execute();

      johnUsers.forEach((user) => {
        expect(user.name).toBe("John Doe");
      });

      // Date comparison
      const recentUsers = await db
        .selectFrom("users")
        .where(({ eb }) => eb("created_at", ">", new Date("2020-01-01")))
        .execute();

      expect(Array.isArray(recentUsers)).toBe(true);
      recentUsers.forEach((user) => {
        expect(user.created_at.getTime()).toBeGreaterThan(
          new Date("2020-01-01").getTime()
        );
      });
    });

    test("should execute expression builder with string operators", async () => {
      // LIKE operator
      const johnLikeUsers = await db
        .selectFrom("users")
        .where(({ eb }) => eb("name", "like", "John%"))
        .execute();

      johnLikeUsers.forEach((user) => {
        expect(user.name.startsWith("John")).toBe(true);
      });

      // ILIKE operator (case-insensitive)
      const johnIlikeUsers = await db
        .selectFrom("users")
        .where(({ eb }) => eb("name", "ilike", "john%"))
        .execute();

      johnIlikeUsers.forEach((user) => {
        expect(user.name.toLowerCase().startsWith("john")).toBe(true);
      });
    });

    test("should execute expression builder with array operators", async () => {
      // IN operator with multiple values
      const usersInList = await db
        .selectFrom("users")
        .where(({ eb }) => eb("id", "in", [1, 2, 3]))
        .execute();

      expect(Array.isArray(usersInList)).toBe(true);
      usersInList.forEach((user) => {
        expect([1, 2, 3]).toContain(user.id);
      });

      // NOT IN operator
      const usersNotInList = await db
        .selectFrom("users")
        .where(({ eb }) => eb("id", "not in", [999, 1000]))
        .execute();

      usersNotInList.forEach((user) => {
        expect([999, 1000]).not.toContain(user.id);
      });
    });

    test("should execute expression builder with null operations", async () => {
      // IS NULL
      const usersWithNullEmail = await db
        .selectFrom("users")
        .where(({ eb }) => eb("email", "is", null))
        .execute();

      usersWithNullEmail.forEach((user) => {
        expect(user.email).toBeNull();
      });

      // IS NOT NULL
      const usersWithEmail = await db
        .selectFrom("users")
        .where(({ eb }) => eb("email", "is not", null))
        .execute();

      usersWithEmail.forEach((user) => {
        expect(user.email).not.toBeNull();
      });
    });

    test("should execute expression builder with AND operations", async () => {
      const activeUsersWithEmail = await db
        .selectFrom("users")
        .where(({ eb }) =>
          eb.and([eb("active", "=", true), eb("email", "is not", null)])
        )
        .execute();

      activeUsersWithEmail.forEach((user) => {
        expect(user.active).toBe(true);
        expect(user.email).not.toBeNull();
      });
    });

    test("should execute expression builder with OR operations", async () => {
      const inactiveOrNullEmail = await db
        .selectFrom("users")
        .where(({ eb }) =>
          eb.or([eb("active", "=", false), eb("email", "is", null)])
        )
        .execute();

      inactiveOrNullEmail.forEach((user) => {
        expect(user.active === false || user.email === null).toBe(true);
      });
    });

    test("should execute expression builder with nested AND/OR operations", async () => {
      // Complex nested logic: (active = true AND email IS NOT NULL) OR (name LIKE 'John%')
      const complexCondition = await db
        .selectFrom("users")
        .where(({ eb }) =>
          eb.or([
            eb.and([eb("active", "=", true), eb("email", "is not", null)]),
            eb("name", "like", "John%"),
          ])
        )
        .execute();

      expect(Array.isArray(complexCondition)).toBe(true);
      complexCondition.forEach((user) => {
        const matchesActiveWithEmail =
          user.active === true && user.email !== null;
        const matchesJohnName = user.name.startsWith("John");
        expect(matchesActiveWithEmail || matchesJohnName).toBe(true);
      });
    });

    test("should execute expression builder with comparison operators", async () => {
      // Greater than
      const usersWithHighId = await db
        .selectFrom("users")
        .where(({ eb }) => eb("id", ">", 2))
        .execute();

      usersWithHighId.forEach((user) => {
        expect(user.id).toBeGreaterThan(2);
      });

      // Less than or equal
      const usersWithLowId = await db
        .selectFrom("users")
        .where(({ eb }) => eb("id", "<=", 3))
        .execute();

      usersWithLowId.forEach((user) => {
        expect(user.id).toBeLessThanOrEqual(3);
      });

      // Not equal
      const usersNotId1 = await db
        .selectFrom("users")
        .where(({ eb }) => eb("id", "!=", 1))
        .execute();

      usersNotId1.forEach((user) => {
        expect(user.id).not.toBe(1);
      });
    });

    test("should execute expression builder with JOIN operations", async () => {
      const activeUsersWithPublishedPosts = await db
        .selectFrom("users")
        .innerJoin("posts", "users.id", "posts.user_id")
        .select([
          "users.name",
          "users.active",
          "posts.title",
          "posts.published",
        ])
        .where(({ eb }) =>
          eb.and([
            eb("users.active", "=", true),
            eb("posts.published", "=", true),
          ])
        )
        .execute();

      activeUsersWithPublishedPosts.forEach((result) => {
        expect(result.active).toBe(true);
        expect(result.published).toBe(true);
      });
    });

    test("should execute expression builder mixed with regular WHERE", async () => {
      // Mix expression builder with regular WHERE clauses
      const mixedConditions = await db
        .selectFrom("users")
        .where("active", "=", true)
        .where(({ eb }) => eb("email", "is not", null))
        .where(({ eb }) =>
          eb.or([eb("name", "like", "John%"), eb("name", "like", "Jane%")])
        )
        .execute();

      mixedConditions.forEach((user) => {
        expect(user.active).toBe(true);
        expect(user.email).not.toBeNull();
        expect(
          user.name.startsWith("John") || user.name.startsWith("Jane")
        ).toBe(true);
      });
    });

    test("should execute expression builder with posts table", async () => {
      // Test with different table and data types
      const recentPublishedPosts = await db
        .selectFrom("posts")
        .where(({ eb }) =>
          eb.and([
            eb("published", "=", true),
            eb("created_at", ">", new Date("2020-01-01")),
            eb("title", "is not", null),
          ])
        )
        .execute();

      recentPublishedPosts.forEach((post) => {
        expect(post.published).toBe(true);
        expect(post.created_at.getTime()).toBeGreaterThan(
          new Date("2020-01-01").getTime()
        );
        expect(post.title).not.toBeNull();
      });
    });

    test("should execute expression builder with date strings", async () => {
      // Test the exact pattern requested by the user: mixing expression builder and regular WHERE with date strings
      const activeUsers = await db
        .selectFrom("users")
        .select(["id", "name", "active", "created_at"])
        .where(({ eb, or }) => [
          or([
            eb("active", "=", true),
            eb("name", "like", "John%"), // Use LIKE for more flexible matching
            eb("created_at", ">", "2020-01-01"), // Use past date that will match test data
          ]),
        ])
        .where("created_at", "<", "2030-12-31") // String for date column in regular WHERE, use future date
        .execute();

      expect(Array.isArray(activeUsers)).toBe(true);
      // Should have results since we're using broad conditions
      expect(activeUsers.length).toBeGreaterThan(0);

      // Verify all results match the conditions
      activeUsers.forEach((user) => {
        expect(user.created_at.getTime()).toBeLessThan(
          new Date("2030-12-31").getTime()
        );
        // Should match at least one of the OR conditions
        const matchesActive = user.active === true;
        const matchesName = user.name.startsWith("John");
        const matchesDate =
          user.created_at.getTime() > new Date("2020-01-01").getTime();
        expect(matchesActive || matchesName || matchesDate).toBe(true);
      });
    });

    test("should support date strings with various operators", async () => {
      // Test different operators with date strings
      const users = await db
        .selectFrom("users")
        .where(({ eb }) =>
          eb.and([
            eb("created_at", ">=", "2020-01-01"), // Greater than or equal
            eb("created_at", "<=", "2030-12-31"), // Less than or equal
            eb("created_at", "!=", "2023-06-15"), // Not equal
          ])
        )
        .execute();

      expect(Array.isArray(users)).toBe(true);
      users.forEach((user) => {
        expect(user.created_at.getTime()).toBeGreaterThanOrEqual(
          new Date("2020-01-01").getTime()
        );
        expect(user.created_at.getTime()).toBeLessThanOrEqual(
          new Date("2030-12-31").getTime()
        );
        expect(user.created_at.getTime()).not.toBe(
          new Date("2023-06-15").getTime()
        );
      });
    });

    test("should support date strings in IN/NOT IN operations", async () => {
      // Test IN operator with date strings
      const usersInDateRange = await db
        .selectFrom("users")
        .where(({ eb }) =>
          eb("created_at", "in", ["2023-01-01", "2023-06-01", "2023-12-01"])
        )
        .execute();

      expect(Array.isArray(usersInDateRange)).toBe(true);
      // Check that if we have results, they match the expected dates
      usersInDateRange.forEach((user) => {
        const dateStr = user.created_at.toISOString().split("T")[0];
        expect(["2023-01-01", "2023-06-01", "2023-12-01"]).toContain(dateStr);
      });

      // Test NOT IN operator with date strings
      const usersNotInDateRange = await db
        .selectFrom("users")
        .where(({ eb }) =>
          eb("created_at", "not in", ["1999-01-01", "1999-06-01"])
        )
        .execute();

      expect(Array.isArray(usersNotInDateRange)).toBe(true);
      usersNotInDateRange.forEach((user) => {
        const dateStr = user.created_at.toISOString().split("T")[0];
        expect(["1999-01-01", "1999-06-01"]).not.toContain(dateStr);
      });
    });
  });

  describe("Error Handling", () => {
    test("should handle non-existent table gracefully", async () => {
      try {
        // This should fail because 'nonexistent' table doesn't exist
        await (db as any).selectFrom("nonexistent").execute();
        expect(true).toBe(false); // Should not reach here
      } catch (error) {
        expect(error).toBeDefined();
        expect(error.message).toContain(
          'relation "nonexistent" does not exist'
        );
      }
    });

    test("should handle invalid WHERE values gracefully", async () => {
      try {
        // This should work but return empty results
        const users = await db
          .selectFrom("users")
          .where("id", "=", 99999)
          .execute();

        expect(Array.isArray(users)).toBe(true);
        expect(users.length).toBe(0);
      } catch (error) {
        // Should not throw for valid query with no results
        expect(true).toBe(false);
      }
    });
  });
});
