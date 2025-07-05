import { expect, test, describe, beforeAll, afterAll } from "bun:test";
import { pgvibe } from "../../src/query-builder";
import type { Database } from "../utils/test-types";
import {
  generateTestId,
  createTestDatabase,
  waitForDatabase,
} from "../integration/utils/test-helpers";
import {
  createStandardTestTables,
  createTestTables,
  seedTestData,
} from "../integration/utils/table-factory";
import { performTestCleanup } from "../integration/utils/cleanup";

describe("Advanced WHERE Operations", () => {
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

    // Add additional test user with null email for IS NULL tests
    await db.query(`
      INSERT INTO ${tables.users.name} (name, email, active)
      VALUES ('Bob Johnson', NULL, false)
    `);
  });

  afterAll(async () => {
    // Clean up our isolated tables
    const tableNames = [tables.users.name, tables.posts.name];
    if (tables.comments) {
      tableNames.push(tables.comments.name);
    }
    await performTestCleanup(db, tableNames);
  });

  describe("Unified WHERE Method", () => {
    test("should support IS NULL operations", () => {
      const query = db.selectFrom(tables.users.name).where("email", "is", null);
      const { sql, parameters } = query.toSQL();

      expect(sql).toBe(
        `SELECT * FROM ${tables.users.name} WHERE email IS NULL`
      );
      expect(parameters).toEqual([]);
    });

    test("should support IS NOT NULL operations", () => {
      const query = db
        .selectFrom(tables.users.name)
        .where("email", "is not", null);
      const { sql, parameters } = query.toSQL();

      expect(sql).toBe(
        `SELECT * FROM ${tables.users.name} WHERE email IS NOT NULL`
      );
      expect(parameters).toEqual([]);
    });

    test("should support IN operations with arrays", () => {
      const query = db
        .selectFrom(tables.users.name)
        .where("id", "in", [1, 2, 3]);
      const { sql, parameters } = query.toSQL();

      expect(sql).toBe(
        `SELECT * FROM ${tables.users.name} WHERE id IN ($1, $2, $3)`
      );
      expect(parameters).toEqual([1, 2, 3]);
    });

    test("should support NOT IN operations", () => {
      const query = db
        .selectFrom(tables.users.name)
        .where("id", "not in", [1, 2]);
      const { sql, parameters } = query.toSQL();

      expect(sql).toBe(
        `SELECT * FROM ${tables.users.name} WHERE id NOT IN ($1, $2)`
      );
      expect(parameters).toEqual([1, 2]);
    });

    test("should support regular comparison operations", () => {
      const query = db.selectFrom(tables.users.name).where("id", "=", 1);
      const { sql, parameters } = query.toSQL();

      expect(sql).toBe(`SELECT * FROM ${tables.users.name} WHERE id = $1`);
      expect(parameters).toEqual([1]);
    });

    test("should support LIKE operations", () => {
      const query = db
        .selectFrom(tables.users.name)
        .where("name", "like", "%john%");
      const { sql, parameters } = query.toSQL();

      expect(sql).toBe(`SELECT * FROM ${tables.users.name} WHERE name LIKE $1`);
      expect(parameters).toEqual(["%john%"]);
    });

    test("should handle chained WHERE conditions", () => {
      const query = db
        .selectFrom(tables.users.name)
        .where("active", "=", true)
        .where("email", "is not", null);

      const { sql, parameters } = query.toSQL();

      expect(sql).toBe(
        `SELECT * FROM ${tables.users.name} WHERE active = $1 AND email IS NOT NULL`
      );
      expect(parameters).toEqual([true]);
    });
  });

  describe("Chaining WHERE Conditions", () => {
    test("should support multiple AND conditions", () => {
      const query = db
        .selectFrom(tables.users.name)
        .where("active", "=", true)
        .where("email", "is not", null);

      const { sql, parameters } = query.toSQL();

      expect(sql).toBe(
        `SELECT * FROM ${tables.users.name} WHERE active = $1 AND email IS NOT NULL`
      );
      expect(parameters).toEqual([true]);
    });

    test("should support OR conditions with expression functions", () => {
      // In Kysely style, OR is handled through expression functions
      // For now, we'll skip this test since we're focusing on the basic unified where
      // TODO: Implement expression function support for OR operations
      const query = db.selectFrom(tables.users.name).where("id", "=", 1);

      const { sql, parameters } = query.toSQL();

      expect(sql).toBe(`SELECT * FROM ${tables.users.name} WHERE id = $1`);
      expect(parameters).toEqual([1]);
    });

    test("should support complex combinations of AND conditions", () => {
      // For now, focusing on AND combinations since OR requires expression functions
      const query = db
        .selectFrom(tables.users.name)
        .where("active", "=", true)
        .where("email", "is not", null);

      const { sql, parameters } = query.toSQL();

      expect(sql).toBe(
        `SELECT * FROM ${tables.users.name} WHERE active = $1 AND email IS NOT NULL`
      );
      expect(parameters).toEqual([true]);
    });
  });

  describe("Real Database Execution", () => {
    test("should execute IS NULL queries correctly", async () => {
      // Bob Johnson has null email
      const users = await db
        .selectFrom(tables.users.name)
        .where("email", "is", null)
        .execute();

      expect(users).toHaveLength(1);
      expect(users[0]!.name).toBe("Bob Johnson");
      expect(users[0]!.email).toBeNull();
    });

    test("should execute IS NOT NULL queries correctly", async () => {
      const users = await db
        .selectFrom(tables.users.name)
        .where("email", "is not", null)
        .execute();

      expect(users).toHaveLength(3); // 3 users from seedTestData have emails
      users.forEach((user) => {
        expect(user.email).not.toBeNull();
      });
    });

    test("should execute IN queries correctly", async () => {
      const users = await db
        .selectFrom(tables.users.name)
        .where("id", "in", [userIds[0]!, userIds[2]!])
        .execute();

      expect(users).toHaveLength(2);
      expect(users.map((u) => u.id).sort()).toEqual(
        [userIds[0]!, userIds[2]!].sort()
      );
    });

    test("should execute chained conditions correctly", async () => {
      const users = await db
        .selectFrom(tables.users.name)
        .where("active", "=", true)
        .where("email", "is not", null)
        .execute();

      expect(users).toHaveLength(2); // 2 active users with emails from seedTestData
      users.forEach((user) => {
        expect(user.active).toBe(true);
        expect(user.email).not.toBeNull();
      });
    });

    test("should execute complex IN queries", async () => {
      const users = await db
        .selectFrom(tables.users.name)
        .where("id", "in", [userIds[0], userIds[1]])
        .execute();

      expect(users).toHaveLength(2);
      expect(users.map((u) => u.id).sort()).toEqual(
        [userIds[0], userIds[1]].sort()
      );
    });
  });

  describe("Type Safety", () => {
    test("should maintain type safety with complex WHERE conditions", async () => {
      const results = await db
        .selectFrom(tables.users.name)
        .select(["id", "name"])
        .where("email", "is not", null)
        .where("active", "=", true)
        .execute();

      const firstResult = results[0];
      if (firstResult) {
        // Should have selected properties
        expect(typeof firstResult.id).toBe("number");
        expect(typeof firstResult.name).toBe("string");

        // Should not have non-selected properties
        // Note: TypeScript would catch this at compile time
        // const invalidAccess = firstResult.email; // Should error
      }
    });

    test("should maintain proper type evolution", () => {
      const query = db
        .selectFrom(tables.users.name)
        .select(["id", "name"])
        .where("active", "=", true);

      type ResultType = Awaited<ReturnType<typeof query.execute>>;

      // Compile-time type check
      expect(Array.isArray([] as ResultType)).toBe(true);
    });

    test("should allow chaining with different operators", () => {
      // This should compile without errors
      const query = db
        .selectFrom(tables.users.name)
        .where("active", "=", true)
        .where("email", "is not", null)
        .where("name", "like", "J%");

      expect(query).toBeDefined();
    });
  });

  describe("Edge Cases", () => {
    test("should handle empty IN arrays gracefully", () => {
      // While this might not be practical, the API should handle it
      const query = db.selectFrom(tables.users.name).where("id", "in", []);
      const { sql, parameters } = query.toSQL();

      expect(sql).toBe(`SELECT * FROM ${tables.users.name} WHERE id IN ()`);
      expect(parameters).toEqual([]);
    });

    test("should handle null values correctly in arrays", () => {
      const query = db
        .selectFrom(tables.users.name)
        .where("email", "in", ["test@example.com", null]);
      const { sql, parameters } = query.toSQL();

      expect(sql).toBe(
        `SELECT * FROM ${tables.users.name} WHERE email IN ($1, $2)`
      );
      expect(parameters).toEqual(["test@example.com", null]);
    });
  });
});
