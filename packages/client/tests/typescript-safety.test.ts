// TypeScript Safety Tests - The Core Challenge
// Goal: Perfect compile-time type safety for alias system and multi-table queries

import { test, expect } from "bun:test";
import { QueryBuilder } from "../src/query-builder";
import type { TestDB } from "./test-schema";

test("TypeScript should enforce alias exclusivity", () => {
  const qb = new QueryBuilder<TestDB>();
  const query = qb.selectFrom("users as u");
  
  // These should compile without errors:
  const goodQuery1 = query.select(["u.id", "u.name"]); // qualified with alias
  const goodQuery2 = query.select(["id", "name"]);     // unqualified
  
  // This should be a TypeScript compilation error (not implemented yet):
  // const badQuery = query.select(["users.id", "users.name"]); // @ts-expect-error
  
  expect(goodQuery1.toSQL()).toBe("SELECT u.id, u.name FROM users AS u");
  expect(goodQuery2.toSQL()).toBe("SELECT id, name FROM users AS u");
});

test("TypeScript should provide correct autocomplete for multi-table JOINs", () => {
  const qb = new QueryBuilder<TestDB>();
  const query = qb
    .selectFrom("users as u")
    .innerJoin("posts as p", "u.id", "p.user_id");
  
  // After JOIN, these should all be valid TypeScript:
  const validColumns = query.select([
    "u.id",          // qualified from users
    "u.name", 
    "u.email",
    "u.active",
    "p.id",          // qualified from posts  
    "p.user_id",
    "p.title",
    "p.published",
    "id",            // unqualified (ambiguous, but allowed)
    "name",          // unqualified from users
    "email",         // unqualified from users
    "active",        // unqualified from users
    "user_id",       // unqualified from posts
    "title",         // unqualified from posts
    "published"      // unqualified from posts
  ]);
  
  // These should be TypeScript errors (not implemented yet):
  // const invalidColumns = query.select([
  //   "users.id",    // @ts-expect-error - original table name should be invalid
  //   "posts.title"  // @ts-expect-error - original table name should be invalid  
  // ]);
  
  expect(validColumns).toBeDefined();
});

test("TypeScript should track type evolution through query building", () => {
  const qb = new QueryBuilder<TestDB>();
  
  // Step 1: Basic table selection
  const step1 = qb.selectFrom("users");
  // Available columns should be: users.id, users.name, users.email, users.active, id, name, email, active
  
  // Step 2: With alias
  const step2 = qb.selectFrom("users as u");  
  // Available columns should be: u.id, u.name, u.email, u.active, id, name, email, active
  // Invalid: users.id, users.name, users.email, users.active
  
  // Step 3: After JOIN
  const step3 = step2.innerJoin("posts as p", "u.id", "p.user_id");
  // Available columns should include both tables' columns with proper alias constraints
  
  // This should compile - we're just testing that the types work
  expect(step1).toBeDefined();
  expect(step2).toBeDefined(); 
  expect(step3).toBeDefined();
});

test("TypeScript should prevent invalid column references", () => {
  const qb = new QueryBuilder<TestDB>();
  
  // TODO: These should eventually be TypeScript compilation errors:
  
  // Invalid table name
  // const invalidTable = qb.selectFrom("nonexistent"); // @ts-expect-error
  
  // Invalid column name  
  // const invalidColumn = qb.selectFrom("users").select(["nonexistent"]); // @ts-expect-error
  
  // Invalid qualified column after alias
  // const invalidQualified = qb.selectFrom("users as u").select(["users.id"]); // @ts-expect-error
  
  // For now, just test that basic functionality works
  const validQuery = qb.selectFrom("users").select(["id", "name"]);
  expect(validQuery).toBeDefined();
});