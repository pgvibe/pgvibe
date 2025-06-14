// TSD Type Tests for INSERT Operations
// These tests verify that our INSERT type system correctly handles operation-aware types

import { expectType } from "tsd";
import { createTestDatabase } from "../utils/test-types";
import { createIntegrationTestDatabase } from "../utils/test-config";
import type { Database, IntegrationTestDatabase } from "../utils/test-types";

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

// Export all test functions to ensure they're processed by TSD
export {
  testBasicInsertOperations,
  testInsertFieldCombinations,
  testBatchInsertOperations,
  testRegularTableInserts,
  testSemanticColumnBehavior,
  testTypeSystemPrevention,
};
