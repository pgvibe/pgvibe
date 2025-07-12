// SQL generation tests for LEFT JOIN with table aliases

import { test, expect } from "bun:test";
import { createTestQueryBuilder } from "../../../../__shared__/helpers/test-utils";

test("SQL: LEFT JOIN with table aliases", () => {
  const qb = createTestQueryBuilder();
  const sql = qb
    .selectFrom("users as u")
    .leftJoin("posts as p", "u.id", "p.user_id")
    .select(["u.name", "p.title"])
    .toSQL();
  expect(sql).toBe("SELECT u.name, p.title FROM users AS u LEFT JOIN posts AS p ON u.id = p.user_id");
});

test("SQL: Multiple LEFT JOINs with aliases", () => {
  const qb = createTestQueryBuilder();
  const sql = qb
    .selectFrom("users as u")
    .leftJoin("posts as p", "u.id", "p.user_id")
    .leftJoin("comments as c", "p.id", "c.post_id")
    .select(["u.name", "p.title", "c.content"])
    .toSQL();
  expect(sql).toBe("SELECT u.name, p.title, c.content FROM users AS u LEFT JOIN posts AS p ON u.id = p.user_id LEFT JOIN comments AS c ON p.id = c.post_id");
});

test("SQL: LEFT JOIN with descriptive aliases", () => {
  const qb = createTestQueryBuilder();
  const sql = qb
    .selectFrom("users as author")
    .leftJoin("posts as articles", "author.id", "articles.user_id")
    .select(["author.name", "articles.title"])
    .toSQL();
  expect(sql).toBe("SELECT author.name, articles.title FROM users AS author LEFT JOIN posts AS articles ON author.id = articles.user_id");
});