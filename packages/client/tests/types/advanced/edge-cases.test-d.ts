// TSD Type Tests for Edge Cases
// These tests verify that ZenQ handles edge cases and boundary conditions correctly

import { expectType, expectError } from "tsd";
import { createTestDatabase } from "../../utils/test-config";
import type { Database } from "../../utils/test-types";

const db = createTestDatabase();

// ======================================================================================
// 🔥 A. DATABASE SCHEMA EDGE CASES
// ======================================================================================

// ===== A1. Reserved Keywords as Column Names =====

// First, let's test our existing database schema to see if we have any reserved keywords
async function testExistingReservedKeywords() {
  // Test if we can handle columns that might conflict with SQL keywords
  const result = await db
    .selectFrom("users")
    .select(["id", "name", "email", "active"]) // These should all be safe
    .execute();

  expectType<
    Array<{
      id: number;
      name: string;
      email: string | null;
      active: boolean;
    }>
  >(result);
}

// ===== A2. Special Characters in Column Names =====

async function testSnakeCaseColumns() {
  // Test snake_case columns (created_at, user_id)
  const result = await db
    .selectFrom("posts")
    .select(["created_at", "user_id"])
    .execute();

  expectType<
    Array<{
      created_at: Date;
      user_id: number;
    }>
  >(result);
}

async function testMixedColumnNameStyles() {
  // Test mixing different column name styles
  const result = await db
    .selectFrom("posts")
    .select(["id", "user_id", "title", "created_at"])
    .execute();

  expectType<
    Array<{
      id: number;
      user_id: number;
      title: string;
      created_at: Date;
    }>
  >(result);
}

// ===== A3. Tables with Only Nullable Columns =====

// Let's test scenarios where many columns are nullable
async function testMostlyNullableColumns() {
  const result = await db
    .selectFrom("users")
    .select(["email"]) // email is nullable in our schema
    .execute();

  expectType<Array<{ email: string | null }>>(result);
}

async function testMixedNullableColumns() {
  const result = await db
    .selectFrom("posts")
    .select(["title", "content"]) // content is nullable, title is not
    .execute();

  expectType<
    Array<{
      title: string;
      content: string | null;
    }>
  >(result);
}

// ======================================================================================
// 🔥 B. QUERY CONSTRUCTION EDGE CASES
// ======================================================================================

// ===== B1. Selecting Same Column Multiple Times =====

async function testSelectingSameColumnMultipleTimes() {
  // This is an interesting edge case - what happens if we select the same column twice?
  const result = await db
    .selectFrom("users")
    .select(["name", "name"]) // Duplicate column
    .execute();

  // Should still resolve to a single property
  expectType<Array<{ name: string }>>(result);
}

async function testSelectingSameQualifiedColumn() {
  const result = await db
    .selectFrom("users")
    .innerJoin("posts", "users.id", "posts.user_id")
    .select(["users.name", "users.name"]) // Same qualified column twice
    .execute();

  expectType<Array<{ name: string }>>(result);
}

// ===== B2. Boundary Conditions for LIMIT/OFFSET =====

async function testLimitZero() {
  const result = await db
    .selectFrom("users")
    .select(["id", "name"])
    .limit(0)
    .execute();

  expectType<Array<{ id: number; name: string }>>(result);
}

async function testOffsetZero() {
  const result = await db
    .selectFrom("users")
    .select(["id", "name"])
    .offset(0)
    .execute();

  expectType<Array<{ id: number; name: string }>>(result);
}

async function testLargeNumbers() {
  const result = await db
    .selectFrom("users")
    .select(["id", "name"])
    .limit(999999)
    .offset(888888)
    .execute();

  expectType<Array<{ id: number; name: string }>>(result);
}

// ===== B3. Complex ORDER BY Scenarios =====

async function testComplexOrderBy() {
  const result = await db
    .selectFrom("users")
    .select(["id", "name", "created_at"])
    .orderBy([
      { column: "name", direction: "asc" },
      { column: "created_at", direction: "desc" },
      { column: "id", direction: "asc" },
    ])
    .execute();

  expectType<
    Array<{
      id: number;
      name: string;
      created_at: Date;
    }>
  >(result);
}

async function testOrderByNullableColumns() {
  const result = await db
    .selectFrom("users")
    .select(["name", "email"])
    .orderBy("email", "desc") // email is nullable
    .execute();

  expectType<Array<{ name: string; email: string | null }>>(result);
}

// ===== B4. Complex WHERE Conditions =====

async function testDeeplyNestedWhereConditions() {
  // Test multiple WHERE conditions (they get ANDed together)
  const result = await db
    .selectFrom("users")
    .select(["id", "name"])
    .where("active", "=", true)
    .where("email", "is not", null)
    .where("id", ">", 0)
    .execute();

  expectType<Array<{ id: number; name: string }>>(result);
}

async function testWhereWithDifferentOperators() {
  const result = await db
    .selectFrom("posts")
    .select(["id", "title"])
    .where("published", "=", true)
    .where("title", "like", "%test%")
    .where("id", "in", [1, 2, 3])
    .execute();

  expectType<Array<{ id: number; title: string }>>(result);
}

// ======================================================================================
// 🔥 C. TYPE SYSTEM STRESS TESTING
// ======================================================================================

// ===== C1. Large Number of Columns =====

async function testSelectingManyColumns() {
  // Test selecting all columns from users (should be manageable)
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

// ===== C2. Large Number of JOINs =====

async function testMultipleJoins() {
  // Test joining all three tables we have
  const result = await db
    .selectFrom("users")
    .innerJoin("posts", "users.id", "posts.user_id")
    .innerJoin("comments", "posts.id", "comments.post_id")
    .select(["users.name", "posts.title", "comments.content"])
    .execute();

  expectType<
    Array<{
      name: string;
      title: string;
      content: string;
    }>
  >(result);
}

async function testMixedJoinsWithManyColumns() {
  // Test mixed JOIN types with multiple columns
  const result = await db
    .selectFrom("users")
    .leftJoin("posts", "users.id", "posts.user_id")
    .leftJoin("comments", "posts.id", "comments.post_id")
    .select([
      "users.id",
      "users.name",
      "users.email",
      "posts.title",
      "posts.content",
      "comments.content",
    ])
    .execute();

  expectType<
    Array<{
      id: number;
      name: string;
      email: string | null;
      title: string | null; // nullable due to LEFT JOIN
      content: string | null; // posts.content is nullable + LEFT JOIN, comments.content is non-null + LEFT JOIN
    }>
  >(result);
}

// ===== C3. Data Type Coverage =====

async function testAllBasicDataTypes() {
  // Test our current data types
  const result = await db
    .selectFrom("users")
    .select(["id", "name", "email", "active", "created_at"])
    .execute();

  expectType<
    Array<{
      id: number; // integer
      name: string; // varchar/text
      email: string | null; // nullable varchar
      active: boolean; // boolean
      created_at: Date; // timestamp
    }>
  >(result);
}

// ======================================================================================
// 🔥 D. EDGE CASE ERROR CONDITIONS
// ======================================================================================

// ===== D1. Empty Selections =====

// NOTE: Currently our type system allows empty arrays - this could be improved
// TODO: Add constraint to prevent select([])
async function testEmptySelections() {
  // Currently this works but probably shouldn't - found edge case to fix later!
  const result = await db.selectFrom("users").select([]).execute();

  // This currently returns empty object type
  expectType<{}[]>(result);
}

// ===== D2. Invalid Method Chaining =====

async function testMethodChainingEdgeCases() {
  // Test that we can chain methods in different orders
  const result1 = await db
    .selectFrom("users")
    .where("active", "=", true)
    .select(["name"])
    .orderBy("name", "asc")
    .limit(5)
    .execute();

  const result2 = await db
    .selectFrom("users")
    .orderBy("name", "asc")
    .where("active", "=", true)
    .limit(5)
    .select(["name"])
    .execute();

  // Both should work and have the same type
  expectType<Array<{ name: string }>>(result1);
  expectType<Array<{ name: string }>>(result2);
}

// Export all test functions
export {
  testExistingReservedKeywords,
  testSnakeCaseColumns,
  testMixedColumnNameStyles,
  testMostlyNullableColumns,
  testMixedNullableColumns,
  testSelectingSameColumnMultipleTimes,
  testSelectingSameQualifiedColumn,
  testLimitZero,
  testOffsetZero,
  testLargeNumbers,
  testComplexOrderBy,
  testOrderByNullableColumns,
  testDeeplyNestedWhereConditions,
  testWhereWithDifferentOperators,
  testSelectingManyColumns,
  testMultipleJoins,
  testMixedJoinsWithManyColumns,
  testAllBasicDataTypes,
  testEmptySelections,
  testMethodChainingEdgeCases,
};
