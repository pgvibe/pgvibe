// Comprehensive WHERE Clause Type Testing
// Consolidates operator coverage, type validation, and error conditions
// Tests all aspects of WHERE clause type safety and validation

import { expectType, expectError, db } from "../utils/test-helpers.test-d.ts";
import type { Database } from "../utils/schemas.test-d.ts";

// =============================================================================
// 1. COMPREHENSIVE OPERATOR COVERAGE
// =============================================================================

// ✅ All comparison operators with correct types
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

// ✅ Type-specific operator behavior
async function testTypeSpecificOperators() {
  // Boolean columns - should allow equality operators
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
// 2. VALID TYPE COMBINATIONS (POSITIVE TESTS)
// =============================================================================

// ✅ Valid type combinations work correctly
async function testValidTypeCombinations() {
  const result = await db
    .selectFrom("users")
    .select(["id", "name", "active"])
    .where("id", "=", 42) // number = number ✅
    .where("name", "=", "John") // string = string ✅
    .where("active", "=", true) // boolean = boolean ✅
    .execute();

  expectType<Array<{ id: number; name: string; active: boolean }>>(result);
}

// ✅ Complex chaining with multiple WHERE conditions
async function testComplexWhereChaining() {
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

// ✅ Different table contexts work correctly
async function testDifferentTableContexts() {
  // Users table WHERE conditions
  const users = await db
    .selectFrom("users")
    .where("active", "=", true)
    .where("email", "is not", null)
    .execute();

  // Posts table WHERE conditions
  const posts = await db
    .selectFrom("posts")
    .where("published", "=", true)
    .where("content", "is not", null)
    .execute();

  // Comments table WHERE conditions
  const comments = await db
    .selectFrom("comments")
    .where("post_id", ">", 0)
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

// =============================================================================
// 3. TYPE SAFETY ERROR CASES
// =============================================================================

// ❌ Invalid operator-type combinations
function testInvalidOperatorTypeCombinations() {
  // Boolean columns cannot use comparison operators
  expectError(db.selectFrom("users").where("active", ">", true)); // boolean > boolean ❌
  expectError(db.selectFrom("users").where("active", ">=", true)); // boolean >= boolean ❌
  expectError(db.selectFrom("users").where("active", "<", false)); // boolean < boolean ❌
  expectError(db.selectFrom("users").where("active", "<=", false)); // boolean <= boolean ❌

  // String columns cannot use LIKE with non-strings
  expectError(db.selectFrom("users").where("name", "like", 123)); // string LIKE number ❌
  expectError(db.selectFrom("users").where("name", "like", true)); // string LIKE boolean ❌
  expectError(db.selectFrom("users").where("name", "like", null)); // string LIKE null ❌

  // Non-string columns cannot use LIKE
  expectError(db.selectFrom("users").where("id", "like", "123")); // number LIKE string ❌
  expectError(db.selectFrom("users").where("active", "like", "true")); // boolean LIKE string ❌
}

// ❌ Invalid null handling
function testInvalidNullHandling() {
  // Cannot use null with equality/comparison operators
  expectError(db.selectFrom("users").where("email", "=", null)); // Use IS instead ❌
  expectError(db.selectFrom("users").where("email", "!=", null)); // Use IS NOT instead ❌
  expectError(db.selectFrom("users").where("email", "<>", null)); // Use IS NOT instead ❌
  expectError(db.selectFrom("users").where("id", ">", null)); // Cannot compare null ❌
  expectError(db.selectFrom("users").where("id", ">=", null)); // Cannot compare null ❌
  expectError(db.selectFrom("users").where("id", "<", null)); // Cannot compare null ❌
  expectError(db.selectFrom("users").where("id", "<=", null)); // Cannot compare null ❌

  // Cannot use string literals like "null" with IS
  expectError(db.selectFrom("users").where("email", "is", "null")); // Use null, not "null" ❌
  expectError(db.selectFrom("users").where("email", "is", "not_null")); // Use null or value ❌
}

// ❌ Invalid array operations
function testInvalidArrayOperations() {
  // IN/NOT IN require arrays
  expectError(db.selectFrom("users").where("id", "in", 123)); // IN requires array ❌
  expectError(db.selectFrom("users").where("id", "not in", "test")); // NOT IN requires array ❌

  // Cannot use arrays with comparison operators
  expectError(db.selectFrom("users").where("id", ">", [1, 2, 3])); // Comparison with array ❌
  expectError(db.selectFrom("users").where("name", "=", ["a", "b"])); // Equality with array ❌
}

// ❌ Value type mismatches
function testValueTypeMismatches() {
  // String for number column
  expectError(db.selectFrom("users").where("id", "=", "not_a_number")); // ❌

  // Number for string column
  expectError(db.selectFrom("users").where("name", "=", 42)); // ❌

  // String for boolean column
  expectError(db.selectFrom("users").where("active", "=", "not_boolean")); // ❌

  // Mixed types in arrays
  expectError(db.selectFrom("users").where("id", "in", [1, "2", 3])); // ❌
  expectError(db.selectFrom("users").where("name", "in", ["John", 42, "Jane"])); // ❌
  expectError(db.selectFrom("users").where("id", "in", [true, false])); // ❌
}

// ❌ Operator/value combination validation
function testOperatorValueValidation() {
  // IN should require array
  expectError(db.selectFrom("users").where("id", "in", 42)); // ❌

  // IS should require null
  expectError(db.selectFrom("users").where("name", "is", "not_null")); // ❌

  // LIKE with null
  expectError(db.selectFrom("users").where("name", "like", null)); // ❌
}

// =============================================================================
// 4. COLUMN VALIDATION ERRORS
// =============================================================================

// ❌ Invalid column names in WHERE
function testInvalidWhereColumns() {
  // Non-existent column in WHERE
  expectError(db.selectFrom("users").where("nonexistent_column", "=", "value"));

  // Column from wrong table in WHERE
  expectError(db.selectFrom("users").where("title", "=", "some title")); // title is from posts

  // Typo in column name in WHERE
  expectError(db.selectFrom("users").where("naem", "=", "john")); // typo for "name"

  // Cross-table column confusion
  expectError(db.selectFrom("users").where("published", "=", true)); // published is from posts
  expectError(db.selectFrom("posts").where("active", "=", true)); // active is from users
}

// ❌ Invalid column names in ORDER BY
function testInvalidOrderByColumns() {
  // Non-existent column in ORDER BY
  expectError(db.selectFrom("users").orderBy("nonexistent_column", "asc"));

  // Column from wrong table in ORDER BY
  expectError(db.selectFrom("users").orderBy("title", "asc")); // title is from posts

  // Typo in column name in ORDER BY
  expectError(db.selectFrom("posts").orderBy("titel", "desc")); // typo for "title"

  // Cross-table column confusion in ORDER BY
  expectError(db.selectFrom("users").orderBy("content", "asc")); // content is from posts
  expectError(db.selectFrom("posts").orderBy("email", "desc")); // email is from users
}

// ❌ Complex WHERE chains with errors
function testComplexWhereErrors() {
  // Multiple WHERE conditions with one invalid column
  expectError(
    db
      .selectFrom("users")
      .where("active", "=", true)
      .where("nonexistent_field", "=", "value") // This should fail
  );

  // Mix of valid and invalid columns in chained WHERE
  expectError(
    db
      .selectFrom("posts")
      .where("published", "=", true)
      .where("invalid_column", "!=", null)
  );
}

// ❌ Chaining SELECT, WHERE, and ORDER BY with errors
function testChainedOperationErrors() {
  // Valid SELECT, invalid WHERE
  expectError(
    db
      .selectFrom("users")
      .select(["id", "name"])
      .where("invalid_column", "=", "test")
      .orderBy("name", "asc")
  );

  // Valid SELECT and WHERE, invalid ORDER BY
  expectError(
    db
      .selectFrom("users")
      .select(["id", "name"])
      .where("active", "=", true)
      .orderBy("invalid_column", "asc")
  );
}

// =============================================================================
// 5. POSITIVE CONTROL TESTS
// =============================================================================

// ✅ Column validation works for valid columns
function testValidColumnValidation() {
  // These should work - column validation allows valid columns
  const validWhere = db.selectFrom("users").where("active", "=", true);
  const validOrderBy = db.selectFrom("posts").orderBy("created_at", "desc");

  expectType<typeof validWhere>(validWhere);
  expectType<typeof validOrderBy>(validOrderBy);
}

// ✅ Valid WHERE and ORDER BY operations work (positive controls)
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
    .where("email", "is not", null)
    .orderBy("name", "asc")
    .limit(10)
    .execute();
  expectType<Array<{ id: number; name: string }>>(result3);
}

// =============================================================================
// EXPORTS
// =============================================================================

export {
  testAllComparisonOperators,
  testTypeSpecificOperators,
  testValidTypeCombinations,
  testComplexWhereChaining,
  testDifferentTableContexts,
  testInvalidOperatorTypeCombinations,
  testInvalidNullHandling,
  testInvalidArrayOperations,
  testValueTypeMismatches,
  testOperatorValueValidation,
  testInvalidWhereColumns,
  testInvalidOrderByColumns,
  testComplexWhereErrors,
  testChainedOperationErrors,
  testValidColumnValidation,
  testValidWhereOrderByOperations,
};
