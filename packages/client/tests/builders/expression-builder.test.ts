// Expression Builder Tests
// Tests for complex WHERE clause functionality with AND/OR combinations

import { describe, test, expect } from "bun:test";
import { pgvibe, type Database } from "../../src/query-builder";

describe("Expression Builder Tests", () => {
  const db = new pgvibe<Database>({
    host: "localhost",
    port: 5432,
    database: "pgvibe_test",
    user: "test",
    password: "test",
  });

  test("should compile basic OR expression", () => {
    const query = db
      .selectFrom("users")
      .select(["name", "email"])
      .where((eb) =>
        eb.or([eb("name", "=", "Jennifer"), eb("name", "=", "Sylvester")])
      );

    const { sql, parameters } = query.compile();

    expect(sql).toBe(
      "SELECT name, email FROM users WHERE name = $1 OR name = $2"
    );
    expect(parameters).toEqual(["Jennifer", "Sylvester"]);
  });

  test("should compile basic AND expression", () => {
    const query = db
      .selectFrom("users")
      .select(["name", "email"])
      .where((eb) => eb.and([eb("active", "=", true), eb("id", ">", 18)]));

    const { sql, parameters } = query.compile();

    expect(sql).toBe(
      "SELECT name, email FROM users WHERE active = $1 AND id > $2"
    );
    expect(parameters).toEqual([true, 18]);
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

  test("should compile nested AND/OR expression", () => {
    const query = db
      .selectFrom("users")
      .select(["name", "email"])
      .where((eb) =>
        eb.and([
          eb("active", "=", true),
          eb.or([eb("id", "<", 18), eb("id", ">", 65)]),
        ])
      );

    const { sql, parameters } = query.compile();

    expect(sql).toBe(
      "SELECT name, email FROM users WHERE (active = $1 AND (id < $2 OR id > $3))"
    );
    expect(parameters).toEqual([true, 18, 65]);
  });

  test("should compile NOT expression", () => {
    const query = db
      .selectFrom("users")
      .select(["name", "email"])
      .where((eb) => eb.not(eb("email", "is", null)));

    const { sql, parameters } = query.compile();

    expect(sql).toBe("SELECT name, email FROM users WHERE NOT (email IS NULL)");
    expect(parameters).toEqual([]);
  });

  test("should mix simple and complex WHERE clauses", () => {
    const query = db
      .selectFrom("users")
      .select(["name", "email"])
      .where("name", "like", "John%")
      .where((eb) => eb.or([eb("id", "<", 18), eb("id", ">", 65)]))
      .where("active", "=", true);

    const { sql, parameters } = query.compile();

    expect(sql).toBe(
      "SELECT name, email FROM users WHERE ((name LIKE $1 AND (id < $2 OR id > $3)) AND active = $4)"
    );
    expect(parameters).toEqual(["John%", 18, 65, true]);
  });

  test("should handle empty AND array", () => {
    const query = db
      .selectFrom("users")
      .select(["name", "email"])
      .where((eb) => eb.and([]));

    const { sql, parameters } = query.compile();

    expect(sql).toBe("SELECT name, email FROM users WHERE true");
    expect(parameters).toEqual([]);
  });

  test("should handle empty OR array", () => {
    const query = db
      .selectFrom("users")
      .select(["name", "email"])
      .where((eb) => eb.or([]));

    const { sql, parameters } = query.compile();

    expect(sql).toBe("SELECT name, email FROM users WHERE false");
    expect(parameters).toEqual([]);
  });

  test("should support destructuring syntax", () => {
    const query = db
      .selectFrom("users")
      .select(["name", "email"])
      .where(({ eb, and, or, not }) =>
        and([
          eb("active", "=", true),
          or([eb("name", "=", "Jennifer"), eb("name", "=", "Sylvester")]),
          not(eb("email", "is", null)),
        ])
      );

    const { sql, parameters } = query.compile();

    expect(sql).toBe(
      "SELECT name, email FROM users WHERE ((active = $1 AND (name = $2 OR name = $3)) AND NOT (email IS NULL))"
    );
    expect(parameters).toEqual([true, "Jennifer", "Sylvester"]);
  });

  test("should maintain backward compatibility", () => {
    // This should work exactly the same as before
    const query = db
      .selectFrom("users")
      .select(["name", "email"])
      .where((eb) =>
        eb.and([
          eb("active", "=", true),
          eb.or([eb("name", "=", "Jennifer"), eb("name", "=", "Sylvester")]),
        ])
      );

    const { sql, parameters } = query.compile();

    expect(sql).toBe(
      "SELECT name, email FROM users WHERE (active = $1 AND (name = $2 OR name = $3))"
    );
    expect(parameters).toEqual([true, "Jennifer", "Sylvester"]);
  });
});
