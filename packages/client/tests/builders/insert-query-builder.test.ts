// INSERT query builder tests
// Tests the fluent API and SQL generation for INSERT operations

import { describe, test, expect } from "bun:test";
import { createTestDatabase } from "../utils/test-config";

describe("INSERT Query Builder", () => {
  const db = createTestDatabase();

  describe("Basic INSERT Operations", () => {
    test("should generate correct SQL for simple INSERT", () => {
      const query = db
        .insertInto("users")
        .values({ name: "John Doe", email: "john@example.com", active: true });

      const { sql, parameters } = query.toSQL();

      expect(sql).toBe(
        "INSERT INTO users (name, email, active) VALUES ($1, $2, $3)"
      );
      expect(parameters).toEqual(["John Doe", "john@example.com", true]);
    });

    test("should generate correct SQL for INSERT with minimal required fields", () => {
      const query = db.insertInto("users").values({ name: "John Doe" }); // Only required field

      const { sql, parameters } = query.toSQL();

      expect(sql).toBe("INSERT INTO users (name) VALUES ($1)");
      expect(parameters).toEqual(["John Doe"]);
    });

    test("should generate correct SQL for bulk INSERT", () => {
      const query = db.insertInto("users").values([
        { name: "John Doe", email: "john@example.com", active: true },
        { name: "Jane Smith", email: "jane@example.com", active: false },
      ]);

      const { sql, parameters } = query.toSQL();

      expect(sql).toBe(
        "INSERT INTO users (name, email, active) VALUES ($1, $2, $3), ($4, $5, $6)"
      );
      expect(parameters).toEqual([
        "John Doe",
        "john@example.com",
        true,
        "Jane Smith",
        "jane@example.com",
        false,
      ]);
    });

    test("should handle mixed columns in bulk INSERT", () => {
      const query = db.insertInto("users").values([
        { name: "John Doe", active: true },
        { name: "Jane Smith", email: "jane@example.com" },
      ]);

      const { sql, parameters } = query.toSQL();

      // Should use columns from first object as the template
      expect(sql).toBe(
        "INSERT INTO users (name, active) VALUES ($1, $2), ($3, $4)"
      );
      expect(parameters).toEqual(["John Doe", true, "Jane Smith", undefined]);
    });
  });

  describe("RETURNING Clause", () => {
    test("should generate correct SQL for INSERT with RETURNING specific columns", () => {
      const query = db
        .insertInto("users")
        .values({ name: "John Doe", email: "john@example.com", active: true })
        .returning(["id", "name"]);

      const { sql, parameters } = query.toSQL();

      expect(sql).toBe(
        "INSERT INTO users (name, email, active) VALUES ($1, $2, $3) RETURNING id, name"
      );
      expect(parameters).toEqual(["John Doe", "john@example.com", true]);
    });

    test("should generate correct SQL for INSERT with RETURNING *", () => {
      const query = db
        .insertInto("users")
        .values({ name: "John Doe", email: "john@example.com", active: true })
        .returningAll();

      const { sql, parameters } = query.toSQL();

      expect(sql).toBe(
        "INSERT INTO users (name, email, active) VALUES ($1, $2, $3) RETURNING *"
      );
      expect(parameters).toEqual(["John Doe", "john@example.com", true]);
    });

    test("should work with bulk INSERT and RETURNING", () => {
      const query = db
        .insertInto("users")
        .values([
          { name: "John Doe", active: true },
          { name: "Jane Smith", active: false },
        ])
        .returning(["id", "name", "active"]);

      const { sql, parameters } = query.toSQL();

      expect(sql).toBe(
        "INSERT INTO users (name, active) VALUES ($1, $2), ($3, $4) RETURNING id, name, active"
      );
      expect(parameters).toEqual(["John Doe", true, "Jane Smith", false]);
    });
  });

  describe("ON CONFLICT Clause", () => {
    test("should generate correct SQL for ON CONFLICT DO NOTHING with single column", () => {
      const query = db
        .insertInto("users")
        .values({ name: "John Doe", email: "john@example.com", active: true })
        .onConflict((oc) => oc.column("email").doNothing());

      const { sql, parameters } = query.toSQL();

      expect(sql).toBe(
        "INSERT INTO users (name, email, active) VALUES ($1, $2, $3) ON CONFLICT (email) DO NOTHING"
      );
      expect(parameters).toEqual(["John Doe", "john@example.com", true]);
    });

    test("should generate correct SQL for ON CONFLICT DO NOTHING with multiple columns", () => {
      const query = db
        .insertInto("users")
        .values({ name: "John Doe", email: "john@example.com", active: true })
        .onConflict((oc) => oc.columns(["email", "name"]).doNothing());

      const { sql, parameters } = query.toSQL();

      expect(sql).toBe(
        "INSERT INTO users (name, email, active) VALUES ($1, $2, $3) ON CONFLICT (email, name) DO NOTHING"
      );
      expect(parameters).toEqual(["John Doe", "john@example.com", true]);
    });

    test("should generate correct SQL for ON CONFLICT DO UPDATE", () => {
      const query = db
        .insertInto("users")
        .values({ name: "John Doe", email: "john@example.com", active: true })
        .onConflict((oc) =>
          oc.column("email").doUpdate({ name: "John Updated", active: false })
        );

      const { sql, parameters } = query.toSQL();

      expect(sql).toBe(
        "INSERT INTO users (name, email, active) VALUES ($1, $2, $3) ON CONFLICT (email) DO UPDATE SET name = $4, active = $5"
      );
      expect(parameters).toEqual([
        "John Doe",
        "john@example.com",
        true,
        "John Updated",
        false,
      ]);
    });

    test("should generate correct SQL for constraint-based ON CONFLICT", () => {
      const query = db
        .insertInto("users")
        .values({ name: "John Doe", email: "john@example.com", active: true })
        .onConflict((oc) => oc.constraint("users_email_unique").doNothing());

      const { sql, parameters } = query.toSQL();

      expect(sql).toBe(
        "INSERT INTO users (name, email, active) VALUES ($1, $2, $3) ON CONFLICT ON CONSTRAINT users_email_unique DO NOTHING"
      );
      expect(parameters).toEqual(["John Doe", "john@example.com", true]);
    });
  });

  describe("Complex Combinations", () => {
    test("should combine INSERT with RETURNING and ON CONFLICT", () => {
      const query = db
        .insertInto("users")
        .values({ name: "John Doe", email: "john@example.com", active: true })
        .onConflict((oc) =>
          oc.column("email").doUpdate({ name: "John Updated" })
        )
        .returning(["id", "name", "email"]);

      const { sql, parameters } = query.toSQL();

      expect(sql).toBe(
        "INSERT INTO users (name, email, active) VALUES ($1, $2, $3) ON CONFLICT (email) DO UPDATE SET name = $4 RETURNING id, name, email"
      );
      expect(parameters).toEqual([
        "John Doe",
        "john@example.com",
        true,
        "John Updated",
      ]);
    });

    test("should work with posts table", () => {
      const query = db
        .insertInto("posts")
        .values({
          user_id: 1,
          title: "My First Post",
          content: "This is the content",
          published: true,
        })
        .returning(["id", "title"]);

      const { sql, parameters } = query.toSQL();

      expect(sql).toBe(
        "INSERT INTO posts (user_id, title, content, published) VALUES ($1, $2, $3, $4) RETURNING id, title"
      );
      expect(parameters).toEqual([
        1,
        "My First Post",
        "This is the content",
        true,
      ]);
    });
  });

  describe("Builder Pattern", () => {
    test("should be immutable - methods return new instances", () => {
      const base = db.insertInto("users");
      const withValues = base.values({ name: "John Doe" });
      const withReturning = withValues.returning(["id", "name"]);

      expect(base).not.toBe(withValues);
      expect(withValues).not.toBe(withReturning);
    });

    test("should chain methods fluently", () => {
      const query = db
        .insertInto("users")
        .values({ name: "John Doe", email: "john@example.com" })
        .onConflict((oc) => oc.column("email").doNothing())
        .returning(["id", "name"]);

      expect(query).toBeDefined();
      expect(query.toSQL().sql).toContain("INSERT");
      expect(query.toSQL().sql).toContain("ON CONFLICT");
      expect(query.toSQL().sql).toContain("RETURNING");
    });
  });
});
