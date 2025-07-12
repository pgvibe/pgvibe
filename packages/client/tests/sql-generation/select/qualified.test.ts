// SQL generation tests for qualified column names (table.column syntax)

import { test, expect } from "bun:test";
import { createTestQueryBuilder } from "../../__shared__/helpers/test-utils";

test("SQL: Qualified column names with table prefix", () => {
  const qb = createTestQueryBuilder();
  const sql = qb.selectFrom("users").select(["users.id", "users.name"]).toSQL();
  expect(sql).toBe("SELECT users.id, users.name FROM users");
});

test("SQL: Mixed qualified and unqualified columns", () => {
  const qb = createTestQueryBuilder();
  const sql = qb.selectFrom("users").select(["users.id", "name", "users.email"]).toSQL();
  expect(sql).toBe("SELECT users.id, name, users.email FROM users");
});

test("SQL: All qualified columns", () => {
  const qb = createTestQueryBuilder();
  const sql = qb.selectFrom("posts").select(["posts.id", "posts.title", "posts.content", "posts.user_id"]).toSQL();
  expect(sql).toBe("SELECT posts.id, posts.title, posts.content, posts.user_id FROM posts");
});

test("SQL: Qualified columns with different table names", () => {
  const qb = createTestQueryBuilder();
  
  const usersSql = qb.selectFrom("users").select(["users.name", "users.email"]).toSQL();
  expect(usersSql).toBe("SELECT users.name, users.email FROM users");
  
  const postsSql = qb.selectFrom("posts").select(["posts.title", "posts.content"]).toSQL();
  expect(postsSql).toBe("SELECT posts.title, posts.content FROM posts");
});

test("SQL: Qualified columns preserve order", () => {
  const qb = createTestQueryBuilder();
  const sql = qb.selectFrom("users").select(["users.email", "users.id", "users.name"]).toSQL();
  expect(sql).toBe("SELECT users.email, users.id, users.name FROM users");
});