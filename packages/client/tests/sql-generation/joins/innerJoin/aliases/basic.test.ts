// SQL generation tests for INNER JOIN with table aliases

import { test, expect } from "bun:test";
import { createTestQueryBuilder } from "../../../../__shared__/helpers/test-utils";

test("SQL: INNER JOIN with table aliases", () => {
  const qb = createTestQueryBuilder();
  const sql = qb
    .selectFrom("users as u")
    .innerJoin("posts as p", "u.id", "p.user_id")
    .select(["u.name", "p.title"])
    .toSQL();
  expect(sql).toBe("SELECT u.name, p.title FROM users AS u INNER JOIN posts AS p ON u.id = p.user_id");
});

test("SQL: INNER JOIN with short aliases", () => {
  const qb = createTestQueryBuilder();
  const sql = qb
    .selectFrom("users as u")
    .innerJoin("posts as p", "u.id", "p.user_id")
    .innerJoin("comments as c", "p.id", "c.post_id")
    .select(["u.name", "p.title", "c.content"])
    .toSQL();
  expect(sql).toBe("SELECT u.name, p.title, c.content FROM users AS u INNER JOIN posts AS p ON u.id = p.user_id INNER JOIN comments AS c ON p.id = c.post_id");
});

test("SQL: INNER JOIN with descriptive aliases", () => {
  const qb = createTestQueryBuilder();
  const sql = qb
    .selectFrom("users as author")
    .innerJoin("posts as article", "author.id", "article.user_id")
    .select(["author.name", "article.title"])
    .toSQL();
  expect(sql).toBe("SELECT author.name, article.title FROM users AS author INNER JOIN posts AS article ON author.id = article.user_id");
});

test("SQL: Mixed aliases - some tables aliased, some not", () => {
  const qb = createTestQueryBuilder();
  const sql = qb
    .selectFrom("users as u")
    .innerJoin("posts", "u.id", "posts.user_id")
    .select(["u.name", "posts.title"])
    .toSQL();
  expect(sql).toBe("SELECT u.name, posts.title FROM users AS u INNER JOIN posts ON u.id = posts.user_id");
});