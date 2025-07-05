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

describe("LIMIT and OFFSET Operations", () => {
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

    // Add additional test users for LIMIT/OFFSET tests
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
    it("should generate LIMIT clause", () => {
      const { sql, parameters } = db
        .selectFrom(tables.users.name)
        .limit(5)
        .toSQL();

      expect(sql).toBe(`SELECT * FROM ${tables.users.name} LIMIT 5`);
      expect(parameters).toEqual([]);
    });

    it("should generate OFFSET clause", () => {
      const { sql, parameters } = db
        .selectFrom(tables.users.name)
        .offset(10)
        .toSQL();

      expect(sql).toBe(`SELECT * FROM ${tables.users.name} OFFSET 10`);
      expect(parameters).toEqual([]);
    });

    it("should generate LIMIT and OFFSET together", () => {
      const { sql, parameters } = db
        .selectFrom(tables.users.name)
        .limit(5)
        .offset(10)
        .toSQL();

      expect(sql).toBe(`SELECT * FROM ${tables.users.name} LIMIT 5 OFFSET 10`);
      expect(parameters).toEqual([]);
    });

    it("should work with WHERE, ORDER BY, LIMIT, and OFFSET", () => {
      const { sql, parameters } = db
        .selectFrom(tables.users.name)
        .where("active", "=", true)
        .orderBy("name", "asc")
        .limit(3)
        .offset(1)
        .toSQL();

      expect(sql).toBe(
        `SELECT * FROM ${tables.users.name} WHERE active = $1 ORDER BY name ASC LIMIT 3 OFFSET 1`
      );
      expect(parameters).toEqual([true]);
    });

    it("should work with SELECT, WHERE, ORDER BY, LIMIT, and OFFSET", () => {
      const { sql, parameters } = db
        .selectFrom(tables.users.name)
        .select(["id", "name"])
        .where("active", "=", true)
        .orderBy("name", "desc")
        .limit(2)
        .offset(1)
        .toSQL();

      expect(sql).toBe(
        `SELECT id, name FROM ${tables.users.name} WHERE active = $1 ORDER BY name DESC LIMIT 2 OFFSET 1`
      );
      expect(parameters).toEqual([true]);
    });

    it("should handle LIMIT 0", () => {
      const { sql, parameters } = db
        .selectFrom(tables.users.name)
        .limit(0)
        .toSQL();

      expect(sql).toBe(`SELECT * FROM ${tables.users.name} LIMIT 0`);
      expect(parameters).toEqual([]);
    });

    it("should handle OFFSET 0", () => {
      const { sql, parameters } = db
        .selectFrom(tables.users.name)
        .offset(0)
        .toSQL();

      expect(sql).toBe(`SELECT * FROM ${tables.users.name} OFFSET 0`);
      expect(parameters).toEqual([]);
    });
  });

  describe("Real Database Execution", () => {
    it("should execute LIMIT correctly", async () => {
      const users = await db
        .selectFrom(tables.users.name)
        .select(["id", "name"])
        .orderBy("name", "asc") // Ensure consistent ordering
        .limit(3)
        .execute();

      expect(users).toHaveLength(3);
      // Should be first 3 users alphabetically
      expect(users[0]!.name).toBe("Alice Wilson");
      expect(users[1]!.name).toBe("Bob Johnson");
      expect(users[2]!.name).toBe("Test User 1");
    });

    it("should execute OFFSET correctly", async () => {
      const users = await db
        .selectFrom(tables.users.name)
        .select(["id", "name"])
        .orderBy("name", "asc") // Ensure consistent ordering
        .offset(2)
        .execute();

      expect(users).toHaveLength(3); // 5 total - 2 offset = 3 remaining
      // Should skip first 2 users and get the rest
      expect(users[0]!.name).toBe("Test User 1");
      expect(users[1]!.name).toBe("Test User 2");
      expect(users[2]!.name).toBe("Test User 3");
    });

    it("should execute LIMIT and OFFSET together", async () => {
      const users = await db
        .selectFrom(tables.users.name)
        .select(["id", "name"])
        .orderBy("name", "asc") // Ensure consistent ordering
        .limit(2)
        .offset(1)
        .execute();

      expect(users).toHaveLength(2);
      // Should skip first user and get next 2
      expect(users[0]!.name).toBe("Bob Johnson");
      expect(users[1]!.name).toBe("Test User 1");
    });

    it("should work with WHERE, ORDER BY, LIMIT, and OFFSET", async () => {
      const activeUsers = await db
        .selectFrom(tables.users.name)
        .select(["id", "name", "active"])
        .where("active", "=", true)
        .orderBy("name", "asc")
        .limit(2)
        .offset(1)
        .execute();

      expect(activeUsers).toHaveLength(2);
      // Active users ordered by name, skip first, get next 2
      expect(activeUsers[0]!.active).toBe(true);
      expect(activeUsers[1]!.active).toBe(true);
    });

    it("should handle LIMIT larger than result set", async () => {
      const users = await db.selectFrom(tables.users.name).limit(100).execute();

      expect(users).toHaveLength(5); // 5 users total (3 from seed + 2 added)
    });

    it("should handle OFFSET larger than result set", async () => {
      const users = await db
        .selectFrom(tables.users.name)
        .offset(100)
        .execute();

      expect(users).toHaveLength(0); // No users left after offset
    });

    it("should handle LIMIT 0", async () => {
      const users = await db.selectFrom(tables.users.name).limit(0).execute();

      expect(users).toHaveLength(0);
    });
  });

  describe("Type Safety", () => {
    it("should maintain type safety with LIMIT and OFFSET", () => {
      const query = db
        .selectFrom(tables.users.name)
        .select(["id", "name"])
        .limit(5)
        .offset(2);

      // TypeScript should know the result type
      type ResultType = Awaited<ReturnType<typeof query.execute>>;

      // This test passes if TypeScript compilation succeeds - just check that we get an array
      expect(Array.isArray([] as ResultType)).toBe(true);
    });

    it("should allow method chaining in any order", () => {
      // All of these should compile fine
      db.selectFrom(tables.users.name).limit(5).offset(2);
      db.selectFrom(tables.users.name).offset(2).limit(5);
      db.selectFrom(tables.users.name)
        .where("active", "=", true)
        .limit(5)
        .offset(2);
      db.selectFrom(tables.users.name).orderBy("name").limit(5).offset(2);
      db.selectFrom(tables.users.name)
        .select(["id", "name"])
        .limit(5)
        .offset(2);

      expect(true).toBe(true);
    });
  });

  describe("Edge Cases", () => {
    it("should handle multiple LIMIT calls (last one wins)", () => {
      const { sql, parameters } = db
        .selectFrom(tables.users.name)
        .limit(10)
        .limit(5) // This should override the previous limit
        .toSQL();

      expect(sql).toBe(`SELECT * FROM ${tables.users.name} LIMIT 5`);
      expect(parameters).toEqual([]);
    });

    it("should handle multiple OFFSET calls (last one wins)", () => {
      const { sql, parameters } = db
        .selectFrom(tables.users.name)
        .offset(10)
        .offset(3) // This should override the previous offset
        .toSQL();

      expect(sql).toBe(`SELECT * FROM ${tables.users.name} OFFSET 3`);
      expect(parameters).toEqual([]);
    });

    it("should handle pagination pattern", () => {
      const { sql, parameters } = db
        .selectFrom(tables.users.name)
        .select(["id", "name"])
        .orderBy("id", "asc")
        .limit(10)
        .offset(20)
        .toSQL();

      expect(sql).toBe(
        `SELECT id, name FROM ${tables.users.name} ORDER BY id ASC LIMIT 10 OFFSET 20`
      );
      expect(parameters).toEqual([]);
    });
  });
});
