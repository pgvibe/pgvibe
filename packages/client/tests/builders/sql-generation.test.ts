// SQL Generation Tests - Pure SQL string and parameter validation
// No database connections - tests .toSQL() and .compile() methods only

import { describe, test, expect } from "bun:test";
import { ZenQ } from "../../src/query-builder";
import type { Database } from "../utils/test-types";

// Create ZenQ instance for SQL generation (no real DB connection needed)
const db = new ZenQ<Database>({
  host: "localhost",
  port: 5432,
  database: "test",
  user: "test",
  password: "test",
});

describe("SQL Generation Tests", () => {
  describe("Basic Query SQL Generation", () => {
    test("should generate correct SQL for simple SELECT", () => {
      const { sql, parameters } = db.selectFrom("users").toSQL();
      expect(sql).toBe("SELECT * FROM users");
      expect(parameters).toEqual([]);
    });

    test("should generate correct SQL for SELECT with WHERE", () => {
      const { sql, parameters } = db
        .selectFrom("users")
        .where("active", "=", true)
        .toSQL();

      expect(sql).toBe("SELECT * FROM users WHERE active = $1");
      expect(parameters).toEqual([true]);
    });

    test("should handle parameter types correctly", () => {
      const queries = [
        {
          query: db.selectFrom("users").where("id", "=", 42),
          expectedParams: [42],
        },
        {
          query: db.selectFrom("users").where("name", "=", "test"),
          expectedParams: ["test"],
        },
        {
          query: db.selectFrom("users").where("active", "=", false),
          expectedParams: [false],
        },
      ];

      queries.forEach(({ query, expectedParams }) => {
        const { parameters } = query.toSQL();
        expect(parameters).toEqual(expectedParams);
      });
    });
  });

  describe("Expression Builder SQL Generation", () => {
    test("should generate correct SQL for basic expression builder", () => {
      const { sql, parameters } = db
        .selectFrom("users")
        .where(({ eb }) => eb("active", "=", true))
        .toSQL();

      expect(sql).toContain("WHERE");
      expect(sql).toContain("active");
      expect(parameters).toContain(true);
    });

    test("should generate correct SQL for AND operations", () => {
      const { sql, parameters } = db
        .selectFrom("users")
        .where(({ eb }) => eb.and([eb("active", "=", true), eb("id", ">", 5)]))
        .toSQL();

      expect(sql).toContain("AND");
      expect(parameters).toEqual(expect.arrayContaining([true, 5]));
    });

    test("should generate correct SQL for OR operations", () => {
      const { sql, parameters } = db
        .selectFrom("users")
        .where(({ eb }) =>
          eb.or([eb("active", "=", false), eb("email", "is", null)])
        )
        .toSQL();

      expect(sql).toContain("OR");
      expect(parameters).toEqual(expect.arrayContaining([false]));
    });

    test("should generate correct SQL for IN operations", () => {
      const { sql, parameters } = db
        .selectFrom("users")
        .where(({ eb }) => eb("id", "in", [1, 2, 3]))
        .toSQL();

      expect(sql).toContain("IN");
      expect(parameters).toEqual([1, 2, 3]);
    });

    test("should generate correct SQL for LIKE operations", () => {
      const { sql, parameters } = db
        .selectFrom("users")
        .where(({ eb }) => eb("name", "like", "John%"))
        .toSQL();

      expect(sql).toContain("LIKE");
      expect(parameters).toContain("John%");
    });

    test("should generate correct SQL for NULL operations", () => {
      const { sql: sqlIsNull } = db
        .selectFrom("users")
        .where(({ eb }) => eb("email", "is", null))
        .toSQL();

      expect(sqlIsNull).toContain("IS NULL");

      const { sql: sqlIsNotNull } = db
        .selectFrom("users")
        .where(({ eb }) => eb("email", "is not", null))
        .toSQL();

      expect(sqlIsNotNull).toContain("IS NOT NULL");
    });
  });

  describe("JSONB SQL Generation", () => {
    test("should generate correct SQL for field extractions", () => {
      const query = db
        .selectFrom("jsonb_users")
        .select(["name"])
        .where(({ jsonb }) => jsonb("settings").field("theme").equals("dark"));

      const { sql, parameters } = query.compile();
      expect(sql).toBe(
        "SELECT name FROM jsonb_users WHERE settings ->> $1 = $2"
      );
      expect(parameters).toEqual(["theme", "dark"]);
    });

    test("should generate correct SQL for nested field extractions", () => {
      const query = db
        .selectFrom("jsonb_users")
        .select(["name"])
        .where(({ jsonb }) =>
          jsonb("settings").field("notifications").field("email").equals(true)
        );

      const { sql, parameters } = query.compile();
      expect(sql).toBe(
        "SELECT name FROM jsonb_users WHERE settings -> $1 ->> $2 = $3"
      );
      expect(parameters).toEqual(["notifications", "email", true]);
    });

    test("should generate correct SQL for key existence checks", () => {
      const query = db
        .selectFrom("jsonb_users")
        .select(["name"])
        .where(({ jsonb }) => jsonb("metadata").hasKey("premium"));

      const { sql, parameters } = query.compile();
      expect(sql).toBe("SELECT name FROM jsonb_users WHERE metadata ? $1");
      expect(parameters).toEqual(["premium"]);
    });

    test("should generate correct SQL for path existence checks", () => {
      const query = db
        .selectFrom("jsonb_users")
        .select(["name"])
        .where(({ jsonb }) =>
          jsonb("settings").path(["notifications", "email"]).exists()
        );

      const { sql, parameters } = query.compile();
      expect(sql).toBe(
        "SELECT name FROM jsonb_users WHERE settings #> $1 IS NOT NULL"
      );
      expect(parameters).toEqual([["notifications", "email"]]);
    });

    test("should generate correct SQL for contains operations", () => {
      const query = db
        .selectFrom("jsonb_users")
        .select(["name"])
        .where(({ jsonb }) =>
          jsonb("settings").contains({ theme: "dark", language: "en" })
        );

      const { sql, parameters } = query.compile();
      expect(sql).toBe("SELECT name FROM jsonb_users WHERE settings @> $1");
      expect(parameters).toEqual([{ theme: "dark", language: "en" }]);
    });
  });

  describe("Edge Cases SQL Generation", () => {
    test("should handle empty SELECT list", () => {
      const { sql, parameters } = db.selectFrom("users").select([]).toSQL();
      expect(sql).toBe("SELECT * FROM users");
      expect(parameters).toEqual([]);
    });

    test("should handle complex nested conditions", () => {
      const { sql } = db
        .selectFrom("users")
        .where(({ eb }) =>
          eb.and([
            eb.or([eb("active", "=", true), eb("name", "like", "Admin%")]),
            eb("email", "is not", null),
          ])
        )
        .toSQL();

      expect(sql).toContain("AND");
      expect(sql).toContain("OR");
      expect(sql).toContain("IS NOT NULL");
    });
  });
});
