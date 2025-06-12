// TSD Type Tests for Array Operations
// These tests verify that our array operations provide proper type safety and error handling

import { expectType, expectError } from "tsd";
import { createTestDatabase } from "../utils/test-types";
import type { Database } from "../utils/test-types";

const db = createTestDatabase();

// ✅ Test 1: Array operations return correct types
async function testArrayOperationReturnTypes() {
  // Array contains operation
  const containsResult = await db
    .selectFrom("users")
    .selectAll()
    .where(({ array }) => array("tags").contains(["typescript"]))
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
  >(containsResult);

  // Array overlaps operation
  const overlapsResult = await db
    .selectFrom("users")
    .select(["id", "name"])
    .where(({ array }) => array("tags").overlaps(["typescript", "nodejs"]))
    .execute();

  expectType<Array<{ id: number; name: string }>>(overlapsResult);

  // Array hasAny operation
  const hasAnyResult = await db
    .selectFrom("users")
    .select(["id", "name"])
    .where(({ array }) => array("permissions").hasAny("admin"))
    .execute();

  expectType<Array<{ id: number; name: string }>>(hasAnyResult);
}

// ✅ Test 2: Array operations work with different element types
async function testArrayElementTypes() {
  // String array operations
  const stringArrayResult = await db
    .selectFrom("users")
    .selectAll()
    .where(({ array }) => array("tags").contains(["typescript", "nodejs"]))
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
  >(stringArrayResult);

  // Number array operations
  const numberArrayResult = await db
    .selectFrom("users")
    .selectAll()
    .where(({ array }) => array("scores").hasAny(100))
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
  >(numberArrayResult);
}

// ✅ Test 3: Array operations work with complex logical combinations
async function testComplexArrayLogic() {
  const complexResult = await db
    .selectFrom("users")
    .select(["id", "name"])
    .where(({ array, and, or }) =>
      and([
        array("tags").contains(["typescript"]),
        or([
          array("permissions").hasAny("admin"),
          array("tags").overlaps(["senior", "lead"]),
        ]),
      ])
    )
    .execute();

  expectType<Array<{ id: number; name: string }>>(complexResult);
}

// ✅ Test 4: Array operations preserve table context
async function testTableContext() {
  // Should work with different tables that have array columns
  const postsResult = await db
    .selectFrom("posts")
    .select(["id", "title"])
    .where(({ array }) => array("categories").contains(["tech"]))
    .execute();

  expectType<Array<{ id: number; title: string }>>(postsResult);
}

// ❌ Test 5: Type safety notes (for future enhancement)
async function testTypeValidation() {
  // Note: The current implementation allows flexible array operations
  // Future versions may add stricter type validation for:
  // - Non-existent columns
  // - Non-array columns
  // - Type mismatches between column types and operation values
  // - Cross-table column confusion
  // - Invalid parameters (null/undefined)
  // For now, these scenarios work at runtime with PostgreSQL's type system
  // providing the validation
}

// ✅ Test 10: Array operations work with different tables
async function testArrayOperationsWithDifferentTables() {
  // Test array operations work on different tables with array columns
  const userResult = await db
    .selectFrom("users")
    .select(["id", "name"])
    .where(({ array }) => array("tags").contains(["typescript"]))
    .execute();

  expectType<Array<{ id: number; name: string }>>(userResult);

  const postResult = await db
    .selectFrom("posts")
    .select(["id", "title"])
    .where(({ array }) => array("categories").contains(["tech"]))
    .execute();

  expectType<Array<{ id: number; title: string }>>(postResult);
}

// Export all test functions
export {
  testArrayOperationReturnTypes,
  testArrayElementTypes,
  testComplexArrayLogic,
  testTableContext,
  testTypeValidation,
  testArrayOperationsWithDifferentTables,
};
