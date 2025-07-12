// SQL generation tests for basic SELECT queries

import { test, expect } from "bun:test";
import { createTestQueryBuilder, normalizeSQL } from "../__shared__/helpers/test-utils";

test("SQL: Basic table selection generates correct syntax", () => {
  const qb = createTestQueryBuilder();
  const sql = qb.selectFrom("users").toSQL();
  expect(sql).toBe("SELECT * FROM users");
});

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

test("SQL: Different tables generate correct syntax", () => {
  const qb = createTestQueryBuilder();
  
  const usersSql = qb.selectFrom("users").select(["id", "name"]).toSQL();
  expect(usersSql).toBe("SELECT id, name FROM users");
  
  const postsSql = qb.selectFrom("posts").select(["title", "content"]).toSQL();
  expect(postsSql).toBe("SELECT title, content FROM posts");
});

test("SQL: Qualified column names", () => {
  const qb = createTestQueryBuilder();
  const sql = qb.selectFrom("users").select(["users.id", "users.name"]).toSQL();
  expect(sql).toBe("SELECT users.id, users.name FROM users");
});

test("SQL: Column aliases in SELECT", () => {
  const qb = createTestQueryBuilder();
  const sql = qb
    .selectFrom("users")
    .select(["name as username", "email as userEmail"])
    .toSQL();
  expect(sql).toBe("SELECT name as username, email as userEmail FROM users");
});