// WHERE Clause Array Operations Tests
// Tests for array-specific operations in WHERE clauses with expression builder
//
// 🔴 TDD RED STATE: These tests define target behavior for array operations
// Tests cover the array() helper function and PostgreSQL array operators

import {
  expectType,
  expectError,
  expectAssignable,
  db,
} from "../utils/test-helpers.test-d.ts";
import type {
  Database,
  UserTable,
  PostTable,
  CommentTable,
} from "../utils/schemas.test-d.ts";

// =============================================================================
// 1. BASIC ARRAY OPERATIONS WITH EXPRESSION BUILDER
// =============================================================================

// ✅ Array contains operation (@>)
async function testArrayContains() {
  const result = await db
    .selectFrom("users")
    .select(["id", "name", "tags"])
    .where(({ array }) => array("tags").contains(["typescript", "nodejs"]))
    .execute();

  expectType<Array<{ id: number; name: string; tags: string[] }>>(result);
}

// ✅ Array overlaps operation (&&)
async function testArrayOverlaps() {
  const result = await db
    .selectFrom("users")
    .select(["id", "name", "permissions"])
    .where(({ array }) => array("permissions").overlaps(["admin", "moderator"]))
    .execute();

  expectType<Array<{ id: number; name: string; permissions: string[] }>>(
    result
  );
}

// ✅ Array is contained by operation (<@)
async function testArrayIsContainedBy() {
  const result = await db
    .selectFrom("users")
    .select(["id", "name", "tags"])
    .where(({ array }) =>
      array("tags").isContainedBy([
        "web",
        "mobile",
        "desktop",
        "typescript",
        "nodejs",
      ])
    )
    .execute();

  expectType<Array<{ id: number; name: string; tags: string[] }>>(result);
}

// ✅ Array has any element (= ANY)
async function testArrayHasAny() {
  const result = await db
    .selectFrom("users")
    .select(["id", "name", "scores"])
    .where(({ array }) => array("scores").hasAny(100))
    .execute();

  expectType<Array<{ id: number; name: string; scores: number[] }>>(result);
}

// ✅ Array has all elements (= ALL)
async function testArrayHasAll() {
  const result = await db
    .selectFrom("users")
    .select(["id", "name", "scores"])
    .where(({ array }) => array("scores").hasAll(90))
    .execute();

  expectType<Array<{ id: number; name: string; scores: number[] }>>(result);
}

// =============================================================================
// 2. COMPLEX ARRAY OPERATIONS
// =============================================================================

// ✅ Multiple array operations combined with logical operators
async function testMultipleArrayOperations() {
  const result = await db
    .selectFrom("users")
    .select(["id", "name", "tags", "permissions"])
    .where(({ array, and }) =>
      and([
        array("tags").contains(["typescript"]),
        array("permissions").overlaps(["admin", "user"]),
      ])
    )
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

// ✅ Array operations with OR logic
async function testArrayOperationsWithOr() {
  const result = await db
    .selectFrom("posts")
    .select(["id", "title", "categories", "ratings"])
    .where(({ array, or }) =>
      or([array("categories").contains(["tech"]), array("ratings").hasAny(5)])
    )
    .execute();

  expectType<
    Array<{
      id: number;
      title: string;
      categories: string[];
      ratings: number[];
    }>
  >(result);
}

// ✅ Nested array operations with complex logic
async function testNestedArrayOperations() {
  const result = await db
    .selectFrom("users")
    .select(["id", "name", "tags", "permissions", "scores"])
    .where(({ array, and, or }) =>
      and([
        or([
          array("tags").overlaps(["javascript", "typescript"]),
          array("permissions").contains(["admin"]),
        ]),
        array("scores").hasAny(95),
      ])
    )
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
// 3. ARRAY OPERATIONS WITH DIFFERENT DATA TYPES
// =============================================================================

// ✅ String array operations
async function testStringArrayOperations() {
  const result = await db
    .selectFrom("users")
    .select(["id", "name", "tags"])
    .where(({ array }) => array("tags").contains(["web", "frontend"]))
    .execute();

  expectType<Array<{ id: number; name: string; tags: string[] }>>(result);
}

// ✅ Number array operations
async function testNumberArrayOperations() {
  const result = await db
    .selectFrom("users")
    .select(["id", "name", "scores"])
    .where(({ array }) => array("scores").overlaps([100, 95, 90]))
    .execute();

  expectType<Array<{ id: number; name: string; scores: number[] }>>(result);
}

// ✅ Mixed array operations on different tables
async function testMixedArrayOperations() {
  const result = await db
    .selectFrom("posts")
    .select(["id", "title", "categories", "ratings"])
    .where(({ array, and }) =>
      and([
        array("categories").contains(["technology"]),
        array("ratings").hasAny(4),
      ])
    )
    .execute();

  expectType<
    Array<{
      id: number;
      title: string;
      categories: string[];
      ratings: number[];
    }>
  >(result);
}

// =============================================================================
// 4. ARRAY OPERATIONS WITH ALIASES
// =============================================================================

// ✅ Array operations with table aliases (TDD - should work)
async function testArrayOperationsWithAliases() {
  const result = await db
    .selectFrom("users as u")
    .select(["u.id", "u.name", "u.tags"])
    .where(({ array }) => array("u.tags").contains(["typescript"]))
    .execute();

  expectType<Array<{ id: number; name: string; tags: string[] }>>(result);
}

// ✅ Array operations with joins and aliases (TDD - target state)
async function testArrayOperationsWithJoinsAndAliases() {
  const result = await db
    .selectFrom("posts as p")
    .innerJoin("users as u", "p.user_id", "u.id")
    .select(["p.id", "p.categories", "u.tags"])
    .where(({ array, and }) =>
      and([
        array("p.categories").overlaps(["tech", "programming"]),
        array("u.tags").contains(["developer"]),
      ])
    )
    .execute();

  expectType<
    Array<{
      id: number;
      categories: string[];
      tags: string[];
    }>
  >(result);
}

// =============================================================================
// 5. MIXED ARRAY AND REGULAR OPERATIONS
// =============================================================================

// ✅ Combining array operations with regular WHERE conditions
async function testMixedArrayAndRegularOperations() {
  const result = await db
    .selectFrom("users")
    .select(["id", "name", "active", "tags"])
    .where("active", "=", true) // Regular where
    .where(({ array }) => array("tags").contains(["javascript"])) // Array operation
    .where("id", ">", 0) // Another regular where
    .execute();

  expectType<
    Array<{
      id: number;
      name: string;
      active: boolean;
      tags: string[];
    }>
  >(result);
}

// ✅ Array operations with expression builder
async function testArrayOperationsWithExpressionBuilder() {
  const result = await db
    .selectFrom("users")
    .select(["id", "name", "tags", "active"])
    .where(({ eb, array, and }) =>
      and([
        eb("active", "=", true),
        array("tags").overlaps(["react", "vue", "angular"]),
      ])
    )
    .execute();

  expectType<
    Array<{
      id: number;
      name: string;
      tags: string[];
      active: boolean;
    }>
  >(result);
}

// =============================================================================
// 6. EMPTY ARRAY OPERATIONS
// =============================================================================

// ✅ Checking for empty arrays
async function testEmptyArrayOperations() {
  const result = await db
    .selectFrom("users")
    .select(["id", "name", "tags"])
    .where(({ array }) => array("tags").contains([]))
    .execute();

  expectType<Array<{ id: number; name: string; tags: string[] }>>(result);
}

// ✅ Checking arrays that don't overlap with empty
async function testArrayNotOverlapEmpty() {
  const result = await db
    .selectFrom("users")
    .select(["id", "name", "permissions"])
    .where(({ array, not }) => not(array("permissions").overlaps([])))
    .execute();

  expectType<Array<{ id: number; name: string; permissions: string[] }>>(
    result
  );
}

// =============================================================================
// 7. ERROR CASES - ARRAY OPERATIONS
// =============================================================================

// ❌ Invalid column references in array operations should fail
function testArrayOperationErrors() {
  // Non-existent column
  expectError(
    db
      .selectFrom("users")
      .where(({ array }) => array("nonexistent").contains(["value"]))
      .selectAll()
  );

  // Non-array column
  expectError(
    db
      .selectFrom("users")
      .where(({ array }) => array("name").contains(["value"])) // name is string, not array
      .selectAll()
  );

  // Wrong array element type
  expectError(
    db
      .selectFrom("users")
      .where(({ array }) => array("tags").contains([123])) // tags is string[], not number[]
      .selectAll()
  );
}

// ❌ Invalid array operation usage
function testInvalidArrayOperations() {
  // hasAny with array instead of single value
  expectError(
    db
      .selectFrom("users")
      .where(({ array }) => array("scores").hasAny([100, 90]))
      .selectAll()
  );

  // hasAll with array instead of single value
  expectError(
    db
      .selectFrom("users")
      .where(({ array }) => array("scores").hasAll([100, 90]))
      .selectAll()
  );
}

// =============================================================================
// 8. ADVANCED ARRAY SCENARIOS
// =============================================================================

// ✅ Array operations with complex element types
async function testComplexArrayElements() {
  const result = await db
    .selectFrom("users")
    .select(["id", "name", "tags"])
    .where(({ array }) =>
      array("tags").contains(["frontend-development", "backend-development"])
    )
    .execute();

  expectType<Array<{ id: number; name: string; tags: string[] }>>(result);
}

// ✅ Chaining multiple array operations
async function testChainedArrayOperations() {
  const result = await db
    .selectFrom("users")
    .select(["id", "name", "tags", "permissions"])
    .where(({ array }) => array("tags").contains(["typescript"]))
    .where(({ array }) => array("permissions").overlaps(["admin", "moderator"]))
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
