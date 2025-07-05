import { describe, test, expect } from "bun:test";
import { pgvibe } from "../../src/query-builder";
import type { Database } from "../utils/test-types";

// Create pgvibe instance for SQL generation (no real DB connection needed)
const db = new pgvibe<Database>({
  host: "localhost",
  port: 5432,
  database: "test",
  user: "test",
  password: "test",
});

describe("Alias WHERE Clause Tests", () => {
  describe("Single Table Alias WHERE", () => {
    test("should support WHERE with unqualified column on aliased table", () => {
      const query = db
        .selectFrom("users as u")
        .select(["u.name", "u.email"])
        .where("active", "=", true);

      const compiled = query.compile();
      expect(compiled.sql).toBe(
        "SELECT u.name, u.email FROM users AS u WHERE u.active = $1"
      );
      expect(compiled.parameters).toEqual([true]);
    });

    test("should support WHERE with qualified column using alias", () => {
      const query = db
        .selectFrom("users as u")
        .select(["u.name", "u.email"])
        .where("u.active", "=", true);

      const compiled = query.compile();
      expect(compiled.sql).toBe(
        "SELECT u.name, u.email FROM users AS u WHERE u.active = $1"
      );
      expect(compiled.parameters).toEqual([true]);
    });

    test("should support WHERE with string values", () => {
      const query = db
        .selectFrom("users as u")
        .select(["u.name", "u.email"])
        .where("u.name", "=", "John");

      const compiled = query.compile();
      expect(compiled.sql).toBe(
        "SELECT u.name, u.email FROM users AS u WHERE u.name = $1"
      );
      expect(compiled.parameters).toEqual(["John"]);
    });

    test("should support WHERE with LIKE operator", () => {
      const query = db
        .selectFrom("users as u")
        .select(["u.name", "u.email"])
        .where("u.email", "like", "%@example.com");

      const compiled = query.compile();
      expect(compiled.sql).toBe(
        "SELECT u.name, u.email FROM users AS u WHERE u.email LIKE $1"
      );
      expect(compiled.parameters).toEqual(["%@example.com"]);
    });

    test("should support WHERE with IN operator", () => {
      const query = db
        .selectFrom("users as u")
        .select(["u.name", "u.email"])
        .where("u.id", "in", [1, 2, 3]);

      const compiled = query.compile();
      expect(compiled.sql).toBe(
        "SELECT u.name, u.email FROM users AS u WHERE u.id IN ($1, $2, $3)"
      );
      expect(compiled.parameters).toEqual([1, 2, 3]);
    });

    test("should support WHERE with comparison operators", () => {
      const query = db
        .selectFrom("users as u")
        .select(["u.name", "u.email"])
        .where("u.id", ">", 10);

      const compiled = query.compile();
      expect(compiled.sql).toBe(
        "SELECT u.name, u.email FROM users AS u WHERE u.id > $1"
      );
      expect(compiled.parameters).toEqual([10]);
    });
  });

  describe("Multi-Table Alias WHERE", () => {
    test("should support WHERE with qualified columns in JOINs", () => {
      const query = db
        .selectFrom("users as u")
        .innerJoin("posts as p", "u.id", "p.user_id")
        .select(["u.name", "p.title"])
        .where("u.active", "=", true);

      const compiled = query.compile();
      expect(compiled.sql).toBe(
        "SELECT u.name, p.title FROM users AS u INNER JOIN posts AS p ON u.id = p.user_id WHERE u.active = $1"
      );
      expect(compiled.parameters).toEqual([true]);
    });

    test("should support WHERE with joined table columns", () => {
      const query = db
        .selectFrom("users as u")
        .innerJoin("posts as p", "u.id", "p.user_id")
        .select(["u.name", "p.title"])
        .where("p.published", "=", true);

      const compiled = query.compile();
      expect(compiled.sql).toBe(
        "SELECT u.name, p.title FROM users AS u INNER JOIN posts AS p ON u.id = p.user_id WHERE p.published = $1"
      );
      expect(compiled.parameters).toEqual([true]);
    });

    test("should support WHERE with multiple conditions", () => {
      const query = db
        .selectFrom("users as u")
        .innerJoin("posts as p", "u.id", "p.user_id")
        .select(["u.name", "p.title"])
        .where("u.active", "=", true)
        .where("p.published", "=", true);

      const compiled = query.compile();
      expect(compiled.sql).toBe(
        "SELECT u.name, p.title FROM users AS u INNER JOIN posts AS p ON u.id = p.user_id WHERE u.active = $1 AND p.published = $2"
      );
      expect(compiled.parameters).toEqual([true, true]);
    });

    test("should support WHERE with complex three-table JOINs", () => {
      const query = db
        .selectFrom("users as u")
        .innerJoin("posts as p", "u.id", "p.user_id")
        .leftJoin("comments as c", "p.id", "c.post_id")
        .select(["u.name", "p.title", "c.content"])
        .where("u.active", "=", true)
        .where("p.published", "=", true);

      const compiled = query.compile();
      expect(compiled.sql).toBe(
        "SELECT u.name, p.title, c.content FROM users AS u INNER JOIN posts AS p ON u.id = p.user_id LEFT JOIN comments AS c ON p.id = c.post_id WHERE u.active = $1 AND p.published = $2"
      );
      expect(compiled.parameters).toEqual([true, true]);
    });
  });

  describe("WHERE with Raw SQL", () => {
    test("should support raw SQL expressions in WHERE", () => {
      const query = db
        .selectFrom("users as u")
        .select(["u.name", "u.email"])
        .where({
          sql: "u.created_at > NOW() - INTERVAL '30 days'",
          parameters: [],
        });

      const compiled = query.compile();
      expect(compiled.sql).toBe(
        "SELECT u.name, u.email FROM users AS u WHERE u.created_at > NOW() - INTERVAL '30 days'"
      );
      expect(compiled.parameters).toEqual([]);
    });

    test("should support raw SQL with parameters", () => {
      const query = db
        .selectFrom("users as u")
        .select(["u.name", "u.email"])
        .where({
          sql: "u.created_at > $1",
          parameters: [new Date("2023-01-01")],
        });

      const compiled = query.compile();
      expect(compiled.sql).toBe(
        "SELECT u.name, u.email FROM users AS u WHERE u.created_at > $1"
      );
      expect(compiled.parameters).toEqual([new Date("2023-01-01")]);
    });
  });

  describe("WHERE with ORDER BY and LIMIT", () => {
    test("should support WHERE combined with ORDER BY and LIMIT", () => {
      const query = db
        .selectFrom("users as u")
        .select(["u.name", "u.email"])
        .where("u.active", "=", true)
        .orderBy("u.created_at", "desc")
        .limit(10);

      const compiled = query.compile();
      expect(compiled.sql).toBe(
        "SELECT u.name, u.email FROM users AS u WHERE u.active = $1 ORDER BY u.created_at DESC LIMIT 10"
      );
      expect(compiled.parameters).toEqual([true]);
    });

    test("should support WHERE with JOIN, ORDER BY, and LIMIT", () => {
      const query = db
        .selectFrom("users as u")
        .innerJoin("posts as p", "u.id", "p.user_id")
        .select(["u.name", "p.title"])
        .where("u.active", "=", true)
        .where("p.published", "=", true)
        .orderBy("p.created_at", "desc")
        .limit(5);

      const compiled = query.compile();
      expect(compiled.sql).toBe(
        "SELECT u.name, p.title FROM users AS u INNER JOIN posts AS p ON u.id = p.user_id WHERE u.active = $1 AND p.published = $2 ORDER BY p.created_at DESC LIMIT 5"
      );
      expect(compiled.parameters).toEqual([true, true]);
    });
  });
});
