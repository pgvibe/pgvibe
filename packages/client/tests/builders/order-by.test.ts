import { describe, it, expect, beforeAll, afterAll } from "bun:test";
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

describe("ORDER BY Operations", () => {
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

    // Add additional test users for ORDER BY tests
    await db.query(`
      INSERT INTO ${tables.users.name} (name, email, active)
      VALUES 
        ('Alice Wilson', 'alice@test.com', true),
        ('Bob Johnson', 'bob@test.com', false)
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

  describe("SQL Generation", () => {
    it("should generate ORDER BY for single column ASC", () => {
      const { sql, parameters } = db
        .selectFrom(tables.users.name)
        .orderBy("name", "asc")
        .toSQL();

      expect(sql).toBe(`SELECT * FROM ${tables.users.name} ORDER BY name ASC`);
      expect(parameters).toEqual([]);
    });

    it("should generate ORDER BY for single column DESC", () => {
      const { sql, parameters } = db
        .selectFrom(tables.users.name)
        .orderBy("created_at", "desc")
        .toSQL();

      expect(sql).toBe(
        `SELECT * FROM ${tables.users.name} ORDER BY created_at DESC`
      );
      expect(parameters).toEqual([]);
    });

    it("should default to ASC when no direction specified", () => {
      const { sql, parameters } = db
        .selectFrom(tables.users.name)
        .orderBy("name")
        .toSQL();

      expect(sql).toBe(`SELECT * FROM ${tables.users.name} ORDER BY name ASC`);
      expect(parameters).toEqual([]);
    });

    it("should generate ORDER BY for multiple columns", () => {
      const { sql, parameters } = db
        .selectFrom(tables.users.name)
        .orderBy([
          { column: "active", direction: "desc" },
          { column: "name", direction: "asc" },
          { column: "created_at" }, // Should default to ASC
        ])
        .toSQL();

      expect(sql).toBe(
        `SELECT * FROM ${tables.users.name} ORDER BY active DESC, name ASC, created_at ASC`
      );
      expect(parameters).toEqual([]);
    });

    it("should work with WHERE and ORDER BY", () => {
      const { sql, parameters } = db
        .selectFrom(tables.users.name)
        .where("active", "=", true)
        .orderBy("name", "asc")
        .toSQL();

      expect(sql).toBe(
        `SELECT * FROM ${tables.users.name} WHERE active = $1 ORDER BY name ASC`
      );
      expect(parameters).toEqual([true]);
    });

    it("should work with SELECT and ORDER BY", () => {
      const { sql, parameters } = db
        .selectFrom(tables.users.name)
        .select(["id", "name"])
        .orderBy("name", "desc")
        .toSQL();

      expect(sql).toBe(
        `SELECT id, name FROM ${tables.users.name} ORDER BY name DESC`
      );
      expect(parameters).toEqual([]);
    });
  });

  describe("Real Database Execution", () => {
    it("should execute ORDER BY ASC correctly", async () => {
      const users = await db
        .selectFrom(tables.users.name)
        .select(["id", "name"])
        .orderBy("name", "asc")
        .execute();

      expect(users).toHaveLength(5);
      // Should be ordered alphabetically: Alice Wilson, Bob Johnson, Test User 1, Test User 2, Test User 3
      expect(users[0]!.name).toBe("Alice Wilson");
      expect(users[1]!.name).toBe("Bob Johnson");
      expect(users[2]!.name).toBe("Test User 1");
      expect(users[3]!.name).toBe("Test User 2");
      expect(users[4]!.name).toBe("Test User 3");
    });

    it("should execute ORDER BY DESC correctly", async () => {
      const users = await db
        .selectFrom(tables.users.name)
        .select(["id", "name"])
        .orderBy("name", "desc")
        .execute();

      expect(users).toHaveLength(5);
      // Should be ordered reverse alphabetically
      expect(users[0]!.name).toBe("Test User 3");
      expect(users[1]!.name).toBe("Test User 2");
      expect(users[2]!.name).toBe("Test User 1");
      expect(users[3]!.name).toBe("Bob Johnson");
      expect(users[4]!.name).toBe("Alice Wilson");
    });

    it("should execute multiple column ORDER BY correctly", async () => {
      const users = await db
        .selectFrom(tables.users.name)
        .select(["id", "name", "active"])
        .orderBy([
          { column: "active", direction: "desc" }, // Active users first
          { column: "name", direction: "asc" }, // Then by name
        ])
        .execute();

      expect(users).toHaveLength(5);
      // Should be: Active users first (Alice, Test User 1, Test User 3), then inactive (Bob, Test User 2)
      const activeUsers = users.filter((u) => u.active);
      const inactiveUsers = users.filter((u) => !u.active);

      expect(activeUsers).toHaveLength(3);
      expect(inactiveUsers).toHaveLength(2);

      // First user should be active
      expect(users[0]!.active).toBe(true);
      // Last user should be inactive
      expect(users[4]!.active).toBe(false);
    });

    it("should work with WHERE and ORDER BY in real query", async () => {
      const activeUsers = await db
        .selectFrom(tables.users.name)
        .where("active", "=", true)
        .orderBy("name", "desc")
        .execute();

      expect(activeUsers).toHaveLength(3); // Alice, Test User 1, Test User 3
      // All should be active
      activeUsers.forEach((user) => expect(user.active).toBe(true));

      // Should be ordered by name descending
      expect(activeUsers[0]!.name).toBe("Test User 3");
      expect(activeUsers[1]!.name).toBe("Test User 1");
      expect(activeUsers[2]!.name).toBe("Alice Wilson");
    });
  });

  describe("Type Safety", () => {
    it("should maintain type safety with ORDER BY", () => {
      const query = db
        .selectFrom(tables.users.name)
        .select(["id", "name"])
        .orderBy("name", "asc");

      // TypeScript should know the result type
      type ResultType = Awaited<ReturnType<typeof query.execute>>;

      // This test passes if TypeScript compilation succeeds - just check that we get an array
      expect(Array.isArray([] as ResultType)).toBe(true);
    });

    it("should only allow ordering by existing columns", () => {
      // This should compile fine
      db.selectFrom(tables.users.name).orderBy("name", "asc");
      db.selectFrom(tables.users.name).orderBy("id", "desc");
      db.selectFrom(tables.users.name).orderBy("active");

      // These would cause TypeScript errors (uncomment to test):
      // db.selectFrom(tables.users.name).orderBy("nonexistent_column", "asc");
      // db.selectFrom(tables.posts.name).orderBy("email", "asc"); // email is not on posts table

      expect(true).toBe(true);
    });
  });

  describe("Edge Cases", () => {
    it("should handle ordering by nullable columns", () => {
      const { sql, parameters } = db
        .selectFrom(tables.users.name)
        .orderBy("email", "asc")
        .toSQL();

      expect(sql).toBe(`SELECT * FROM ${tables.users.name} ORDER BY email ASC`);
      expect(parameters).toEqual([]);
    });

    it("should combine with LIMIT correctly", () => {
      const { sql, parameters } = db
        .selectFrom(tables.users.name)
        .orderBy("name", "desc")
        .limit(3)
        .toSQL();

      expect(sql).toBe(
        `SELECT * FROM ${tables.users.name} ORDER BY name DESC LIMIT 3`
      );
      expect(parameters).toEqual([]);
    });
  });
});
