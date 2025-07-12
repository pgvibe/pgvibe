// SQL generation tests for mixed JOIN types (INNER + LEFT JOIN combinations)

import { test, expect } from "bun:test";
import { createTestQueryBuilder } from "../../../__shared__/helpers/test-utils";

test("SQL: INNER JOIN followed by LEFT JOIN", () => {
  const qb = createTestQueryBuilder();
  const sql = qb
    .selectFrom("users")
    .innerJoin("posts", "users.id", "posts.user_id")
    .leftJoin("comments", "posts.id", "comments.post_id")
    .select(["users.name", "posts.title", "comments.content"])
    .toSQL();
  expect(sql).toBe("SELECT users.name, posts.title, comments.content FROM users INNER JOIN posts ON users.id = posts.user_id LEFT JOIN comments ON posts.id = comments.post_id");
});

test("SQL: LEFT JOIN followed by INNER JOIN", () => {
  const qb = createTestQueryBuilder();
  const sql = qb
    .selectFrom("users")
    .leftJoin("posts", "users.id", "posts.user_id")
    .innerJoin("categories", "posts.category_id", "categories.id")
    .select(["users.name", "posts.title", "categories.name"])
    .toSQL();
  expect(sql).toBe("SELECT users.name, posts.title, categories.name FROM users LEFT JOIN posts ON users.id = posts.user_id INNER JOIN categories ON posts.category_id = categories.id");
});

test("SQL: Multiple mixed JOINs", () => {
  const qb = createTestQueryBuilder();
  const sql = qb
    .selectFrom("users")
    .innerJoin("posts", "users.id", "posts.user_id")
    .leftJoin("comments", "posts.id", "comments.post_id")
    .innerJoin("categories", "posts.category_id", "categories.id")
    .select(["users.name", "posts.title", "comments.content", "categories.name"])
    .toSQL();
  expect(sql).toBe("SELECT users.name, posts.title, comments.content, categories.name FROM users INNER JOIN posts ON users.id = posts.user_id LEFT JOIN comments ON posts.id = comments.post_id INNER JOIN categories ON posts.category_id = categories.id");
});