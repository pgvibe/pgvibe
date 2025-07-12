// Phase 2: Table Aliases (Core Challenge)
// Goal: Make db.selectFrom("users as u") work perfectly with alias exclusivity

import { test, expect } from "bun:test";
import { QueryBuilder } from "../../src/query-builder";
import type { TestDB } from "../fixtures/test-schema";

test("should create query builder from aliased table", () => {
  const qb = new QueryBuilder<TestDB>();
  const query = qb.selectFrom("users as u");
  
  expect(query).toBeDefined();
  expect(query.toSQL()).toBe("SELECT * FROM users AS u");
});

test("should support unqualified column selection with alias", () => {
  const qb = new QueryBuilder<TestDB>();
  const query = qb.selectFrom("users as u").select(["id", "name"]);
  
  expect(query.toSQL()).toBe("SELECT id, name FROM users AS u");
});

test("should support qualified column selection with alias", () => {
  const qb = new QueryBuilder<TestDB>();
  const query = qb.selectFrom("users as u").select(["u.id", "u.name"]);
  
  expect(query.toSQL()).toBe("SELECT u.id, u.name FROM users AS u");
});

test("should support mixed qualified and unqualified columns", () => {
  const qb = new QueryBuilder<TestDB>();
  const query = qb.selectFrom("users as u").select(["u.id", "name", "u.email"]);
  
  expect(query.toSQL()).toBe("SELECT u.id, name, u.email FROM users AS u");
});

test("should work with different table aliases", () => {
  const qb = new QueryBuilder<TestDB>();
  const query = qb.selectFrom("posts as p").select(["p.id", "title"]);
  
  expect(query.toSQL()).toBe("SELECT p.id, title FROM posts AS p");
});

test("should parse alias correctly from different formats", () => {
  const qb = new QueryBuilder<TestDB>();
  
  // Test different spacing
  const query1 = qb.selectFrom("users as u").select(["u.id"]);
  const query2 = qb.selectFrom("posts as p").select(["p.title"]);
  
  expect(query1.toSQL()).toBe("SELECT u.id FROM users AS u");
  expect(query2.toSQL()).toBe("SELECT p.title FROM posts AS p");
});

// TypeScript tests - these should fail at compile time when alias exclusivity is implemented
test("should demonstrate alias exclusivity requirement", () => {
  const qb = new QueryBuilder<TestDB>();
  const query = qb.selectFrom("users as u");
  
  // These should work:
  const goodQuery1 = query.select(["id"]); // unqualified
  const goodQuery2 = query.select(["u.id"]); // qualified with alias
  
  expect(goodQuery1.toSQL()).toBe("SELECT id FROM users AS u");
  expect(goodQuery2.toSQL()).toBe("SELECT u.id FROM users AS u");
  
  // This should eventually fail at TypeScript level (not implemented yet):
  // const badQuery = query.select(["users.id"]); // qualified with original table name
});