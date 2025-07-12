// SQL generation tests for basic SELECT column operations

import { test, expect } from "bun:test";
import { createTestQueryBuilder } from "../../__shared__/helpers/test-utils";

test("SQL: Single column selection", () => {
  const qb = createTestQueryBuilder();
  const sql = qb.selectFrom("users").select(["name"]).toSQL();
  expect(sql).toBe("SELECT name FROM users");
});

test("SQL: Multiple column selection", () => {
  const qb = createTestQueryBuilder();
  const sql = qb.selectFrom("users").select(["id", "name", "email"]).toSQL();
  expect(sql).toBe("SELECT id, name, email FROM users");
});

test("SQL: Column order preservation", () => {
  const qb = createTestQueryBuilder();
  const sql = qb.selectFrom("users").select(["email", "id", "name"]).toSQL();
  expect(sql).toBe("SELECT email, id, name FROM users");
});

test("SQL: SELECT all columns with asterisk", () => {
  const qb = createTestQueryBuilder();
  const sql = qb.selectFrom("users").toSQL();
  expect(sql).toBe("SELECT * FROM users");
});

test("SQL: Single column from different tables", () => {
  const qb = createTestQueryBuilder();
  
  const usersSql = qb.selectFrom("users").select(["name"]).toSQL();
  expect(usersSql).toBe("SELECT name FROM users");
  
  const postsSql = qb.selectFrom("posts").select(["title"]).toSQL();
  expect(postsSql).toBe("SELECT title FROM posts");
});