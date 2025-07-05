// SELECT Integration Tests
// Tests SELECT operations with isolated test tables

import { describe, test, expect, beforeAll, afterAll } from "bun:test";
import { pgvibe } from "../../../src/query-builder";
import {
  generateTestId,
  createTestDatabase,
  waitForDatabase,
  expectTypeMatch,
} from "../utils/test-helpers";
import {
  createStandardTestTables,
  createTestTables,
  seedTestData,
} from "../utils/table-factory";
import { performTestCleanup } from "../utils/cleanup";

describe("SELECT Integration Tests", () => {
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

  describe("Basic SELECT Operations", () => {
    test("should execute SELECT * from users table", async () => {
      const users = await db.selectFrom(tables.users.name).execute();

      expect(users.length).toBeGreaterThan(0);
      expect(users.length).toBe(3); // We seeded 3 users

      const user = users[0]!;
      expectTypeMatch(user, ["id", "name", "email", "active", "created_at"]);

      expect(typeof user.id).toBe("number");
      expect(typeof user.name).toBe("string");
      expect(typeof user.active).toBe("boolean");
      expect(user.created_at).toBeInstanceOf(Date);
    });

    test("should execute SELECT with specific columns", async () => {
      const users = await db
        .selectFrom(tables.users.name)
        .select(["id", "name", "email"])
        .execute();

      expect(users.length).toBe(3);

      const user = users[0]!;
      expect(user).toHaveProperty("id");
      expect(user).toHaveProperty("name");
      expect(user).toHaveProperty("email");
      // Should not have other properties
      expect(user).not.toHaveProperty("active");
      expect(user).not.toHaveProperty("created_at");
    });

    test("should execute SELECT with WHERE clause", async () => {
      const activeUsers = await db
        .selectFrom(tables.users.name)
        .where("active", "=", true)
        .execute();

      expect(activeUsers.length).toBeGreaterThan(0);

      // All returned users should be active
      activeUsers.forEach((user) => {
        expect(user.active).toBe(true);
      });
    });

    test("should execute SELECT with multiple WHERE conditions", async () => {
      const results = await db
        .selectFrom(tables.users.name)
        .where("active", "=", true)
        .where("id", ">", 0)
        .execute();

      results.forEach((user) => {
        expect(user.active).toBe(true);
        expect(user.id).toBeGreaterThan(0);
      });
    });
  });

  describe("WHERE Clause Variations", () => {
    test("should handle different comparison operators", async () => {
      // Test IN operator
      const usersById = await db
        .selectFrom(tables.users.name)
        .where("id", "in", userIds.slice(0, 2))
        .execute();

      expect(usersById.length).toBe(2);
      usersById.forEach((user) => {
        expect(userIds.slice(0, 2)).toContain(user.id);
      });

      // Test LIKE operator
      const usersByName = await db
        .selectFrom(tables.users.name)
        .where("name", "like", "Test User%")
        .execute();

      expect(usersByName.length).toBe(3); // All our test users match this pattern
      usersByName.forEach((user) => {
        expect(user.name.startsWith("Test User")).toBe(true);
      });
    });

    test("should handle NULL checks", async () => {
      const usersWithEmail = await db
        .selectFrom(tables.users.name)
        .where("email", "is not", null)
        .execute();

      usersWithEmail.forEach((user) => {
        expect(user.email).not.toBeNull();
        expect(typeof user.email).toBe("string");
      });
    });

    test("should handle complex WHERE conditions with expression builder", async () => {
      const results = await db
        .selectFrom(tables.users.name)
        .where(({ eb }) =>
          eb.and([
            eb.or([eb("active", "=", true), eb("name", "like", "Admin%")]),
            eb("id", ">", 0),
          ])
        )
        .execute();

      results.forEach((user) => {
        expect(user.id).toBeGreaterThan(0);
        expect(user.active === true || user.name.startsWith("Admin")).toBe(
          true
        );
      });
    });
  });

  describe("ORDER BY and LIMIT", () => {
    test("should execute ORDER BY single column", async () => {
      const users = await db
        .selectFrom(tables.users.name)
        .select(["id", "name"])
        .orderBy("name", "asc")
        .execute();

      expect(users.length).toBe(3);

      // Check if properly ordered
      for (let i = 1; i < users.length; i++) {
        expect(users[i]!.name >= users[i - 1]!.name).toBe(true);
      }
    });

    test("should execute ORDER BY multiple columns", async () => {
      const users = await db
        .selectFrom(tables.users.name)
        .select(["id", "name", "active"])
        .orderBy("active", "desc")
        .orderBy("name", "asc")
        .execute();

      expect(users.length).toBe(3);

      // Active users should come first, then ordered by name
      let foundInactive = false;
      for (const user of users) {
        if (!user.active) {
          foundInactive = true;
        } else if (foundInactive) {
          // Should not find active users after inactive ones
          throw new Error(
            "Active user found after inactive user - ordering incorrect"
          );
        }
      }
    });

    test("should execute LIMIT", async () => {
      const users = await db.selectFrom(tables.users.name).limit(2).execute();

      expect(users.length).toBe(2);
    });

    test("should execute OFFSET", async () => {
      const allUsers = await db
        .selectFrom(tables.users.name)
        .orderBy("id", "asc")
        .execute();

      const usersWithOffset = await db
        .selectFrom(tables.users.name)
        .orderBy("id", "asc")
        .offset(1)
        .execute();

      expect(usersWithOffset.length).toBe(allUsers.length - 1);
      expect(usersWithOffset[0]!.id).toBe(allUsers[1]!.id);
    });

    test("should execute LIMIT with OFFSET", async () => {
      const users = await db
        .selectFrom(tables.users.name)
        .orderBy("id", "asc")
        .limit(1)
        .offset(1)
        .execute();

      expect(users.length).toBe(1);
    });
  });

  describe("Edge Cases", () => {
    test("should handle empty results gracefully", async () => {
      const nonExistentUsers = await db
        .selectFrom(tables.users.name)
        .where("id", "=", 999999)
        .execute();

      expect(Array.isArray(nonExistentUsers)).toBe(true);
      expect(nonExistentUsers.length).toBe(0);
    });

    test("should handle LIMIT 0", async () => {
      const users = await db.selectFrom(tables.users.name).limit(0).execute();

      expect(Array.isArray(users)).toBe(true);
      expect(users.length).toBe(0);
    });

    test("should handle large LIMIT numbers gracefully", async () => {
      const users = await db
        .selectFrom(tables.users.name)
        .limit(999999)
        .execute();

      expect(Array.isArray(users)).toBe(true);
      expect(users.length).toBe(3); // Should return all available users
    });

    test("should handle large OFFSET numbers gracefully", async () => {
      const users = await db
        .selectFrom(tables.users.name)
        .offset(999)
        .execute();

      expect(Array.isArray(users)).toBe(true);
      expect(users.length).toBe(0); // Should return empty array
    });
  });

  describe("Type Safety Validation", () => {
    test("should return properly typed results", async () => {
      const users = await db.selectFrom(tables.users.name).execute();

      if (users.length > 0) {
        const user = users[0]!;

        // Check all required properties exist and have correct types
        expect(typeof user.id).toBe("number");
        expect(typeof user.name).toBe("string");
        expect(typeof user.active).toBe("boolean");
        expect(user.created_at).toBeInstanceOf(Date);

        // Email can be null or string
        expect(user.email === null || typeof user.email === "string").toBe(
          true
        );
      }
    });

    test("should handle nullable fields correctly", async () => {
      const users = await db.selectFrom(tables.users.name).execute();

      users.forEach((user) => {
        // Email can be null or string
        if (user.email !== null) {
          expect(typeof user.email).toBe("string");
        }
      });
    });
  });
});
