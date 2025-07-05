// INSERT Utility Types Tests
// Tests the Generated<T> and WithDefault<T> utility types for INSERT operations

import { describe, test, expect } from "bun:test";
import { createIntegrationTestDatabase } from "../utils/test-config";

describe("INSERT Utility Types", () => {
  const db = createIntegrationTestDatabase();

  describe("Generated<T> Type Behavior", () => {
    test("should allow INSERT without Generated<T> columns", () => {
      // test_users.id is Generated<number> - should be optional in INSERT
      const query = db.insertInto("test_users").values({
        name: "John Doe", // Required field
        email: "john@example.com", // Optional (nullable)
        // id should NOT be required (Generated<number>)
      });

      const { sql, parameters } = query.toSQL();

      expect(sql).toBe("INSERT INTO test_users (name, email) VALUES ($1, $2)");
      expect(parameters).toEqual(["John Doe", "john@example.com"]);
    });

    test("should allow INSERT with only required fields", () => {
      // Only provide required fields, Generated<T> columns should be optional
      const query = db.insertInto("test_users").values({
        name: "Jane Doe", // Required field only
        // id (Generated<number>) - optional
        // created_at (Generated<Date>) - optional
        // email (string | null) - optional
        // active (WithDefault<boolean>) - optional
      });

      const { sql, parameters } = query.toSQL();

      expect(sql).toBe("INSERT INTO test_users (name) VALUES ($1)");
      expect(parameters).toEqual(["Jane Doe"]);
    });

    test("should work with bulk inserts and Generated<T> columns", () => {
      const query = db.insertInto("test_users").values([
        { name: "User 1", email: "user1@example.com" },
        { name: "User 2", active: false },
        { name: "User 3" }, // Only required field
      ]);

      const { sql, parameters } = query.toSQL();

      expect(sql).toBe(
        "INSERT INTO test_users (name, email) VALUES ($1, $2), ($3, $4), ($5, $6)"
      );
      expect(parameters).toEqual([
        "User 1",
        "user1@example.com",
        "User 2",
        undefined,
        "User 3",
        undefined,
      ]);
    });

    test("should support RETURNING with Generated<T> columns", () => {
      const query = db
        .insertInto("test_users")
        .values({ name: "John Doe" })
        .returning(["id", "name", "created_at"]); // Including Generated<T> columns

      const { sql, parameters } = query.toSQL();

      expect(sql).toBe(
        "INSERT INTO test_users (name) VALUES ($1) RETURNING id, name, created_at"
      );
      expect(parameters).toEqual(["John Doe"]);
    });
  });

  describe("WithDefault<T> Type Behavior", () => {
    test("should allow INSERT without WithDefault<T> columns", () => {
      // test_users.active is WithDefault<boolean> - should be optional in INSERT
      const query = db.insertInto("test_users").values({
        name: "John Doe", // Required field
        email: "john@example.com", // Optional (nullable)
        // active should NOT be required (WithDefault<boolean>)
      });

      const { sql, parameters } = query.toSQL();

      expect(sql).toBe("INSERT INTO test_users (name, email) VALUES ($1, $2)");
      expect(parameters).toEqual(["John Doe", "john@example.com"]);
    });

    test("should allow explicit values for WithDefault<T> columns", () => {
      const query = db.insertInto("test_users").values({
        name: "Jane Doe",
        active: false, // Explicitly set WithDefault<boolean> column
      });

      const { sql, parameters } = query.toSQL();

      expect(sql).toBe("INSERT INTO test_users (name, active) VALUES ($1, $2)");
      expect(parameters).toEqual(["Jane Doe", false]);
    });

    test("should work with posts table WithDefault<T> columns", () => {
      // test_posts.published is WithDefault<boolean> - should be optional
      const query = db.insertInto("test_posts").values({
        user_id: 1, // Required field
        title: "My Post", // Required field
        content: "Post content", // Optional (nullable)
        // published should NOT be required (WithDefault<boolean>)
      });

      const { sql, parameters } = query.toSQL();

      expect(sql).toBe(
        "INSERT INTO test_posts (user_id, title, content) VALUES ($1, $2, $3)"
      );
      expect(parameters).toEqual([1, "My Post", "Post content"]);
    });

    test("should support RETURNING with WithDefault<T> columns", () => {
      const query = db
        .insertInto("test_posts")
        .values({ user_id: 1, title: "Test Post" })
        .returning(["id", "title", "published"]); // Including WithDefault<T> column

      const { sql, parameters } = query.toSQL();

      expect(sql).toBe(
        "INSERT INTO test_posts (user_id, title) VALUES ($1, $2) RETURNING id, title, published"
      );
      expect(parameters).toEqual([1, "Test Post"]);
    });
  });

  describe("Nullable Column Type Behavior", () => {
    test("should allow INSERT without nullable columns", () => {
      // test_users.email is string | null - should be optional in INSERT
      const query = db.insertInto("test_users").values({
        name: "John Doe", // Required field
        // email should NOT be required (string | null)
      });

      const { sql, parameters } = query.toSQL();

      expect(sql).toBe("INSERT INTO test_users (name) VALUES ($1)");
      expect(parameters).toEqual(["John Doe"]);
    });

    test("should allow explicit null for nullable columns", () => {
      const query = db.insertInto("test_users").values({
        name: "Jane Doe",
        email: null, // Explicitly set nullable column to null
      });

      const { sql, parameters } = query.toSQL();

      expect(sql).toBe("INSERT INTO test_users (name, email) VALUES ($1, $2)");
      expect(parameters).toEqual(["Jane Doe", null]);
    });

    test("should allow string values for nullable columns", () => {
      const query = db.insertInto("test_users").values({
        name: "Bob Smith",
        email: "bob@example.com", // String value for nullable column
      });

      const { sql, parameters } = query.toSQL();

      expect(sql).toBe("INSERT INTO test_users (name, email) VALUES ($1, $2)");
      expect(parameters).toEqual(["Bob Smith", "bob@example.com"]);
    });
  });

  describe("Combined Type Behavior", () => {
    test("should allow INSERT with all optional column types omitted", () => {
      // Only provide required fields, all optional types should be omitted
      const query = db.insertInto("test_users").values({
        name: "Minimal User", // Required field only
        // id (Generated<number>) - optional
        // email (string | null) - optional
        // active (WithDefault<boolean>) - optional
        // created_at (Generated<Date>) - optional
      });

      const { sql, parameters } = query.toSQL();

      expect(sql).toBe("INSERT INTO test_users (name) VALUES ($1)");
      expect(parameters).toEqual(["Minimal User"]);
    });

    test("should allow INSERT with all column types provided", () => {
      const query = db.insertInto("test_users").values({
        name: "Full User", // Required
        email: "full@example.com", // Optional (nullable)
        active: true, // Optional (WithDefault<boolean>)
        // id and created_at cannot be explicitly set (Generated<T>)
      });

      const { sql, parameters } = query.toSQL();

      expect(sql).toBe(
        "INSERT INTO test_users (name, email, active) VALUES ($1, $2, $3)"
      );
      expect(parameters).toEqual(["Full User", "full@example.com", true]);
    });

    test("should work with posts table combined types", () => {
      const query = db.insertInto("test_posts").values({
        user_id: 1, // Required
        title: "Complete Post", // Required
        content: "Post content", // Optional (nullable)
        published: true, // Optional (WithDefault<boolean>)
        // id and created_at cannot be explicitly set (Generated<T>)
      });

      const { sql, parameters } = query.toSQL();

      expect(sql).toBe(
        "INSERT INTO test_posts (user_id, title, content, published) VALUES ($1, $2, $3, $4)"
      );
      expect(parameters).toEqual([1, "Complete Post", "Post content", true]);
    });

    test("should support bulk insert with mixed optional columns", () => {
      const query = db.insertInto("test_users").values([
        {
          name: "User A",
          email: "a@example.com",
          active: true,
        },
        {
          name: "User B",
          active: false,
          // email omitted (nullable)
        },
        {
          name: "User C",
          email: null,
          // active omitted (WithDefault)
        },
        {
          name: "User D",
          // Both email and active omitted
        },
      ]);

      const { sql, parameters } = query.toSQL();

      expect(sql).toBe(
        "INSERT INTO test_users (name, email, active) VALUES ($1, $2, $3), ($4, $5, $6), ($7, $8, $9), ($10, $11, $12)"
      );
      expect(parameters).toEqual([
        "User A",
        "a@example.com",
        true,
        "User B",
        undefined,
        false,
        "User C",
        null,
        undefined,
        "User D",
        undefined,
        undefined,
      ]);
    });
  });

  describe("RETURNING with Utility Types", () => {
    test("should return Generated<T> columns from database", () => {
      const query = db
        .insertInto("test_users")
        .values({ name: "Test User" })
        .returning(["id", "created_at"]); // Both Generated<T> columns

      const { sql, parameters } = query.toSQL();

      expect(sql).toBe(
        "INSERT INTO test_users (name) VALUES ($1) RETURNING id, created_at"
      );
      expect(parameters).toEqual(["Test User"]);
    });

    test("should return WithDefault<T> columns with their default values", () => {
      const query = db
        .insertInto("test_users")
        .values({ name: "Default Test" })
        .returning(["active"]); // WithDefault<boolean> column

      const { sql, parameters } = query.toSQL();

      expect(sql).toBe(
        "INSERT INTO test_users (name) VALUES ($1) RETURNING active"
      );
      expect(parameters).toEqual(["Default Test"]);
    });

    test("should return all columns including utility types", () => {
      const query = db
        .insertInto("test_users")
        .values({ name: "Complete Test" })
        .returningAll();

      const { sql, parameters } = query.toSQL();

      expect(sql).toBe("INSERT INTO test_users (name) VALUES ($1) RETURNING *");
      expect(parameters).toEqual(["Complete Test"]);
    });
  });

  describe("ON CONFLICT with Utility Types", () => {
    test("should work with ON CONFLICT on nullable columns", () => {
      const query = db
        .insertInto("test_users")
        .values({
          name: "Conflict User",
          email: "conflict@example.com",
        })
        .onConflict((oc) => oc.column("email").doNothing());

      const { sql, parameters } = query.toSQL();

      expect(sql).toBe(
        "INSERT INTO test_users (name, email) VALUES ($1, $2) ON CONFLICT (email) DO NOTHING"
      );
      expect(parameters).toEqual(["Conflict User", "conflict@example.com"]);
    });

    test("should work with ON CONFLICT DO UPDATE with utility types", () => {
      const query = db
        .insertInto("test_users")
        .values({
          name: "Update User",
          email: "update@example.com",
          active: false,
        })
        .onConflict((oc) =>
          oc.column("email").doUpdate({
            name: "Updated User",
            active: true, // WithDefault<T> column
          })
        );

      const { sql, parameters } = query.toSQL();

      expect(sql).toBe(
        "INSERT INTO test_users (name, email, active) VALUES ($1, $2, $3) ON CONFLICT (email) DO UPDATE SET name = $4, active = $5"
      );
      expect(parameters).toEqual([
        "Update User",
        "update@example.com",
        false,
        "Updated User",
        true,
      ]);
    });

    test("should combine ON CONFLICT with RETURNING utility types", () => {
      const query = db
        .insertInto("test_users")
        .values({
          name: "Conflict Return User",
          email: "conflictreturn@example.com",
        })
        .onConflict((oc) =>
          oc.column("email").doUpdate({ name: "Conflict Updated" })
        )
        .returning(["id", "name", "active", "created_at"]);

      const { sql, parameters } = query.toSQL();

      expect(sql).toBe(
        "INSERT INTO test_users (name, email) VALUES ($1, $2) ON CONFLICT (email) DO UPDATE SET name = $3 RETURNING id, name, active, created_at"
      );
      expect(parameters).toEqual([
        "Conflict Return User",
        "conflictreturn@example.com",
        "Conflict Updated",
      ]);
    });
  });

  describe("Type System Validation", () => {
    test("should maintain type safety with utility types", () => {
      // These should compile without TypeScript errors
      const query1 = db.insertInto("test_users").values({ name: "Test" });
      const query2 = db
        .insertInto("test_users")
        .values({ name: "Test", email: "test@example.com" });
      const query3 = db
        .insertInto("test_users")
        .values({ name: "Test", active: false });
      const query4 = db
        .insertInto("test_posts")
        .values({ user_id: 1, title: "Test" });
      const query5 = db
        .insertInto("test_posts")
        .values({ user_id: 1, title: "Test", published: true });

      expect(query1).toBeDefined();
      expect(query2).toBeDefined();
      expect(query3).toBeDefined();
      expect(query4).toBeDefined();
      expect(query5).toBeDefined();
    });
  });
});
