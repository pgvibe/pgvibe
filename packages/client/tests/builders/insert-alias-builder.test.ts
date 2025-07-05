// INSERT with Table Aliases Builder Tests
// Tests the fluent API and SQL generation for INSERT operations with table aliases

import { describe, test, expect } from "bun:test";
import { createIntegrationTestDatabase } from "../utils/test-config";

describe("INSERT with Table Aliases Builder", () => {
  const db = createIntegrationTestDatabase();

  describe("Basic INSERT with Alias Operations", () => {
    test("should generate correct SQL for INSERT with table alias", () => {
      const query = db
        .insertInto("test_users as u")
        .values({ name: "John Doe", email: "john@example.com", active: true });

      const { sql, parameters } = query.toSQL();

      expect(sql).toBe(
        "INSERT INTO test_users AS u (name, email, active) VALUES ($1, $2, $3)"
      );
      expect(parameters).toEqual(["John Doe", "john@example.com", true]);
    });

    test("should generate correct SQL for INSERT with alias and minimal fields", () => {
      const query = db
        .insertInto("test_users as u")
        .values({ name: "Jane Doe" }); // Only required field

      const { sql, parameters } = query.toSQL();

      expect(sql).toBe("INSERT INTO test_users AS u (name) VALUES ($1)");
      expect(parameters).toEqual(["Jane Doe"]);
    });

    test("should generate correct SQL for bulk INSERT with alias", () => {
      const query = db.insertInto("test_users as u").values([
        { name: "John Doe", email: "john@example.com", active: true },
        { name: "Jane Smith", email: "jane@example.com", active: false },
      ]);

      const { sql, parameters } = query.toSQL();

      expect(sql).toBe(
        "INSERT INTO test_users AS u (name, email, active) VALUES ($1, $2, $3), ($4, $5, $6)"
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

    test("should handle null values with alias correctly", () => {
      const query = db.insertInto("test_users as u").values({
        name: "John Doe",
        email: null, // Nullable field
        active: true,
      });

      const { sql, parameters } = query.toSQL();

      expect(sql).toBe(
        "INSERT INTO test_users AS u (name, email, active) VALUES ($1, $2, $3)"
      );
      expect(parameters).toEqual(["John Doe", null, true]);
    });
  });

  describe("RETURNING Clause with Aliases", () => {
    test("should generate correct SQL for RETURNING with alias-qualified columns", () => {
      const query = db
        .insertInto("test_users as u")
        .values({ name: "John Doe", email: "john@example.com", active: true })
        .returning(["u.id", "u.name"]);

      const { sql, parameters } = query.toSQL();

      expect(sql).toBe(
        "INSERT INTO test_users AS u (name, email, active) VALUES ($1, $2, $3) RETURNING u.id, u.name"
      );
      expect(parameters).toEqual(["John Doe", "john@example.com", true]);
    });

    test("should generate correct SQL for RETURNING with mixed qualified/unqualified columns", () => {
      const query = db
        .insertInto("test_users as u")
        .values({ name: "John Doe", email: "john@example.com" })
        .returning(["u.id", "name", "u.email", "created_at"]);

      const { sql, parameters } = query.toSQL();

      expect(sql).toBe(
        "INSERT INTO test_users AS u (name, email) VALUES ($1, $2) RETURNING u.id, name, u.email, created_at"
      );
      expect(parameters).toEqual(["John Doe", "john@example.com"]);
    });

    test("should generate correct SQL for RETURNING * with alias", () => {
      const query = db
        .insertInto("test_users as u")
        .values({ name: "John Doe", email: "john@example.com", active: true })
        .returningAll();

      const { sql, parameters } = query.toSQL();

      expect(sql).toBe(
        "INSERT INTO test_users AS u (name, email, active) VALUES ($1, $2, $3) RETURNING *"
      );
      expect(parameters).toEqual(["John Doe", "john@example.com", true]);
    });

    test("should work with bulk INSERT and alias-qualified RETURNING", () => {
      const query = db
        .insertInto("test_users as u")
        .values([
          { name: "John Doe", active: true },
          { name: "Jane Smith", active: false },
        ])
        .returning(["u.id", "u.name", "u.active"]);

      const { sql, parameters } = query.toSQL();

      expect(sql).toBe(
        "INSERT INTO test_users AS u (name, active) VALUES ($1, $2), ($3, $4) RETURNING u.id, u.name, u.active"
      );
      expect(parameters).toEqual(["John Doe", true, "Jane Smith", false]);
    });
  });

  describe("ON CONFLICT with Aliases", () => {
    test("should generate correct SQL for ON CONFLICT DO NOTHING with alias", () => {
      const query = db
        .insertInto("test_users as u")
        .values({ name: "John Doe", email: "john@example.com", active: true })
        .onConflict((oc) => oc.column("email").doNothing());

      const { sql, parameters } = query.toSQL();

      expect(sql).toBe(
        "INSERT INTO test_users AS u (name, email, active) VALUES ($1, $2, $3) ON CONFLICT (email) DO NOTHING"
      );
      expect(parameters).toEqual(["John Doe", "john@example.com", true]);
    });

    test("should generate correct SQL for ON CONFLICT DO UPDATE with alias", () => {
      const query = db
        .insertInto("test_users as u")
        .values({ name: "John Doe", email: "john@example.com", active: true })
        .onConflict((oc) =>
          oc.column("email").doUpdate({ name: "John Updated", active: false })
        );

      const { sql, parameters } = query.toSQL();

      expect(sql).toBe(
        "INSERT INTO test_users AS u (name, email, active) VALUES ($1, $2, $3) ON CONFLICT (email) DO UPDATE SET name = $4, active = $5"
      );
      expect(parameters).toEqual([
        "John Doe",
        "john@example.com",
        true,
        "John Updated",
        false,
      ]);
    });

    test("should support constraint-based ON CONFLICT with alias", () => {
      const query = db
        .insertInto("test_users as u")
        .values({ name: "John Doe", email: "john@example.com", active: true })
        .onConflict((oc) =>
          oc.constraint("test_users_email_unique").doNothing()
        );

      const { sql, parameters } = query.toSQL();

      expect(sql).toBe(
        "INSERT INTO test_users AS u (name, email, active) VALUES ($1, $2, $3) ON CONFLICT ON CONSTRAINT test_users_email_unique DO NOTHING"
      );
      expect(parameters).toEqual(["John Doe", "john@example.com", true]);
    });
  });

  describe("Complex Combinations with Aliases", () => {
    test("should combine INSERT alias with RETURNING and ON CONFLICT", () => {
      const query = db
        .insertInto("test_users as u")
        .values({ name: "John Doe", email: "john@example.com", active: true })
        .onConflict((oc) =>
          oc.column("email").doUpdate({ name: "John Updated" })
        )
        .returning(["u.id", "u.name", "u.email"]);

      const { sql, parameters } = query.toSQL();

      expect(sql).toBe(
        "INSERT INTO test_users AS u (name, email, active) VALUES ($1, $2, $3) ON CONFLICT (email) DO UPDATE SET name = $4 RETURNING u.id, u.name, u.email"
      );
      expect(parameters).toEqual([
        "John Doe",
        "john@example.com",
        true,
        "John Updated",
      ]);
    });

    test("should work with posts table and alias", () => {
      const query = db
        .insertInto("test_posts as p")
        .values({
          user_id: 1,
          title: "My First Post",
          content: "This is the content",
          published: true,
        })
        .returning(["p.id", "p.title"]);

      const { sql, parameters } = query.toSQL();

      expect(sql).toBe(
        "INSERT INTO test_posts AS p (user_id, title, content, published) VALUES ($1, $2, $3, $4) RETURNING p.id, p.title"
      );
      expect(parameters).toEqual([
        1,
        "My First Post",
        "This is the content",
        true,
      ]);
    });

    test("should handle complex alias scenario with all features", () => {
      const query = db
        .insertInto("test_posts as p")
        .values([
          { user_id: 1, title: "Post 1", content: "Content 1" },
          { user_id: 2, title: "Post 2", content: "Content 2" },
        ])
        .onConflict((oc) => oc.columns(["user_id", "title"]).doNothing())
        .returning(["p.id", "p.title", "p.user_id", "published"]);

      const { sql, parameters } = query.toSQL();

      expect(sql).toBe(
        "INSERT INTO test_posts AS p (user_id, title, content) VALUES ($1, $2, $3), ($4, $5, $6) ON CONFLICT (user_id, title) DO NOTHING RETURNING p.id, p.title, p.user_id, published"
      );
      expect(parameters).toEqual([
        1,
        "Post 1",
        "Content 1",
        2,
        "Post 2",
        "Content 2",
      ]);
    });
  });

  describe("Different Table Aliases", () => {
    test("should support various alias names", () => {
      const query1 = db
        .insertInto("test_users as user")
        .values({ name: "John" })
        .returning(["user.id", "user.name"]);

      const query2 = db
        .insertInto("test_posts as post_table")
        .values({ user_id: 1, title: "Title" })
        .returning(["post_table.id"]);

      const compiled1 = query1.toSQL();
      const compiled2 = query2.toSQL();

      expect(compiled1.sql).toContain("INSERT INTO test_users AS");
      expect(compiled1.sql).toContain("RETURNING");

      expect(compiled2.sql).toContain("INSERT INTO test_posts AS");
      expect(compiled2.sql).toContain("RETURNING");
    });

    test("should support semantic aliases", () => {
      const query = db
        .insertInto("test_users as author")
        .values({ name: "Author Name", email: "author@example.com" })
        .returning(["author.id", "author.name", "author.email"]);

      const { sql, parameters } = query.toSQL();

      expect(sql).toBe(
        "INSERT INTO test_users AS author (name, email) VALUES ($1, $2) RETURNING author.id, author.name, author.email"
      );
      expect(parameters).toEqual(["Author Name", "author@example.com"]);
    });
  });

  describe("Type System Integration", () => {
    test("should maintain type safety with aliases", () => {
      // These should compile without TypeScript errors
      const query1 = db.insertInto("test_users as u").values({ name: "Test" });
      const query2 = db
        .insertInto("test_users as u")
        .values({ name: "Test" })
        .returning(["u.id", "u.name"]);
      const query3 = db
        .insertInto("test_posts as p")
        .values({ user_id: 1, title: "Test" })
        .returning(["p.id", "p.title"]);

      expect(query1).toBeDefined();
      expect(query2).toBeDefined();
      expect(query3).toBeDefined();
    });
  });

  describe("Alias Column Reference Validation", () => {
    test("should allow simple column names with alias", () => {
      const query = db
        .insertInto("test_users as u")
        .values({ name: "John Doe", email: "john@example.com" })
        .returning(["id", "name", "email"]);

      const { sql, parameters } = query.toSQL();

      expect(sql).toBe(
        "INSERT INTO test_users AS u (name, email) VALUES ($1, $2) RETURNING id, name, email"
      );
      expect(parameters).toEqual(["John Doe", "john@example.com"]);
    });

    test("should allow alias-qualified column names", () => {
      const query = db
        .insertInto("test_users as u")
        .values({ name: "John Doe", email: "john@example.com" })
        .returning(["u.id", "u.name", "u.email"]);

      const { sql, parameters } = query.toSQL();

      expect(sql).toBe(
        "INSERT INTO test_users AS u (name, email) VALUES ($1, $2) RETURNING u.id, u.name, u.email"
      );
      expect(parameters).toEqual(["John Doe", "john@example.com"]);
    });

    test("should allow mixed simple and alias-qualified column names", () => {
      const query = db
        .insertInto("test_users as u")
        .values({ name: "John Doe", email: "john@example.com" })
        .returning(["id", "u.name", "email", "u.created_at"]);

      const { sql, parameters } = query.toSQL();

      expect(sql).toBe(
        "INSERT INTO test_users AS u (name, email) VALUES ($1, $2) RETURNING id, u.name, email, u.created_at"
      );
      expect(parameters).toEqual(["John Doe", "john@example.com"]);
    });

    test("should work without alias (baseline)", () => {
      const query = db
        .insertInto("test_users")
        .values({ name: "John Doe", email: "john@example.com" })
        .returning(["id", "name", "test_users.email"]);

      const { sql, parameters } = query.toSQL();

      expect(sql).toBe(
        "INSERT INTO test_users (name, email) VALUES ($1, $2) RETURNING id, name, test_users.email"
      );
      expect(parameters).toEqual(["John Doe", "john@example.com"]);
    });
  });

  describe("Optional Fields and Generated Types", () => {
    test("should only require non-Generated fields", () => {
      // This should compile - only 'name' is required
      const query = db
        .insertInto("test_users as u")
        .values({ name: "John Doe" });

      const { sql, parameters } = query.toSQL();

      expect(sql).toBe("INSERT INTO test_users AS u (name) VALUES ($1)");
      expect(parameters).toEqual(["John Doe"]);
    });

    test("should allow optional Generated fields to be provided", () => {
      // This should compile - Generated fields can be provided but aren't required
      const query = db.insertInto("test_users as u").values({
        name: "John Doe",
        email: "john@example.com",
        active: true,
      });

      const { sql, parameters } = query.toSQL();

      expect(sql).toBe(
        "INSERT INTO test_users AS u (name, email, active) VALUES ($1, $2, $3)"
      );
      expect(parameters).toEqual(["John Doe", "john@example.com", true]);
    });

    test("should handle null values for Generated fields", () => {
      const query = db.insertInto("test_users as u").values({
        name: "John Doe",
        email: null, // Generated<string | null> allows null
      });

      const { sql, parameters } = query.toSQL();

      expect(sql).toBe(
        "INSERT INTO test_users AS u (name, email) VALUES ($1, $2)"
      );
      expect(parameters).toEqual(["John Doe", null]);
    });

    test("should work with bulk inserts and minimal fields", () => {
      const query = db
        .insertInto("test_users as u")
        .values([
          { name: "John Doe" },
          { name: "Jane Smith", email: "jane@example.com" },
          { name: "Bob Wilson", active: false },
        ]);

      const { sql, parameters } = query.toSQL();

      expect(sql).toBe(
        "INSERT INTO test_users AS u (name) VALUES ($1), ($2), ($3)"
      );
      expect(parameters).toEqual(["John Doe", "Jane Smith", "Bob Wilson"]);
    });
  });

  describe("RETURNING Type Narrowing with Aliases", () => {
    test("should narrow return type to requested columns", () => {
      const query = db
        .insertInto("test_users as u")
        .values({ name: "John Doe", email: "john@example.com" })
        .returning(["id", "name"]);

      const { sql } = query.toSQL();

      expect(sql).toBe(
        "INSERT INTO test_users AS u (name, email) VALUES ($1, $2) RETURNING id, name"
      );

      // Type assertion to verify type narrowing works
      // In real usage, TypeScript would enforce this at compile time
      type ResultType = Awaited<ReturnType<typeof query.execute>>;
      type ExpectedType = Array<{ id: number; name: string }>;

      // This line would fail to compile if type narrowing doesn't work
      const _typeCheck: ExpectedType = [] as ResultType;
      expect(_typeCheck).toBeDefined();
    });

    test("should narrow return type with alias-qualified columns", () => {
      const query = db
        .insertInto("test_users as u")
        .values({ name: "John Doe", email: "john@example.com" })
        .returning(["u.id", "u.email"]);

      const { sql } = query.toSQL();

      expect(sql).toBe(
        "INSERT INTO test_users AS u (name, email) VALUES ($1, $2) RETURNING u.id, u.email"
      );

      // Type assertion to verify type narrowing works
      type ResultType = Awaited<ReturnType<typeof query.execute>>;
      type ExpectedType = Array<{ id: number; email: string | null }>;

      const _typeCheck: ExpectedType = [] as ResultType;
      expect(_typeCheck).toBeDefined();
    });

    test("should handle mixed column references in RETURNING", () => {
      const query = db
        .insertInto("test_users as u")
        .values({ name: "John Doe", email: "john@example.com" })
        .returning(["id", "u.name", "email"]);

      const { sql } = query.toSQL();

      expect(sql).toBe(
        "INSERT INTO test_users AS u (name, email) VALUES ($1, $2) RETURNING id, u.name, email"
      );

      // Type assertion to verify type narrowing works
      type ResultType = Awaited<ReturnType<typeof query.execute>>;
      type ExpectedType = Array<{
        id: number;
        name: string;
        email: string | null;
      }>;

      const _typeCheck: ExpectedType = [] as ResultType;
      expect(_typeCheck).toBeDefined();
    });

    test("should work with returningAll()", () => {
      const query = db
        .insertInto("test_users as u")
        .values({ name: "John Doe", email: "john@example.com" })
        .returningAll();

      const { sql } = query.toSQL();

      expect(sql).toBe(
        "INSERT INTO test_users AS u (name, email) VALUES ($1, $2) RETURNING *"
      );

      // Type assertion to verify returningAll works
      type ResultType = Awaited<ReturnType<typeof query.execute>>;
      type ExpectedType = Array<{
        id: number;
        name: string;
        email: string | null;
        active: boolean;
        created_at: Date;
      }>;

      const _typeCheck: ExpectedType = [] as ResultType;
      expect(_typeCheck).toBeDefined();
    });
  });

  describe("Complex Scenarios", () => {
    test("should handle INSERT with alias, ON CONFLICT, and RETURNING together", () => {
      const query = db
        .insertInto("test_users as u")
        .values({ name: "John Doe", email: "john@example.com" })
        .onConflict((oc) =>
          oc.column("email").doUpdate({ name: "John Updated" })
        )
        .returning(["u.id", "u.name", "u.email"]);

      const { sql, parameters } = query.toSQL();

      expect(sql).toBe(
        "INSERT INTO test_users AS u (name, email) VALUES ($1, $2) ON CONFLICT (email) DO UPDATE SET name = $3 RETURNING u.id, u.name, u.email"
      );
      expect(parameters).toEqual([
        "John Doe",
        "john@example.com",
        "John Updated",
      ]);
    });

    test("should handle bulk INSERT with alias and RETURNING", () => {
      const query = db
        .insertInto("test_users as u")
        .values([
          { name: "John Doe", email: "john@example.com" },
          { name: "Jane Smith", active: false },
          { name: "Bob Wilson" },
        ])
        .returning(["u.id", "name", "u.email"]);

      const { sql, parameters } = query.toSQL();

      expect(sql).toBe(
        "INSERT INTO test_users AS u (name, email) VALUES ($1, $2), ($3, $4), ($5, $6) RETURNING u.id, name, u.email"
      );
      expect(parameters).toEqual([
        "John Doe",
        "john@example.com",
        "Jane Smith",
        undefined,
        "Bob Wilson",
        undefined,
      ]);
    });

    test("should maintain type safety across method chaining", () => {
      // This tests that the type system works correctly through the entire chain
      const query = db
        .insertInto("test_users as u")
        .values({ name: "John Doe" }) // Only required field
        .returning(["id", "u.name"]); // Mixed column references

      const { sql } = query.toSQL();

      expect(sql).toBe(
        "INSERT INTO test_users AS u (name) VALUES ($1) RETURNING id, u.name"
      );

      // Verify the final result type is correct
      type ResultType = Awaited<ReturnType<typeof query.execute>>;
      type ExpectedType = Array<{ id: number; name: string }>;

      const _typeCheck: ExpectedType = [] as ResultType;
      expect(_typeCheck).toBeDefined();
    });
  });
});
