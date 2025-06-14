// JOIN Integration Tests
// Tests JOIN operations with isolated test tables

import { describe, test, expect, beforeAll, afterAll } from "bun:test";
import { ZenQ } from "../../../src/query-builder";
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

describe("JOIN Integration Tests", () => {
  const testId = generateTestId();
  const tables = createStandardTestTables(testId);
  let db: ZenQ<any>;
  let userIds: number[];
  let postIds: number[];

  // Type assertion since createStandardTestTables always creates comments table
  const commentsTable = tables.comments!;

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

  describe("Basic JOIN Operations", () => {
    test("should execute INNER JOIN", async () => {
      const result = await db
        .selectFrom(tables.users.name)
        .innerJoin(
          tables.posts.name,
          `${tables.users.name}.id`,
          `${tables.posts.name}.user_id`
        )
        .select([`${tables.users.name}.name`, `${tables.posts.name}.title`])
        .execute();

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);

      result.forEach((row) => {
        expect(row).toHaveProperty("name");
        expect(row).toHaveProperty("title");
        expect(typeof row.name).toBe("string");
        expect(typeof row.title).toBe("string");
      });
    });

    test("should execute LEFT JOIN", async () => {
      const allUsers = await db.selectFrom(tables.users.name).execute();

      const result = await db
        .selectFrom(tables.users.name)
        .leftJoin(
          tables.posts.name,
          `${tables.users.name}.id`,
          `${tables.posts.name}.user_id`
        )
        .select([`${tables.users.name}.name`, `${tables.posts.name}.title`])
        .execute();

      expect(Array.isArray(result)).toBe(true);
      // LEFT JOIN should return at least as many rows as there are users
      expect(result.length).toBeGreaterThanOrEqual(allUsers.length);

      result.forEach((row) => {
        expect(row).toHaveProperty("name");
        expect(row).toHaveProperty("title");
        expect(typeof row.name).toBe("string");
        // title can be null in LEFT JOIN
      });
    });

    test("should execute RIGHT JOIN", async () => {
      const result = await db
        .selectFrom(tables.users.name)
        .rightJoin(
          tables.posts.name,
          `${tables.users.name}.id`,
          `${tables.posts.name}.user_id`
        )
        .select([`${tables.users.name}.name`, `${tables.posts.name}.title`])
        .execute();

      expect(Array.isArray(result)).toBe(true);

      result.forEach((row) => {
        expect(row).toHaveProperty("name");
        expect(row).toHaveProperty("title");
        // In RIGHT JOIN, posts.title should never be null, but users.name might be
        expect(row.title).not.toBeNull();
      });
    });

    test("should execute FULL OUTER JOIN", async () => {
      const result = await db
        .selectFrom(tables.users.name)
        .fullJoin(
          tables.posts.name,
          `${tables.users.name}.id`,
          `${tables.posts.name}.user_id`
        )
        .select([`${tables.users.name}.name`, `${tables.posts.name}.title`])
        .execute();

      expect(Array.isArray(result)).toBe(true);

      result.forEach((row) => {
        expect(row).toHaveProperty("name");
        expect(row).toHaveProperty("title");
        // Both columns can be null in FULL OUTER JOIN
      });
    });
  });

  describe("Multi-table JOINs", () => {
    test("should execute complex multi-table JOIN", async () => {
      const result = await db
        .selectFrom(tables.users.name)
        .innerJoin(
          tables.posts.name,
          `${tables.users.name}.id`,
          `${tables.posts.name}.user_id`
        )
        .innerJoin(
          commentsTable.name,
          `${tables.posts.name}.id`,
          `${commentsTable.name}.post_id`
        )
        .select([
          `${tables.users.name}.name`,
          `${tables.posts.name}.title`,
          `${commentsTable.name}.content`,
        ])
        .execute();

      expect(Array.isArray(result)).toBe(true);

      result.forEach((row) => {
        expect(row).toHaveProperty("name");
        expect(row).toHaveProperty("title");
        expect(row).toHaveProperty("content");
        expect(typeof row.name).toBe("string");
        expect(typeof row.title).toBe("string");
        expect(typeof row.content).toBe("string");
      });
    });

    test("should handle mixed JOIN types with all three tables", async () => {
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
        .limit(10)
        .execute();

      expect(Array.isArray(result)).toBe(true);

      result.forEach((row) => {
        // Users columns should always be present
        expect(row).toHaveProperty("id");
        expect(row).toHaveProperty("name");
        expect(row).toHaveProperty("email");
        expect(typeof row.id).toBe("number");
        expect(typeof row.name).toBe("string");

        // Posts and comments columns might be null due to LEFT JOINs
        expect(row).toHaveProperty("title");
        expect(row).toHaveProperty("content");
      });
    });
  });

  describe("JOINs with WHERE Conditions", () => {
    test("should execute JOIN with WHERE on main table", async () => {
      const result = await db
        .selectFrom(tables.users.name)
        .innerJoin(
          tables.posts.name,
          `${tables.users.name}.id`,
          `${tables.posts.name}.user_id`
        )
        .select([`${tables.users.name}.name`, `${tables.posts.name}.title`])
        .where(`${tables.users.name}.active`, "=", true)
        .execute();

      expect(Array.isArray(result)).toBe(true);

      result.forEach((row) => {
        expect(row).toHaveProperty("name");
        expect(row).toHaveProperty("title");
      });
    });

    test("should execute JOIN with WHERE on joined table", async () => {
      const result = await db
        .selectFrom(tables.users.name)
        .innerJoin(
          tables.posts.name,
          `${tables.users.name}.id`,
          `${tables.posts.name}.user_id`
        )
        .select([`${tables.users.name}.name`, `${tables.posts.name}.title`])
        .where(`${tables.posts.name}.published`, "=", true)
        .execute();

      expect(Array.isArray(result)).toBe(true);

      result.forEach((row) => {
        expect(row).toHaveProperty("name");
        expect(row).toHaveProperty("title");
      });
    });

    test("should execute JOIN with complex WHERE conditions", async () => {
      const result = await db
        .selectFrom(tables.users.name)
        .innerJoin(
          tables.posts.name,
          `${tables.users.name}.id`,
          `${tables.posts.name}.user_id`
        )
        .select([`${tables.users.name}.name`, `${tables.posts.name}.title`])
        .where(({ eb }) =>
          eb.and([
            eb(`${tables.users.name}.active`, "=", true),
            eb(`${tables.posts.name}.published`, "=", true),
          ])
        )
        .execute();

      expect(Array.isArray(result)).toBe(true);

      result.forEach((row) => {
        expect(row).toHaveProperty("name");
        expect(row).toHaveProperty("title");
      });
    });
  });

  describe("JOINs with ORDER BY", () => {
    test("should execute ORDER BY with JOIN", async () => {
      const result = await db
        .selectFrom(tables.users.name)
        .innerJoin(
          tables.posts.name,
          `${tables.users.name}.id`,
          `${tables.posts.name}.user_id`
        )
        .select([
          `${tables.users.name}.name`,
          `${tables.posts.name}.title`,
          `${tables.posts.name}.created_at`,
        ])
        .orderBy(`${tables.posts.name}.created_at`, "desc")
        .execute();

      expect(Array.isArray(result)).toBe(true);

      if (result.length > 1) {
        // Check that posts are ordered by created_at DESC
        for (let i = 1; i < result.length; i++) {
          const current = result[i];
          const previous = result[i - 1];
          if (current && previous) {
            expect(current.created_at <= previous.created_at).toBe(true);
          }
        }
      }
    });

    test("should execute ORDER BY multiple columns with JOIN", async () => {
      const result = await db
        .selectFrom(tables.users.name)
        .innerJoin(
          tables.posts.name,
          `${tables.users.name}.id`,
          `${tables.posts.name}.user_id`
        )
        .select([
          `${tables.users.name}.name`,
          `${tables.posts.name}.title`,
          `${tables.posts.name}.created_at`,
        ])
        .orderBy([
          { column: `${tables.users.name}.name`, direction: "asc" },
          { column: `${tables.posts.name}.created_at`, direction: "desc" },
        ])
        .execute();

      expect(Array.isArray(result)).toBe(true);

      result.forEach((row) => {
        expect(row).toHaveProperty("name");
        expect(row).toHaveProperty("title");
        expect(row).toHaveProperty("created_at");
      });
    });
  });

  describe("JOINs with Array Operations", () => {
    test("should use array operations in JOIN queries", async () => {
      // First, add array columns to our test tables by modifying some test data
      await db.query(
        `UPDATE ${tables.posts.name} SET categories = ARRAY['tech', 'tutorial'] WHERE id = $1`,
        [postIds[0]]
      );
      await db.query(
        `UPDATE ${tables.posts.name} SET categories = ARRAY['news', 'update'] WHERE id = $1`,
        [postIds[1]]
      );

      const userPostsWithTechCategories = await db
        .selectFrom(tables.users.name)
        .innerJoin(
          tables.posts.name,
          `${tables.users.name}.id`,
          `${tables.posts.name}.user_id`
        )
        .select([
          `${tables.users.name}.name`,
          `${tables.posts.name}.title`,
          `${tables.posts.name}.categories`,
        ])
        .where(({ array }) =>
          array(`${tables.posts.name}.categories`).overlaps([
            "tech",
            "tutorial",
          ])
        )
        .execute();

      expect(Array.isArray(userPostsWithTechCategories)).toBe(true);

      // Verify all posts have tech or tutorial categories
      userPostsWithTechCategories.forEach((result) => {
        expect(result.categories).toBeDefined();
        if (result.categories) {
          const hasOverlap = result.categories.some((category: string) =>
            ["tech", "tutorial"].includes(category)
          );
          expect(hasOverlap).toBe(true);
        }
      });
    });

    test("should combine user and post array operations in JOINs", async () => {
      // Update test data with tags
      await db.query(
        `UPDATE ${tables.users.name} SET tags = ARRAY['typescript', 'nodejs'] WHERE id = $1`,
        [userIds[0]]
      );
      await db.query(
        `UPDATE ${tables.posts.name} SET categories = ARRAY['tech', 'programming'] WHERE id = $1`,
        [postIds[0]]
      );

      const matchingUserPosts = await db
        .selectFrom(tables.users.name)
        .innerJoin(
          tables.posts.name,
          `${tables.users.name}.id`,
          `${tables.posts.name}.user_id`
        )
        .select([
          `${tables.users.name}.name`,
          `${tables.users.name}.tags`,
          `${tables.posts.name}.title`,
          `${tables.posts.name}.categories`,
        ])
        .where(({ array, and }) =>
          and([
            array(`${tables.users.name}.tags`).contains(["typescript"]),
            array(`${tables.posts.name}.categories`).contains(["tech"]),
          ])
        )
        .execute();

      expect(Array.isArray(matchingUserPosts)).toBe(true);

      // Verify all results match both conditions
      matchingUserPosts.forEach((result) => {
        if (result.tags) {
          expect(result.tags).toContain("typescript");
        }
        if (result.categories) {
          expect(result.categories).toContain("tech");
        }
      });
    });
  });

  describe("JOIN Edge Cases", () => {
    test("should handle qualified columns in JOIN", async () => {
      const result = await db
        .selectFrom(tables.users.name)
        .innerJoin(
          tables.posts.name,
          `${tables.users.name}.id`,
          `${tables.posts.name}.user_id`
        )
        .select([
          `${tables.users.name}.id`,
          `${tables.posts.name}.id`,
          `${tables.users.name}.name`,
        ])
        .execute();

      expect(Array.isArray(result)).toBe(true);

      result.forEach((row) => {
        expect(row).toHaveProperty("id");
        expect(row).toHaveProperty("name");
        expect(typeof row.id).toBe("number");
        expect(typeof row.name).toBe("string");
      });
    });

    test("should handle empty JOIN results", async () => {
      // Create a user with no posts to test empty JOIN
      await db.query(
        `INSERT INTO ${tables.users.name} (name, email, active) VALUES ($1, $2, $3)`,
        ["Isolated User", "isolated@test.com", true]
      );

      const result = await db
        .selectFrom(tables.users.name)
        .innerJoin(
          tables.posts.name,
          `${tables.users.name}.id`,
          `${tables.posts.name}.user_id`
        )
        .select([`${tables.users.name}.name`, `${tables.posts.name}.title`])
        .where(`${tables.users.name}.name`, "=", "Isolated User")
        .execute();

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(0); // INNER JOIN should return no results
    });

    test("should handle self-referencing JOIN patterns", async () => {
      // Create a simple self-referencing scenario using posts table
      await db.query(
        `UPDATE ${tables.posts.name} SET parent_id = $1 WHERE id = $2`,
        [postIds[0], postIds[1]]
      );

      // Query for posts that have a parent_id set (child posts)
      const result = await db
        .selectFrom(tables.posts.name)
        .select([
          `${tables.posts.name}.id`,
          `${tables.posts.name}.title`,
          `${tables.posts.name}.parent_id`,
        ])
        .where(`${tables.posts.name}.parent_id`, "is not", null)
        .execute();

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);

      result.forEach((row) => {
        expect(row).toHaveProperty("id");
        expect(row).toHaveProperty("title");
        expect(row).toHaveProperty("parent_id");
        expect(row.parent_id).not.toBeNull();
        expect(typeof row.title).toBe("string");
      });
    });
  });

  describe("JOIN Performance and Limits", () => {
    test("should handle JOINs with LIMIT and OFFSET", async () => {
      const result = await db
        .selectFrom(tables.users.name)
        .innerJoin(
          tables.posts.name,
          `${tables.users.name}.id`,
          `${tables.posts.name}.user_id`
        )
        .select([`${tables.users.name}.name`, `${tables.posts.name}.title`])
        .limit(2)
        .offset(1)
        .execute();

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeLessThanOrEqual(2);
    });

    test("should execute JOINs efficiently", async () => {
      const startTime = Date.now();

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
        .execute();

      const endTime = Date.now();
      const executionTime = endTime - startTime;

      expect(Array.isArray(result)).toBe(true);
      // Should execute reasonably quickly (under 100ms for test data)
      expect(executionTime).toBeLessThan(100);
    });
  });
});
