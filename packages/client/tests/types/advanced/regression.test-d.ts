// Regression Tests for Type System
// Consolidates regression tests and specific bug fixes across the type system

import { expectType, expectError, db } from "../utils/test-helpers.test-d.ts";
import type { Database } from "../utils/schemas.test-d.ts";

// =============================================================================
// REGRESSION TESTS - SPECIFIC BUG FIXES
// =============================================================================

// ✅ Regression: Ensure that the original problems are solved
async function testOriginalProblemsAreSolved() {
  // Test that we can perform basic operations without issues
  const users = await db.selectFrom("users").execute();
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
  >(users);

  // Test that method chaining works correctly
  const filteredUsers = await db
    .selectFrom("users")
    .select(["id", "name"])
    .where("active", "=", true)
    .orderBy("name", "asc")
    .limit(10)
    .execute();

  expectType<Array<{ id: number; name: string }>>(filteredUsers);
}

// ✅ Regression: Type system catches errors that should be caught
function testErrorsAreProperlyCaught() {
  // These should properly error - regression test for error detection
  expectError(db.selectFrom("users").select("nonexistent_column"));
  expectError(db.selectFrom("nonexistent_table").selectAll());
  expectError(db.selectFrom("users").where("nonexistent_column", "=", "value"));
  expectError(db.selectFrom("users").orderBy("nonexistent_column", "asc"));
}

// ✅ Regression: Complex query patterns work correctly
async function testComplexQueryPatternsWork() {
  // Test that complex patterns don't break the type system
  const complexResult = await db
    .selectFrom("users")
    .select(["id", "name", "email", "active"])
    .where("active", "=", true)
    .where("email", "is not", null)
    .where("id", "in", [1, 2, 3, 4, 5])
    .orderBy("name", "asc")
    .orderBy("id", "desc")
    .limit(20)
    .offset(10)
    .execute();

  expectType<
    Array<{
      id: number;
      name: string;
      email: string | null;
      active: boolean;
    }>
  >(complexResult);
}

// ✅ Regression: Different table operations work consistently
async function testConsistentTableOperations() {
  // Ensure all tables work consistently with the same operations
  const usersResult = await db
    .selectFrom("users")
    .select(["id", "name"])
    .where("active", "=", true)
    .execute();

  const postsResult = await db
    .selectFrom("posts")
    .select(["id", "title"])
    .where("published", "=", true)
    .execute();

  const commentsResult = await db
    .selectFrom("comments")
    .select(["id", "content"])
    .where("post_id", ">", 0)
    .execute();

  expectType<Array<{ id: number; name: string }>>(usersResult);
  expectType<Array<{ id: number; title: string }>>(postsResult);
  expectType<Array<{ id: number; content: string }>>(commentsResult);
}

// =============================================================================
// FUTURE REGRESSION PREVENTION
// =============================================================================

// Note: Add new regression tests here as bugs are discovered and fixed
// This ensures that previously fixed issues don't reoccur

export {
  testOriginalProblemsAreSolved,
  testErrorsAreProperlyCaught,
  testComplexQueryPatternsWork,
  testConsistentTableOperations,
};
