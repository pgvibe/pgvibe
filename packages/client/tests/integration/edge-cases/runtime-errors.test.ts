// Runtime Edge Cases Integration Tests
// Tests edge case scenarios with isolated test tables

import { describe, test, expect, beforeAll, afterAll } from "bun:test";
import { pgvibe } from "../../../src/query-builder";
import {
  generateTestId,
  createTestDatabase,
  waitForDatabase,
} from "../utils/test-helpers";
import {
  createStandardTestTables,
  createTestTables,
  seedTestData,
} from "../utils/table-factory";
import { performTestCleanup } from "../utils/cleanup";

describe("Runtime Edge Cases Integration Tests", () => {
  const testId = generateTestId();
  const tables = createStandardTestTables(testId);
  let db: pgvibe<any>;
  let userIds: number[];
  let postIds: number[];

  beforeAll(async () => {
    db = createTestDatabase();
    await waitForDatabase();

    // Create isolated test tables
    await createTestTables(db, tables);

    // Seed with test data
    const seedResult = await seedTestData(db, tables);
    userIds = seedResult.userIds;
    postIds = seedResult.postIds;
  });

  afterAll(async () => {
    // Clean up our isolated tables
    const tableNames = [tables.users.name, tables.posts.name];
    if (tables.comments) {
      tableNames.push(tables.comments.name);
    }
    await performTestCleanup(db, tableNames);
  });

  describe("Boundary Conditions", () => {
    test("should handle LIMIT 0 correctly", async () => {
      const result = await db
        .selectFrom(tables.users.name)
        .select(["id", "name"])
        .limit(0)
        .execute();

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(0);
    });

    test("should handle OFFSET 0 correctly", async () => {
      const result = await db
        .selectFrom(tables.users.name)
        .select(["id", "name"])
        .offset(0)
        .execute();

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThanOrEqual(0);
    });

    test("should handle large LIMIT numbers gracefully", async () => {
      const result = await db
        .selectFrom(tables.users.name)
        .select(["id", "name"])
        .limit(999999)
        .execute();

      expect(Array.isArray(result)).toBe(true);
      // Should return all available users (up to 999999)
    });

    test("should handle large OFFSET numbers gracefully", async () => {
      const result = await db
        .selectFrom(tables.users.name)
        .select(["id", "name"])
        .offset(999999)
        .execute();

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(0); // Should return empty array if offset exceeds data
    });
  });

  describe("Column Selection Edge Cases", () => {
    test("should handle selecting all available columns", async () => {
      const result = await db
        .selectFrom(tables.users.name)
        .select(["id", "name", "email", "active", "created_at"])
        .limit(1)
        .execute();

      expect(Array.isArray(result)).toBe(true);
      if (result.length > 0) {
        const user = result[0];
        expect(user).toHaveProperty("id");
        expect(user).toHaveProperty("name");
        expect(user).toHaveProperty("email");
        expect(user).toHaveProperty("active");
        expect(user).toHaveProperty("created_at");
      }
    });
  });

  describe("Complex WHERE Conditions", () => {
    test("should handle multiple WHERE conditions correctly", async () => {
      const result = await db
        .selectFrom(tables.users.name)
        .select(["id", "name"])
        .where("active", "=", true)
        .where("id", ">", 0)
        .execute();

      expect(Array.isArray(result)).toBe(true);
      // All returned users should be active and have positive IDs
      result.forEach((user) => {
        expect(user.id).toBeGreaterThan(0);
      });
    });

    test("should handle WHERE with different operators", async () => {
      const result = await db
        .selectFrom(tables.posts.name)
        .select(["id", "title"])
        .where("published", "=", true)
        .where("id", "in", postIds.slice(0, 2))
        .execute();

      expect(Array.isArray(result)).toBe(true);
      // All returned posts should have IDs from our test data
      result.forEach((post) => {
        expect(postIds).toContain(post.id);
      });
    });

    test("should handle WHERE with nullable columns", async () => {
      const result = await db
        .selectFrom(tables.users.name)
        .select(["name", "email"])
        .where("email", "is not", null)
        .execute();

      expect(Array.isArray(result)).toBe(true);
      // All returned users should have non-null emails
      result.forEach((user) => {
        expect(user.email).not.toBeNull();
      });
    });
  });

  describe("Complex ORDER BY Scenarios", () => {
    test("should handle ORDER BY on nullable columns", async () => {
      const result = await db
        .selectFrom(tables.users.name)
        .select(["name", "email"])
        .orderBy("email", "desc")
        .execute();

      expect(Array.isArray(result)).toBe(true);
      // Should complete without errors even with null emails
    });

    test("should handle multiple ORDER BY columns", async () => {
      const result = await db
        .selectFrom(tables.users.name)
        .select(["id", "name", "created_at"])
        .orderBy([
          { column: "name", direction: "asc" },
          { column: "created_at", direction: "desc" },
        ])
        .limit(5)
        .execute();

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeLessThanOrEqual(5);
    });
  });

  describe("Multiple JOINs with Edge Cases", () => {
    test("should handle all three tables joined together", async () => {
      const result = await db
        .selectFrom(tables.users.name)
        .innerJoin(
          tables.posts.name,
          `${tables.users.name}.id`,
          `${tables.posts.name}.user_id`
        )
        .innerJoin(
          tables.comments!.name,
          `${tables.posts.name}.id`,
          `${tables.comments!.name}.post_id`
        )
        .select([
          `${tables.users.name}.name`,
          `${tables.posts.name}.title`,
          `${tables.comments!.name}.content`,
        ])
        .limit(5)
        .execute();

      expect(Array.isArray(result)).toBe(true);
      result.forEach((row) => {
        expect(row).toHaveProperty("name");
        expect(row).toHaveProperty("title");
        expect(row).toHaveProperty("content");
      });
    });

    test("should handle mixed JOIN types with many columns", async () => {
      const result = await db
        .selectFrom(tables.users.name)
        .leftJoin(
          tables.posts.name,
          `${tables.users.name}.id`,
          `${tables.posts.name}.user_id`
        )
        .leftJoin(
          tables.comments!.name,
          `${tables.posts.name}.id`,
          `${tables.comments!.name}.post_id`
        )
        .select([
          `${tables.users.name}.id`,
          `${tables.users.name}.name`,
          `${tables.users.name}.email`,
          `${tables.posts.name}.title`,
          `${tables.posts.name}.content`,
          `${tables.comments!.name}.content`,
        ])
        .limit(5)
        .execute();

      expect(Array.isArray(result)).toBe(true);
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
    test("should handle methods in different orders", async () => {
      const result = await db
        .selectFrom(tables.users.name)
        .where("active", "=", true)
        .select(["id", "name"])
        .orderBy("name", "asc")
        .limit(3)
        .execute();

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeLessThanOrEqual(3);

      result.forEach((user) => {
        expect(user).toHaveProperty("id");
        expect(user).toHaveProperty("name");
        expect(typeof user.name).toBe("string");
      });
    });
  });
});
