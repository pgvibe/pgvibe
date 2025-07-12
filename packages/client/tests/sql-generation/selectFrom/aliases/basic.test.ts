// SQL generation tests for selectFrom with table aliases

import { test, expect } from "bun:test";
import { createTestQueryBuilder } from "../../../__shared__/helpers/test-utils";

test("SQL: Table aliases generate correct AS syntax", () => {
  const qb = createTestQueryBuilder();
  const sql = qb.selectFrom("users as u").select(["u.name"]).toSQL();
  expect(sql).toBe("SELECT u.name FROM users AS u");
});

test("SQL: Different table aliases work correctly", () => {
  const qb = createTestQueryBuilder();
  
  const usersSql = qb.selectFrom("users as user_table").select(["user_table.id"]).toSQL();
  expect(usersSql).toBe("SELECT user_table.id FROM users AS user_table");
  
  const postsSql = qb.selectFrom("posts as p").select(["p.title"]).toSQL();
  expect(postsSql).toBe("SELECT p.title FROM posts AS p");
});

test("SQL: Short and long table aliases", () => {
  const qb = createTestQueryBuilder();
  
  // Short alias
  const shortSql = qb.selectFrom("users as u").select(["u.name"]).toSQL();
  expect(shortSql).toBe("SELECT u.name FROM users AS u");
  
  // Long alias
  const longSql = qb.selectFrom("users as user_data").select(["user_data.email"]).toSQL();
  expect(longSql).toBe("SELECT user_data.email FROM users AS user_data");
});