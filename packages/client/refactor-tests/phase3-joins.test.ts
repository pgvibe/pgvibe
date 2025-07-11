// Phase 3: JOIN Operations  
// Goal: Make innerJoin("posts as p", "u.id", "p.user_id") work with aliases

import { test, expect } from "bun:test";
import { QueryBuilder } from "../src/query-builder";
import type { TestDB } from "./test-schema";

test("should support basic INNER JOIN", () => {
  const qb = new QueryBuilder<TestDB>();
  const query = qb
    .selectFrom("users")
    .innerJoin("posts", "users.id", "posts.user_id")
    .select(["users.name", "posts.title"]);
  
  expect(query.toSQL()).toBe(
    "SELECT users.name, posts.title FROM users INNER JOIN posts ON users.id = posts.user_id"
  );
});

test("should support INNER JOIN with aliases", () => {
  const qb = new QueryBuilder<TestDB>();
  const query = qb
    .selectFrom("users as u")
    .innerJoin("posts as p", "u.id", "p.user_id")
    .select(["u.name", "p.title"]);
  
  expect(query.toSQL()).toBe(
    "SELECT u.name, p.title FROM users AS u INNER JOIN posts AS p ON u.id = p.user_id"
  );
});

test("should support mixed qualified and unqualified columns in JOINs", () => {
  const qb = new QueryBuilder<TestDB>();
  const query = qb
    .selectFrom("users as u")
    .innerJoin("posts as p", "u.id", "p.user_id")
    .select(["u.id", "name", "p.title", "published"]);
  
  expect(query.toSQL()).toBe(
    "SELECT u.id, name, p.title, published FROM users AS u INNER JOIN posts AS p ON u.id = p.user_id"
  );
});

test("should support LEFT JOIN with aliases", () => {
  const qb = new QueryBuilder<TestDB>();
  const query = qb
    .selectFrom("users as u")
    .leftJoin("posts as p", "u.id", "p.user_id")
    .select(["u.name", "p.title"]);
  
  expect(query.toSQL()).toBe(
    "SELECT u.name, p.title FROM users AS u LEFT JOIN posts AS p ON u.id = p.user_id"
  );
});

test("should support RIGHT JOIN with aliases", () => {
  const qb = new QueryBuilder<TestDB>();
  const query = qb
    .selectFrom("users as u")
    .rightJoin("posts as p", "u.id", "p.user_id")
    .select(["u.name", "p.title"]);
  
  expect(query.toSQL()).toBe(
    "SELECT u.name, p.title FROM users AS u RIGHT JOIN posts AS p ON u.id = p.user_id"
  );
});

test("should support multiple JOINs chaining", () => {
  // Add comments table to our schema for this test
  const qb = new QueryBuilder<TestDB & { comments: { id: number; post_id: number; content: string } }>();
  const query = qb
    .selectFrom("users as u")
    .innerJoin("posts as p", "u.id", "p.user_id")
    .leftJoin("comments as c", "p.id", "c.post_id")
    .select(["u.name", "p.title", "c.content"]);
  
  expect(query.toSQL()).toBe(
    "SELECT u.name, p.title, c.content FROM users AS u INNER JOIN posts AS p ON u.id = p.user_id LEFT JOIN comments AS c ON p.id = c.post_id"
  );
});

test("should support JOIN without aliases (comparison)", () => {
  const qb = new QueryBuilder<TestDB>();
  const query = qb
    .selectFrom("users")
    .innerJoin("posts", "users.id", "posts.user_id")
    .select(["users.name", "posts.title"]);
  
  expect(query.toSQL()).toBe(
    "SELECT users.name, posts.title FROM users INNER JOIN posts ON users.id = posts.user_id"
  );
});

test("should support selectAll with JOINs", () => {
  const qb = new QueryBuilder<TestDB>();
  const query = qb
    .selectFrom("users as u")
    .innerJoin("posts as p", "u.id", "p.user_id")
    .selectAll();
  
  expect(query.toSQL()).toBe(
    "SELECT * FROM users AS u INNER JOIN posts AS p ON u.id = p.user_id"
  );
});