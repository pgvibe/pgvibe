// SQL generation tests for basic INNER JOIN operations

import { test, expect } from "bun:test";
import { createTestQueryBuilder } from "../../../__shared__/helpers/test-utils";

test("SQL: Basic INNER JOIN generates correct syntax", () => {
  const qb = createTestQueryBuilder();
  const sql = qb
    .selectFrom("users")
    .innerJoin("posts", "users.id", "posts.user_id")
    .select(["users.name", "posts.title"])
    .toSQL();
  expect(sql).toBe("SELECT users.name, posts.title FROM users INNER JOIN posts ON users.id = posts.user_id");
});

test("SQL: INNER JOIN with different table combinations", () => {
  const qb = createTestQueryBuilder();
  
  // Users -> Posts
  const userPostsSql = qb
    .selectFrom("users")
    .innerJoin("posts", "users.id", "posts.user_id")
    .select(["users.name", "posts.title"])
    .toSQL();
  expect(userPostsSql).toBe("SELECT users.name, posts.title FROM users INNER JOIN posts ON users.id = posts.user_id");
  
  // Posts -> Comments
  const postCommentsSql = qb
    .selectFrom("posts")
    .innerJoin("comments", "posts.id", "comments.post_id")
    .select(["posts.title", "comments.content"])
    .toSQL();
  expect(postCommentsSql).toBe("SELECT posts.title, comments.content FROM posts INNER JOIN comments ON posts.id = comments.post_id");
});

test("SQL: INNER JOIN with all columns from both tables", () => {
  const qb = createTestQueryBuilder();
  const sql = qb
    .selectFrom("users")
    .innerJoin("posts", "users.id", "posts.user_id")
    .toSQL();
  expect(sql).toBe("SELECT * FROM users INNER JOIN posts ON users.id = posts.user_id");
});

test("SQL: INNER JOIN with single table columns", () => {
  const qb = createTestQueryBuilder();
  const sql = qb
    .selectFrom("users")
    .innerJoin("posts", "users.id", "posts.user_id")
    .select(["users.name", "users.email"])
    .toSQL();
  expect(sql).toBe("SELECT users.name, users.email FROM users INNER JOIN posts ON users.id = posts.user_id");
});