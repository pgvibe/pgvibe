// Phase 1: Foundation (Single Table)
// Goal: Get basic db.selectFrom("users").select(["id", "name"]) working

import { test, expect } from "bun:test";
import { QueryBuilder } from "../../src/query-builder.js";
import type { TestDB } from "../fixtures/test-schema.js";

test("should create query builder from table name", () => {
  const qb = new QueryBuilder<TestDB>();
  const query = qb.selectFrom("users");
  
  expect(query).toBeDefined();
  expect(query.toSQL()).toBe("SELECT * FROM users");
});

test("should select specific columns", () => {
  const qb = new QueryBuilder<TestDB>();
  const query = qb.selectFrom("users").select(["id", "name"]);
  
  expect(query.toSQL()).toBe("SELECT id, name FROM users");
});

test("should select single column", () => {
  const qb = new QueryBuilder<TestDB>();
  const query = qb.selectFrom("users").select(["email"]);
  
  expect(query.toSQL()).toBe("SELECT email FROM users");
});

test("should select all columns (default behavior)", () => {
  const qb = new QueryBuilder<TestDB>();
  const query = qb.selectFrom("users");
  
  expect(query.toSQL()).toBe("SELECT * FROM users");
});

test("should work with posts table", () => {
  const qb = new QueryBuilder<TestDB>();
  const query = qb.selectFrom("posts").select(["id", "title"]);
  
  expect(query.toSQL()).toBe("SELECT id, title FROM posts");
});

test("should handle multiple columns in correct order", () => {
  const qb = new QueryBuilder<TestDB>();
  const query = qb.selectFrom("users").select(["name", "email", "active", "id"]);
  
  expect(query.toSQL()).toBe("SELECT name, email, active, id FROM users");
});