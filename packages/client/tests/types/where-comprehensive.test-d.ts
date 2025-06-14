// Comprehensive WHERE Method Type Safety Tests
// Tests all WHERE operators, edge cases, and type safety scenarios

import { expectType, expectError } from "tsd";
import { createTestDatabase } from "../utils/test-types";
import type { Database } from "../utils/test-types";

const db = createTestDatabase();

// =============================================================================
// ✅ COMPREHENSIVE OPERATOR COVERAGE
// =============================================================================

// Test 1: All comparison operators with correct types
async function testAllComparisonOperators() {
  // Equality operators
  const eq = await db.selectFrom("users").where("id", "=", 1).execute();
  const neq1 = await db.selectFrom("users").where("id", "!=", 1).execute();
  const neq2 = await db.selectFrom("users").where("id", "<>", 1).execute();

  // Comparison operators
  const gt = await db.selectFrom("users").where("id", ">", 1).execute();
  const gte = await db.selectFrom("users").where("id", ">=", 1).execute();
  const lt = await db.selectFrom("users").where("id", "<", 100).execute();
  const lte = await db.selectFrom("users").where("id", "<=", 100).execute();

  // String operators
  const like = await db
    .selectFrom("users")
    .where("name", "like", "John%")
    .execute();
  const notLike = await db
    .selectFrom("users")
    .where("name", "not like", "Jane%")
    .execute();
  const ilike = await db
    .selectFrom("users")
    .where("name", "ilike", "JOHN%")
    .execute();
  const notIlike = await db
    .selectFrom("users")
    .where("name", "not ilike", "JANE%")
    .execute();

  // Array operators
  const inOp = await db
    .selectFrom("users")
    .where("id", "in", [1, 2, 3])
    .execute();
  const notInOp = await db
    .selectFrom("users")
    .where("id", "not in", [4, 5, 6])
    .execute();

  // Null operators
  const isNull = await db
    .selectFrom("users")
    .where("email", "is", null)
    .execute();
  const isNotNull = await db
    .selectFrom("users")
    .where("email", "is not", null)
    .execute();

  // All should return the same type
  expectType<typeof eq>(neq1);
  expectType<typeof eq>(neq2);
  expectType<typeof eq>(gt);
  expectType<typeof eq>(gte);
  expectType<typeof eq>(lt);
  expectType<typeof eq>(lte);
  expectType<typeof eq>(like);
  expectType<typeof eq>(notLike);
  expectType<typeof eq>(ilike);
  expectType<typeof eq>(notIlike);
  expectType<typeof eq>(inOp);
  expectType<typeof eq>(notInOp);
  expectType<typeof eq>(isNull);
  expectType<typeof eq>(isNotNull);
}

// Test 2: Type-specific operator restrictions
async function testTypeSpecificOperators() {
  // Boolean columns - should only allow equality operators
  const boolEq = await db
    .selectFrom("users")
    .where("active", "=", true)
    .execute();
  const boolNeq = await db
    .selectFrom("users")
    .where("active", "!=", false)
    .execute();

  expectType<typeof boolEq>(boolNeq);

  // Date columns - should accept both Date objects and strings
  const dateObj = await db
    .selectFrom("users")
    .where("created_at", ">", new Date())
    .execute();
  const dateStr = await db
    .selectFrom("users")
    .where("created_at", ">", "2023-01-01")
    .execute();

  expectType<typeof dateObj>(dateStr);
}

// =============================================================================
// ❌ TYPE SAFETY ERROR CASES
// =============================================================================

// Test 3: Invalid operator-type combinations
function testInvalidOperatorTypeCombinations() {
  // Boolean columns cannot use comparison operators
  expectError(
    db.selectFrom("users").where("active", ">", true) // boolean > boolean ❌
  );

  expectError(
    db.selectFrom("users").where("active", ">=", true) // boolean >= boolean ❌
  );

  expectError(
    db.selectFrom("users").where("active", "<", false) // boolean < boolean ❌
  );

  expectError(
    db.selectFrom("users").where("active", "<=", false) // boolean <= boolean ❌
  );

  // String columns cannot use LIKE with non-strings
  expectError(
    db.selectFrom("users").where("name", "like", 123) // string LIKE number ❌
  );

  expectError(
    db.selectFrom("users").where("name", "like", true) // string LIKE boolean ❌
  );

  expectError(
    db.selectFrom("users").where("name", "like", null) // string LIKE null ❌
  );

  // Non-string columns cannot use LIKE
  expectError(
    db.selectFrom("users").where("id", "like", "123") // number LIKE string ❌
  );

  expectError(
    db.selectFrom("users").where("active", "like", "true") // boolean LIKE string ❌
  );
}

// Test 4: Invalid null handling
function testInvalidNullHandling() {
  // Cannot use null with equality/comparison operators
  expectError(
    db.selectFrom("users").where("email", "=", null) // Use IS instead ❌
  );

  expectError(
    db.selectFrom("users").where("email", "!=", null) // Use IS NOT instead ❌
  );

  expectError(
    db.selectFrom("users").where("email", "<>", null) // Use IS NOT instead ❌
  );

  expectError(
    db.selectFrom("users").where("id", ">", null) // Cannot compare null ❌
  );

  expectError(
    db.selectFrom("users").where("id", ">=", null) // Cannot compare null ❌
  );

  expectError(
    db.selectFrom("users").where("id", "<", null) // Cannot compare null ❌
  );

  expectError(
    db.selectFrom("users").where("id", "<=", null) // Cannot compare null ❌
  );

  // Cannot use string literals like "null" with IS
  expectError(
    db.selectFrom("users").where("email", "is", "null") // Use null, not "null" ❌
  );

  expectError(
    db.selectFrom("users").where("email", "is", "not_null") // Use null or value ❌
  );
}

// Test 5: Invalid array operations
function testInvalidArrayOperations() {
  // IN/NOT IN require arrays
  expectError(
    db.selectFrom("users").where("id", "in", 123) // IN requires array ❌
  );

  expectError(
    db.selectFrom("users").where("name", "not in", "John") // NOT IN requires array ❌
  );

  // Array elements must match column type
  expectError(
    db.selectFrom("users").where("id", "in", [1, "2", 3]) // Mixed types in array ❌
  );

  expectError(
    db.selectFrom("users").where("name", "in", ["John", 42, "Jane"]) // Mixed types ❌
  );

  expectError(
    db.selectFrom("users").where("active", "in", [true, "false"]) // Mixed types ❌
  );

  // Wrong array type for column
  expectError(
    db.selectFrom("users").where("id", "in", ["1", "2", "3"]) // string[] for number column ❌
  );

  expectError(
    db.selectFrom("users").where("name", "in", [1, 2, 3]) // number[] for string column ❌
  );

  expectError(
    db.selectFrom("users").where("active", "in", ["true", "false"]) // string[] for boolean column ❌
  );
}

// Test 6: Invalid column references
function testInvalidColumnReferences() {
  // Non-existent columns
  expectError(
    db.selectFrom("users").where("nonexistent_column", "=", "value") // Column doesn't exist ❌
  );

  expectError(
    db.selectFrom("users").where("fake_id", ">", 123) // Column doesn't exist ❌
  );

  // Columns from wrong table
  expectError(
    db.selectFrom("users").where("title", "=", "Post Title") // title is from posts ❌
  );

  expectError(
    db.selectFrom("posts").where("email", "like", "%@example.com") // email is from users ❌
  );

  // Typos in column names
  expectError(
    db.selectFrom("users").where("naem", "=", "John") // typo for "name" ❌
  );

  expectError(
    db.selectFrom("posts").where("titel", "like", "%test%") // typo for "title" ❌
  );
}

// =============================================================================
// ✅ ADVANCED WHERE SCENARIOS
// =============================================================================

// Test 7: Complex chaining scenarios
async function testComplexChaining() {
  // Multiple WHERE conditions
  const multiWhere = await db
    .selectFrom("users")
    .where("active", "=", true)
    .where("email", "is not", null)
    .where("name", "like", "J%")
    .where("id", ">", 0)
    .execute();

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
  >(multiWhere);

  // Mixed with other clauses
  const complex = await db
    .selectFrom("users")
    .select(["id", "name", "email"])
    .where("active", "=", true)
    .where("created_at", ">", "2023-01-01")
    .orderBy("name", "asc")
    .limit(10)
    .execute();

  expectType<
    Array<{
      id: number;
      name: string;
      email: string | null;
    }>
  >(complex);
}

// Test 8: WHERE with different table contexts
async function testDifferentTableContexts() {
  // Users table
  const users = await db
    .selectFrom("users")
    .where("active", "=", true)
    .where("email", "is not", null)
    .execute();

  // Posts table
  const posts = await db
    .selectFrom("posts")
    .where("published", "=", true)
    .where("content", "is not", null)
    .execute();

  // Comments table
  const comments = await db
    .selectFrom("comments")
    .where("user_id", ">", 0)
    .where("content", "like", "%great%")
    .execute();

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
  >(posts);

  expectType<
    Array<{
      id: number;
      post_id: number;
      user_id: number;
      content: string;
      created_at: Date;
    }>
  >(comments);
}

// Test 9: WHERE with nullable vs non-nullable columns
async function testNullableVsNonNullable() {
  // Nullable column (email)
  const nullableTests = await db
    .selectFrom("users")
    .where("email", "is", null) // ✅ OK
    .execute();

  const nullableTests2 = await db
    .selectFrom("users")
    .where("email", "is not", null) // ✅ OK
    .execute();

  const nullableTests3 = await db
    .selectFrom("users")
    .where("email", "=", "test@example.com") // ✅ OK
    .execute();

  // Non-nullable column (name) - can still use IS with actual values
  const nonNullableTests = await db
    .selectFrom("users")
    .where("name", "is", "John") // ✅ OK - IS with actual value
    .execute();

  const nonNullableTests2 = await db
    .selectFrom("users")
    .where("name", "is not", "Jane") // ✅ OK - IS NOT with actual value
    .execute();

  expectType<typeof nullableTests>(nullableTests2);
  expectType<typeof nullableTests>(nullableTests3);
  expectType<typeof nullableTests>(nonNullableTests);
  expectType<typeof nullableTests>(nonNullableTests2);
}

// Test 10: Edge cases with empty arrays and special values
async function testEdgeCases() {
  // Empty arrays (should be allowed but might return no results)
  const emptyArray = await db
    .selectFrom("users")
    .where("id", "in", [] as number[])
    .execute();

  // Single element arrays
  const singleElement = await db
    .selectFrom("users")
    .where("id", "in", [1])
    .execute();

  // Large arrays
  const largeArray = await db
    .selectFrom("users")
    .where("id", "in", [1, 2, 3, 4, 5, 6, 7, 8, 9, 10])
    .execute();

  expectType<typeof emptyArray>(singleElement);
  expectType<typeof emptyArray>(largeArray);
}

// =============================================================================
// ✅ EXPRESSION BUILDER COMPREHENSIVE TESTS
// =============================================================================

// Test 11: Expression builder with all operators
async function testExpressionBuilderComprehensive() {
  const result = await db
    .selectFrom("users")
    .where(({ eb, and, or, not }) =>
      and([
        // Basic comparisons
        eb("id", ">", 0),
        eb("active", "=", true),
        eb("name", "!=", ""),

        // String operations
        eb("name", "like", "J%"),
        eb("email", "not like", "%spam%"),

        // Array operations
        eb("id", "in", [1, 2, 3, 4, 5]),
        eb("name", "not in", ["banned1", "banned2"]),

        // Null operations
        eb("email", "is not", null),

        // Nested logical operations
        or([
          eb("created_at", ">", "2023-01-01"),
          and([eb("id", "<", 1000), eb("name", "ilike", "%admin%")]),
        ]),

        // NOT operations
        not(eb("active", "=", false)),
      ])
    )
    .execute();

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

// Test 12: Expression builder error cases
function testExpressionBuilderErrors() {
  // Same error cases as regular WHERE but in expression builder
  expectError(
    db.selectFrom("users").where(({ eb }) => eb("active", ">", true)) // boolean comparison ❌
  );

  expectError(
    db.selectFrom("users").where(({ eb }) => eb("email", "=", null)) // use IS ❌
  );

  expectError(
    db.selectFrom("users").where(({ eb }) => eb("id", "in", 123)) // IN needs array ❌
  );

  expectError(
    db.selectFrom("users").where(({ eb }) => eb("nonexistent", "=", "value")) // bad column ❌
  );
}

// Export all test functions
export {
  testAllComparisonOperators,
  testTypeSpecificOperators,
  testInvalidOperatorTypeCombinations,
  testInvalidNullHandling,
  testInvalidArrayOperations,
  testInvalidColumnReferences,
  testComplexChaining,
  testDifferentTableContexts,
  testNullableVsNonNullable,
  testEdgeCases,
  testExpressionBuilderComprehensive,
  testExpressionBuilderErrors,
};
