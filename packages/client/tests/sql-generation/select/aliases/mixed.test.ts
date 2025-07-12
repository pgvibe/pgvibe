// SQL generation tests for mixed table and column aliases

import { test, expect } from "bun:test";
import { createTestQueryBuilder } from "../../../__shared__/helpers/test-utils";

test("SQL: Table alias with column aliases", () => {
  const qb = createTestQueryBuilder();
  const sql = qb
    .selectFrom("users as u")
    .select(["u.name as username", "u.email as contact"])
    .toSQL();
  expect(sql).toBe("SELECT u.name as username, u.email as contact FROM users AS u");
});

test("SQL: Table alias with mixed aliased and non-aliased columns", () => {
  const qb = createTestQueryBuilder();
  const sql = qb
    .selectFrom("users as u")
    .select(["u.id", "u.name as username", "u.email"])
    .toSQL();
  expect(sql).toBe("SELECT u.id, u.name as username, u.email FROM users AS u");
});

test("SQL: Multiple table aliases with column aliases", () => {
  const qb = createTestQueryBuilder();
  const sql = qb
    .selectFrom("users as user_table")
    .select(["user_table.name as full_name", "user_table.email as contact_email"])
    .toSQL();
  expect(sql).toBe("SELECT user_table.name as full_name, user_table.email as contact_email FROM users AS user_table");
});

test("SQL: Short table alias with descriptive column aliases", () => {
  const qb = createTestQueryBuilder();
  const sql = qb
    .selectFrom("posts as p")
    .select(["p.title as post_title", "p.content as post_content", "p.created_at as published_date"])
    .toSQL();
  expect(sql).toBe("SELECT p.title as post_title, p.content as post_content, p.created_at as published_date FROM posts AS p");
});