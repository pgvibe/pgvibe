// WHERE Clause JSONB Operations Tests
// Tests for JSONB-specific operations in WHERE clauses with expression builder
//
// 🔴 TDD RED STATE: These tests define target behavior for JSONB operations
// Tests cover the jsonb() helper function and PostgreSQL JSONB operators

import {
  expectType,
  expectError,
  expectAssignable,
  db,
} from "../utils/test-helpers.test-d.ts";
import type {
  Database,
  JsonbUserTable,
  JsonbProductTable,
} from "../utils/schemas.test-d.ts";

// =============================================================================
// 1. BASIC JSONB OPERATIONS WITH EXPRESSION BUILDER
// =============================================================================

// ✅ JSONB field access and comparison
async function testJsonbFieldAccess() {
  const result = await db
    .selectFrom("jsonb_users")
    .select(["id", "name", "settings"])
    .where(({ jsonb }) => jsonb("settings").field("theme").equals("dark"))
    .execute();

  expectType<
    Array<{
      id: number;
      name: string;
      settings: any; // JsonbType gets simplified in result
    }>
  >(result);
}

// ✅ JSONB nested field access
async function testJsonbNestedFieldAccess() {
  const result = await db
    .selectFrom("jsonb_users")
    .select(["id", "name", "settings"])
    .where(({ jsonb }) =>
      jsonb("settings").field("notifications").field("email").equals(true)
    )
    .execute();

  expectType<
    Array<{
      id: number;
      name: string;
      settings: any;
    }>
  >(result);
}

// ✅ JSONB path access
async function testJsonbPathAccess() {
  const result = await db
    .selectFrom("jsonb_users")
    .select(["id", "name", "settings"])
    .where(({ jsonb }) =>
      jsonb("settings").path(["notifications", "push"]).equals(true)
    )
    .execute();

  expectType<
    Array<{
      id: number;
      name: string;
      settings: any;
    }>
  >(result);
}

// ✅ JSONB containment operations
async function testJsonbContainment() {
  const result = await db
    .selectFrom("jsonb_users")
    .select(["id", "name", "metadata"])
    .where(({ jsonb }) =>
      jsonb("metadata").contains({ premium: true, plan: "enterprise" })
    )
    .execute();

  expectType<
    Array<{
      id: number;
      name: string;
      metadata: any;
    }>
  >(result);
}

// ✅ JSONB existence checks
async function testJsonbExistence() {
  const result = await db
    .selectFrom("jsonb_users")
    .select(["id", "name", "settings"])
    .where(({ jsonb }) => jsonb("settings").field("theme").exists())
    .execute();

  expectType<
    Array<{
      id: number;
      name: string;
      settings: any;
    }>
  >(result);
}

// =============================================================================
// 2. COMPLEX JSONB OPERATIONS
// =============================================================================

// ✅ Multiple JSONB operations combined with logical operators
async function testMultipleJsonbOperations() {
  const result = await db
    .selectFrom("jsonb_users")
    .select(["id", "name", "settings", "metadata"])
    .where(({ jsonb, and }) =>
      and([
        jsonb("settings").field("theme").equals("dark"),
        jsonb("metadata").contains({ premium: true }),
      ])
    )
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

// ✅ JSONB operations with OR logic
async function testJsonbOperationsWithOr() {
  const result = await db
    .selectFrom("jsonb_products")
    .select(["id", "name", "attributes"])
    .where(({ jsonb, or }) =>
      or([
        jsonb("attributes").field("sale").equals(true),
        jsonb("attributes").field("featured").equals(true),
      ])
    )
    .execute();

  expectType<
    Array<{
      id: number;
      name: string;
      attributes: any;
    }>
  >(result);
}

// ✅ Nested JSONB operations with complex logic
async function testNestedJsonbOperations() {
  const result = await db
    .selectFrom("jsonb_products")
    .select(["id", "name", "attributes", "analytics"])
    .where(({ jsonb, and, or }) =>
      and([
        or([
          jsonb("attributes").field("featured").equals(true),
          jsonb("attributes").field("trending").equals(true),
        ]),
        jsonb("analytics").field("views").equals(1000),
      ])
    )
    .execute();

  expectType<
    Array<{
      id: number;
      name: string;
      attributes: any;
      analytics: any;
    }>
  >(result);
}

// =============================================================================
// 3. JSONB OPERATIONS WITH DIFFERENT DATA TYPES
// =============================================================================

// ✅ JSONB with string values
async function testJsonbStringOperations() {
  const result = await db
    .selectFrom("jsonb_users")
    .select(["id", "name", "settings"])
    .where(({ jsonb }) => jsonb("settings").field("language").equals("en"))
    .execute();

  expectType<
    Array<{
      id: number;
      name: string;
      settings: any;
    }>
  >(result);
}

// ✅ JSONB with number values
async function testJsonbNumberOperations() {
  const result = await db
    .selectFrom("jsonb_products")
    .select(["id", "name", "analytics"])
    .where(({ jsonb }) => jsonb("analytics").field("views").equals(500))
    .execute();

  expectType<
    Array<{
      id: number;
      name: string;
      analytics: any;
    }>
  >(result);
}

// ✅ JSONB with boolean values
async function testJsonbBooleanOperations() {
  const result = await db
    .selectFrom("jsonb_products")
    .select(["id", "name", "attributes"])
    .where(({ jsonb }) => jsonb("attributes").field("sale").equals(false))
    .execute();

  expectType<
    Array<{
      id: number;
      name: string;
      attributes: any;
    }>
  >(result);
}

// =============================================================================
// 4. JSONB OPERATIONS WITH ALIASES
// =============================================================================

// ✅ JSONB operations with table aliases (TDD - should work)
async function testJsonbOperationsWithAliases() {
  const result = await db
    .selectFrom("jsonb_users as ju")
    .select(["ju.id", "ju.name", "ju.settings"])
    .where(({ jsonb }) => jsonb("ju.settings").field("theme").equals("light"))
    .execute();

  expectType<
    Array<{
      id: number;
      name: string;
      settings: any;
    }>
  >(result);
}

// ✅ JSONB operations with joins and aliases (TDD - target state)
async function testJsonbOperationsWithJoinsAndAliases() {
  const result = await db
    .selectFrom("jsonb_users as ju")
    .innerJoin("jsonb_products as jp", "ju.id", "jp.id") // Assuming some relation
    .select(["ju.settings", "jp.attributes"])
    .where(({ jsonb, and }) =>
      and([
        jsonb("ju.settings").field("theme").equals("dark"),
        jsonb("jp.attributes").field("featured").equals(true),
      ])
    )
    .execute();

  expectType<
    Array<{
      settings: any;
      attributes: any;
    }>
  >(result);
}

// =============================================================================
// 5. MIXED JSONB AND REGULAR OPERATIONS
// =============================================================================

// ✅ Combining JSONB operations with regular WHERE conditions
async function testMixedJsonbAndRegularOperations() {
  const result = await db
    .selectFrom("jsonb_users")
    .select(["id", "name", "email", "settings"])
    .where("email", "is not", null) // Regular where
    .where(({ jsonb }) => jsonb("settings").field("theme").equals("dark")) // JSONB operation
    .where("id", ">", 0) // Another regular where
    .execute();

  expectType<
    Array<{
      id: number;
      name: string;
      email: string | null;
      settings: any;
    }>
  >(result);
}

// ✅ JSONB operations with expression builder
async function testJsonbOperationsWithExpressionBuilder() {
  const result = await db
    .selectFrom("jsonb_users")
    .select(["id", "name", "settings"])
    .where(({ eb, jsonb, and }) =>
      and([
        eb("id", ">", 0),
        jsonb("settings").field("notifications").field("email").equals(true),
      ])
    )
    .execute();

  expectType<
    Array<{
      id: number;
      name: string;
      settings: any;
    }>
  >(result);
}

// =============================================================================
// 6. JSONB TEXT OPERATIONS
// =============================================================================

// ✅ JSONB text extraction and comparison
async function testJsonbTextOperations() {
  const result = await db
    .selectFrom("jsonb_users")
    .select(["id", "name", "settings"])
    .where(({ jsonb }) =>
      jsonb("settings").path(["theme"]).asText().equals("dark")
    )
    .execute();

  expectType<
    Array<{
      id: number;
      name: string;
      settings: any;
    }>
  >(result);
}

// ✅ JSONB text operations with NOT EQUALS
async function testJsonbTextNotEquals() {
  const result = await db
    .selectFrom("jsonb_users")
    .select(["id", "name", "settings"])
    .where(({ jsonb }) =>
      jsonb("settings").field("language").asText().notEquals("en")
    )
    .execute();

  expectType<
    Array<{
      id: number;
      name: string;
      settings: any;
    }>
  >(result);
}

// =============================================================================
// 7. ERROR CASES - JSONB OPERATIONS
// =============================================================================

// ❌ Invalid column references in JSONB operations should fail
function testJsonbOperationErrors() {
  // Non-existent column
  expectError(
    db
      .selectFrom("jsonb_users")
      .where(({ jsonb }) => jsonb("nonexistent").field("theme").equals("dark"))
      .selectAll()
  );

  // Non-JSONB column
  expectError(
    db
      .selectFrom("jsonb_users")
      .where(({ jsonb }) => jsonb("name").field("theme").equals("dark")) // name is string, not JSONB
      .selectAll()
  );
}

// ❌ Invalid JSONB field operations
function testInvalidJsonbOperations() {
  // Invalid field access patterns could be tested here
  // The specific errors depend on the implementation
}

// =============================================================================
// 8. ADVANCED JSONB SCENARIOS
// =============================================================================

// ✅ JSONB array field operations
async function testJsonbArrayFields() {
  const result = await db
    .selectFrom("jsonb_users")
    .select(["id", "name", "settings"])
    .where(({ jsonb }) =>
      jsonb("settings").field("features").contains(["notifications", "themes"])
    )
    .execute();

  expectType<
    Array<{
      id: number;
      name: string;
      settings: any;
    }>
  >(result);
}

// ✅ Complex nested JSONB path operations
async function testComplexJsonbPaths() {
  const result = await db
    .selectFrom("jsonb_products")
    .select(["id", "name", "attributes"])
    .where(({ jsonb }) =>
      jsonb("attributes").path(["tags", "0"]).equals("electronics")
    )
    .execute();

  expectType<
    Array<{
      id: number;
      name: string;
      attributes: any;
    }>
  >(result);
}

// ✅ Chaining multiple JSONB operations
async function testChainedJsonbOperations() {
  const result = await db
    .selectFrom("jsonb_users")
    .select(["id", "name", "settings", "metadata"])
    .where(({ jsonb }) => jsonb("settings").field("theme").equals("dark"))
    .where(({ jsonb }) => jsonb("metadata").field("premium").equals(true))
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
