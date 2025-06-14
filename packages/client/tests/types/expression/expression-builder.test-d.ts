// TypeScript Declaration Tests for Expression Builder
// Tests for advanced WHERE clause type safety and compatibility

import { expectType, expectError } from "tsd";
import { createTestDatabase } from "../../utils/test-config";
import type { Database } from "../../utils/test-types";

const db = createTestDatabase();

// =============================================================================
// POSITIVE CASES: Expression Builder Type Safety
// =============================================================================

// ✅ Test 1: Basic WHERE clause type safety
async function testBasicWhereTypes() {
  const result = await db
    .selectFrom("users")
    .select(["id", "name", "email", "active"])
    .where("active", "=", true)
    .where("id", ">", 10)
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

// ✅ Test 2: Different column types work correctly
async function testColumnTypes() {
  const result = await db
    .selectFrom("users")
    .select(["id", "created_at", "active"])
    .where("id", "=", 42)
    .where("created_at", ">", new Date())
    .where("active", "=", true)
    .execute();

  expectType<
    Array<{
      id: number;
      created_at: Date;
      active: boolean;
    }>
  >(result);
}

// ✅ Test 3: String operators maintain type safety
async function testStringOperators() {
  const result = await db
    .selectFrom("users")
    .select(["name", "email"])
    .where("name", "like", "John%")
    .where("email", "like", "%@example.com")
    .execute();

  expectType<Array<{ name: string; email: string | null }>>(result);
}

// ✅ Test 4: Array operators (IN/NOT IN)
async function testArrayOperators() {
  const result = await db
    .selectFrom("users")
    .select(["id", "name"])
    .where("id", "in", [1, 2, 3])
    .where("name", "not in", ["admin", "system"])
    .execute();

  expectType<Array<{ id: number; name: string }>>(result);
}

// ✅ Test 5: NULL operators
async function testNullOperators() {
  const result = await db
    .selectFrom("users")
    .select(["email", "name"])
    .where("email", "is", null)
    .execute();

  expectType<Array<{ email: string | null; name: string }>>(result);

  const result2 = await db
    .selectFrom("users")
    .select(["email", "name"])
    .where("email", "is not", null)
    .execute();

  expectType<Array<{ email: string | null; name: string }>>(result2);
}

// ✅ Test 6: JOIN queries maintain type safety
async function testJoinTypes() {
  const result = await db
    .selectFrom("users")
    .innerJoin("posts", "users.id", "posts.user_id")
    .select(["users.name", "posts.title", "posts.published"])
    .where("users.active", "=", true)
    .where("posts.published", "=", true)
    .execute();

  expectType<
    Array<{
      name: string;
      title: string;
      published: boolean;
    }>
  >(result);
}

// ✅ Test 7: Complex multi-table JOIN
async function testComplexJoinTypes() {
  const result = await db
    .selectFrom("users")
    .innerJoin("posts", "users.id", "posts.user_id")
    .innerJoin("comments", "posts.id", "comments.post_id")
    .select(["users.name", "posts.title", "comments.content"])
    .where("users.active", "=", true)
    .where("posts.published", "=", true)
    .execute();

  expectType<
    Array<{
      name: string;
      title: string;
      content: string;
    }>
  >(result);
}

// ✅ Test 8: Mixed WHERE conditions with different operators
async function testMixedOperators() {
  const result = await db
    .selectFrom("posts")
    .select(["id", "title", "published", "created_at"])
    .where("published", "=", true)
    .where("id", ">", 5)
    .where("title", "like", "%typescript%")
    .where("created_at", ">=", new Date("2024-01-01"))
    .execute();

  expectType<
    Array<{
      id: number;
      title: string;
      published: boolean;
      created_at: Date;
    }>
  >(result);
}

// ✅ Test 9: Chaining multiple WHERE conditions
async function testWhereChaining() {
  const result = await db
    .selectFrom("users")
    .select(["id", "name", "email"])
    .where("active", "=", true)
    .where("email", "is not", null)
    .where("id", "in", [1, 2, 3, 4, 5])
    .where("name", "!=", "admin")
    .execute();

  expectType<
    Array<{
      id: number;
      name: string;
      email: string | null;
    }>
  >(result);
}

// ✅ Test 10: Type safety with nullable columns
async function testNullableColumns() {
  const result = await db
    .selectFrom("posts")
    .select(["id", "title", "content"])
    .where("content", "is not", null)
    .execute();

  expectType<
    Array<{
      id: number;
      title: string;
      content: string | null;
    }>
  >(result);
}

// ✅ Test 11: Date comparisons
async function testDateComparisons() {
  const result = await db
    .selectFrom("users")
    .select(["id", "name", "created_at"])
    .where("created_at", ">", new Date("2024-01-01"))
    .where("created_at", "<", new Date())
    .execute();

  expectType<
    Array<{
      id: number;
      name: string;
      created_at: Date;
    }>
  >(result);
}

// ✅ Test 12: Boolean comparisons
async function testBooleanComparisons() {
  const result = await db
    .selectFrom("posts")
    .select(["id", "title", "published"])
    .where("published", "=", true)
    .where("published", "!=", false)
    .execute();

  expectType<
    Array<{
      id: number;
      title: string;
      published: boolean;
    }>
  >(result);
}

// =============================================================================
// ERROR CASES: These should fail at compile time
// =============================================================================

// ❌ Test 13: Invalid column names (THESE ARE CAUGHT BY TYPESCRIPT)
function testInvalidColumnNames() {
  // Non-existent column
  expectError(
    db
      .selectFrom("users")
      .select(["id", "name"])
      .where("nonexistent_column", "=", "value")
  );

  // Column from wrong table context
  expectError(
    db
      .selectFrom("users")
      .select(["id", "name"])
      .where("title", "=", "some title")
  );

  // Typo in column name
  expectError(
    db.selectFrom("users").select(["id", "name"]).where("naem", "=", "john")
  );
}

// ❌ Test 14: JOIN context validation (THESE ARE CAUGHT BY TYPESCRIPT)
function testJoinContextErrors() {
  // Using column from table not in JOIN context
  expectError(
    db
      .selectFrom("users")
      .innerJoin("posts", "users.id", "posts.user_id")
      .select(["users.name", "posts.title"])
      .where("comments.content", "=", "test")
  );

  // Using qualified column without JOIN
  expectError(
    db.selectFrom("users").select(["name"]).where("posts.title", "=", "test")
  );
}

// NOTE: The following tests demonstrate areas where our type system could be improved
// Currently these do NOT fail at compile time but ideally should:

// ⚠️ TODO: Type mismatches (NOT YET CAUGHT - IMPROVEMENT NEEDED)
function testTypeMismatchesTodo() {
  // These currently compile but should ideally error:
  // - String value for number column: where("id", "=", "not_a_number")
  // - Number value for string column: where("name", "=", 42)
  // - Wrong types for Date columns: where("created_at", "=", "not_a_date")
  // - Array type mismatches: where("id", "in", [1, "2", 3])
  // - Null with comparison operators: where("email", "=", null)
  // These represent future enhancements to our type system
}

// =============================================================================
// VALUE TYPE ERROR CASES: These should fail at compile time
// =============================================================================

// ❌ Test: Value type mismatches in expression builder
function testExpressionBuilderValueTypeErrors() {
  // String value for number column (should error)
  expectError(
    db
      .selectFrom("users")
      .select(["name"])
      .where(({ eb }) => eb("id", "=", "not_a_number"))
  );

  // Number value for string column (should error)
  expectError(
    db
      .selectFrom("users")
      .select(["name"])
      .where(({ eb }) => eb("name", "=", 42))
  );

  // Boolean value for string column (should error)
  expectError(
    db
      .selectFrom("users")
      .select(["name"])
      .where(({ eb }) => eb("name", "=", true))
  );

  // String value for Date column (now allowed for ISO date strings)
  // Note: TypeScript cannot validate string format at compile time
  // This is now allowed to support ISO date strings like "2023-01-01"
  db.selectFrom("users")
    .select(["name"])
    .where(({ eb }) => eb("created_at", ">", "2023-01-01")); // ✅ ISO date string allowed

  // String value for boolean column (should error)
  expectError(
    db
      .selectFrom("users")
      .select(["name"])
      .where(({ eb }) => eb("active", "=", "not_boolean"))
  );
}

// ❌ Test: Null operator misuse in expression builder
function testExpressionBuilderNullOperatorErrors() {
  // Should use 'is' not '=' for null (should error)
  expectError(
    db
      .selectFrom("users")
      .select(["name"])
      .where(({ eb }) => eb("email", "=", null))
  );

  // Should use 'is not' not '!=' for null (should error)
  expectError(
    db
      .selectFrom("users")
      .select(["name"])
      .where(({ eb }) => eb("email", "!=", null))
  );

  // Should use 'is not' not '<>' for null (should error)
  expectError(
    db
      .selectFrom("users")
      .select(["name"])
      .where(({ eb }) => eb("email", "<>", null))
  );

  // Cannot LIKE null (should error)
  expectError(
    db
      .selectFrom("users")
      .select(["name"])
      .where(({ eb }) => eb("name", "like", null))
  );

  // Cannot compare null with > (should error)
  expectError(
    db
      .selectFrom("users")
      .select(["name"])
      .where(({ eb }) => eb("id", ">", null))
  );
}

// ❌ Test: Invalid 'is' operator values in expression builder
function testExpressionBuilderInvalidIsOperatorErrors() {
  // "not_null" is not a valid value for 'is' (should error)
  expectError(
    db
      .selectFrom("users")
      .select(["name"])
      .where(({ eb }) => eb("name", "is", "not_null"))
  );

  // "null" string is not the same as null value (should error)
  expectError(
    db
      .selectFrom("users")
      .select(["name"])
      .where(({ eb }) => eb("email", "is", "null"))
  );

  // Numbers cannot use 'is' with string values (should error)
  expectError(
    db
      .selectFrom("users")
      .select(["name"])
      .where(({ eb }) => eb("id", "is", "not_null"))
  );

  // 'is' should only accept null or the column type (should error)
  expectError(
    db
      .selectFrom("users")
      .select(["name"])
      .where(({ eb }) => eb("active", "is", "false"))
  );
}

// ❌ Test: Array type inconsistencies in expression builder
function testExpressionBuilderArrayTypeErrors() {
  // Mixed types in array for number column (should error)
  expectError(
    db
      .selectFrom("users")
      .select(["name"])
      .where(({ eb }) => eb("id", "in", [1, "2", 3]))
  );

  // Mixed types in array for string column (should error)
  expectError(
    db
      .selectFrom("users")
      .select(["name"])
      .where(({ eb }) => eb("name", "in", ["John", 42, "Jane"]))
  );

  // Wrong type array for boolean column (should error)
  expectError(
    db
      .selectFrom("users")
      .select(["name"])
      .where(({ eb }) => eb("active", "in", ["true", "false"]))
  );

  // Mixed null and string inappropriately (should error)
  expectError(
    db
      .selectFrom("users")
      .select(["name"])
      .where(({ eb }) => eb("name", "not in", [null, "test"]))
  );
}

// ❌ Test: LIKE/ILIKE operator type mismatches
function testExpressionBuilderLikeOperatorErrors() {
  // Cannot LIKE a number (should error)
  expectError(
    db
      .selectFrom("users")
      .select(["name"])
      .where(({ eb }) => eb("id", "like", "%123%"))
  );

  // Number column cannot use string LIKE pattern (should error)
  expectError(
    db
      .selectFrom("users")
      .select(["name"])
      .where(({ eb }) => eb("id", "ilike", "test%"))
  );

  // Boolean column cannot use LIKE (should error)
  expectError(
    db
      .selectFrom("users")
      .select(["name"])
      .where(({ eb }) => eb("active", "like", "%true%"))
  );

  // Date column needs proper date comparison (should error)
  expectError(
    db
      .selectFrom("users")
      .select(["name"])
      .where(({ eb }) => eb("created_at", "like", "2023%"))
  );
}

// ❌ Test: Comparison operator appropriateness
function testExpressionBuilderComparisonOperatorErrors() {
  // Boolean shouldn't use greater than (should error)
  expectError(
    db
      .selectFrom("users")
      .select(["name"])
      .where(({ eb }) => eb("active", ">", true))
  );

  // Boolean shouldn't use less than (should error)
  expectError(
    db
      .selectFrom("users")
      .select(["name"])
      .where(({ eb }) => eb("active", "<", false))
  );

  // String comparison with number (should error)
  expectError(
    db
      .selectFrom("users")
      .select(["name"])
      .where(({ eb }) => eb("name", ">", 50))
  );

  // Number comparison with string (should error)
  expectError(
    db
      .selectFrom("users")
      .select(["name"])
      .where(({ eb }) => eb("id", "<", "abc"))
  );
}

// DEBUG: Simple direct test without destructuring
function testDirectExpressionBuilder() {
  const eb = db.selectFrom("users").where;

  // This should error - string for number column
  expectError(
    db.selectFrom("users").select(["name"]).where("id", "=", "not_a_number")
  );
}

// Export all test functions to ensure they're processed by TSD
export {
  testBasicWhereTypes,
  testColumnTypes,
  testStringOperators,
  testArrayOperators,
  testNullOperators,
  testJoinTypes,
  testComplexJoinTypes,
  testMixedOperators,
  testWhereChaining,
  testNullableColumns,
  testDateComparisons,
  testBooleanComparisons,
  testInvalidColumnNames,
  testJoinContextErrors,
  testTypeMismatchesTodo,
  testExpressionBuilderValueTypeErrors,
  testExpressionBuilderNullOperatorErrors,
  testExpressionBuilderInvalidIsOperatorErrors,
  testExpressionBuilderArrayTypeErrors,
  testExpressionBuilderLikeOperatorErrors,
  testExpressionBuilderComparisonOperatorErrors,
  testDirectExpressionBuilder,
};
