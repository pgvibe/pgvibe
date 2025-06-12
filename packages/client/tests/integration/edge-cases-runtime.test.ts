// Runtime tests for edge cases
// These tests verify that edge case scenarios work correctly with actual database execution

import { describe, it, expect } from "bun:test";
import { ZenQ } from "../../src/query-builder";
import type { ExampleDatabase } from "../../playground/types";

const db = new ZenQ<ExampleDatabase>({
  connectionString:
    "postgresql://zenq_user:zenq_password@localhost:54322/zenq_test",
});

describe("Edge Cases Runtime Tests", () => {
  describe("Boundary Conditions", () => {
    it("should handle LIMIT 0 correctly", async () => {
      const result = await db
        .selectFrom("users")
        .select(["id", "name"])
        .limit(0)
        .execute();

      expect(result).toBeArray();
      expect(result).toHaveLength(0);
    });

    it("should handle OFFSET 0 correctly", async () => {
      const result = await db
        .selectFrom("users")
        .select(["id", "name"])
        .offset(0)
        .execute();

      expect(result).toBeArray();
      expect(result.length).toBeGreaterThanOrEqual(0);
    });

    it("should handle large LIMIT numbers gracefully", async () => {
      const result = await db
        .selectFrom("users")
        .select(["id", "name"])
        .limit(999999)
        .execute();

      expect(result).toBeArray();
      // Should return all available users (up to 999999)
    });

    it("should handle large OFFSET numbers gracefully", async () => {
      const result = await db
        .selectFrom("users")
        .select(["id", "name"])
        .offset(999999)
        .execute();

      expect(result).toBeArray();
      expect(result).toHaveLength(0); // Should return empty array if offset exceeds data
    });
  });

  describe("Column Selection Edge Cases", () => {
    it("should handle selecting all available columns", async () => {
      const result = await db
        .selectFrom("users")
        .select(["id", "name", "email", "active", "created_at"])
        .limit(1)
        .execute();

      expect(result).toBeArray();
      if (result.length > 0) {
        const user = result[0]!;
        expect(user).toHaveProperty("id");
        expect(user).toHaveProperty("name");
        expect(user).toHaveProperty("email");
        expect(user).toHaveProperty("active");
        expect(user).toHaveProperty("created_at");
      }
    });
  });

  describe("Complex WHERE Conditions", () => {
    it("should handle multiple WHERE conditions correctly", async () => {
      const result = await db
        .selectFrom("users")
        .select(["id", "name"])
        .where("active", "=", true)
        .where("id", ">", 0)
        .execute();

      expect(result).toBeArray();
      // All returned users should be active and have positive IDs
      result.forEach((user) => {
        expect(user.id).toBeGreaterThan(0);
      });
    });

    it("should handle WHERE with different operators", async () => {
      const result = await db
        .selectFrom("posts")
        .select(["id", "title"])
        .where("published", "=", true)
        .where("id", "in", [1, 2, 3])
        .execute();

      expect(result).toBeArray();
      // All returned posts should have IDs 1, 2, or 3
      result.forEach((post) => {
        expect([1, 2, 3]).toContain(post.id);
      });
    });

    it("should handle WHERE with nullable columns", async () => {
      const result = await db
        .selectFrom("users")
        .select(["name", "email"])
        .where("email", "is not", null)
        .execute();

      expect(result).toBeArray();
      // All returned users should have non-null emails
      result.forEach((user) => {
        expect(user.email).not.toBeNull();
      });
    });
  });

  describe("Complex ORDER BY Scenarios", () => {
    it("should handle ORDER BY on nullable columns", async () => {
      const result = await db
        .selectFrom("users")
        .select(["name", "email"])
        .orderBy("email", "desc")
        .execute();

      expect(result).toBeArray();
      // Should complete without errors even with null emails
    });

    it("should handle multiple ORDER BY columns", async () => {
      const result = await db
        .selectFrom("users")
        .select(["id", "name", "created_at"])
        .orderBy([
          { column: "name", direction: "asc" },
          { column: "created_at", direction: "desc" },
        ])
        .limit(5)
        .execute();

      expect(result).toBeArray();
      expect(result.length).toBeLessThanOrEqual(5);
    });
  });

  describe("Multiple JOINs with Edge Cases", () => {
    it("should handle all three tables joined together", async () => {
      const result = await db
        .selectFrom("users")
        .innerJoin("posts", "users.id", "posts.user_id")
        .innerJoin("comments", "posts.id", "comments.post_id")
        .select(["users.name", "posts.title", "comments.content"])
        .limit(5)
        .execute();

      expect(result).toBeArray();
      result.forEach((row) => {
        expect(row).toHaveProperty("name");
        expect(row).toHaveProperty("title");
        expect(row).toHaveProperty("content");
      });
    });

    it("should handle mixed JOIN types with many columns", async () => {
      const result = await db
        .selectFrom("users")
        .leftJoin("posts", "users.id", "posts.user_id")
        .leftJoin("comments", "posts.id", "comments.post_id")
        .select([
          "users.id",
          "users.name",
          "users.email",
          "posts.title",
          "posts.content",
          "comments.content",
        ])
        .limit(5)
        .execute();

      expect(result).toBeArray();
      result.forEach((row) => {
        // Users columns should always be present
        expect(row).toHaveProperty("id");
        expect(row).toHaveProperty("name");
        expect(row).toHaveProperty("email");

        // Posts and comments columns might be null due to LEFT JOINs
        expect(row).toHaveProperty("title");
        expect(row).toHaveProperty("content");
      });
    });
  });

  describe("Method Chaining Edge Cases", () => {
    it("should handle methods in different orders", async () => {
      // Test different chaining orders
      const result1 = await db
        .selectFrom("users")
        .where("active", "=", true)
        .select(["name"])
        .orderBy("name", "asc")
        .limit(3)
        .execute();

      const result2 = await db
        .selectFrom("users")
        .orderBy("name", "asc")
        .where("active", "=", true)
        .limit(3)
        .select(["name"])
        .execute();

      // Both should work and return valid results
      expect(result1).toBeArray();
      expect(result2).toBeArray();
      expect(result1.length).toBeLessThanOrEqual(3);
      expect(result2.length).toBeLessThanOrEqual(3);
    });
  });
});

// Cleanup
export { db };
