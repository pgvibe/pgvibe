// SQL generation tests for JOIN operations

import { test, expect } from "bun:test";
import { createTestQueryBuilder } from "../__shared__/helpers/test-utils";

test("SQL: Basic INNER JOIN generates correct syntax", () => {
  const qb = createTestQueryBuilder();
  const sql = qb
    .selectFrom("users")
    .innerJoin("posts", "users.id", "posts.user_id")
    .select(["users.name", "posts.title"])
    .toSQL();
  
  expect(sql).toBe(
    "SELECT users.name, posts.title FROM users INNER JOIN posts ON users.id = posts.user_id"
  );
});

test("SQL: INNER JOIN with table aliases", () => {
  const qb = createTestQueryBuilder();
  const sql = qb
    .selectFrom("users as u")
    .innerJoin("posts as p", "u.id", "p.user_id")
    .select(["u.name", "p.title"])
    .toSQL();
  
  expect(sql).toBe(
    "SELECT u.name, p.title FROM users AS u INNER JOIN posts AS p ON u.id = p.user_id"
  );
});

test("SQL: LEFT JOIN generates correct syntax", () => {
  const qb = createTestQueryBuilder();
  const sql = qb
    .selectFrom("users as u")
    .leftJoin("posts as p", "u.id", "p.user_id")
    .select(["u.name", "p.title"])
    .toSQL();
  
  expect(sql).toBe(
    "SELECT u.name, p.title FROM users AS u LEFT JOIN posts AS p ON u.id = p.user_id"
  );
});

test("SQL: Multiple JOINs generate correct syntax", () => {
  const qb = createTestQueryBuilder();
  const sql = qb
    .selectFrom("users as u")
    .innerJoin("posts as p", "u.id", "p.user_id")
    .leftJoin("comments as c", "p.id", "c.post_id")
    .select(["u.name", "p.title", "c.content"])
    .toSQL();
  
  expect(sql).toBe(
    "SELECT u.name, p.title, c.content FROM users AS u INNER JOIN posts AS p ON u.id = p.user_id LEFT JOIN comments AS c ON p.id = c.post_id"
  );
});

test("SQL: Mixed qualified and unqualified columns in JOINs", () => {
  const qb = createTestQueryBuilder();
  const sql = qb
    .selectFrom("users as u")
    .innerJoin("posts as p", "u.id", "p.user_id")
    .select(["u.name", "title", "p.created_at"])
    .toSQL();
  
  expect(sql).toBe(
    "SELECT u.name, title, p.created_at FROM users AS u INNER JOIN posts AS p ON u.id = p.user_id"
  );
});

test("SQL: JOINs without aliases", () => {
  const qb = createTestQueryBuilder();
  const sql = qb
    .selectFrom("users")
    .innerJoin("posts", "users.id", "posts.user_id")
    .select(["users.name", "posts.title"])
    .toSQL();
  
  expect(sql).toBe(
    "SELECT users.name, posts.title FROM users INNER JOIN posts ON users.id = posts.user_id"
  );
});