// SQL generation tests for table and column aliases

import { test, expect } from "bun:test";
import { createTestQueryBuilder } from "../__shared__/helpers/test-utils";

test("SQL: Table aliases generate correct AS syntax", () => {
  const qb = createTestQueryBuilder();
  const sql = qb.selectFrom("users as u").select(["u.name"]).toSQL();
  expect(sql).toBe("SELECT u.name FROM users AS u");
});

test("SQL: Multiple table aliases", () => {
  const qb = createTestQueryBuilder();
  const sql = qb
    .selectFrom("users as user_table")
    .innerJoin("posts as post_table", "user_table.id", "post_table.user_id")
    .select(["user_table.name", "post_table.title"])
    .toSQL();
  
  expect(sql).toBe(
    "SELECT user_table.name, post_table.title FROM users AS user_table INNER JOIN posts AS post_table ON user_table.id = post_table.user_id"
  );
});

test("SQL: Column aliases generate correct AS syntax", () => {
  const qb = createTestQueryBuilder();
  const sql = qb
    .selectFrom("users")
    .select(["name as full_name", "email as contact_email"])
    .toSQL();
  
  expect(sql).toBe("SELECT name as full_name, email as contact_email FROM users");
});

test("SQL: Mixed table and column aliases", () => {
  const qb = createTestQueryBuilder();
  const sql = qb
    .selectFrom("users as u")
    .select(["u.name as username", "u.email as userEmail"])
    .toSQL();
  
  expect(sql).toBe("SELECT u.name as username, u.email as userEmail FROM users AS u");
});

test("SQL: Complex aliases with JOINs", () => {
  const qb = createTestQueryBuilder();
  const sql = qb
    .selectFrom("users as u")
    .innerJoin("posts as p", "u.id", "p.user_id")
    .select([
      "u.name as author_name",
      "p.title as post_title",
      "p.created_at as published_date"
    ])
    .toSQL();
  
  expect(sql).toBe(
    "SELECT u.name as author_name, p.title as post_title, p.created_at as published_date FROM users AS u INNER JOIN posts AS p ON u.id = p.user_id"
  );
});