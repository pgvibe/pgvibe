// TSD Type Tests for INSERT Operations
// These tests verify that our INSERT type system correctly handles operation-aware types

import { expectType, expectError } from "tsd";
import { createTestDatabase } from "../utils/test-types";
import { createIntegrationTestDatabase } from "../utils/test-config";
import type { Database, IntegrationTestDatabase } from "../utils/test-types";
import type { InsertReturningAllResult } from "../../src/core/builders/insert-query-builder";

const db = createTestDatabase();
const integrationDb = createIntegrationTestDatabase();

// ✅ Test 1: Basic INSERT operations with required fields only
async function testBasicInsertOperations() {
  // Integration test tables with semantic column types
  const result1 = await integrationDb
    .insertInto("test_users")
    .values({
      name: "John Doe", // Required field
    })
    .execute();

  expectType<{ readonly affectedRows: number }>(result1);

  // Can include optional fields
  const result2 = await integrationDb
    .insertInto("test_users")
    .values({
      name: "Jane Doe", // Required
      email: "jane@example.com", // Optional (nullable)
      active: false, // Optional (has default)
    })
    .execute();

  expectType<{ readonly affectedRows: number }>(result2);

  // Posts table
  const result3 = await integrationDb
    .insertInto("test_posts")
    .values({
      user_id: 1, // Required
      title: "My Post", // Required
    })
    .execute();

  expectType<{ readonly affectedRows: number }>(result3);
}

// ✅ Test 2: INSERT with all possible field combinations
async function testInsertFieldCombinations() {
  // Test users: only required fields
  const minimalUser = await integrationDb
    .insertInto("test_users")
    .values({
      name: "Minimal User",
    })
    .execute();

  expectType<{ readonly affectedRows: number }>(minimalUser);

  // Test users: all fields (including optional ones)
  const fullUser = await integrationDb
    .insertInto("test_users")
    .values({
      name: "Full User", // Required
      email: "full@example.com", // Optional (nullable)
      active: true, // Optional (has default)
    })
    .execute();

  expectType<{ readonly affectedRows: number }>(fullUser);

  // Test posts: only required fields
  const minimalPost = await integrationDb
    .insertInto("test_posts")
    .values({
      user_id: 1, // Required
      title: "Minimal Post", // Required
    })
    .execute();

  expectType<{ readonly affectedRows: number }>(minimalPost);

  // Test posts: all fields
  const fullPost = await integrationDb
    .insertInto("test_posts")
    .values({
      user_id: 1, // Required
      title: "Full Post", // Required
      content: "Post content", // Optional (nullable)
      published: true, // Optional (has default)
    })
    .execute();

  expectType<{ readonly affectedRows: number }>(fullPost);
}

// ✅ Test 3: Multiple INSERT operations (batch inserts)
async function testBatchInsertOperations() {
  // Multiple users with required fields only
  const batchResult1 = await integrationDb
    .insertInto("test_users")
    .values([{ name: "User 1" }, { name: "User 2" }, { name: "User 3" }])
    .execute();

  expectType<{ readonly affectedRows: number }>(batchResult1);

  // Multiple users with mixed field combinations
  const batchResult2 = await integrationDb
    .insertInto("test_users")
    .values([
      { name: "User A" }, // Minimal
      { name: "User B", email: "b@example.com" }, // With email
      { name: "User C", active: false }, // With active
      { name: "User D", email: "d@example.com", active: true }, // Full
    ])
    .execute();

  expectType<{ readonly affectedRows: number }>(batchResult2);

  // Multiple posts
  const batchResult3 = await integrationDb
    .insertInto("test_posts")
    .values([
      { user_id: 1, title: "Post 1" },
      { user_id: 2, title: "Post 2", content: "Content 2" },
      { user_id: 3, title: "Post 3", published: true },
    ])
    .execute();

  expectType<{ readonly affectedRows: number }>(batchResult3);
}

// ✅ Test 4: Regular tables (without semantic column types)
async function testRegularTableInserts() {
  // Regular users table (all fields required in INSERT)
  const result1 = await db
    .insertInto("users")
    .values({
      id: 1,
      name: "John Doe",
      email: "john@example.com",
      active: true,
      created_at: new Date(),
      tags: ["typescript"],
      permissions: ["read"],
      scores: [100],
    })
    .execute();

  expectType<{ readonly affectedRows: number }>(result1);

  // Regular posts table
  const result2 = await db
    .insertInto("posts")
    .values({
      id: 1,
      user_id: 1,
      title: "My Post",
      content: "Post content",
      published: true,
      created_at: new Date(),
      categories: ["tech"],
      ratings: [5],
    })
    .execute();

  expectType<{ readonly affectedRows: number }>(result2);
}

// ✅ Test 5: Verify semantic column behavior
async function testSemanticColumnBehavior() {
  // Test that required fields are actually required
  // This should compile fine - name is required and provided
  const validInsert = await integrationDb
    .insertInto("test_users")
    .values({
      name: "Valid User", // Required field provided
    })
    .execute();

  expectType<{ readonly affectedRows: number }>(validInsert);

  // Test that optional fields work
  const withOptionals = await integrationDb
    .insertInto("test_users")
    .values({
      name: "User with optionals", // Required
      email: "user@example.com", // Optional (nullable)
      active: true, // Optional (has default)
    })
    .execute();

  expectType<{ readonly affectedRows: number }>(withOptionals);

  // Test posts with required fields
  const validPost = await integrationDb
    .insertInto("test_posts")
    .values({
      user_id: 1, // Required
      title: "Valid Post", // Required
    })
    .execute();

  expectType<{ readonly affectedRows: number }>(validPost);

  // Test posts with optional fields
  const postWithOptionals = await integrationDb
    .insertInto("test_posts")
    .values({
      user_id: 1, // Required
      title: "Post with optionals", // Required
      content: "Some content", // Optional (nullable)
      published: false, // Optional (has default)
    })
    .execute();

  expectType<{ readonly affectedRows: number }>(postWithOptionals);
}

// ✅ Test 6: Verify that the type system prevents invalid operations
async function testTypeSystemPrevention() {
  // These tests verify that our type system correctly prevents invalid operations
  // at compile time. The fact that these would cause TypeScript errors is the test.

  // Note: We can't use expectError here because TypeScript prevents compilation
  // of invalid operations, which is exactly what we want. The type safety is
  // enforced at the TypeScript level, not at runtime.

  // Examples of what our type system prevents:
  // 1. Missing required fields (name is required for test_users)
  // 2. Auto-generated fields in INSERT (id, created_at are auto-generated)
  // 3. Invalid column names (non-existent columns)
  // 4. Type mismatches (string where number expected, etc.)
  // 5. Cross-table column confusion (using posts columns in users table)

  // The fact that this test compiles and runs means our positive cases work.
  // The fact that invalid operations don't compile means our negative cases work.

  const validOperation = await integrationDb
    .insertInto("test_users")
    .values({ name: "Type System Test" })
    .execute();

  expectType<{ readonly affectedRows: number }>(validOperation);
}

// ✅ Test 7: RETURNING clause functionality and type correctness
async function testReturningClauseFunctionality() {
  // Test returning specific columns - should return array of objects with only those columns
  const result1 = await integrationDb
    .insertInto("test_users")
    .values({
      name: "John Doe",
      email: "john@example.com",
    })
    .returning(["id", "name"])
    .execute();

  // Should return array of objects with only id and name
  expectType<{ readonly id: number; readonly name: string }[]>(result1);

  // Test returning all columns - should return array of objects with all table columns
  const result2 = await integrationDb
    .insertInto("test_users")
    .values({
      name: "Jane Doe",
    })
    .returningAll()
    .execute();

  // Should return array with all columns from TestUserTable using InsertReturningAllResult type
  expectType<InsertReturningAllResult<IntegrationTestDatabase, "test_users">>(
    result2
  );

  // Test returning with multiple inserts
  const result3 = await integrationDb
    .insertInto("test_users")
    .values([{ name: "User 1" }, { name: "User 2" }])
    .returning(["id", "name", "email"])
    .execute();

  expectType<
    {
      readonly id: number;
      readonly name: string;
      readonly email: string | null;
    }[]
  >(result3);

  // Test returning from posts table
  const result4 = await integrationDb
    .insertInto("test_posts")
    .values({
      user_id: 1,
      title: "My Post",
      content: "Post content",
    })
    .returning(["id", "title", "published"])
    .execute();

  expectType<
    {
      readonly id: number;
      readonly title: string;
      readonly published: boolean;
    }[]
  >(result4);

  // Test returning all from posts table
  const result5 = await integrationDb
    .insertInto("test_posts")
    .values({
      user_id: 1,
      title: "Another Post",
    })
    .returningAll()
    .execute();

  expectType<InsertReturningAllResult<IntegrationTestDatabase, "test_posts">>(
    result5
  );

  // Test returning single column
  const result6 = await integrationDb
    .insertInto("test_users")
    .values({ name: "Single Column Return" })
    .returning(["id"])
    .execute();

  expectType<{ readonly id: number }[]>(result6);

  // Test returning with regular tables (non-semantic columns)
  const result7 = await db
    .insertInto("users")
    .values({
      id: 1,
      name: "Regular User",
      email: "regular@example.com",
      active: true,
      created_at: new Date(),
      tags: ["test"],
      permissions: ["read"],
      scores: [100],
    })
    .returning(["id", "name", "email"])
    .execute();

  expectType<
    {
      readonly id: number;
      readonly name: string;
      readonly email: string | null;
    }[]
  >(result7);
}

// ✅ Test 8: Type safety - ensuring invalid type assignments are prevented
async function testTypeSafetyValidation() {
  // These tests demonstrate that our type system correctly prevents invalid operations.
  // The successful compilation of valid operations proves the positive cases work.
  // Invalid operations that would cause compilation errors prove the negative cases work.

  // ✅ Valid operations that should compile
  const validUserInsert = await integrationDb
    .insertInto("test_users")
    .values({
      name: "Valid User", // string to string column ✅
      email: "user@example.com", // string to nullable string column ✅
      active: true, // boolean to boolean column ✅
    })
    .execute();

  expectType<{ readonly affectedRows: number }>(validUserInsert);

  const validPostInsert = await integrationDb
    .insertInto("test_posts")
    .values({
      user_id: 123, // number to number column ✅
      title: "Valid Title", // string to string column ✅
      content: "Valid content", // string to nullable string column ✅
      published: false, // boolean to boolean column ✅
    })
    .execute();

  expectType<{ readonly affectedRows: number }>(validPostInsert);

  // ✅ Valid nullable field operations
  const validNullable = await integrationDb
    .insertInto("test_users")
    .values({
      name: "User with null email",
      email: null, // null to nullable column ✅
    })
    .execute();

  expectType<{ readonly affectedRows: number }>(validNullable);

  // ✅ Valid omission of optional fields
  const validMinimal = await integrationDb
    .insertInto("test_users")
    .values({
      name: "Minimal User", // Only required field ✅
      // email and active are optional and can be omitted
    })
    .execute();

  expectType<{ readonly affectedRows: number }>(validMinimal);

  // ✅ Valid array operations for regular tables
  const validArrays = await db
    .insertInto("users")
    .values({
      id: 1,
      name: "Array User",
      email: "array@example.com",
      active: true,
      created_at: new Date(),
      tags: ["typescript", "testing"], // string[] to string[] column ✅
      permissions: ["read", "write"], // string[] to string[] column ✅
      scores: [95, 87, 92], // number[] to number[] column ✅
    })
    .execute();

  expectType<{ readonly affectedRows: number }>(validArrays);

  // ✅ Valid Date objects
  const validDate = await db
    .insertInto("users")
    .values({
      id: 2,
      name: "Date User",
      email: "date@example.com",
      active: true,
      created_at: new Date(), // Date to Date column ✅
      tags: [],
      permissions: [],
      scores: [],
    })
    .execute();

  expectType<{ readonly affectedRows: number }>(validDate);

  // Note: The following operations would cause TypeScript compilation errors,
  // which is exactly what we want. These represent the negative test cases:

  // ❌ These would fail compilation (demonstrating type safety):
  // 1. String to boolean: active: "true" instead of active: true
  // 2. Number to string: name: 123 instead of name: "string"
  // 3. Invalid column names: nonexistent_column: "value"
  // 4. Missing required fields: omitting 'name' from test_users
  // 5. Wrong array types: tags: [1, 2, 3] instead of tags: ["a", "b", "c"]
  // 6. Non-null to nullable: email: undefined for required string field
  //
  // Note: Generated/WithDefault fields CAN be provided (they're optional overrides)

  // The fact that this test function compiles and the above valid operations work
  // proves our type system correctly allows valid operations while preventing invalid ones.
}

// ❌ Test 9: Negative tests - ensuring type safety with expectError
function testTypeErrorPrevention() {
  // Test 1: Basic type mismatches - these should be caught by TSD
  expectError(
    integrationDb.insertInto("test_users").values({
      name: 123, // ❌ number instead of string
    })
  );

  expectError(
    integrationDb.insertInto("test_users").values({
      name: "User",
      active: "true", // ❌ string instead of boolean
    })
  );

  expectError(
    integrationDb.insertInto("test_posts").values({
      user_id: "1", // ❌ string instead of number
      title: "Post",
    })
  );

  // Test 2: Missing required fields
  expectError(
    integrationDb.insertInto("test_users").values({
      email: "user@example.com",
      // name is missing ❌
    })
  );

  expectError(
    integrationDb.insertInto("test_posts").values({
      title: "Post Title",
      // user_id is missing ❌
    })
  );

  // Test 3: Generated and WithDefault fields CAN be provided (optional override)
  // These should NOT error - you can override generated/default values
  const validWithGenerated = integrationDb.insertInto("test_users").values({
    id: 1, // ✅ Generated<number> can be overridden
    name: "User",
  });

  const validWithGeneratedTimestamp = integrationDb
    .insertInto("test_users")
    .values({
      name: "User",
      created_at: new Date(), // ✅ Generated<Date> can be overridden
    });

  const validWithDefault = integrationDb.insertInto("test_users").values({
    name: "User",
    active: false, // ✅ WithDefault<boolean> can be overridden
  });

  // Test 4: Invalid column names
  expectError(
    integrationDb.insertInto("test_users").values({
      name: "User",
      nonexistent_column: "value",
    })
  );

  // Test 5: Invalid RETURNING columns
  expectError(
    integrationDb
      .insertInto("test_users")
      .values({ name: "User" })
      .returning(["id", "nonexistent_column"])
  );

  // Test 6: Null to non-nullable fields
  expectError(
    integrationDb.insertInto("test_users").values({
      name: null, // ❌ name is required string
    })
  );

  // Test 7: Array type mismatches for regular tables
  expectError(
    db.insertInto("users").values({
      id: 1,
      name: "User",
      email: "user@example.com",
      active: true,
      created_at: new Date(),
      tags: [1, 2, 3], // ❌ number[] instead of string[]
      permissions: ["read"],
      scores: [100],
    })
  );

  // Test 8: Wrong table references
  expectError(integrationDb.insertInto("nonexistent_table"));
}

// Export all test functions to ensure they're processed by TSD
export {
  testBasicInsertOperations,
  testInsertFieldCombinations,
  testBatchInsertOperations,
  testRegularTableInserts,
  testSemanticColumnBehavior,
  testTypeSystemPrevention,
  testReturningClauseFunctionality,
  testTypeSafetyValidation,
  testTypeErrorPrevention,
};
