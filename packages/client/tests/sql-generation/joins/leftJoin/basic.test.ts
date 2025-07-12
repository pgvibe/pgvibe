// SQL generation tests for basic LEFT JOIN operations

import { test, expect } from "bun:test";
import { createTestQueryBuilder } from "../../../__shared__/helpers/test-utils";

test("SQL: Basic LEFT JOIN generates correct syntax", () => {
  const qb = createTestQueryBuilder();
  const sql = qb
    .selectFrom("users")
    .leftJoin("posts", "users.id", "posts.user_id")
    .select(["users.name", "posts.title"])
    .toSQL();
  expect(sql).toBe("SELECT users.name, posts.title FROM users LEFT JOIN posts ON users.id = posts.user_id");
});

test("SQL: LEFT JOIN with different table combinations", () => {
  const qb = createTestQueryBuilder();
  
  // Users -> Posts (users without posts included)
  const userPostsSql = qb
    .selectFrom("users")
    .leftJoin("posts", "users.id", "posts.user_id")
    .select(["users.name", "posts.title"])
    .toSQL();
  expect(userPostsSql).toBe("SELECT users.name, posts.title FROM users LEFT JOIN posts ON users.id = posts.user_id");
  
  // Posts -> Comments (posts without comments included)
  const postCommentsSql = qb
    .selectFrom("posts")
    .leftJoin("comments", "posts.id", "comments.post_id")
    .select(["posts.title", "comments.content"])
    .toSQL();
  expect(postCommentsSql).toBe("SELECT posts.title, comments.content FROM posts LEFT JOIN comments ON posts.id = comments.post_id");
});

test("SQL: LEFT JOIN with all columns", () => {
  const qb = createTestQueryBuilder();
  const sql = qb
    .selectFrom("users")
    .leftJoin("posts", "users.id", "posts.user_id")
    .toSQL();
  expect(sql).toBe("SELECT * FROM users LEFT JOIN posts ON users.id = posts.user_id");
});

test("SQL: LEFT JOIN selecting only from left table", () => {
  const qb = createTestQueryBuilder();
  const sql = qb
    .selectFrom("users")
    .leftJoin("posts", "users.id", "posts.user_id")
    .select(["users.name", "users.email"])
    .toSQL();
  expect(sql).toBe("SELECT users.name, users.email FROM users LEFT JOIN posts ON users.id = posts.user_id");
});