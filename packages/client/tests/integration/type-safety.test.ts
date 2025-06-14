// Type safety integration tests
// Tests that column selection produces properly typed results

import { describe, test, expect, beforeAll } from "bun:test";
import { ZenQ } from "../../src/query-builder";
import { createTestDatabase } from "../utils/test-config";
import type { Database } from "../utils/test-types";

describe("Type Safety Integration Tests", () => {
  let db: ZenQ<Database>;

  beforeAll(async () => {
    db = createTestDatabase();
  });

  describe("Full Table Selection (SELECT *)", () => {
    test("should return full user objects with all properties", async () => {
      // SELECT * should return full table type
      const users = await db.selectFrom("users").execute();

      expect(users.length).toBeGreaterThan(0);

      const user = users[0]!; // Non-null assertion since we verified length > 0

      // All UserTable properties should be present
      expect(user).toHaveProperty("id");
      expect(user).toHaveProperty("name");
      expect(user).toHaveProperty("email");
      expect(user).toHaveProperty("active");
      expect(user).toHaveProperty("created_at");

      // Type checks
      expect(typeof user.id).toBe("number");
      expect(typeof user.name).toBe("string");
      expect(typeof user.active).toBe("boolean");
      expect(user.created_at).toBeInstanceOf(Date);

      // Email can be null
      expect(user.email === null || typeof user.email === "string").toBe(true);
    });

    test("should return full post objects with all properties", async () => {
      const posts = await db.selectFrom("posts").execute();

      if (posts.length > 0) {
        const post = posts[0]!; // Non-null assertion since we verified length > 0

        // All PostTable properties should be present
        expect(post).toHaveProperty("id");
        expect(post).toHaveProperty("user_id");
        expect(post).toHaveProperty("title");
        expect(post).toHaveProperty("content");
        expect(post).toHaveProperty("published");
        expect(post).toHaveProperty("created_at");

        // Type checks
        expect(typeof post.id).toBe("number");
        expect(typeof post.user_id).toBe("number");
        expect(typeof post.title).toBe("string");
        expect(typeof post.published).toBe("boolean");
        expect(post.created_at).toBeInstanceOf(Date);

        // Content can be null
        expect(post.content === null || typeof post.content === "string").toBe(
          true
        );
      }
    });
  });

  describe("Column Selection with WHERE", () => {
    test("should filter results correctly while maintaining types", async () => {
      // Test specific user
      const activeUsers = await db
        .selectFrom("users")
        .where("active", "=", true)
        .execute();

      expect(activeUsers.length).toBeGreaterThan(0);

      // All returned users should be active
      activeUsers.forEach((user) => {
        expect(user.active).toBe(true);
        // Should still have all properties
        expect(user).toHaveProperty("id");
        expect(user).toHaveProperty("name");
        expect(user).toHaveProperty("email");
        expect(user).toHaveProperty("created_at");
      });
    });

    test("should handle different column types in WHERE clauses", async () => {
      // String comparison
      const usersByName = await db
        .selectFrom("users")
        .where("name", "like", "John%")
        .execute();

      usersByName.forEach((user) => {
        expect(user.name.startsWith("John")).toBe(true);
      });

      // Number comparison
      const usersById = await db
        .selectFrom("users")
        .where("id", ">", 0)
        .execute();

      expect(usersById.length).toBeGreaterThan(0);
      usersById.forEach((user) => {
        expect(user.id).toBeGreaterThan(0);
      });

      // Boolean comparison
      const inactiveUsers = await db
        .selectFrom("users")
        .where("active", "=", false)
        .execute();

      inactiveUsers.forEach((user) => {
        expect(user.active).toBe(false);
      });
    });
  });

  describe("Multiple Table Types", () => {
    test("should handle users table correctly", async () => {
      const users = await db.selectFrom("users").execute();

      if (users.length > 0) {
        const user = users[0]!; // Non-null assertion since we verified length > 0

        // Check that it's a proper UserTable type
        const isUserType =
          typeof user.id === "number" &&
          typeof user.name === "string" &&
          typeof user.active === "boolean" &&
          user.created_at instanceof Date;

        expect(isUserType).toBe(true);
      }
    });

    test("should handle posts table correctly", async () => {
      const posts = await db.selectFrom("posts").execute();

      if (posts.length > 0) {
        const post = posts[0]!; // Non-null assertion since we verified length > 0

        // Check that it's a proper PostTable type
        const isPostType =
          typeof post.id === "number" &&
          typeof post.user_id === "number" &&
          typeof post.title === "string" &&
          typeof post.published === "boolean" &&
          post.created_at instanceof Date;

        expect(isPostType).toBe(true);
      }
    });

    test("should handle comments table correctly", async () => {
      const comments = await db.selectFrom("comments").execute();

      if (comments.length > 0) {
        const comment = comments[0]!; // Non-null assertion since we verified length > 0

        // Check that it's a proper CommentTable type
        const isCommentType =
          typeof comment.id === "number" &&
          typeof comment.post_id === "number" &&
          typeof comment.user_id === "number" &&
          typeof comment.content === "string" &&
          comment.created_at instanceof Date;

        expect(isCommentType).toBe(true);
      }
    });
  });

  describe("Edge Cases and Data Validation", () => {
    test("should handle nullable fields correctly", async () => {
      const users = await db.selectFrom("users").execute();

      if (users.length > 0) {
        users.forEach((user) => {
          // Email can be null or string
          if (user.email !== null) {
            expect(typeof user.email).toBe("string");
          }
        });
      }
    });

    test("should handle empty results gracefully", async () => {
      const nonExistentUsers = await db
        .selectFrom("users")
        .where("id", "=", 999999)
        .execute();

      expect(Array.isArray(nonExistentUsers)).toBe(true);
      expect(nonExistentUsers.length).toBe(0);
    });

    test("should maintain consistent typing across queries", async () => {
      // Multiple queries should return the same types
      const query1 = await db
        .selectFrom("users")
        .where("active", "=", true)
        .execute();
      const query2 = await db.selectFrom("users").where("id", ">", 0).execute();

      if (query1.length > 0 && query2.length > 0) {
        const user1 = query1[0];
        const user2 = query2[0];

        // Both should have the same property structure
        const user1Props = Object.keys(user1).sort();
        const user2Props = Object.keys(user2).sort();

        expect(user1Props).toEqual(user2Props);
      }
    });
  });
});
