// INSERT integration tests with real database operations
// Tests actual database INSERT, RETURNING, and ON CONFLICT operations

import {
  describe,
  test,
  expect,
  beforeAll,
  afterAll,
  beforeEach,
} from "bun:test";
import {
  createIntegrationTestDatabase,
  waitForDatabase,
} from "../utils/test-config";

describe("INSERT Integration Tests", () => {
  const db = createIntegrationTestDatabase();

  beforeAll(async () => {
    // Wait for database to be ready
    await waitForDatabase();

    // Create test tables if they don't exist
    await db.query(`
      CREATE TABLE IF NOT EXISTS test_users (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE,
        active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await db.query(`
      CREATE TABLE IF NOT EXISTS test_posts (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES test_users(id),
        title VARCHAR(255) NOT NULL,
        content TEXT,
        published BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
  });

  beforeEach(async () => {
    // Clean up data before each test
    await db.query("TRUNCATE test_posts, test_users RESTART IDENTITY CASCADE");
  });

  afterAll(async () => {
    // Clean up tables after all tests
    await db.query("DROP TABLE IF EXISTS test_posts");
    await db.query("DROP TABLE IF EXISTS test_users");
  });

  describe("Basic INSERT Operations", () => {
    test("should insert a single user and return affected rows", async () => {
      const result = await db
        .insertInto("test_users")
        .values({
          name: "John Doe",
          email: "john@example.com",
          active: true,
        })
        .execute();

      expect(result.affectedRows).toBe(1);
    });

    test("should insert a user with minimal required fields", async () => {
      const result = await db
        .insertInto("test_users" as any)
        .values({
          name: "Jane Doe",
        })
        .execute();

      expect(result.affectedRows).toBe(1);
    });

    test("should insert multiple users in bulk", async () => {
      const result = await db
        .insertInto("test_users" as any)
        .values([
          { name: "John Doe", email: "john@example.com", active: true },
          { name: "Jane Smith", email: "jane@example.com", active: false },
          { name: "Bob Wilson", email: "bob@example.com" },
        ])
        .execute();

      expect(result.affectedRows).toBe(3);
    });

    test("should handle null values correctly", async () => {
      const result = await db
        .insertInto("test_users" as any)
        .values({
          name: "John Doe",
          email: null, // Nullable field
          active: true,
        })
        .execute();

      expect(result.affectedRows).toBe(1);
    });
  });

  describe("RETURNING Clause", () => {
    test("should return specific columns after insert", async () => {
      const result = await db
        .insertInto("test_users" as any)
        .values({
          name: "John Doe",
          email: "john@example.com",
          active: true,
        })
        .returning(["id", "name", "created_at"])
        .execute();

      expect(Array.isArray(result)).toBe(true);
      expect(result).toHaveLength(1);
      expect(result[0]).toHaveProperty("id");
      expect(result[0]).toHaveProperty("name", "John Doe");
      expect(result[0]).toHaveProperty("created_at");
      expect(result[0]).not.toHaveProperty("email");
    });

    test("should return all columns with returningAll()", async () => {
      const result = await db
        .insertInto("test_users" as any)
        .values({
          name: "Jane Smith",
          email: "jane@example.com",
          active: false,
        })
        .returningAll()
        .execute();

      expect(Array.isArray(result)).toBe(true);
      expect(result).toHaveLength(1);
      expect(result[0]).toHaveProperty("id");
      expect(result[0]).toHaveProperty("name", "Jane Smith");
      expect(result[0]).toHaveProperty("email", "jane@example.com");
      expect(result[0]).toHaveProperty("active", false);
      expect(result[0]).toHaveProperty("created_at");
    });

    test("should return data from bulk insert", async () => {
      const result = await db
        .insertInto("test_users" as any)
        .values([
          { name: "John Doe", email: "john@example.com" },
          { name: "Jane Smith", email: "jane@example.com" },
        ])
        .returning(["id", "name", "email"])
        .execute();

      expect(Array.isArray(result)).toBe(true);
      expect(result).toHaveLength(2);
      expect(result[0]).toHaveProperty("name", "John Doe");
      expect(result[1]).toHaveProperty("name", "Jane Smith");
      expect(result[0]).toHaveProperty("id");
      expect(result[1]).toHaveProperty("id");
    });
  });

  describe("ON CONFLICT Operations", () => {
    test("should handle ON CONFLICT DO NOTHING", async () => {
      // First insert
      await db
        .insertInto("test_users" as any)
        .values({
          name: "John Doe",
          email: "john@example.com",
          active: true,
        })
        .execute();

      // Second insert with same email should be ignored
      const result = await db
        .insertInto("test_users" as any)
        .values({
          name: "John Updated",
          email: "john@example.com", // Duplicate email
          active: false,
        })
        .onConflict((oc: any) => oc.column("email").doNothing())
        .execute();

      expect(result.affectedRows).toBe(0);

      // Verify original data wasn't changed
      const users = await db
        .selectFrom("test_users" as any)
        .select(["name", "active"])
        .where("email", "=", "john@example.com")
        .execute();

      expect(users).toHaveLength(1);
      expect(users[0]?.name).toBe("John Doe");
      expect(users[0]?.active).toBe(true);
    });

    test("should handle ON CONFLICT DO UPDATE", async () => {
      // First insert
      await db
        .insertInto("test_users" as any)
        .values({
          name: "John Doe",
          email: "john@example.com",
          active: true,
        })
        .execute();

      // Second insert with update on conflict
      const result = await db
        .insertInto("test_users" as any)
        .values({
          name: "John Updated",
          email: "john@example.com", // Duplicate email
          active: false,
        })
        .onConflict((oc: any) =>
          oc.column("email").doUpdate({
            name: "John Updated",
            active: false,
          })
        )
        .execute();

      expect(result.affectedRows).toBe(1);

      // Verify data was updated
      const users = await db
        .selectFrom("test_users" as any)
        .select(["name", "active"])
        .where("email", "=", "john@example.com")
        .execute();

      expect(users).toHaveLength(1);
      expect(users[0]?.name).toBe("John Updated");
      expect(users[0]?.active).toBe(false);
    });

    test("should handle ON CONFLICT with RETURNING", async () => {
      // First insert
      await db
        .insertInto("test_users" as any)
        .values({
          name: "John Doe",
          email: "john@example.com",
          active: true,
        })
        .execute();

      // Conflict with update and returning
      const result = await db
        .insertInto("test_users" as any)
        .values({
          name: "John New",
          email: "john@example.com",
          active: false,
        })
        .onConflict((oc: any) =>
          oc.column("email").doUpdate({
            name: "John Updated",
          })
        )
        .returning(["id", "name", "email", "active"])
        .execute();

      expect(Array.isArray(result)).toBe(true);
      expect(result).toHaveLength(1);
      expect(result[0]?.name).toBe("John Updated");
      expect(result[0]?.email).toBe("john@example.com");
      expect(result[0]?.active).toBe(true); // Should keep original value
    });

    test("should handle multiple conflict columns", async () => {
      // Create a unique constraint on name + email combination (simulated with single column for this test)
      await db
        .insertInto("test_users" as any)
        .values({
          name: "John Doe",
          email: "john@example.com",
        })
        .execute();

      const result = await db
        .insertInto("test_users" as any)
        .values({
          name: "John Doe",
          email: "john@example.com", // Same combination
          active: false,
        })
        .onConflict((oc: any) => oc.columns(["email"]).doNothing())
        .execute();

      expect(result.affectedRows).toBe(0);
    });
  });

  describe("Complex Scenarios", () => {
    test("should work with foreign key relationships", async () => {
      // First create a user
      const userResult = await db
        .insertInto("test_users" as any)
        .values({
          name: "John Doe",
          email: "john@example.com",
        })
        .returning(["id"])
        .execute();

      const userId = userResult[0]?.id;
      expect(userId).toBeDefined();

      // Then create a post for that user
      const postResult = await db
        .insertInto("test_posts" as any)
        .values({
          user_id: userId!,
          title: "My First Post",
          content: "This is my first post content",
          published: true,
        })
        .returning(["id", "title", "user_id"])
        .execute();

      expect(postResult).toHaveLength(1);
      expect(postResult[0]?.title).toBe("My First Post");
      expect(postResult[0]?.user_id).toBe(userId);
    });

    test("should handle large bulk inserts", async () => {
      const users = Array.from({ length: 50 }, (_, i) => ({
        name: `User ${i + 1}`,
        email: `user${i + 1}@example.com`,
        active: i % 2 === 0,
      }));

      const result = await db
        .insertInto("test_users" as any)
        .values(users)
        .execute();

      expect(result.affectedRows).toBe(50);

      // Verify data was inserted
      const count = await db
        .selectFrom("test_users" as any)
        .select(["id"])
        .execute();
      expect(count).toHaveLength(50);
    });

    test("should handle default values", async () => {
      const result = await db
        .insertInto("test_users" as any)
        .values({
          name: "John Doe",
          email: "john@example.com",
        })
        .returningAll()
        .execute();

      expect(result).toHaveLength(1);
      expect(result[0]?.active).toBe(true); // Default value
      expect(result[0]?.created_at).toBeDefined();
    });
  });

  describe("Error Handling", () => {
    test("should handle constraint violations", async () => {
      // First insert
      await db
        .insertInto("test_users" as any)
        .values({
          name: "John Doe",
          email: "john@example.com",
        })
        .execute();

      // Second insert with same email should fail without ON CONFLICT
      await expect(
        db
          .insertInto("test_users" as any)
          .values({
            name: "Jane Doe",
            email: "john@example.com", // Duplicate email
          })
          .execute()
      ).rejects.toThrow();
    });

    test("should handle missing required fields", async () => {
      // This should fail because name is required but we're not providing it
      await expect(
        db
          .insertInto("test_users" as any)
          .values({
            email: "john@example.com",
          } as any) // Type assertion to bypass compile-time check
          .execute()
      ).rejects.toThrow();
    });

    test("should handle invalid foreign key", async () => {
      await expect(
        db
          .insertInto("test_posts" as any)
          .values({
            user_id: 99999, // Non-existent user
            title: "Test Post",
          })
          .execute()
      ).rejects.toThrow();
    });
  });

  describe("Raw SQL for Complex Cases", () => {
    test("should work with template literal raw SQL", async () => {
      const userId = 123;
      const email = "test@example.com";

      // Insert using template literal
      const result = await db.sql`
        INSERT INTO test_users (name, email) 
        VALUES ('Template User', ${email})
        RETURNING id, name, email
      `;

      expect(result.rows).toHaveLength(1);
      expect(result.rows[0]?.name).toBe("Template User");
      expect(result.rows[0]?.email).toBe(email);
    });

    test("should work with query method", async () => {
      const result = await db.query(
        `
        INSERT INTO test_users (name, email) 
        VALUES ($1, $2)
        RETURNING id, name, email
      `,
        ["Query User", "query@example.com"]
      );

      expect(result.rows).toHaveLength(1);
      expect(result.rows[0]?.name).toBe("Query User");
      expect(result.rows[0]?.email).toBe("query@example.com");
    });
  });
});
