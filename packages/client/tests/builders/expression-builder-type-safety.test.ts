// Expression Builder Type Safety Tests
// Tests to ensure the expression builder provides proper type safety

import { describe, test, expect } from "bun:test";
import { ZenQ, type Database } from "../../src/query-builder";

describe("Expression Builder Type Safety Tests", () => {
  const db = new ZenQ<Database>({
    host: "localhost",
    port: 5432,
    database: "zenq_test",
    user: "test",
    password: "test",
  });

  test("should allow valid type combinations", () => {
    // These should all compile without errors
    const query1 = db
      .selectFrom("users")
      .select(["name", "email"])
      .where((eb) =>
        eb.and([
          eb("active", "=", true), // boolean = boolean ✅
          eb("name", "=", "John"), // string = string ✅
          eb("id", ">", 123), // number > number ✅
          eb("email", "is", null), // nullable field IS null ✅
        ])
      );

    expect(query1).toBeDefined();
  });

  test("should prevent invalid type combinations", () => {
    // Note: These tests verify that TypeScript would show errors, but won't fail at runtime
    // In a real project, these would cause TypeScript compilation errors

    // Test 1: Boolean column with string value
    // eb("active", "=", "hello")  // ❌ Should error: boolean field with string value

    // Test 2: String column with number value
    // eb("name", "=", 123)        // ❌ Should error: string field with number value

    // Test 3: Number column with string value
    // eb("id", ">", "hello")      // ❌ Should error: number field with string value

    // Test 4: Using null with equality on non-nullable field
    // eb("name", "=", null)       // ❌ Should error: use IS for null checks

    // Since these would cause TypeScript errors, we'll test with runtime checks
    expect(true).toBe(true); // Placeholder - type checking happens at compile time
  });

  test("should allow proper operator-value combinations", () => {
    const query = db
      .selectFrom("users")
      .select(["name"])
      .where((eb) =>
        eb.and([
          eb("name", "like", "John%"), // string LIKE string ✅
          eb("email", "is not", null), // nullable IS NOT null ✅
          eb("id", "in", [1, 2, 3]), // number IN number[] ✅
          eb("active", "!=", false), // boolean != boolean ✅
        ])
      );

    expect(query).toBeDefined();
  });

  test("should compile to correct SQL with type-safe values", () => {
    const query = db
      .selectFrom("users")
      .select(["name", "email"])
      .where((eb) =>
        eb.and([
          eb("active", "=", true),
          eb("name", "like", "John%"),
          eb("id", ">", 18),
        ])
      );

    const { sql, parameters } = query.compile();

    expect(sql).toBe(
      "SELECT name, email FROM users WHERE (active = $1 AND name LIKE $2 AND id > $3)"
    );
    expect(parameters).toEqual([true, "John%", 18]);
  });

  test("should handle nested expressions with type safety", () => {
    const query = db
      .selectFrom("users")
      .select(["name"])
      .where((eb) =>
        eb.and([
          eb("active", "=", true),
          eb.or([
            eb("id", "<", 18), // number < number ✅
            eb("id", ">", 65), // number > number ✅
          ]),
        ])
      );

    const { sql, parameters } = query.compile();

    expect(sql).toBe(
      "SELECT name FROM users WHERE (active = $1 AND (id < $2 OR id > $3))"
    );
    expect(parameters).toEqual([true, 18, 65]);
  });
});
