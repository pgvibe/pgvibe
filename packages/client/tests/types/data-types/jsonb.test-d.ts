// TypeScript Declaration Tests for JSONB Data Types
// Tests that JSONB columns work correctly with the fluent API and all operations

import { expectType, expectError } from "tsd";
import { createTestDatabase } from "../../utils/test-config";
import type { Database } from "../../utils/test-types";

const db = createTestDatabase();

// =============================================================================
// POSITIVE CASES: JSONB Fluent API Support
// =============================================================================

// ✅ Test 1: Basic JSONB containment operations
async function testBasicJsonbContainment() {
  const result = await db
    .selectFrom("jsonb_users")
    .select(["id", "name", "settings"])
    .where(({ jsonb }) => jsonb("settings").contains({ theme: "dark" }))
    .execute();

  expectType<
    Array<{
      id: number;
      name: string;
      settings: any; // JSONB fields are typed as any in results
    }>
  >(result);
}

// ✅ Test 2: JSONB field access operations
async function testJsonbFieldAccess() {
  const result = await db
    .selectFrom("jsonb_users")
    .select(["id", "name"])
    .where(({ jsonb }) => jsonb("settings").field("theme").equals("light"))
    .execute();

  expectType<
    Array<{
      id: number;
      name: string;
    }>
  >(result);
}

// ✅ Test 3: JSONB nested field access
async function testJsonbNestedFieldAccess() {
  const result = await db
    .selectFrom("jsonb_users")
    .select(["id", "name"])
    .where(({ jsonb }) =>
      jsonb("settings").field("notifications").field("email").equals(true)
    )
    .execute();

  expectType<
    Array<{
      id: number;
      name: string;
    }>
  >(result);
}

// ✅ Test 4: JSONB path operations
async function testJsonbPathOperations() {
  const result = await db
    .selectFrom("jsonb_users")
    .select(["id", "name"])
    .where(({ jsonb }) =>
      jsonb("settings").path(["notifications", "push"]).equals(false)
    )
    .execute();

  expectType<
    Array<{
      id: number;
      name: string;
    }>
  >(result);
}

// ✅ Test 5: JSONB key existence operations
async function testJsonbKeyExistence() {
  const result = await db
    .selectFrom("jsonb_users")
    .select(["id", "name"])
    .where(({ jsonb }) => jsonb("settings").hasKey("theme"))
    .where(({ jsonb }) => jsonb("settings").hasAllKeys(["theme", "language"]))
    .execute();

  expectType<
    Array<{
      id: number;
      name: string;
    }>
  >(result);
}

// ✅ Test 6: JSONB products table operations
async function testJsonbProductsOperations() {
  const result = await db
    .selectFrom("jsonb_products")
    .select(["id", "name", "attributes"])
    .where(({ jsonb }) => jsonb("attributes").field("color").equals("red"))
    .where(({ jsonb }) => jsonb("attributes").contains({ size: "large" }))
    .execute();

  expectType<
    Array<{
      id: number;
      name: string;
      attributes: any;
    }>
  >(result);
}

// ✅ Test 7: JSONB array operations
async function testJsonbArrayOperations() {
  const result = await db
    .selectFrom("jsonb_users")
    .select(["id", "name"])
    .where(({ jsonb }) =>
      jsonb("settings").field("features").contains(["premium"])
    )
    .execute();

  expectType<
    Array<{
      id: number;
      name: string;
    }>
  >(result);
}

// ✅ Test 8: JSONB existence checks
async function testJsonbExistenceChecks() {
  const result = await db
    .selectFrom("jsonb_users")
    .select(["id", "name"])
    .where(({ jsonb }) => jsonb("settings").field("theme").exists())
    .where(({ jsonb }) => jsonb("metadata").path(["premium"]).exists())
    .execute();

  expectType<
    Array<{
      id: number;
      name: string;
    }>
  >(result);
}

// ✅ Test 9: JSONB null checks
async function testJsonbNullChecks() {
  const result = await db
    .selectFrom("jsonb_users")
    .select(["id", "name"])
    .where(({ jsonb }) => jsonb("settings").field("optional_setting").isNull())
    .execute();

  expectType<
    Array<{
      id: number;
      name: string;
    }>
  >(result);
}

// ✅ Test 10: JSONB text extraction
async function testJsonbTextExtraction() {
  const result = await db
    .selectFrom("jsonb_users")
    .select(["id", "name"])
    .where(({ jsonb }) =>
      jsonb("settings").path(["theme"]).asText().equals("dark")
    )
    .execute();

  expectType<
    Array<{
      id: number;
      name: string;
    }>
  >(result);
}

// ✅ Test 11: JSONB complex queries
async function testJsonbComplexQueries() {
  const result = await db
    .selectFrom("jsonb_users")
    .select(["id", "name", "settings", "metadata"])
    .where(({ jsonb, and, or }) => [
      and([
        jsonb("settings").field("theme").equals("dark"),
        or([
          jsonb("settings").field("language").equals("en"),
          jsonb("metadata").hasKey("premium"),
        ]),
      ]),
    ])
    .execute();

  expectType<
    Array<{
      id: number;
      name: string;
      settings: any;
      metadata: any;
    }>
  >(result);
}

// ✅ Test 12: JSONB with JOINs
async function testJsonbWithJoins() {
  const result = await db
    .selectFrom("jsonb_users")
    .innerJoin("jsonb_products", "jsonb_users.id", "jsonb_products.id")
    .select(["jsonb_users.name", "jsonb_products.name"])
    .where(({ jsonb }) => jsonb("settings").field("theme").equals("dark"))
    .where(({ jsonb }) => jsonb("attributes").field("featured").equals(true))
    .execute();

  expectType<
    Array<{
      name: string;
    }>
  >(result);
}

// ✅ Test 13: JSONB analytics operations
async function testJsonbAnalyticsOperations() {
  const result = await db
    .selectFrom("jsonb_products")
    .select(["id", "name"])
    .where(({ jsonb }) => jsonb("analytics").field("views").equals(1000))
    .where(({ jsonb }) => jsonb("analytics").contains({ revenue: 500 }))
    .execute();

  expectType<
    Array<{
      id: number;
      name: string;
    }>
  >(result);
}

// ✅ Test 14: JSONB containedBy operations
async function testJsonbContainedBy() {
  const result = await db
    .selectFrom("jsonb_users")
    .select(["id", "name"])
    .where(({ jsonb }) =>
      jsonb("settings").containedBy({
        theme: "dark",
        language: "en",
        notifications: { email: true, push: false },
      })
    )
    .execute();

  expectType<
    Array<{
      id: number;
      name: string;
    }>
  >(result);
}

// ✅ Test 15: JSONB hasAnyKey operations
async function testJsonbHasAnyKey() {
  const result = await db
    .selectFrom("jsonb_users")
    .select(["id", "name"])
    .where(({ jsonb }) =>
      jsonb("settings").hasAnyKey(["premium", "enterprise", "trial"])
    )
    .execute();

  expectType<
    Array<{
      id: number;
      name: string;
    }>
  >(result);
}

// =============================================================================
// NEGATIVE CASES: These should fail for type safety
// =============================================================================

// ❌ Test 16: Non-JSONB columns should not work with JSONB operations
function testNonJsonbColumnsFailWithJsonbOperations() {
  // Regular string column with JSONB operations (should error)
  expectError(
    db
      .selectFrom("users")
      .select(["name"])
      .where(({ jsonb }) => jsonb("name").field("theme").equals("dark"))
  );

  // Regular number column with JSONB operations (should error)
  expectError(
    db
      .selectFrom("users")
      .select(["id"])
      .where(({ jsonb }) => jsonb("id").contains({ value: 123 }))
  );

  // Regular boolean column with JSONB operations (should error)
  expectError(
    db
      .selectFrom("users")
      .select(["active"])
      .where(({ jsonb }) => jsonb("active").hasKey("enabled"))
  );
}

// ❌ Test 17: Invalid column names should fail
function testInvalidJsonbColumnNames() {
  // Non-existent column (should error)
  expectError(
    db
      .selectFrom("jsonb_users")
      .select(["id"])
      .where(({ jsonb }) => jsonb("nonexistent_column").hasKey("theme"))
  );

  // Column from wrong table (should error)
  expectError(
    db
      .selectFrom("jsonb_users")
      .select(["id"])
      .where(({ jsonb }) => jsonb("attributes").field("color").equals("red"))
  );
}

// ❌ Test 18: Cross-table column confusion
function testCrossTableJsonbColumnConfusion() {
  // Using jsonb_products columns on jsonb_users table (should error)
  expectError(
    db
      .selectFrom("jsonb_users")
      .select(["id"])
      .where(({ jsonb }) => jsonb("analytics").field("views").equals(100))
  );

  // Using jsonb_users columns on jsonb_products table (should error)
  expectError(
    db
      .selectFrom("jsonb_products")
      .select(["id"])
      .where(({ jsonb }) => jsonb("settings").field("theme").equals("dark"))
  );
}

// =============================================================================
// EDGE CASES: Complex JSONB scenarios
// =============================================================================

// ✅ Test 19: JSONB with ORDER BY
async function testJsonbWithOrderBy() {
  const result = await db
    .selectFrom("jsonb_users")
    .select(["id", "name"])
    .where(({ jsonb }) => jsonb("settings").field("theme").equals("dark"))
    .orderBy("name", "asc")
    .execute();

  expectType<
    Array<{
      id: number;
      name: string;
    }>
  >(result);
}

// ✅ Test 20: JSONB with LIMIT and OFFSET
async function testJsonbWithLimitOffset() {
  const result = await db
    .selectFrom("jsonb_users")
    .select(["id", "name"])
    .where(({ jsonb }) => jsonb("metadata").hasKey("premium"))
    .limit(10)
    .offset(20)
    .execute();

  expectType<
    Array<{
      id: number;
      name: string;
    }>
  >(result);
}

// ✅ Test 21: JSONB deeply nested operations
async function testJsonbDeeplyNested() {
  const result = await db
    .selectFrom("jsonb_users")
    .select(["id", "name"])
    .where(({ jsonb }) =>
      jsonb("settings").field("notifications").field("email").equals(true)
    )
    .execute();

  expectType<
    Array<{
      id: number;
      name: string;
    }>
  >(result);
}

// ✅ Test 22: JSONB with complex path arrays
async function testJsonbComplexPaths() {
  const result = await db
    .selectFrom("jsonb_users")
    .select(["id", "name"])
    .where(({ jsonb }) =>
      jsonb("metadata").path(["user", "preferences", "theme"]).exists()
    )
    .execute();

  expectType<
    Array<{
      id: number;
      name: string;
    }>
  >(result);
}

// ✅ Test 23: JSONB mixed operations
async function testJsonbMixedOperations() {
  const result = await db
    .selectFrom("jsonb_users")
    .select(["id", "name"])
    .where(({ jsonb, and }) => [
      and([
        jsonb("settings").hasKey("theme"),
        jsonb("settings").field("theme").equals("dark"),
        jsonb("metadata").contains({ premium: true }),
      ]),
    ])
    .execute();

  expectType<
    Array<{
      id: number;
      name: string;
    }>
  >(result);
}

// Export test functions
export {
  testBasicJsonbContainment,
  testJsonbFieldAccess,
  testJsonbNestedFieldAccess,
  testJsonbPathOperations,
  testJsonbKeyExistence,
  testJsonbProductsOperations,
  testJsonbArrayOperations,
  testJsonbExistenceChecks,
  testJsonbNullChecks,
  testJsonbTextExtraction,
  testJsonbComplexQueries,
  testJsonbWithJoins,
  testJsonbAnalyticsOperations,
  testJsonbContainedBy,
  testJsonbHasAnyKey,
  testNonJsonbColumnsFailWithJsonbOperations,
  testInvalidJsonbColumnNames,
  testCrossTableJsonbColumnConfusion,
  testJsonbWithOrderBy,
  testJsonbWithLimitOffset,
  testJsonbDeeplyNested,
  testJsonbComplexPaths,
  testJsonbMixedOperations,
};
