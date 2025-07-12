// SQL generation tests for column alias edge cases

import { test, expect } from "bun:test";
import { createTestQueryBuilder } from "../../../__shared__/helpers/test-utils";

test("SQL: Column aliases with underscores", () => {
  const qb = createTestQueryBuilder();
  const sql = qb.selectFrom("users").select(["name as full_name", "email as email_address"]).toSQL();
  expect(sql).toBe("SELECT name as full_name, email as email_address FROM users");
});

test("SQL: Column aliases with numbers", () => {
  const qb = createTestQueryBuilder();
  const sql = qb.selectFrom("posts").select(["title as title1", "content as content2"]).toSQL();
  expect(sql).toBe("SELECT title as title1, content as content2 FROM posts");
});

test("SQL: Very descriptive column aliases", () => {
  const qb = createTestQueryBuilder();
  const sql = qb
    .selectFrom("users")
    .select([
      "name as user_full_name", 
      "email as primary_email_address",
      "created_at as account_creation_timestamp"
    ])
    .toSQL();
  expect(sql).toBe("SELECT name as user_full_name, email as primary_email_address, created_at as account_creation_timestamp FROM users");
});

// TODO: Add more edge cases:
// - Reserved PostgreSQL keywords as alias names (may need quoting)
// - Special characters in alias names  
// - Case sensitivity in aliases
// - Unicode characters in aliases