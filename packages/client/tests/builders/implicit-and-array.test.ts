import { describe, test, expect } from "bun:test";
import { createTestDatabase } from "../utils/test-config";

const db = createTestDatabase();

describe("WHERE callback returning array (implicit AND)", () => {
  test("compiles two-way AND without extra parens", () => {
    const query = db
      .selectFrom("users")
      .select(["id", "name"])
      .where(({ eb }) => [eb("active", "=", true), eb("id", ">", 10)]);

    const { sql, parameters } = query.toSQL();

    expect(sql).toBe(
      "SELECT id, name FROM users WHERE active = $1 AND id > $2"
    );
    expect(parameters).toEqual([true, 10]);
  });

  test("compiles three-way AND with parens", () => {
    const query = db
      .selectFrom("users")
      .select(["id", "name"])
      .where(({ eb }) => [
        eb("active", "=", true),
        eb("name", "like", "A%"),
        eb("id", ">", 5),
      ]);

    const { sql, parameters } = query.toSQL();

    expect(sql).toBe(
      "SELECT id, name FROM users WHERE (active = $1 AND name LIKE $2 AND id > $3)"
    );
    expect(parameters).toEqual([true, "A%", 5]);
  });

  test("works with nested OR helper", () => {
    const query = db
      .selectFrom("users")
      .select(["id", "name"])
      .where(({ eb, or }) => [
        eb("active", "=", true),
        or([eb("id", "<", 3), eb("id", ">", 8)]),
      ]);

    const { sql, parameters } = query.toSQL();

    expect(sql).toBe(
      "SELECT id, name FROM users WHERE (active = $1 AND (id < $2 OR id > $3))"
    );
    expect(parameters).toEqual([true, 3, 8]);
  });

  test("works with array return using plain ExpressionBuilder param", () => {
    const query = db
      .selectFrom("users")
      .select(["id", "name"])
      .where((eb) => [eb("active", "=", true), eb("id", "<", 4)]);

    const { sql, parameters } = query.toSQL();

    expect(sql).toBe(
      "SELECT id, name FROM users WHERE active = $1 AND id < $2"
    );
    expect(parameters).toEqual([true, 4]);
  });
});
