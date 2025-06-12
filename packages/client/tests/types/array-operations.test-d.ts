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

// ❌ Test 5: Type safety validation (these should fail but currently don't)
async function testTypeValidation() {
  // Test 5.1: Non-existent columns - these should cause TypeScript errors
  expectError(
    db
      .selectFrom("users")
      .selectAll()
      .where(({ array }) => array("nonExistentColumn").contains(["value"]))
      .execute()
  );

  expectError(
    db
      .selectFrom("users")
      .selectAll()
      .where(({ array }) => array("fake_tags").overlaps(["typescript"]))
      .execute()
  );

  // Test 5.2: Non-array columns - these should cause TypeScript errors
  expectError(
    db
      .selectFrom("users")
      .selectAll()
      .where(({ array }) => array("id").contains([1, 2, 3])) // id is number, not array
      .execute()
  );

  expectError(
    db
      .selectFrom("users")
      .selectAll()
      .where(({ array }) => array("name").hasAny("john")) // name is string, not array
      .execute()
  );

  expectError(
    db
      .selectFrom("users")
      .selectAll()
      .where(({ array }) => array("active").overlaps([true, false])) // active is boolean, not array
      .execute()
  );

  // Test 5.3: Type mismatches between column types and operation values
  expectError(
    db
      .selectFrom("users")
      .selectAll()
      .where(({ array }) => array("tags").contains([1, 2, 3])) // tags is string[], not number[]
      .execute()
  );

  expectError(
    db
      .selectFrom("users")
      .selectAll()
      .where(({ array }) => array("scores").hasAny("not-a-number")) // scores is number[], not string
      .execute()
  );

  expectError(
    db
      .selectFrom("users")
      .selectAll()
      .where(({ array }) => array("permissions").overlaps([true, false])) // permissions is string[], not boolean[]
      .execute()
  );

  // Test 5.4: Cross-table column confusion - should catch using wrong table's columns
  expectError(
    db
      .selectFrom("users")
      .selectAll()
      .where(({ array }) => array("categories").contains(["tech"])) // categories is from posts table, not users
      .execute()
  );

  expectError(
    db
      .selectFrom("posts")
      .selectAll()
      .where(({ array }) => array("permissions").hasAny("admin")) // permissions is from users table, not posts
      .execute()
  );

  // Test 5.5: Invalid parameters (null/undefined) - these should cause TypeScript errors
  expectError(
    db
      .selectFrom("users")
      .selectAll()
      .where(({ array }) => array("tags").contains(null)) // null is not valid array
      .execute()
  );

  expectError(
    db
      .selectFrom("users")
      .selectAll()
      .where(({ array }) => array("tags").contains(undefined)) // undefined is not valid array
      .execute()
  );

  expectError(
    db
      .selectFrom("users")
      .selectAll()
      .where(({ array }) => array("permissions").hasAny(null)) // null is not valid element
      .execute()
  );

  expectError(
    db
      .selectFrom("users")
      .selectAll()
      .where(({ array }) => array("scores").hasAll(undefined)) // undefined is not valid element
      .execute()
  );

  // Note: Mixed-type arrays like ["string", 123, true] are not a practical concern
  // and don't need type validation since developers rarely write them by accident
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
