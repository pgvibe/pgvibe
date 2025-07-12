// SQL generation tests for basic selectFrom operations

import { test, expect } from "bun:test";
import { createTestQueryBuilder } from "../../__shared__/helpers/test-utils";

test("SQL: Basic table selection generates correct syntax", () => {
  const qb = createTestQueryBuilder();
  const sql = qb.selectFrom("users").toSQL();
  expect(sql).toBe("SELECT * FROM users");
});

test("SQL: Different tables generate correct FROM syntax", () => {
  const qb = createTestQueryBuilder();
  
  const usersSql = qb.selectFrom("users").toSQL();
  expect(usersSql).toBe("SELECT * FROM users");
  
  const postsSql = qb.selectFrom("posts").toSQL();
  expect(postsSql).toBe("SELECT * FROM posts");
  
  const commentsSql = qb.selectFrom("comments").toSQL();
  expect(commentsSql).toBe("SELECT * FROM comments");
});