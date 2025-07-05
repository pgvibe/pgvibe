// INSERT with Table Aliases Integration Tests
// Tests INSERT operations with table aliases against real database

import {
  describe,
  test,
  expect,
  beforeAll,
  afterAll,
  beforeEach,
} from "bun:test";
import { pgvibe } from "../../../src/query-builder";
import {
  generateTestId,
  createTestDatabase,
  waitForDatabase,
} from "../utils/test-helpers";
import {
  createMinimalTestTables,
  createTestTables,
} from "../utils/table-factory";
import { performTestCleanup } from "../utils/cleanup";

describe("INSERT with Table Aliases Integration Tests", () => {
  const testId = generateTestId();
  const tables = createMinimalTestTables(testId);
  let db: pgvibe<any>;

  beforeAll(async () => {
    db = createTestDatabase();
    await waitForDatabase();

    // Create isolated test tables
    await createTestTables(db, tables);
  });

  beforeEach(async () => {
    // Clean up data before each test to ensure isolation
    await db.query(
      `TRUNCATE ${tables.posts.name}, ${tables.users.name} RESTART IDENTITY CASCADE`
    );
  });

  afterAll(async () => {
    // Clean up our isolated tables
    await performTestCleanup(db, [tables.users.name, tables.posts.name]);
  });

  describe("Basic INSERT with Alias Operations", () => {
    test("should insert a single user with table alias", async () => {
      const result = await db
        .insertInto(`${tables.users.name} as u`)
        .values({
          name: "John Doe",
          email: "john@example.com",
          active: true,
        })
        .execute();

      expect(result.affectedRows).toBe(1);
    });

    test("should insert with only required fields using alias", async () => {
      const result = await db
        .insertInto(`${tables.users.name} as u`)
        .values({
          name: "Jane Doe",
        })
        .execute();

      expect(result.affectedRows).toBe(1);
    });

    test("should insert multiple users with table alias", async () => {
      const result = await db
        .insertInto(`${tables.users.name} as u`)
        .values([
          { name: "John Doe", email: "john@example.com", active: true },
          { name: "Jane Smith", email: "jane@example.com", active: false },
          { name: "Bob Wilson", email: "bob@example.com" },
        ])
        .execute();

      expect(result.affectedRows).toBe(3);
    });

    test("should handle null values with alias correctly", async () => {
      const result = await db
        .insertInto(`${tables.users.name} as u`)
        .values({
          name: "John Doe",
          email: null, // Nullable field
          active: true,
        })
        .execute();

      expect(result.affectedRows).toBe(1);
    });
  });

  describe("RETURNING Clause with Aliases", () => {
    test("should return alias-qualified columns after insert", async () => {
      const result = await db
        .insertInto(`${tables.users.name} as u`)
        .values({
          name: "John Doe",
          email: "john@example.com",
          active: true,
        })
        .returning(["u.id", "u.name", "u.created_at"])
        .execute();

      expect(Array.isArray(result)).toBe(true);
      expect(result).toHaveLength(1);
      expect(result[0]).toHaveProperty("id");
      expect(result[0]).toHaveProperty("name", "John Doe");
      expect(result[0]).toHaveProperty("created_at");
      expect(result[0]).not.toHaveProperty("email");
    });

    test("should return mixed qualified/unqualified columns", async () => {
      const result = await db
        .insertInto(`${tables.users.name} as u`)
        .values({
          name: "Jane Smith",
          email: "jane@example.com",
          active: false,
        })
        .returning(["u.id", "name", "u.email", "active"])
        .execute();

      expect(Array.isArray(result)).toBe(true);
      expect(result).toHaveLength(1);
      expect(result[0]).toHaveProperty("id");
      expect(result[0]).toHaveProperty("name", "Jane Smith");
      expect(result[0]).toHaveProperty("email", "jane@example.com");
      expect(result[0]).toHaveProperty("active", false);
    });

    test("should return all columns with alias and returningAll()", async () => {
      const result = await db
        .insertInto(`${tables.users.name} as u`)
        .values({
          name: "Bob Wilson",
          email: "bob@example.com",
          active: true,
        })
        .returningAll()
        .execute();

      expect(Array.isArray(result)).toBe(true);
      expect(result).toHaveLength(1);
      expect(result[0]).toHaveProperty("id");
      expect(result[0]).toHaveProperty("name", "Bob Wilson");
      expect(result[0]).toHaveProperty("email", "bob@example.com");
      expect(result[0]).toHaveProperty("active", true);
      expect(result[0]).toHaveProperty("created_at");
    });

    test("should return data from bulk insert with alias", async () => {
      const result = await db
        .insertInto(`${tables.users.name} as u`)
        .values([
          { name: "John Doe", email: "john@example.com" },
          { name: "Jane Smith", email: "jane@example.com" },
        ])
        .returning(["u.id", "u.name", "u.email"])
        .execute();

      expect(Array.isArray(result)).toBe(true);
      expect(result).toHaveLength(2);
      expect(result[0]).toHaveProperty("name", "John Doe");
      expect(result[1]).toHaveProperty("name", "Jane Smith");
      expect(result[0]).toHaveProperty("id");
      expect(result[1]).toHaveProperty("id");
    });
  });

  describe("ON CONFLICT with Aliases", () => {
    test("should handle ON CONFLICT DO NOTHING with alias", async () => {
      // First insert
      await db
        .insertInto(`${tables.users.name} as u`)
        .values({
          name: "John Doe",
          email: "john@example.com",
          active: true,
        })
        .execute();

      // Second insert with same email should be ignored
      const result = await db
        .insertInto(`${tables.users.name} as u`)
        .values({
          name: "John Updated",
          email: "john@example.com", // Duplicate email
          active: false,
        })
        .onConflict((oc) => oc.column("email").doNothing())
        .execute();

      expect(result.affectedRows).toBe(0);

      // Verify original data wasn't changed
      const users = await db
        .selectFrom(`${tables.users.name} as u`)
        .select(["u.name", "u.active"])
        .where("u.email", "=", "john@example.com")
        .execute();

      expect(users).toHaveLength(1);
      expect(users[0]?.name).toBe("John Doe");
      expect(users[0]?.active).toBe(true);
    });

    test("should handle ON CONFLICT DO UPDATE with alias", async () => {
      // First insert
      await db
        .insertInto(`${tables.users.name} as u`)
        .values({
          name: "John Doe",
          email: "john@example.com",
          active: true,
        })
        .execute();

      // Conflict with update
      const result = await db
        .insertInto(`${tables.users.name} as u`)
        .values({
          name: "John New",
          email: "john@example.com",
          active: false,
        })
        .onConflict((oc) =>
          oc.column("email").doUpdate({
            name: "John Updated",
          })
        )
        .execute();

      expect(result.affectedRows).toBe(1);

      // Verify data was updated
      const users = await db
        .selectFrom(`${tables.users.name} as u`)
        .select(["u.name", "u.active"])
        .where("u.email", "=", "john@example.com")
        .execute();

      expect(users).toHaveLength(1);
      expect(users[0]?.name).toBe("John Updated");
      expect(users[0]?.active).toBe(true); // Should keep original value
    });

    test("should handle ON CONFLICT with RETURNING and alias", async () => {
      // First insert
      await db
        .insertInto(`${tables.users.name} as u`)
        .values({
          name: "John Doe",
          email: "john@example.com",
          active: true,
        })
        .execute();

      // Conflict with update and returning
      const result = await db
        .insertInto(`${tables.users.name} as u`)
        .values({
          name: "John New",
          email: "john@example.com",
          active: false,
        })
        .onConflict((oc) =>
          oc.column("email").doUpdate({
            name: "John Updated",
          })
        )
        .returning(["u.id", "u.name", "u.email", "u.active"])
        .execute();

      expect(Array.isArray(result)).toBe(true);
      expect(result).toHaveLength(1);
      expect(result[0]?.name).toBe("John Updated");
      expect(result[0]?.email).toBe("john@example.com");
      expect(result[0]?.active).toBe(true); // Should keep original value
    });
  });

  describe("Complex Combinations with Aliases", () => {
    test("should combine all features with alias", async () => {
      const result = await db
        .insertInto(`${tables.users.name} as u`)
        .values([
          { name: "John Doe", email: "john@example.com", active: true },
          { name: "Jane Smith", email: "jane@example.com", active: false },
        ])
        .onConflict((oc) => oc.column("email").doNothing())
        .returning(["u.id", "u.name", "u.email", "u.active"])
        .execute();

      expect(Array.isArray(result)).toBe(true);
      expect(result).toHaveLength(2);
      expect(result[0]).toHaveProperty("name", "John Doe");
      expect(result[1]).toHaveProperty("name", "Jane Smith");
      expect(result[0]).toHaveProperty("id");
      expect(result[1]).toHaveProperty("id");
    });

    test("should work with posts table and alias", async () => {
      // First create a user
      const userResult = await db
        .insertInto(`${tables.users.name} as u`)
        .values({ name: "Author" })
        .returning(["u.id"])
        .execute();

      const userId = userResult[0]?.id;

      // Then create a post with alias
      const postResult = await db
        .insertInto(`${tables.posts.name} as p`)
        .values({
          user_id: userId,
          title: "My First Post",
          content: "This is the content",
          published: true,
        })
        .returning(["p.id", "p.title", "p.user_id"])
        .execute();

      expect(Array.isArray(postResult)).toBe(true);
      expect(postResult).toHaveLength(1);
      expect(postResult[0]).toHaveProperty("title", "My First Post");
      expect(postResult[0]).toHaveProperty("user_id", userId);
      expect(postResult[0]).toHaveProperty("id");
    });
  });

  describe("Different Table Aliases", () => {
    test("should support various alias names", async () => {
      const result1 = await db
        .insertInto(`${tables.users.name} as user`)
        .values({ name: "John" })
        .returning(["user.id", "user.name"])
        .execute();

      expect(result1).toHaveLength(1);
      expect(result1[0]).toHaveProperty("name", "John");

      const result2 = await db
        .insertInto(`${tables.users.name} as author`)
        .values({ name: "Jane" })
        .returning(["author.id", "author.name"])
        .execute();

      expect(result2).toHaveLength(1);
      expect(result2[0]).toHaveProperty("name", "Jane");
    });

    test("should support semantic aliases", async () => {
      const result = await db
        .insertInto(`${tables.users.name} as author`)
        .values({ name: "Author Name", email: "author@example.com" })
        .returning(["author.id", "author.name", "author.email"])
        .execute();

      expect(result).toHaveLength(1);
      expect(result[0]).toHaveProperty("name", "Author Name");
      expect(result[0]).toHaveProperty("email", "author@example.com");
    });
  });

  describe("Edge Cases with Aliases", () => {
    test("should handle null values correctly with alias", async () => {
      const result = await db
        .insertInto(`${tables.users.name} as u`)
        .values({
          name: "Test User",
          email: null, // Explicitly null
        })
        .returning(["u.id", "u.name", "u.email"])
        .execute();

      expect(result).toHaveLength(1);
      expect(result[0]).toHaveProperty("name", "Test User");
      expect(result[0]).toHaveProperty("email", null);
    });

    test("should handle default values correctly with alias", async () => {
      const result = await db
        .insertInto(`${tables.users.name} as u`)
        .values({
          name: "Default User",
          // Don't specify active or created_at - should use defaults
        })
        .returning(["u.id", "u.name", "u.active", "u.created_at"])
        .execute();

      expect(result).toHaveLength(1);
      expect(result[0]).toHaveProperty("name", "Default User");
      expect(result[0]).toHaveProperty("active", true); // Default value
      expect(result[0]).toHaveProperty("created_at");
      expect(result[0]?.created_at).toBeInstanceOf(Date);
    });

    test("should handle single item array with alias", async () => {
      const result = await db
        .insertInto(`${tables.users.name} as u`)
        .values([{ name: "Single User" }])
        .execute();

      expect(result.affectedRows).toBe(1);
    });
  });

  describe("Verification Against Regular INSERT", () => {
    test("should produce same results as regular INSERT", async () => {
      // Insert with alias
      const aliasResult = await db
        .insertInto(`${tables.users.name} as u`)
        .values({
          name: "Alias User",
          email: "alias@example.com",
          active: true,
        })
        .returning(["u.id", "u.name", "u.email", "u.active"])
        .execute();

      // Insert without alias
      const regularResult = await db
        .insertInto(tables.users.name)
        .values({
          name: "Regular User",
          email: "regular@example.com",
          active: true,
        })
        .returning(["id", "name", "email", "active"])
        .execute();

      // Both should have the same structure
      expect(aliasResult).toHaveLength(1);
      expect(regularResult).toHaveLength(1);

      // Both should have the same properties
      expect(Object.keys(aliasResult[0]!).sort()).toEqual(
        Object.keys(regularResult[0]!).sort()
      );

      // Both should have valid data
      expect(aliasResult[0]).toHaveProperty("name", "Alias User");
      expect(regularResult[0]).toHaveProperty("name", "Regular User");
      expect(aliasResult[0]).toHaveProperty("active", true);
      expect(regularResult[0]).toHaveProperty("active", true);
    });
  });
});
