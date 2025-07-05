// Complex Queries Integration Tests
// Tests advanced query patterns and expression builder with isolated test tables

import { describe, test, expect, beforeAll, afterAll } from "bun:test";
import { pgvibe } from "../../../src/query-builder";
import {
  generateTestId,
  createTestDatabase,
  waitForDatabase,
} from "../utils/test-helpers";
import { performTestCleanup } from "../utils/cleanup";

// Table schema for complex query tests
function createComplexQueryTables(testId: string) {
  return {
    users: {
      name: `test_users_${testId}`,
      schema: `
        CREATE TABLE test_users_${testId} (
          id SERIAL PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          email VARCHAR(255) UNIQUE,
          active BOOLEAN DEFAULT true,
          role VARCHAR(50) DEFAULT 'user',
          score INTEGER DEFAULT 0,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        )
      `,
    },
    posts: {
      name: `test_posts_${testId}`,
      schema: `
        CREATE TABLE test_posts_${testId} (
          id SERIAL PRIMARY KEY,
          user_id INTEGER REFERENCES test_users_${testId}(id) ON DELETE CASCADE,
          title VARCHAR(255) NOT NULL,
          content TEXT,
          published BOOLEAN DEFAULT false,
          views INTEGER DEFAULT 0,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        )
      `,
    },
    comments: {
      name: `test_comments_${testId}`,
      schema: `
        CREATE TABLE test_comments_${testId} (
          id SERIAL PRIMARY KEY,
          user_id INTEGER REFERENCES test_users_${testId}(id) ON DELETE CASCADE,
          post_id INTEGER REFERENCES test_posts_${testId}(id) ON DELETE CASCADE,
          content TEXT NOT NULL,
          approved BOOLEAN DEFAULT false,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        )
      `,
    },
  };
}

async function createComplexQueryDbTables(db: pgvibe<any>, tables: any) {
  await db.query(tables.users.schema);
  await db.query(tables.posts.schema);
  await db.query(tables.comments.schema);
}

async function seedComplexQueryData(db: pgvibe<any>, tables: any) {
  // Insert users with variety of data for complex queries
  await db.query(`
    INSERT INTO ${tables.users.name} (name, email, active, role, score, created_at)
    VALUES 
      ('John Doe', 'john@test.com', true, 'admin', 95, '2023-01-15 10:30:00'),
      ('Jane Smith', 'jane@test.com', true, 'user', 87, '2023-02-20 14:15:00'),
      ('Charlie Brown', 'charlie@test.com', false, 'user', 76, '2023-03-10 09:45:00'),
      ('Alice Wilson', 'alice@test.com', true, 'moderator', 92, '2023-04-05 16:20:00'),
      ('Bob Johnson', NULL, true, 'user', 68, '2023-05-12 11:10:00'),
      ('Eve Davis', 'eve@test.com', false, 'admin', 89, '2023-06-18 13:30:00')
  `);

  // Insert posts with various data
  await db.query(`
    INSERT INTO ${tables.posts.name} (user_id, title, content, published, views, created_at)
    VALUES 
      (1, 'Introduction to PostgreSQL', 'Comprehensive guide to PostgreSQL', true, 150, '2023-01-20 12:00:00'),
      (1, 'Advanced Query Techniques', 'Advanced PostgreSQL query patterns', false, 45, '2023-02-15 10:30:00'),
      (2, 'JavaScript Best Practices', 'Modern JavaScript development', true, 280, '2023-03-01 14:20:00'),
      (4, 'Database Design Principles', 'Principles of good database design', true, 95, '2023-03-15 16:45:00'),
      (2, 'React Performance Tips', 'Optimizing React applications', true, 320, '2023-04-10 09:15:00'),
      (6, 'Admin Guide', 'Administrative procedures', false, 12, '2023-05-20 15:30:00')
  `);

  // Insert comments
  await db.query(`
    INSERT INTO ${tables.comments.name} (user_id, post_id, content, approved, created_at)
    VALUES 
      (2, 1, 'Great introduction!', true, '2023-01-21 10:30:00'),
      (3, 1, 'Very helpful content', false, '2023-01-22 14:15:00'),
      (4, 3, 'Love these JavaScript tips', true, '2023-03-02 11:20:00'),
      (1, 3, 'Thanks for sharing!', true, '2023-03-03 16:45:00'),
      (5, 4, 'Excellent database insights', true, '2023-03-16 12:30:00'),
      (2, 5, 'React optimization is crucial', true, '2023-04-11 08:45:00')
  `);
}

describe("Complex Queries Integration Tests", () => {
  const testId = generateTestId();
  const tables = createComplexQueryTables(testId);
  let db: pgvibe<any>;

  beforeAll(async () => {
    db = createTestDatabase();
    await waitForDatabase();

    // Create isolated test tables
    await createComplexQueryDbTables(db, tables);

    // Seed with test data
    await seedComplexQueryData(db, tables);
  });

  afterAll(async () => {
    // Clean up our isolated tables
    await performTestCleanup(db, [
      tables.comments.name,
      tables.posts.name,
      tables.users.name,
    ]);
  });

  describe("Expression Builder WHERE Clauses", () => {
    test("should execute basic expression builder WHERE conditions", async () => {
      const activeUsers = await db
        .selectFrom(tables.users.name)
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
      const highScoreUsers = await db
        .selectFrom(tables.users.name)
        .where(({ eb }) => eb("score", ">=", 90))
        .execute();

      expect(Array.isArray(highScoreUsers)).toBe(true);
      highScoreUsers.forEach((user) => {
        expect(user.score).toBeGreaterThanOrEqual(90);
      });

      // String comparison
      const johnUsers = await db
        .selectFrom(tables.users.name)
        .where(({ eb }) => eb("name", "=", "John Doe"))
        .execute();

      johnUsers.forEach((user) => {
        expect(user.name).toBe("John Doe");
      });

      // Date comparison
      const recentUsers = await db
        .selectFrom(tables.users.name)
        .where(({ eb }) => eb("created_at", ">", new Date("2023-03-01")))
        .execute();

      expect(Array.isArray(recentUsers)).toBe(true);
      recentUsers.forEach((user) => {
        expect(user.created_at.getTime()).toBeGreaterThan(
          new Date("2023-03-01").getTime()
        );
      });
    });

    test("should execute expression builder with string operators", async () => {
      // LIKE operator
      const johnLikeUsers = await db
        .selectFrom(tables.users.name)
        .where(({ eb }) => eb("name", "like", "John%"))
        .execute();

      johnLikeUsers.forEach((user) => {
        expect(user.name.startsWith("John")).toBe(true);
      });

      // ILIKE operator (case-insensitive)
      const johnIlikeUsers = await db
        .selectFrom(tables.users.name)
        .where(({ eb }) => eb("name", "ilike", "john%"))
        .execute();

      johnIlikeUsers.forEach((user) => {
        expect(user.name.toLowerCase().startsWith("john")).toBe(true);
      });
    });

    test("should execute expression builder with array operators", async () => {
      // IN operator with multiple values
      const usersInList = await db
        .selectFrom(tables.users.name)
        .where(({ eb }) => eb("id", "in", [1, 2, 3]))
        .execute();

      expect(Array.isArray(usersInList)).toBe(true);
      usersInList.forEach((user) => {
        expect([1, 2, 3]).toContain(user.id);
      });

      // NOT IN operator
      const usersNotInList = await db
        .selectFrom(tables.users.name)
        .where(({ eb }) => eb("id", "not in", [999, 1000]))
        .execute();

      usersNotInList.forEach((user) => {
        expect([999, 1000]).not.toContain(user.id);
      });
    });

    test("should execute expression builder with null operations", async () => {
      // IS NULL
      const usersWithNullEmail = await db
        .selectFrom(tables.users.name)
        .where(({ eb }) => eb("email", "is", null))
        .execute();

      usersWithNullEmail.forEach((user) => {
        expect(user.email).toBeNull();
      });

      // IS NOT NULL
      const usersWithEmail = await db
        .selectFrom(tables.users.name)
        .where(({ eb }) => eb("email", "is not", null))
        .execute();

      usersWithEmail.forEach((user) => {
        expect(user.email).not.toBeNull();
      });
    });
  });

  describe("Complex Logical Operations", () => {
    test("should execute expression builder with AND operations", async () => {
      const activeUsersWithEmail = await db
        .selectFrom(tables.users.name)
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
        .selectFrom(tables.users.name)
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
        .selectFrom(tables.users.name)
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
      const usersWithHighScore = await db
        .selectFrom(tables.users.name)
        .where(({ eb }) => eb("score", ">", 80))
        .execute();

      usersWithHighScore.forEach((user) => {
        expect(user.score).toBeGreaterThan(80);
      });

      // Less than or equal
      const usersWithLowScore = await db
        .selectFrom(tables.users.name)
        .where(({ eb }) => eb("score", "<=", 90))
        .execute();

      usersWithLowScore.forEach((user) => {
        expect(user.score).toBeLessThanOrEqual(90);
      });

      // Not equal
      const usersNotAdmin = await db
        .selectFrom(tables.users.name)
        .where(({ eb }) => eb("role", "!=", "admin"))
        .execute();

      usersNotAdmin.forEach((user) => {
        expect(user.role).not.toBe("admin");
      });
    });
  });

  describe("Advanced JOIN Operations", () => {
    test("should execute expression builder with JOIN operations", async () => {
      const activeUsersWithPublishedPosts = await db
        .selectFrom(tables.users.name)
        .innerJoin(
          tables.posts.name,
          `${tables.users.name}.id`,
          `${tables.posts.name}.user_id`
        )
        .select([
          `${tables.users.name}.name`,
          `${tables.users.name}.active`,
          `${tables.posts.name}.title`,
          `${tables.posts.name}.published`,
        ])
        .where(({ eb }) =>
          eb.and([
            eb(`${tables.users.name}.active`, "=", true),
            eb(`${tables.posts.name}.published`, "=", true),
          ])
        )
        .execute();

      activeUsersWithPublishedPosts.forEach((result) => {
        expect(result.active).toBe(true);
        expect(result.published).toBe(true);
      });
    });

    test("should execute complex multi-table JOIN with expression builder", async () => {
      const activeUsersWithApprovedComments = await db
        .selectFrom(tables.users.name)
        .innerJoin(
          tables.posts.name,
          `${tables.users.name}.id`,
          `${tables.posts.name}.user_id`
        )
        .innerJoin(
          tables.comments.name,
          `${tables.posts.name}.id`,
          `${tables.comments.name}.post_id`
        )
        .select([
          `${tables.users.name}.name`,
          `${tables.posts.name}.title`,
          `${tables.comments.name}.content`,
        ])
        .where(({ eb }) =>
          eb.and([
            eb(`${tables.users.name}.active`, "=", true),
            eb(`${tables.posts.name}.published`, "=", true),
            eb(`${tables.comments.name}.approved`, "=", true),
          ])
        )
        .execute();

      activeUsersWithApprovedComments.forEach((result) => {
        expect(result.name).toBeDefined();
        expect(result.title).toBeDefined();
        expect(result.content).toBeDefined();
      });
    });
  });

  describe("Mixed Expression Builder and Regular WHERE", () => {
    test("should execute expression builder mixed with regular WHERE", async () => {
      // Mix expression builder with regular WHERE clauses
      const mixedConditions = await db
        .selectFrom(tables.users.name)
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
        .selectFrom(tables.posts.name)
        .where(({ eb }) =>
          eb.and([
            eb("published", "=", true),
            eb("created_at", ">", new Date("2023-03-01")),
            eb("title", "is not", null),
          ])
        )
        .execute();

      recentPublishedPosts.forEach((post) => {
        expect(post.published).toBe(true);
        expect(post.created_at.getTime()).toBeGreaterThan(
          new Date("2023-03-01").getTime()
        );
        expect(post.title).not.toBeNull();
      });
    });
  });

  describe("Date String Operations", () => {
    test("should execute expression builder with date strings", async () => {
      const activeUsers = await db
        .selectFrom(tables.users.name)
        .select(["id", "name", "active", "created_at"])
        .where(({ eb, or }) => [
          or([
            eb("active", "=", true),
            eb("name", "like", "John%"),
            eb("created_at", ">", "2023-03-01"),
          ]),
        ])
        .where("created_at", "<", "2024-12-31")
        .execute();

      expect(Array.isArray(activeUsers)).toBe(true);
      expect(activeUsers.length).toBeGreaterThan(0);

      activeUsers.forEach((user) => {
        expect(user.created_at.getTime()).toBeLessThan(
          new Date("2024-12-31").getTime()
        );
        // Should match at least one of the OR conditions
        const matchesActive = user.active === true;
        const matchesName = user.name.startsWith("John");
        const matchesDate =
          user.created_at.getTime() > new Date("2023-03-01").getTime();
        expect(matchesActive || matchesName || matchesDate).toBe(true);
      });
    });

    test("should support date strings with various operators", async () => {
      const users = await db
        .selectFrom(tables.users.name)
        .where(({ eb }) =>
          eb.and([
            eb("created_at", ">=", "2023-01-01"),
            eb("created_at", "<=", "2023-12-31"),
            eb("created_at", "!=", "2023-06-15"),
          ])
        )
        .execute();

      expect(Array.isArray(users)).toBe(true);
      users.forEach((user) => {
        expect(user.created_at.getTime()).toBeGreaterThanOrEqual(
          new Date("2023-01-01").getTime()
        );
        expect(user.created_at.getTime()).toBeLessThanOrEqual(
          new Date("2023-12-31").getTime()
        );
        expect(user.created_at.getTime()).not.toBe(
          new Date("2023-06-15").getTime()
        );
      });
    });

    test("should support date strings in IN/NOT IN operations", async () => {
      // Test NOT IN operator with date strings (more likely to have results)
      const usersNotInDateRange = await db
        .selectFrom(tables.users.name)
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

  describe("Performance and Complex Scenarios", () => {
    test("should handle complex nested conditions efficiently", async () => {
      const startTime = Date.now();

      const complexQuery = await db
        .selectFrom(tables.users.name)
        .where(({ eb, and, or }) =>
          and([
            or([eb("role", "=", "admin"), eb("role", "=", "moderator")]),
            eb("active", "=", true),
            eb("score", ">", 75),
            or([eb("email", "is not", null), eb("name", "like", "%John%")]),
          ])
        )
        .execute();

      const endTime = Date.now();
      const executionTime = endTime - startTime;

      expect(Array.isArray(complexQuery)).toBe(true);
      expect(executionTime).toBeLessThan(100);

      complexQuery.forEach((user) => {
        expect(["admin", "moderator"]).toContain(user.role);
        expect(user.active).toBe(true);
        expect(user.score).toBeGreaterThan(75);
        expect(user.email !== null || user.name.includes("John")).toBe(true);
      });
    });

    test("should handle subquery-like patterns with JOINs", async () => {
      // Find users who have published posts with high view counts
      const popularContentCreators = await db
        .selectFrom(tables.users.name)
        .innerJoin(
          tables.posts.name,
          `${tables.users.name}.id`,
          `${tables.posts.name}.user_id`
        )
        .select([
          `${tables.users.name}.name`,
          `${tables.users.name}.role`,
          `${tables.posts.name}.title`,
          `${tables.posts.name}.views`,
        ])
        .where(({ eb }) =>
          eb.and([
            eb(`${tables.posts.name}.published`, "=", true),
            eb(`${tables.posts.name}.views`, ">", 100),
            eb(`${tables.users.name}.active`, "=", true),
          ])
        )
        .orderBy(`${tables.posts.name}.views`, "desc")
        .execute();

      expect(Array.isArray(popularContentCreators)).toBe(true);
      popularContentCreators.forEach((result) => {
        expect(result.views).toBeGreaterThan(100);
        expect(result.name).toBeDefined();
        expect(result.title).toBeDefined();
      });
    });
  });
});
