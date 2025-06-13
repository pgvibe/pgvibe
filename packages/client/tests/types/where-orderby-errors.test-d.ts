// TSD Type Tests for WHERE and ORDER BY Error Conditions
// These tests verify that our type system properly validates query clauses

import { expectError, expectType } from "tsd";
import { createTestDatabase } from "../utils/test-types";

const db = createTestDatabase();

// ❌ Test 1: WHERE clause column validation
async function testWhereColumnErrors() {
  // Non-existent column in WHERE
  expectError(
    db
      .selectFrom("users")
      .selectAll()
      .where("nonexistent_column", "=", "value")
      .execute()
  );

  // Column from wrong table in WHERE
  expectError(
    db
      .selectFrom("users")
      .selectAll()
      .where("title", "=", "some title") // title is from posts table
      .execute()
  );

  // Typo in column name in WHERE
  expectError(
    db
      .selectFrom("users")
      .selectAll()
      .where("naem", "=", "john") // typo for "name"
      .execute()
  );
}

// ❌ Test 2: ORDER BY column validation
async function testOrderByColumnErrors() {
  // Non-existent column in ORDER BY
  expectError(
    db
      .selectFrom("users")
      .selectAll()
      .orderBy("nonexistent_column", "asc")
      .execute()
  );

  // Column from wrong table in ORDER BY
  expectError(
    db
      .selectFrom("users")
      .selectAll()
      .orderBy("title", "asc") // title is from posts table
      .execute()
  );

  // Typo in column name in ORDER BY
  expectError(
    db
      .selectFrom("posts")
      .selectAll()
      .orderBy("titel", "desc") // typo for "title"
      .execute()
  );
}

// ❌ Test 3: Complex WHERE chains with errors
async function testComplexWhereErrors() {
  // Multiple WHERE conditions with one invalid column
  expectError(
    db
      .selectFrom("users")
      .selectAll()
      .where("active", "=", true)
      .where("nonexistent_field", "=", "value") // This should fail
      .execute()
  );

  // Mix of valid and invalid columns in chained WHERE
  expectError(
    db
      .selectFrom("posts")
      .selectAll()
      .where("published", "=", true)
      .where("invalid_column", "!=", null)
      .execute()
  );
}

// ❌ Test 4: Complex ORDER BY with errors
async function testComplexOrderByErrors() {
  // Valid SELECT with invalid ORDER BY
  expectError(
    db
      .selectFrom("users")
      .select(["id", "name"])
      .orderBy("nonexistent_column", "asc")
      .execute()
  );

  // ORDER BY column not from the selected table
  expectError(
    db
      .selectFrom("comments")
      .select(["id", "content"])
      .orderBy("title", "desc") // title is from posts
      .execute()
  );
}

// ❌ Test 5: Chaining SELECT, WHERE, and ORDER BY with errors
async function testChainedOperationErrors() {
  // Invalid column in SELECT, but valid WHERE and ORDER BY
  expectError(
    db
      .selectFrom("users")
      .select(["id", "invalid_column"])
      .where("active", "=", true)
      .orderBy("name", "asc")
      .execute()
  );

  // Valid SELECT, invalid WHERE
  expectError(
    db
      .selectFrom("users")
      .select(["id", "name"])
      .where("invalid_column", "=", "test")
      .orderBy("name", "asc")
      .execute()
  );

  // Valid SELECT and WHERE, invalid ORDER BY
  expectError(
    db
      .selectFrom("users")
      .select(["id", "name"])
      .where("active", "=", true)
      .orderBy("invalid_column", "asc")
      .execute()
  );
}

// ❌ Test 6: Cross-table confusion in WHERE and ORDER BY
async function testCrossTableConfusionInClauses() {
  // Using posts columns in users queries
  expectError(
    db
      .selectFrom("users")
      .select(["id", "name"])
      .where("published", "=", true) // published is from posts
      .execute()
  );

  expectError(
    db
      .selectFrom("users")
      .select(["id", "name"])
      .orderBy("content", "asc") // content is from posts
      .execute()
  );

  // Using users columns in posts queries
  expectError(
    db
      .selectFrom("posts")
      .select(["id", "title"])
      .where("active", "=", true) // active is from users
      .execute()
  );

  expectError(
    db
      .selectFrom("posts")
      .select(["id", "title"])
      .orderBy("email", "desc") // email is from users
      .execute()
  );
}

// ✅ Test 7: Verify VALID WHERE and ORDER BY operations work (positive controls)
async function testValidWhereOrderByOperations() {
  // Valid WHERE conditions
  const result1 = await db
    .selectFrom("users")
    .select(["id", "name", "email"])
    .where("active", "=", true)
    .execute();
  expectType<Array<{ id: number; name: string; email: string | null }>>(
    result1
  );

  // Valid ORDER BY
  const result2 = await db
    .selectFrom("posts")
    .select(["id", "title", "published"])
    .orderBy("created_at", "desc")
    .execute();
  expectType<Array<{ id: number; title: string; published: boolean }>>(result2);

  // Valid complex chaining
  const result3 = await db
    .selectFrom("users")
    .select(["id", "name"])
    .where("active", "=", true)
    .where("email", "!=", null)
    .orderBy("name", "asc")
    .limit(10)
    .execute();
  expectType<Array<{ id: number; name: string }>>(result3);

  // Multiple WHERE conditions (all valid)
  const result4 = await db
    .selectFrom("posts")
    .selectAll()
    .where("published", "=", true)
    .where("content", "!=", null)
    .orderBy("title", "asc")
    .execute();
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
  >(result4);
}

// Export all test functions
export {
  testWhereColumnErrors,
  testOrderByColumnErrors,
  testComplexWhereErrors,
  testComplexOrderByErrors,
  testChainedOperationErrors,
  testCrossTableConfusionInClauses,
  testValidWhereOrderByOperations,
};
