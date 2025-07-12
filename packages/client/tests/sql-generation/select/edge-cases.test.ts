// SQL generation tests for SELECT edge cases and special scenarios

import { test, expect } from "bun:test";
import { createTestQueryBuilder } from "../../__shared__/helpers/test-utils";

test("SQL: Empty select array falls back to SELECT *", () => {
  const qb = createTestQueryBuilder();
  const sql = qb.selectFrom("users").select([]).toSQL();
  expect(sql).toBe("SELECT * FROM users");
});

test("SQL: Columns with underscores", () => {
  const qb = createTestQueryBuilder();
  const sql = qb.selectFrom("users").select(["first_name", "last_name", "created_at"]).toSQL();
  expect(sql).toBe("SELECT first_name, last_name, created_at FROM users");
});

test("SQL: Columns with numbers", () => {
  const qb = createTestQueryBuilder();
  const sql = qb.selectFrom("posts").select(["user_id", "category_id", "tag1", "tag2"]).toSQL();
  expect(sql).toBe("SELECT user_id, category_id, tag1, tag2 FROM posts");
});

// TODO: Add more edge cases as they're discovered:
// - Reserved PostgreSQL keywords as column names (may need quoting)
// - Special characters in column names
// - Unicode column names
// - Very long column names
// - Case sensitivity tests