import { describe, test, expect } from "bun:test";
import { ZenQ, sql, raw } from "../../src/query-builder";
import type { Database } from "../utils/test-types";
import { createTestDatabase } from "../utils/test-config";

const db = createTestDatabase();

describe("Raw SQL Template Literals", () => {
  describe("sql template tag", () => {
    test("should create RawBuilder from template literal", () => {
      const userId = 123;
      const status = "active";

      const rawExpression = sql`user_id = ${userId} AND status = ${status}`;

      expect(rawExpression.sql).toBe("user_id = $1 AND status = $2");
      expect(rawExpression.parameters).toEqual([123, "active"]);
    });

    test("should handle no parameters", () => {
      const rawExpression = sql`NOW()`;

      expect(rawExpression.sql).toBe("NOW()");
      expect(rawExpression.parameters).toEqual([]);
    });

    test("should handle multiple parameter types", () => {
      const id = 1;
      const name = "John";
      const active = true;
      const created = new Date("2024-01-01");

      const rawExpression = sql`id = ${id} AND name = ${name} AND active = ${active} AND created_at > ${created}`;

      expect(rawExpression.sql).toBe(
        "id = $1 AND name = $2 AND active = $3 AND created_at > $4"
      );
      expect(rawExpression.parameters).toEqual([1, "John", true, created]);
    });
  });

  describe("raw function", () => {
    test("should create RawBuilder from plain string", () => {
      const rawExpression = raw("CURRENT_TIMESTAMP");

      expect(rawExpression.sql).toBe("CURRENT_TIMESTAMP");
      expect(rawExpression.parameters).toEqual([]);
    });

    test("should handle complex SQL expressions", () => {
      const rawExpression = raw("EXTRACT(YEAR FROM created_at) = 2024");

      expect(rawExpression.sql).toBe("EXTRACT(YEAR FROM created_at) = 2024");
      expect(rawExpression.parameters).toEqual([]);
    });
  });

  describe("WHERE clause integration", () => {
    test("should support raw SQL in WHERE clauses", () => {
      const userId = 123;
      const condition = sql`user_id = ${userId} AND active = true`;

      const query = db.selectFrom("users").where(condition);

      const { sql: generatedSql, parameters } = query.toSQL();

      expect(generatedSql).toContain("user_id = $1 AND active = true");
      expect(parameters).toEqual([123]);
    });

    test("should combine raw SQL with regular WHERE conditions", () => {
      const customCondition = sql`EXTRACT(YEAR FROM created_at) = ${2024}`;

      const query = db
        .selectFrom("users")
        .where("active", "=", true)
        .where(customCondition);

      const { sql: generatedSql, parameters } = query.toSQL();

      expect(generatedSql).toContain("active = $1");
      expect(generatedSql).toContain("EXTRACT(YEAR FROM created_at) = $2");
      expect(parameters).toEqual([true, 2024]);
    });

    test("should handle raw SQL with no parameters", () => {
      const condition = raw("deleted_at IS NULL");

      const query = db.selectFrom("users").where(condition);

      const { sql: generatedSql, parameters } = query.toSQL();

      expect(generatedSql).toContain("deleted_at IS NULL");
      expect(parameters).toEqual([]);
    });
  });

  describe("Complex usage scenarios", () => {
    test("should support complex date calculations", () => {
      const daysAgo = 30;
      const condition = sql`created_at > NOW() - INTERVAL '${daysAgo} days'`;

      const query = db.selectFrom("users").where(condition);

      const { sql: generatedSql, parameters } = query.toSQL();

      expect(generatedSql).toContain("created_at > NOW() - INTERVAL '$1 days'");
      expect(parameters).toEqual([30]);
    });

    test("should support subquery-like expressions", () => {
      const minPostCount = 5;
      const condition = sql`id IN (SELECT user_id FROM posts GROUP BY user_id HAVING COUNT(*) > ${minPostCount})`;

      const query = db.selectFrom("users").where(condition);

      const { sql: generatedSql, parameters } = query.toSQL();

      expect(generatedSql).toContain(
        "id IN (SELECT user_id FROM posts GROUP BY user_id HAVING COUNT(*) > $1)"
      );
      expect(parameters).toEqual([5]);
    });

    test("should support JSON operations", () => {
      const jsonPath = "$.age";
      const minAge = 18;
      const condition = sql`metadata->>${jsonPath} > ${minAge}`;

      const query = db.selectFrom("users").where(condition);

      const { sql: generatedSql, parameters } = query.toSQL();

      expect(generatedSql).toContain("metadata->>$1 > $2");
      expect(parameters).toEqual(["$.age", 18]);
    });
  });

  describe("Parameter handling", () => {
    test("should handle null values", () => {
      const value = null;
      const condition = sql`custom_field = ${value}`;

      const query = db.selectFrom("users").where(condition);

      const { sql: generatedSql, parameters } = query.toSQL();

      expect(generatedSql).toContain("custom_field = $1");
      expect(parameters).toEqual([null]);
    });

    test("should handle array values", () => {
      const ids = [1, 2, 3];
      const condition = sql`id = ANY(${ids})`;

      const query = db.selectFrom("users").where(condition);

      const { sql: generatedSql, parameters } = query.toSQL();

      expect(generatedSql).toContain("id = ANY($1)");
      expect(parameters).toEqual([[1, 2, 3]]);
    });
  });

  describe("SQL Generation", () => {
    test("should generate correct SQL with mixed conditions", () => {
      const customCondition = sql`UPPER(name) LIKE ${"%JOHN%"}`;

      const query = db
        .selectFrom("users")
        .select(["id", "name", "email"])
        .where("active", "=", true)
        .where(customCondition)
        .orderBy("name", "asc")
        .limit(10);

      const { sql: generatedSql, parameters } = query.toSQL();

      expect(generatedSql).toBe(
        "SELECT id, name, email FROM users WHERE (active = $1 AND UPPER(name) LIKE $2) ORDER BY name ASC LIMIT 10"
      );
      expect(parameters).toEqual([true, "%JOHN%"]);
    });

    test("should maintain parameter order across multiple raw expressions", () => {
      const condition1 = sql`created_at > ${new Date("2024-01-01")}`;
      const condition2 = sql`name ILIKE ${"%test%"}`;

      const query = db
        .selectFrom("users")
        .where("id", "in", [1, 2, 3])
        .where(condition1)
        .where(condition2);

      const { sql: generatedSql, parameters } = query.toSQL();

      expect(parameters).toHaveLength(5); // [1,2,3], date, "%test%"
      expect(generatedSql).toContain("id IN ($1, $2, $3)");
      expect(generatedSql).toContain("created_at > $4");
      expect(generatedSql).toContain("name ILIKE $5");
    });
  });
});

describe("Type Safety", () => {
  test("should maintain type safety with raw SQL", () => {
    const query = db
      .selectFrom("users")
      .select(["id", "name"])
      .where(sql`active = ${true}`);

    // Should still return properly typed results
    expect(query.toSQL().sql).toContain("SELECT id, name FROM users");
  });

  test("should work with JOINs and raw SQL", () => {
    const condition = sql`users.created_at > posts.created_at - INTERVAL '1 day'`;

    const query = db
      .selectFrom("users")
      .innerJoin("posts", "users.id", "posts.user_id")
      .where(condition);

    const { sql: generatedSql } = query.toSQL();

    expect(generatedSql).toContain(
      "INNER JOIN posts ON users.id = posts.user_id"
    );
    expect(generatedSql).toContain(
      "users.created_at > posts.created_at - INTERVAL '1 day'"
    );
  });
});
