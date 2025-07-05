// TypeScript Declaration Tests for Array Data Types
// Tests that array columns work correctly with all array operations

import { expectType, expectError } from "tsd";
import { createTestDatabase } from "../../utils/test-config";
import type { Database } from "../../utils/test-types";

const db = createTestDatabase();

// =============================================================================
// POSITIVE CASES: Array Operations Support
// =============================================================================

// ✅ Test 1: Basic array contains operations
async function testBasicArrayContains() {
  const result = await db
    .selectFrom("users")
    .select(["id", "name", "tags"])
    .where(({ array }) => array("tags").contains(["typescript", "javascript"]))
    .execute();

  expectType<
    Array<{
      id: number;
      name: string;
      tags: string[];
    }>
  >(result);
}

// ✅ Test 2: Array hasAny operations
async function testArrayHasAny() {
  const result = await db
    .selectFrom("users")
    .select(["id", "name", "permissions"])
    .where(({ array }) => array("permissions").hasAny("admin"))
    .execute();

  expectType<
    Array<{
      id: number;
      name: string;
      permissions: string[];
    }>
  >(result);
}

// ✅ Test 3: Array hasAll operations
async function testArrayHasAll() {
  const result = await db
    .selectFrom("users")
    .select(["id", "name", "permissions"])
    .where(({ array }) => array("permissions").hasAll("read"))
    .execute();

  expectType<
    Array<{
      id: number;
      name: string;
      permissions: string[];
    }>
  >(result);
}

// ✅ Test 4: Array overlaps operations
async function testArrayOverlaps() {
  const result = await db
    .selectFrom("users")
    .select(["id", "name", "tags"])
    .where(({ array }) => array("tags").overlaps(["frontend", "backend"]))
    .execute();

  expectType<
    Array<{
      id: number;
      name: string;
      tags: string[];
    }>
  >(result);
}

// ✅ Test 5: Array isContainedBy operations
async function testArrayIsContainedBy() {
  const result = await db
    .selectFrom("users")
    .select(["id", "name", "tags"])
    .where(({ array }) =>
      array("tags").isContainedBy(["javascript", "typescript", "react", "node"])
    )
    .execute();

  expectType<
    Array<{
      id: number;
      name: string;
      tags: string[];
    }>
  >(result);
}

// ✅ Test 6: Array multiple operations
async function testArrayMultipleOperations() {
  const result = await db
    .selectFrom("users")
    .select(["id", "name", "tags"])
    .where(({ array }) => array("tags").hasAny("typescript"))
    .where(({ array }) => array("tags").contains(["javascript"]))
    .execute();

  expectType<
    Array<{
      id: number;
      name: string;
      tags: string[];
    }>
  >(result);
}

// ✅ Test 7: Numeric array operations
async function testNumericArrayOperations() {
  const result = await db
    .selectFrom("users")
    .select(["id", "name", "scores"])
    .where(({ array }) => array("scores").contains([100, 95, 90]))
    .where(({ array }) => array("scores").hasAny(85))
    .execute();

  expectType<
    Array<{
      id: number;
      name: string;
      scores: number[];
    }>
  >(result);
}

// ✅ Test 8: Array operations with different tables
async function testArrayOperationsDifferentTables() {
  const result = await db
    .selectFrom("posts")
    .select(["id", "title", "categories"])
    .where(({ array }) => array("categories").hasAny("technology"))
    .execute();

  expectType<
    Array<{
      id: number;
      title: string;
      categories: string[];
    }>
  >(result);
}

// ✅ Test 9: Array operations with complex where clauses
async function testArrayComplexWhere() {
  const result = await db
    .selectFrom("users")
    .select(["id", "name", "tags", "permissions"])
    .where(({ array, and, or }) => [
      and([
        array("tags").hasAny("javascript"),
        or([
          array("permissions").hasAny("admin"),
          array("permissions").hasAll("read"),
        ]),
      ]),
    ])
    .execute();

  expectType<
    Array<{
      id: number;
      name: string;
      tags: string[];
      permissions: string[];
    }>
  >(result);
}

// ✅ Test 10: Array operations with JOINs
async function testArrayOperationsWithJoins() {
  const result = await db
    .selectFrom("users")
    .innerJoin("posts", "users.id", "posts.user_id")
    .select(["users.name", "posts.title", "posts.categories"])
    .where(({ array }) => array("tags").hasAny("author"))
    .where(({ array }) => array("categories").hasAny("tech"))
    .execute();

  expectType<
    Array<{
      name: string;
      title: string;
      categories: string[];
    }>
  >(result);
}

// ✅ Test 11: Array operations with ORDER BY
async function testArrayOperationsWithOrderBy() {
  const result = await db
    .selectFrom("users")
    .select(["id", "name", "tags"])
    .where(({ array }) => array("tags").length().equals(3))
    .orderBy("name", "asc")
    .execute();

  expectType<
    Array<{
      id: number;
      name: string;
      tags: string[];
    }>
  >(result);
}

// ✅ Test 12: Array operations with LIMIT and OFFSET
async function testArrayOperationsWithLimitOffset() {
  const result = await db
    .selectFrom("users")
    .select(["id", "name", "permissions"])
    .where(({ array }) => array("permissions").hasAny("admin"))
    .limit(10)
    .offset(5)
    .execute();

  expectType<
    Array<{
      id: number;
      name: string;
      permissions: string[];
    }>
  >(result);
}

// ✅ Test 13: Empty array operations
async function testEmptyArrayOperations() {
  const result = await db
    .selectFrom("users")
    .select(["id", "name", "tags"])
    .where(({ array }) => array("tags").length().equals(0))
    .execute();

  expectType<
    Array<{
      id: number;
      name: string;
      tags: string[];
    }>
  >(result);
}

// ✅ Test 14: Array operations with null handling
async function testArrayOperationsWithNull() {
  const result = await db
    .selectFrom("users")
    .select(["id", "name", "tags"])
    .where("tags", "is not", null)
    .where(({ array }) => array("tags").length().equals(0))
    .execute();

  expectType<
    Array<{
      id: number;
      name: string;
      tags: string[];
    }>
  >(result);
}

// ✅ Test 15: Array element access operations (NEW!)
async function testArrayElementAccess() {
  const result = await db
    .selectFrom("users")
    .select(["id", "name", "tags"])
    .where(({ array }) => array("tags").element(0).equals("typescript"))
    .execute();

  expectType<
    Array<{
      id: number;
      name: string;
      tags: string[];
    }>
  >(result);
}

// ✅ Test 16: Array operations with aliases (ARCHITECTURE TEST!)
async function testArrayOperationsWithAliases() {
  const result = await db
    .selectFrom("users as u")
    .select(["u.id", "u.name", "u.tags"])
    .where(({ array }) => array("tags").hasAny("typescript"))
    .where(({ array }) => array("tags").length().greaterThan(2))
    .execute();

  expectType<
    Array<{
      id: number;
      name: string;
      tags: string[];
    }>
  >(result);
}

// ✅ Test 17: Array operations with multiple conditions
async function testArrayMultipleConditions() {
  const result = await db
    .selectFrom("users")
    .select(["id", "name", "tags", "permissions", "scores"])
    .where(({ array }) => array("tags").hasAny("javascript"))
    .where(({ array }) => array("permissions").hasAll("read"))
    .where(({ array }) => array("scores").hasAny(90))
    .execute();

  expectType<
    Array<{
      id: number;
      name: string;
      tags: string[];
      permissions: string[];
      scores: number[];
    }>
  >(result);
}

// =============================================================================
// NEGATIVE CASES: These should fail for type safety
// =============================================================================

// ❌ Test 16: Non-array columns should not work with array operations
function testNonArrayColumnsFailWithArrayOperations() {
  // Regular string column with array operations (should error)
  expectError(
    db
      .selectFrom("users")
      .select(["name"])
      .where(({ array }) => array("name").hasAny("value"))
  );

  // Regular number column with array operations (should error)
  expectError(
    db
      .selectFrom("users")
      .select(["id"])
      .where(({ array }) => array("id").contains([1, 2, 3]))
  );

  // Regular boolean column with array operations (should error)
  expectError(
    db
      .selectFrom("users")
      .select(["active"])
      .where(({ array }) => array("active").overlaps([true, false]))
  );
}

// ❌ Test 17: Wrong element types should fail
function testWrongElementTypesFailForArrayOperations() {
  // String array with number elements (should error)
  expectError(
    db
      .selectFrom("users")
      .select(["tags"])
      .where(({ array }) => array("tags").hasAny(123))
  );

  // Number array with string elements (should error)
  expectError(
    db
      .selectFrom("users")
      .select(["scores"])
      .where(({ array }) => array("scores").contains(["not", "numbers"]))
  );

  // Mixed type arrays (should error)
  expectError(
    db
      .selectFrom("users")
      .select(["tags"])
      .where(({ array }) => array("tags").overlaps(["string", 123, true]))
  );
}

// ❌ Test 18: Invalid column names should fail
function testInvalidArrayColumnNames() {
  // Non-existent column (should error)
  expectError(
    db
      .selectFrom("users")
      .select(["id"])
      .where(({ array }) => array("nonexistent_column").hasAny("value"))
  );

  // Column from wrong table (should error)
  expectError(
    db
      .selectFrom("users")
      .select(["id"])
      .where(({ array }) => array("categories").hasAny("tech"))
  );
}

// ❌ Test 19: Cross-table column confusion
function testCrossTableArrayColumnConfusion() {
  // Using posts columns on users table (should error)
  expectError(
    db
      .selectFrom("users")
      .select(["id"])
      .where(({ array }) => array("categories").hasAny("technology"))
  );

  // Using users columns on posts table (should error)
  expectError(
    db
      .selectFrom("posts")
      .select(["id"])
      .where(({ array }) => array("permissions").hasAny("admin"))
  );
}

// ❌ Test 20: Invalid array operations parameters
function testInvalidArrayOperationParameters() {
  // Null parameters (should error)
  expectError(
    db
      .selectFrom("users")
      .select(["tags"])
      .where(({ array }) => array("tags").hasAny(null))
  );

  // Undefined parameters (should error)
  expectError(
    db
      .selectFrom("users")
      .select(["tags"])
      .where(({ array }) => array("tags").contains(undefined))
  );

  // Wrong parameter types for element access (should error)
  expectError(
    db
      .selectFrom("users")
      .select(["tags"])
      .where(({ array }) =>
        array("tags").element("not-a-number").equals("value")
      )
  );
}

// =============================================================================
// EDGE CASES: Complex array scenarios
// =============================================================================

// ✅ Test 21: Array operations with different comparison operators
async function testArrayDifferentComparisons() {
  const result = await db
    .selectFrom("users")
    .select(["id", "name", "scores"])
    .where(({ array }) => array("scores").length().greaterThan(5))
    .where(({ array }) => array("scores").element(0).greaterThan(80))
    .execute();

  expectType<
    Array<{
      id: number;
      name: string;
      scores: number[];
    }>
  >(result);
}

// ✅ Test 22: Array operations with expressions
async function testArrayOperationsWithExpressions() {
  const result = await db
    .selectFrom("users")
    .select(["id", "name", "tags"])
    .where(({ array, eb }) => [
      eb(array("tags").length(), ">", 0),
      eb(array("tags").element(0), "=", "typescript"),
    ])
    .execute();

  expectType<
    Array<{
      id: number;
      name: string;
      tags: string[];
    }>
  >(result);
}

// ✅ Test 23: Array operations with nested conditions
async function testArrayOperationsNestedConditions() {
  const result = await db
    .selectFrom("users")
    .select(["id", "name", "tags", "permissions"])
    .where(({ array, and, or, not }) => [
      and([
        array("tags").hasAny("javascript"),
        or([
          array("permissions").hasAny("admin"),
          not(array("permissions").hasAll(["read", "write"])),
        ]),
      ]),
    ])
    .execute();

  expectType<
    Array<{
      id: number;
      name: string;
      tags: string[];
      permissions: string[];
    }>
  >(result);
}

// ✅ Test 24: Array operations with single elements
async function testArrayOperationsWithSingleElements() {
  const result = await db
    .selectFrom("users")
    .select(["id", "name", "tags"])
    .where(({ array }) => array("tags").contains(["typescript"]))
    .where(({ array }) => array("tags").hasAny("javascript"))
    .execute();

  expectType<
    Array<{
      id: number;
      name: string;
      tags: string[];
    }>
  >(result);
}

// ✅ Test 25: Array operations with large arrays
async function testArrayOperationsWithLargeArrays() {
  const result = await db
    .selectFrom("users")
    .select(["id", "name", "tags"])
    .where(({ array }) =>
      array("tags").overlaps([
        "javascript",
        "typescript",
        "react",
        "vue",
        "angular",
        "node",
        "express",
        "fastify",
        "postgresql",
        "mongodb",
      ])
    )
    .execute();

  expectType<
    Array<{
      id: number;
      name: string;
      tags: string[];
    }>
  >(result);
}

// Export test functions
export {
  testBasicArrayContains,
  testArrayHasAny,
  testArrayHasAll,
  testArrayOverlaps,
  testArrayLength,
  testArrayElementAccess,
  testNumericArrayOperations,
  testArrayOperationsDifferentTables,
  testArrayComplexWhere,
  testArrayOperationsWithJoins,
  testArrayOperationsWithOrderBy,
  testArrayOperationsWithLimitOffset,
  testEmptyArrayOperations,
  testArrayOperationsWithNull,
  testArrayMultipleConditions,
  testNonArrayColumnsFailWithArrayOperations,
  testWrongElementTypesFailForArrayOperations,
  testInvalidArrayColumnNames,
  testCrossTableArrayColumnConfusion,
  testInvalidArrayOperationParameters,
  testArrayDifferentComparisons,
  testArrayOperationsWithExpressions,
  testArrayOperationsNestedConditions,
  testArrayOperationsWithSingleElements,
  testArrayOperationsWithLargeArrays,
};
