// TSD Type Tests for Basic Single Table Operations (Positive Cases)
// These tests verify that our type system correctly infers return types

import { expectType } from "tsd";
import { createTestDatabase } from "../utils/test-types";
import type { Database } from "../utils/test-types";

const db = createTestDatabase();

// ✅ Test 1: selectAll() returns expanded types instead of raw table types
async function testSelectAll() {
  const result = await db.selectFrom("users").selectAll().execute();

  // Should return expanded object type, NOT UserTable[]
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
    }>
  >(result);
}

// ✅ Test 2: Single column selection with string literal
async function testSingleColumn() {
  const result = await db.selectFrom("users").select("name").execute();

  expectType<Array<{ name: string }>>(result);
}

// ✅ Test 3: Multiple column selection with array
async function testMultipleColumns() {
  const result = await db.selectFrom("users").select(["id", "name"]).execute();

  expectType<Array<{ id: number; name: string }>>(result);
}

// ✅ Test 4: Mixed column types with nullable fields
async function testMixedColumnTypes() {
  const result = await db
    .selectFrom("users")
    .select(["id", "email", "active"])
    .execute();

  expectType<
    Array<{
      id: number;
      email: string | null;
      active: boolean;
    }>
  >(result);
}

// ✅ Test 5: All columns with different types
async function testAllColumnTypes() {
  const result = await db
    .selectFrom("users")
    .select(["id", "name", "email", "active", "created_at"])
    .execute();

  expectType<
    Array<{
      id: number;
      name: string;
      email: string | null;
      active: boolean;
      created_at: Date;
    }>
  >(result);
}

// ✅ Test 6: Different table types (Posts)
async function testPostsTable() {
  const result = await db.selectFrom("posts").selectAll().execute();

  expectType<
    Array<{
      id: number;
      user_id: number;
      title: string;
      content: string | null;
      published: boolean;
      created_at: Date;
      categories: string[];
      ratings: number[];
    }>
  >(result);
}

// ✅ Test 7: Posts with specific columns
async function testPostsColumns() {
  const result = await db
    .selectFrom("posts")
    .select(["id", "title", "published"])
    .execute();

  expectType<
    Array<{
      id: number;
      title: string;
      published: boolean;
    }>
  >(result);
}

// ✅ Test 8: Comments table
async function testCommentsTable() {
  const result = await db.selectFrom("comments").selectAll().execute();

  expectType<
    Array<{
      id: number;
      post_id: number;
      user_id: number;
      content: string;
      created_at: Date;
    }>
  >(result);
}

// ✅ Test 9: Single column from different tables
async function testSingleColumnsFromDifferentTables() {
  const userNames = await db.selectFrom("users").select("name").execute();
  const postTitles = await db.selectFrom("posts").select("title").execute();
  const commentContent = await db
    .selectFrom("comments")
    .select("content")
    .execute();

  expectType<Array<{ name: string }>>(userNames);
  expectType<Array<{ title: string }>>(postTitles);
  expectType<Array<{ content: string }>>(commentContent);
}

// ✅ Test 10: Chain with WHERE clause (types should remain correct)
async function testWithWhereClause() {
  const result = await db
    .selectFrom("users")
    .select(["id", "name"])
    .where("active", "=", true)
    .execute();

  expectType<Array<{ id: number; name: string }>>(result);
}

// ✅ Test 11: Chain with ORDER BY clause (types should remain correct)
async function testWithOrderBy() {
  const result = await db
    .selectFrom("users")
    .select(["name", "created_at"])
    .orderBy("created_at", "desc")
    .execute();

  expectType<Array<{ name: string; created_at: Date }>>(result);
}

// ✅ Test 12: Chain with LIMIT and OFFSET (types should remain correct)
async function testWithLimitAndOffset() {
  const result = await db
    .selectFrom("posts")
    .select(["title", "published"])
    .limit(10)
    .offset(5)
    .execute();

  expectType<Array<{ title: string; published: boolean }>>(result);
}

// ✅ Test 13: Complex chaining maintains types
async function testComplexChaining() {
  const result = await db
    .selectFrom("users")
    .select(["id", "name", "email"])
    .where("active", "=", true)
    .orderBy("name", "asc")
    .limit(50)
    .execute();

  expectType<
    Array<{
      id: number;
      name: string;
      email: string | null;
    }>
  >(result);
}

// Export all test functions to ensure they're processed by TSD
export {
  testSelectAll,
  testSingleColumn,
  testMultipleColumns,
  testMixedColumnTypes,
  testAllColumnTypes,
  testPostsTable,
  testPostsColumns,
  testCommentsTable,
  testSingleColumnsFromDifferentTables,
  testWithWhereClause,
  testWithOrderBy,
  testWithLimitAndOffset,
  testComplexChaining,
};
