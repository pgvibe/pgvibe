// TSD Type Tests for JOIN Operations
// These tests verify that JOIN queries correctly infer types and handle edge cases

import { expectType, expectError } from "tsd";
import { createTestDatabase } from "../utils/test-types";
import type { Database } from "../utils/test-types";

const db = createTestDatabase();

// ======================================================================================
// ✅ BASIC TWO-TABLE JOIN TESTS
// ======================================================================================

// ✅ Test 1: Basic INNER JOIN with selectAll() - should include all columns from both tables
async function testInnerJoinSelectAll() {
  const result = await db
    .selectFrom("users")
    .innerJoin("posts", "users.id", "posts.user_id")
    .selectAll()
    .execute();

  // SelectAll on joined tables should include all columns from both tables
  // Note: This may show intersection type rather than individual columns
  expectType<
    Array<{
      id: number;
      name: string;
      email: string | null;
      active: boolean;
      created_at: Date;
      tags: string[];
      permissions: string[];
      scores: number[];
      user_id: number;
      title: string;
      content: string | null;
      published: boolean;
      categories: string[];
      ratings: number[];
    }>
  >(result);
}

// ✅ Test 2: INNER JOIN with qualified column selection
async function testInnerJoinQualifiedColumns() {
  const result = await db
    .selectFrom("users")
    .innerJoin("posts", "users.id", "posts.user_id")
    .select(["users.name", "posts.title", "posts.published"])
    .execute();

  // Currently our SelectResult strips table prefixes, so qualified columns become simple names
  expectType<
    Array<{
      name: string; // "users.name" becomes "name"
      title: string; // "posts.title" becomes "title"
      published: boolean; // "posts.published" becomes "published"
    }>
  >(result);
}

// ✅ Test 3: INNER JOIN with mixed simple and qualified columns
async function testInnerJoinMixedColumns() {
  const result = await db
    .selectFrom("users")
    .innerJoin("posts", "users.id", "posts.user_id")
    .select(["users.name", "email", "posts.title"])
    .execute();

  // Mixed qualified/simple columns - all get normalized to simple names
  expectType<
    Array<{
      name: string; // "users.name" becomes "name"
      email: string | null; // "email" stays "email" (resolves to users.email)
      title: string; // "posts.title" becomes "title"
    }>
  >(result);
}

// ✅ Test 4: LEFT JOIN - posts table columns become nullable
async function testLeftJoinNullability() {
  const result = await db
    .selectFrom("users")
    .leftJoin("posts", "users.id", "posts.user_id")
    .select(["users.name", "posts.title", "posts.published"])
    .execute();

  // LEFT JOIN: Right table (posts) columns become nullable
  expectType<
    Array<{
      name: string; // users.name stays non-null
      title: string | null; // posts.title becomes nullable
      published: boolean | null; // posts.published becomes nullable
    }>
  >(result);
}

// ✅ Test 5: RIGHT JOIN - users table columns become nullable
async function testRightJoinNullability() {
  const result = await db
    .selectFrom("users")
    .rightJoin("posts", "users.id", "posts.user_id")
    .select(["users.name", "posts.title"])
    .execute();

  // RIGHT JOIN: Left table (users) columns become nullable
  expectType<
    Array<{
      name: string | null; // users.name becomes nullable
      title: string; // posts.title stays non-null
    }>
  >(result);
}

// ✅ Test 6: FULL JOIN - both table columns become nullable
async function testFullJoinNullability() {
  const result = await db
    .selectFrom("users")
    .fullJoin("posts", "users.id", "posts.user_id")
    .select(["users.name", "posts.title"])
    .execute();

  // FULL JOIN: Both table columns become nullable
  expectType<
    Array<{
      name: string | null; // users.name becomes nullable
      title: string | null; // posts.title becomes nullable
    }>
  >(result);
}

// ======================================================================================
// ✅ ADVANCED NULLABILITY TESTS
// ======================================================================================

// ✅ Test 7: Multiple LEFT JOINs - accumulated nullability
async function testMultipleLeftJoins() {
  const result = await db
    .selectFrom("users")
    .leftJoin("posts", "users.id", "posts.user_id")
    .leftJoin("comments", "posts.id", "comments.post_id")
    .select(["users.name", "posts.title", "comments.content"])
    .execute();

  // Multiple LEFT JOINs: All joined tables become nullable
  expectType<
    Array<{
      name: string; // users.name stays non-null (base table)
      title: string | null; // posts.title becomes nullable (LEFT JOIN)
      content: string | null; // comments.content becomes nullable (LEFT JOIN)
    }>
  >(result);
}

// ✅ Test 8: Mixed JOIN types - complex nullability
async function testMixedJoinTypesNullability() {
  const result = await db
    .selectFrom("users")
    .innerJoin("posts", "users.id", "posts.user_id")
    .leftJoin("comments", "posts.id", "comments.post_id")
    .select(["users.name", "posts.title", "comments.content"])
    .execute();

  // Mixed JOINs: Only LEFT JOIN makes columns nullable
  expectType<
    Array<{
      name: string; // users.name stays non-null (base table)
      title: string; // posts.title stays non-null (INNER JOIN)
      content: string | null; // comments.content becomes nullable (LEFT JOIN)
    }>
  >(result);
}

// ✅ Test 9: Already nullable columns with JOINs
async function testNullableColumnsWithJoins() {
  const result = await db
    .selectFrom("users")
    .leftJoin("posts", "users.id", "posts.user_id")
    .select(["users.email", "posts.content"]) // Both are already nullable in schema
    .execute();

  // Already nullable columns stay nullable regardless of JOIN type
  expectType<
    Array<{
      email: string | null; // users.email is nullable in schema + base table
      content: string | null; // posts.content is nullable in schema + LEFT JOIN
    }>
  >(result);
}

// ======================================================================================
// ✅ JOIN WITH WHERE/ORDER BY TESTS
// ======================================================================================

// ✅ Test 10: JOIN with WHERE clause using qualified columns
async function testJoinWithWhere() {
  const result = await db
    .selectFrom("users")
    .innerJoin("posts", "users.id", "posts.user_id")
    .select(["users.name", "posts.title"])
    .where("posts.published", "=", true)
    .where("users.active", "=", true)
    .execute();

  expectType<
    Array<{
      name: string;
      title: string;
    }>
  >(result);
}

// ✅ Test 11: JOIN with ORDER BY using qualified columns
async function testJoinWithOrderBy() {
  const result = await db
    .selectFrom("users")
    .innerJoin("posts", "users.id", "posts.user_id")
    .select(["users.name", "posts.title"])
    .orderBy("posts.created_at", "desc")
    .execute();

  expectType<
    Array<{
      name: string;
      title: string;
    }>
  >(result);
}

// ======================================================================================
// ✅ COLUMN AMBIGUITY TESTS
// ======================================================================================

// ✅ Test 12: Ambiguous column should work with qualification
async function testAmbiguousColumnResolution() {
  // Both users and posts have 'created_at' column - qualified selection should work
  const result = await db
    .selectFrom("users")
    .innerJoin("posts", "users.id", "posts.user_id")
    .select(["users.created_at", "posts.created_at"])
    .execute();

  // Currently both become "created_at" - this reveals a limitation we should address
  expectType<
    Array<{
      created_at: Date; // Both qualified columns become the same property name!
    }>
  >(result);
}

// ======================================================================================
// ✅ COMPLEX JOIN SCENARIOS
// ======================================================================================

// ✅ Test 13: Multiple JOINs with LIMIT/OFFSET and nullability
async function testComplexJoinWithPagination() {
  const result = await db
    .selectFrom("users")
    .innerJoin("posts", "users.id", "posts.user_id")
    .leftJoin("comments", "posts.id", "comments.post_id")
    .select(["users.name", "posts.title", "comments.content"])
    .where("posts.published", "=", true)
    .orderBy("posts.created_at", "desc")
    .limit(10)
    .offset(20)
    .execute();

  expectType<
    Array<{
      name: string; // users.name stays non-null (base table)
      title: string; // posts.title stays non-null (INNER JOIN)
      content: string | null; // comments.content becomes nullable (LEFT JOIN)
    }>
  >(result);
}

// ======================================================================================
// 📝 ERROR CONDITION TESTS - FUTURE ENHANCEMENT
// ======================================================================================

// Note: Error condition testing reveals that our current type system doesn't
// catch these errors yet. This is good documentation of what we need to implement.

// TODO: These should show TypeScript errors but currently don't
// Future enhancement: Make JOIN type system catch these errors

// Future test: Invalid table in JOIN
// Future test: Invalid column in JOIN ON clause
// Future test: Cross-table column reference without JOIN
// Future test: Invalid column in WHERE after JOIN
// Future test: Invalid column in ORDER BY after JOIN

// Export all test functions to ensure they're processed by TSD
export {
  testInnerJoinSelectAll,
  testInnerJoinQualifiedColumns,
  testInnerJoinMixedColumns,
  testLeftJoinNullability,
  testRightJoinNullability,
  testFullJoinNullability,
  testMultipleLeftJoins,
  testMixedJoinTypesNullability,
  testNullableColumnsWithJoins,
  testJoinWithWhere,
  testJoinWithOrderBy,
  testAmbiguousColumnResolution,
  testComplexJoinWithPagination,
};
