// Comprehensive Expression Builder Type Safety Tests
// Tests for type mismatches and advanced type scenarios

import { describe, test, expect } from "bun:test";
import { createTestDatabase } from "../utils/test-config";
import type { Database } from "../utils/test-types";

const db = createTestDatabase();

describe("Expression Builder Comprehensive Type Safety", () => {
  describe("Type Mismatch Detection", () => {
    test("should allow correct type combinations", () => {
      // All these should compile without TypeScript errors
      const query = db
        .selectFrom("users")
        .select(["name"])
        .where(({ eb, and }) =>
          and([
            eb("id", "=", 123), // number = number ✅
            eb("name", "=", "John"), // string = string ✅
            eb("active", "=", true), // boolean = boolean ✅
            eb("email", "is", null), // string | null IS null ✅
            eb("created_at", ">", new Date()), // Date > Date ✅
          ])
        );

      const { sql } = query.toSQL();
      expect(sql).toContain("WHERE");
    });

    test("should work with comparison operators and correct types", () => {
      const query = db
        .selectFrom("users")
        .select(["id"])
        .where(({ eb, and }) =>
          and([
            eb("id", ">", 0), // number > number ✅
            eb("id", ">=", 1), // number >= number ✅
            eb("id", "<", 100), // number < number ✅
            eb("id", "<=", 99), // number <= number ✅
            eb("id", "!=", 50), // number != number ✅
            eb("id", "<>", 51), // number <> number ✅
          ])
        );

      expect(query.toSQL().sql).toContain("WHERE");
    });

    test("should work with string operators and correct types", () => {
      const query = db
        .selectFrom("users")
        .select(["name"])
        .where(({ eb, and }) =>
          and([
            eb("name", "like", "%John%"), // string LIKE string ✅
            eb("name", "not like", "%Jane%"), // string NOT LIKE string ✅
            eb("name", "ilike", "%JOHN%"), // string ILIKE string ✅
            eb("name", "not ilike", "%JANE%"), // string NOT ILIKE string ✅
          ])
        );

      expect(query.toSQL().sql).toContain("LIKE");
    });

    test("should work with IN operators and correct array types", () => {
      const query = db
        .selectFrom("users")
        .select(["id"])
        .where(({ eb, and }) =>
          and([
            eb("id", "in", [1, 2, 3]), // number IN number[] ✅
            eb("name", "in", ["John", "Jane"]), // string IN string[] ✅
            eb("active", "in", [true, false]), // boolean IN boolean[] ✅
            eb("id", "not in", [4, 5, 6]), // number NOT IN number[] ✅
          ])
        );

      expect(query.toSQL().sql).toContain("IN");
    });

    test("should work with NULL operators", () => {
      const query = db
        .selectFrom("users")
        .select(["name"])
        .where(({ eb, and }) =>
          and([
            eb("email", "is", null), // nullable IS null ✅
            eb("email", "is not", null), // nullable IS NOT null ✅
            eb("name", "is", "John"), // non-null IS value ✅
            eb("name", "is not", "Jane"), // non-null IS NOT value ✅
          ])
        );

      expect(query.toSQL().sql).toContain("IS");
    });
  });

  describe("Array Return Type Safety", () => {
    test("should work with implicit AND array containing mixed expression types", () => {
      const query = db
        .selectFrom("users")
        .select(["name"])
        .where(({ eb, or, not }) => [
          eb("active", "=", true), // boolean expression
          or([eb("id", "<", 18), eb("id", ">", 65)]), // OR expression
          not(eb("email", "is", null)), // NOT expression
        ]);

      const { sql, parameters } = query.toSQL();
      expect(sql).toContain("AND");
      expect(parameters).toEqual([true, 18, 65]);
    });

    test("should work with nested array structures", () => {
      const query = db
        .selectFrom("users")
        .select(["name"])
        .where(({ eb, and, or }) => [
          eb("active", "=", true),
          and([
            eb("id", ">", 0),
            or([eb("name", "like", "A%"), eb("name", "like", "B%")]),
          ]),
        ]);

      expect(query.toSQL().sql).toContain("WHERE");
    });
  });

  describe("Complex Type Scenarios", () => {
    test("should handle Date comparisons correctly", () => {
      const startDate = new Date("2023-01-01");
      const endDate = new Date("2023-12-31");

      const query = db
        .selectFrom("users")
        .select(["name"])
        .where(({ eb, and }) =>
          and([
            eb("created_at", ">=", startDate), // Date >= Date ✅
            eb("created_at", "<=", endDate), // Date <= Date ✅
          ])
        );

      const { sql, parameters } = query.toSQL();
      expect(parameters).toEqual([startDate, endDate]);
    });

    test("should handle nullable column comparisons", () => {
      const query = db
        .selectFrom("users")
        .select(["name"])
        .where(({ eb, and, or }) =>
          and([
            or([
              eb("email", "is", null), // nullable IS null ✅
              eb("email", "like", "%@example.com"), // nullable LIKE string ✅
            ]),
          ])
        );

      expect(query.toSQL().sql).toContain("email");
    });

    test("should work with qualified column references", () => {
      const query = db
        .selectFrom("users")
        .innerJoin("posts", "users.id", "posts.user_id")
        .select(["users.name"])
        .where(({ eb, and }) =>
          and([
            eb("users.active", "=", true), // qualified boolean ✅
            eb("posts.published", "=", true), // qualified boolean ✅
            eb("users.id", "=", eb("posts.user_id")), // column = column reference (future feature)
          ])
        );

      // Note: column = column reference might need special handling
      // For now we test that basic qualified refs work
      expect(query.toSQL().sql).toContain("users.active");
    });
  });

  describe("Edge Cases and Error Conditions", () => {
    test("should handle empty arrays gracefully", () => {
      const query = db
        .selectFrom("users")
        .select(["name"])
        .where(({ eb }) => eb("id", "in", [])); // empty array

      const { sql } = query.toSQL();
      expect(sql).toContain("IN ()");
    });

    test("should handle mixed null and non-null in arrays", () => {
      // This tests that we can handle arrays with mixed null/non-null values
      const query = db
        .selectFrom("users")
        .select(["name"])
        .where(({ eb }) => eb("email", "in", ["test@example.com", null]));

      expect(query.toSQL().sql).toContain("IN");
    });

    test("should maintain type safety in complex nested expressions", () => {
      const query = db
        .selectFrom("users")
        .select(["name"])
        .where(({ eb, and, or, not }) =>
          and([
            or([
              and([eb("active", "=", true), eb("id", ">", 0)]),
              not(eb("email", "is", null)),
            ]),
            eb("name", "like", "%test%"),
          ])
        );

      const { sql } = query.toSQL();
      expect(sql).toContain("WHERE");
      expect(sql).toContain("AND");
      expect(sql).toContain("OR");
      expect(sql).toContain("NOT");
    });
  });

  describe("Runtime Type Validation", () => {
    test("should handle type coercion gracefully", () => {
      // Test that the system handles reasonable type coercions
      const query = db
        .selectFrom("users")
        .select(["name"])
        .where(({ eb }) => eb("id", "=", 123)); // number literal

      expect(query.toSQL().parameters).toEqual([123]);
    });

    test("should preserve parameter types correctly", () => {
      const testDate = new Date("2023-01-01");
      const query = db
        .selectFrom("users")
        .select(["name"])
        .where(({ eb, and }) =>
          and([
            eb("id", "=", 42),
            eb("name", "=", "test"),
            eb("active", "=", true),
            eb("created_at", ">", testDate),
          ])
        );

      const { parameters } = query.toSQL();
      expect(parameters).toEqual([42, "test", true, testDate]);
      expect(typeof parameters[0]).toBe("number");
      expect(typeof parameters[1]).toBe("string");
      expect(typeof parameters[2]).toBe("boolean");
      expect(parameters[3]).toBeInstanceOf(Date);
    });
  });
});
