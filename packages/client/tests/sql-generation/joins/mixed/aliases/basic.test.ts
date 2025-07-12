// SQL generation tests for mixed JOIN types with table aliases

import { test, expect } from "bun:test";
import { createTestQueryBuilder } from "../../../../__shared__/helpers/test-utils";

test("SQL: Mixed JOINs with table aliases", () => {
  const qb = createTestQueryBuilder();
  const sql = qb
    .selectFrom("users as u")
    .innerJoin("posts as p", "u.id", "p.user_id")
    .leftJoin("comments as c", "p.id", "c.post_id")
    .select(["u.name", "p.title", "c.content"])
    .toSQL();
  expect(sql).toBe("SELECT u.name, p.title, c.content FROM users AS u INNER JOIN posts AS p ON u.id = p.user_id LEFT JOIN comments AS c ON p.id = c.post_id");
});

test("SQL: Complex mixed JOINs with descriptive aliases", () => {
  const qb = createTestQueryBuilder();
  const sql = qb
    .selectFrom("users as author")
    .innerJoin("posts as article", "author.id", "article.user_id")
    .leftJoin("comments as feedback", "article.id", "feedback.post_id")
    .innerJoin("categories as topic", "article.category_id", "topic.id")
    .select(["author.name", "article.title", "feedback.content", "topic.name"])
    .toSQL();
  expect(sql).toBe("SELECT author.name, article.title, feedback.content, topic.name FROM users AS author INNER JOIN posts AS article ON author.id = article.user_id LEFT JOIN comments AS feedback ON article.id = feedback.post_id INNER JOIN categories AS topic ON article.category_id = topic.id");
});

test("SQL: Mixed JOINs with some aliases", () => {
  const qb = createTestQueryBuilder();
  const sql = qb
    .selectFrom("users as u")
    .innerJoin("posts", "u.id", "posts.user_id")
    .leftJoin("comments as c", "posts.id", "c.post_id")
    .select(["u.name", "posts.title", "c.content"])
    .toSQL();
  expect(sql).toBe("SELECT u.name, posts.title, c.content FROM users AS u INNER JOIN posts ON u.id = posts.user_id LEFT JOIN comments AS c ON posts.id = c.post_id");
});