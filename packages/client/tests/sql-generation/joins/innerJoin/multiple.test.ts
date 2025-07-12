// SQL generation tests for multiple INNER JOIN operations

import { test, expect } from "bun:test";
import { createTestQueryBuilder } from "../../../__shared__/helpers/test-utils";

test("SQL: Two INNER JOINs - Users -> Posts -> Comments", () => {
  const qb = createTestQueryBuilder();
  const sql = qb
    .selectFrom("users")
    .innerJoin("posts", "users.id", "posts.user_id")
    .innerJoin("comments", "posts.id", "comments.post_id")
    .select(["users.name", "posts.title", "comments.content"])
    .toSQL();
  expect(sql).toBe("SELECT users.name, posts.title, comments.content FROM users INNER JOIN posts ON users.id = posts.user_id INNER JOIN comments ON posts.id = comments.post_id");
});

test("SQL: Multiple JOINs with different starting tables", () => {
  const qb = createTestQueryBuilder();
  const sql = qb
    .selectFrom("posts")
    .innerJoin("users", "posts.user_id", "users.id")
    .innerJoin("comments", "posts.id", "comments.post_id")
    .select(["posts.title", "users.name", "comments.content"])
    .toSQL();
  expect(sql).toBe("SELECT posts.title, users.name, comments.content FROM posts INNER JOIN users ON posts.user_id = users.id INNER JOIN comments ON posts.id = comments.post_id");
});

test("SQL: Three INNER JOINs with all tables", () => {
  const qb = createTestQueryBuilder();
  const sql = qb
    .selectFrom("users")
    .innerJoin("posts", "users.id", "posts.user_id")
    .innerJoin("comments", "posts.id", "comments.post_id")
    .innerJoin("categories", "posts.category_id", "categories.id")
    .select(["users.name", "posts.title", "comments.content", "categories.name"])
    .toSQL();
  expect(sql).toBe("SELECT users.name, posts.title, comments.content, categories.name FROM users INNER JOIN posts ON users.id = posts.user_id INNER JOIN comments ON posts.id = comments.post_id INNER JOIN categories ON posts.category_id = categories.id");
});

test("SQL: Multiple JOINs with SELECT * (all columns)", () => {
  const qb = createTestQueryBuilder();
  const sql = qb
    .selectFrom("users")
    .innerJoin("posts", "users.id", "posts.user_id")
    .innerJoin("comments", "posts.id", "comments.post_id")
    .toSQL();
  expect(sql).toBe("SELECT * FROM users INNER JOIN posts ON users.id = posts.user_id INNER JOIN comments ON posts.id = comments.post_id");
});