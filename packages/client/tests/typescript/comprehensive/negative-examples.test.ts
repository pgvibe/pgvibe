import { test, expect } from "bun:test";
import { QueryBuilder } from "../../../src/query-builder";
import { TestDB } from "../../__shared__/fixtures/test-schema";

// This file tests TypeScript's compile-time validation
// These tests verify that TypeScript correctly rejects invalid code

test("TypeScript should reject invalid table names in selectFrom", () => {
  const qb = new QueryBuilder<TestDB>();
  
  // Valid table names (should compile)
  qb.selectFrom("users");
  qb.selectFrom("posts");
  qb.selectFrom("comments");
  
  // Invalid table names (should NOT compile)
  // @ts-expect-error - "invalid_table" doesn't exist in TestDB
  qb.selectFrom("invalid_table");
  
  // @ts-expect-error - "user" is not "users"
  qb.selectFrom("user");
  
  // @ts-expect-error - empty string is not valid
  qb.selectFrom("");
  
  expect(true).toBe(true);
});

test("TypeScript should reject invalid column names in select", () => {
  const qb = new QueryBuilder<TestDB>();
  
  // Valid columns for users table
  const validQuery = qb.selectFrom("users").select(["id", "name", "email", "active"]);
  
  // Invalid columns (should NOT compile)
  // @ts-expect-error - "invalid_column" doesn't exist in users table
  qb.selectFrom("users").select(["invalid_column"]);
  
  // @ts-expect-error - "title" exists in posts, not users
  qb.selectFrom("users").select(["title"]);
  
  // @ts-expect-error - "content" exists in comments, not users
  qb.selectFrom("users").select(["content"]);
  
  expect(true).toBe(true);
});

test("TypeScript should enforce alias exclusivity", () => {
  const qb = new QueryBuilder<TestDB>();
  
  // When using alias, original table name should be rejected
  const aliasedQuery = qb.selectFrom("users as u");
  
  // Valid: using alias
  aliasedQuery.select(["u.id", "u.name"]);
  aliasedQuery.select(["id", "name"]); // unqualified also valid
  
  // Invalid: using original table name after aliasing
  // @ts-expect-error - "users.id" is invalid when table is aliased as "u"
  aliasedQuery.select(["users.id"]);
  
  // @ts-expect-error - "users.name" is invalid when table is aliased as "u"
  aliasedQuery.select(["users.name", "u.email"]);
  
  expect(true).toBe(true);
});

test("TypeScript should reject invalid columns in JOIN conditions", () => {
  const qb = new QueryBuilder<TestDB>();
  
  // Valid JOIN
  qb.selectFrom("users as u")
    .innerJoin("posts as p", "u.id", "p.user_id");
  
  // Invalid JOIN conditions
  // @ts-expect-error - "u.invalid" doesn't exist
  qb.selectFrom("users as u")
    .innerJoin("posts as p", "u.invalid", "p.user_id");
  
  // @ts-expect-error - "p.invalid" doesn't exist
  qb.selectFrom("users as u")
    .innerJoin("posts as p", "u.id", "p.invalid");
  
  // @ts-expect-error - can't use original table name with alias
  qb.selectFrom("users as u")
    .innerJoin("posts as p", "users.id", "p.user_id");
  
  expect(true).toBe(true);
});

test("TypeScript should reject columns from non-joined tables", () => {
  const qb = new QueryBuilder<TestDB>();
  
  // Single table query
  const singleTable = qb.selectFrom("users");
  
  // Valid: columns from users
  singleTable.select(["id", "name"]);
  
  // Invalid: columns from other tables
  // @ts-expect-error - can't select posts columns without joining posts
  singleTable.select(["title"]);
  
  // @ts-expect-error - can't use qualified names from non-joined tables
  singleTable.select(["posts.title"]);
  
  // After JOIN, both tables' columns should be available
  const withJoin = qb.selectFrom("users as u")
    .innerJoin("posts as p", "u.id", "p.user_id");
  
  // Valid: columns from both tables
  withJoin.select(["u.name", "p.title"]);
  
  // Invalid: columns from non-joined table
  // @ts-expect-error - comments table not joined
  withJoin.select(["c.content"]);
  
  expect(true).toBe(true);
});

test("TypeScript should validate column aliases correctly", () => {
  const qb = new QueryBuilder<TestDB>();
  
  // Valid column aliases
  qb.selectFrom("users")
    .select(["id as userId", "name as userName"]);
  
  qb.selectFrom("users as u")
    .select(["u.id as userId", "u.name as userName"]);
  
  // Invalid: aliasing non-existent columns
  // @ts-expect-error - "invalid_col" doesn't exist
  qb.selectFrom("users")
    .select(["invalid_col as alias"]);
  
  // @ts-expect-error - "title" doesn't exist in users
  qb.selectFrom("users")
    .select(["title as postTitle"]);
  
  expect(true).toBe(true);
});

test("TypeScript should track available columns through query chain", () => {
  const qb = new QueryBuilder<TestDB>();
  
  // Start with users
  const q1 = qb.selectFrom("users as u");
  
  // Can select users columns
  q1.select(["u.id", "u.name"]);
  
  // After joining posts
  const q2 = q1.innerJoin("posts as p", "u.id", "p.user_id");
  
  // Can now select from both tables
  q2.select(["u.name", "p.title"]);
  
  // After joining comments
  const q3 = q2.leftJoin("comments as c", "p.id", "c.post_id");
  
  // Can select from all three tables
  q3.select(["u.name", "p.title", "c.content"]);
  
  // But original query builder still can't access joined tables
  // @ts-expect-error - p.title not available in q1
  q1.select(["p.title"]);
  
  expect(true).toBe(true);
});

test("TypeScript should validate mixed qualified/unqualified columns", () => {
  const qb = new QueryBuilder<TestDB>();
  
  const query = qb.selectFrom("users as u")
    .innerJoin("posts as p", "u.id", "p.user_id");
  
  // Valid: mixed qualified and unqualified
  query.select(["u.name", "title", "p.published", "email"]);
  
  // When columns exist in multiple tables, both qualified forms are valid
  query.select(["u.id", "p.id"]); // both tables have "id"
  query.select(["id"]); // unqualified "id" is also valid (ambiguous but allowed)
  
  // Invalid: wrong table qualifier
  // @ts-expect-error - "u.title" doesn't exist (title is in posts)
  query.select(["u.title"]);
  
  // @ts-expect-error - "p.name" doesn't exist (name is in users)
  query.select(["p.name"]);
  
  expect(true).toBe(true);
});

test("TypeScript should properly type nullable columns from LEFT JOIN", () => {
  const qb = new QueryBuilder<TestDB>();
  
  // INNER JOIN - all columns non-nullable
  const innerResult = qb.selectFrom("users as u")
    .innerJoin("posts as p", "u.id", "p.user_id")
    .select(["u.name", "p.title"])
    .execute();
  
  // Type should be: Promise<{ name: string, title: string }[]>
  innerResult.then(rows => {
    if (rows[0]) {
      // These should all be non-nullable
      const name: string = rows[0].name;
      const title: string = rows[0].title;
    }
  });
  
  // LEFT JOIN - joined columns nullable
  const leftResult = qb.selectFrom("users as u")
    .leftJoin("posts as p", "u.id", "p.user_id")
    .select(["u.name", "p.title"])
    .execute();
  
  // Type should be: Promise<{ name: string, title: string | null }[]>
  leftResult.then(rows => {
    if (rows[0]) {
      const name: string = rows[0].name; // non-nullable (from base table)
      const title: string | null = rows[0].title; // nullable (from LEFT JOIN)
      
      // TypeScript should error if we try to treat nullable as non-nullable
      // @ts-expect-error - title might be null
      const titleNotNull: string = rows[0].title;
    }
  });
  
  expect(true).toBe(true);
});