// SQL generation tests for column aliases in SELECT clauses

import { test, expect } from "bun:test";
import { createTestQueryBuilder } from "../../../__shared__/helpers/test-utils";

test("SQL: Single column alias", () => {
  const qb = createTestQueryBuilder();
  const sql = qb.selectFrom("users").select(["name as username"]).toSQL();
  expect(sql).toBe("SELECT name as username FROM users");
});

test("SQL: Multiple column aliases", () => {
  const qb = createTestQueryBuilder();
  const sql = qb.selectFrom("users").select(["name as username", "email as contact_email"]).toSQL();
  expect(sql).toBe("SELECT name as username, email as contact_email FROM users");
});

test("SQL: Mixed aliased and non-aliased columns", () => {
  const qb = createTestQueryBuilder();
  const sql = qb.selectFrom("users").select(["id", "name as username", "email"]).toSQL();
  expect(sql).toBe("SELECT id, name as username, email FROM users");
});

test("SQL: Qualified column aliases", () => {
  const qb = createTestQueryBuilder();
  const sql = qb.selectFrom("users").select(["users.name as full_name", "users.email as contact"]).toSQL();
  expect(sql).toBe("SELECT users.name as full_name, users.email as contact FROM users");
});

test("SQL: Column aliases preserve order", () => {
  const qb = createTestQueryBuilder();
  const sql = qb.selectFrom("users").select(["email as contact", "id as user_id", "name as username"]).toSQL();
  expect(sql).toBe("SELECT email as contact, id as user_id, name as username FROM users");
});