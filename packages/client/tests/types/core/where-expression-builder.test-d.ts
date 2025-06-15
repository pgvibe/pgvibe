// WHERE Clause Expression Builder Tests
// Tests for expression builder (eb) functionality with type safety and aliases
//
// 🔴 TDD RED STATE: Many tests currently fail with type errors
// These failing tests define the target behavior for alias support in expression builder
// The type system should eventually support "u.column" syntax in eb() functions

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
// 1. BASIC EXPRESSION BUILDER FUNCTIONALITY
// =============================================================================

// ✅ Basic eb function usage
async function testBasicExpressionBuilder() {
  const result = await db
    .selectFrom("users")
    .select(["id", "name", "active"])
    .where(({ eb }) => eb("active", "=", true))
    .execute();

  expectType<Array<{ id: number; name: string; active: boolean }>>(result);
}

// ✅ Multiple eb conditions chained
async function testMultipleEbConditions() {
  const result = await db
    .selectFrom("users")
    .select(["id", "name", "email"])
    .where(({ eb }) => eb("active", "=", true))
    .where(({ eb }) => eb("id", ">", 10))
    .where(({ eb }) => eb("email", "is not", null))
    .execute();

  expectType<Array<{ id: number; name: string; email: string | null }>>(result);
}

// ✅ Different operators with eb
async function testEbOperators() {
  // Equality operators
  const eq = await db
    .selectFrom("users")
    .where(({ eb }) => eb("id", "=", 1))
    .selectAll()
    .execute();

  // Comparison operators
  const gt = await db
    .selectFrom("users")
    .where(({ eb }) => eb("id", ">", 1))
    .selectAll()
    .execute();

  // String operators
  const like = await db
    .selectFrom("users")
    .where(({ eb }) => eb("name", "like", "John%"))
    .selectAll()
    .execute();

  // Array operators
  const inOp = await db
    .selectFrom("users")
    .where(({ eb }) => eb("id", "in", [1, 2, 3]))
    .selectAll()
    .execute();

  // Null operators
  const isNull = await db
    .selectFrom("users")
    .where(({ eb }) => eb("email", "is", null))
    .selectAll()
    .execute();

  expectType<typeof eq>(gt);
  expectType<typeof eq>(like);
  expectType<typeof eq>(inOp);
  expectType<typeof eq>(isNull);
}

// =============================================================================
// 2. EXPRESSION BUILDER WITH ALIASES
// =============================================================================

// ✅ Basic alias usage with eb function (TDD - should work once alias support is complete)
async function testEbWithBasicAlias() {
  const result = await db
    .selectFrom("users as u")
    .select(["u.id", "u.name", "u.active"])
    .where(({ eb }) => eb("u.active", "=", true))
    .execute();

  expectType<Array<{ id: number; name: string; active: boolean }>>(result);
}

// ✅ Mixed alias and non-alias columns with eb (TDD - should work)
async function testEbWithMixedAliasReferences() {
  const result = await db
    .selectFrom("users as u")
    .select(["u.id", "u.name"])
    .where(({ eb }) => eb("u.active", "=", true))
    .where(({ eb }) => eb("email", "is not", null)) // Non-prefixed column
    .execute();

  expectType<Array<{ id: number; name: string }>>(result);
}

// ✅ Multiple tables with aliases and eb (TDD - should work once implemented)
async function testEbWithMultipleAliases() {
  const result = await db
    .selectFrom("posts as p")
    .innerJoin("users as u", "p.user_id", "u.id")
    .select(["p.id", "p.title", "u.name"])
    .where(({ eb }) => eb("p.published", "=", true))
    .where(({ eb }) => eb("u.active", "=", true))
    .execute();

  expectType<Array<{ id: number; title: string; name: string }>>(result);
}

// ✅ Complex WHERE with aliases and different operators (TDD - target state)
async function testEbAliasComplexOperators() {
  const result = await db
    .selectFrom("posts as p")
    .innerJoin("users as u", "p.user_id", "u.id")
    .select(["p.id", "p.title", "u.name"])
    .where(({ eb }) => eb("p.published", "=", true))
    .where(({ eb }) => eb("u.active", "=", true))
    .where(({ eb }) => eb("p.title", "like", "%typescript%"))
    .where(({ eb }) => eb("u.id", "in", [1, 2, 3]))
    .execute();

  expectType<Array<{ id: number; title: string; name: string }>>(result);
}

// ✅ Alias with array columns and eb
async function testEbAliasWithArrays() {
  const result = await db
    .selectFrom("users as u")
    .select(["u.id", "u.name", "u.tags"])
    .where(({ eb }) => eb("u.active", "=", true))
    .execute();

  expectType<Array<{ id: number; name: string; tags: string[] }>>(result);
}

// =============================================================================
// 3. COMPLEX EXPRESSION BUILDER SCENARIOS
// =============================================================================

// ✅ Nested query with eb and aliases
async function testNestedEbWithAliases() {
  const result = await db
    .selectFrom("users as u")
    .innerJoin("posts as p", "u.id", "p.user_id")
    .innerJoin("comments as c", "p.id", "c.post_id")
    .select(["u.name", "p.title", "c.content"])
    .where(({ eb }) => eb("u.active", "=", true))
    .where(({ eb }) => eb("p.published", "=", true))
    .where(({ eb }) => eb("c.content", "like", "%great%"))
    .execute();

  expectType<Array<{ name: string; title: string; content: string }>>(result);
}

// ✅ Mixed regular where and eb where
async function testMixedWhereAndEb() {
  const result = await db
    .selectFrom("posts as p")
    .select(["p.id", "p.title"])
    .where("p.published", "=", true) // Regular where
    .where(({ eb }) => eb("p.user_id", ">", 5)) // Expression builder where
    .execute();

  expectType<Array<{ id: number; title: string }>>(result);
}

// ✅ Different column types with eb and aliases
async function testEbAliasColumnTypes() {
  const result = await db
    .selectFrom("posts as p")
    .select(["p.id", "p.title", "p.published", "p.created_at"])
    .where(({ eb }) => eb("p.id", "=", 42)) // number
    .where(({ eb }) => eb("p.title", "=", "Test")) // string
    .where(({ eb }) => eb("p.published", "=", true)) // boolean
    .where(({ eb }) => eb("p.created_at", ">", new Date())) // Date
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

// =============================================================================
// 4. ERROR CASES - EXPRESSION BUILDER
// =============================================================================

// ❌ Wrong table prefix with eb should fail
function testEbWrongTablePrefix() {
  // Using original table name when alias is defined
  expectError(
    db
      .selectFrom("users as u")
      .where(({ eb }) => eb("users.id", "=", 1))
      .selectAll()
  );

  // Using wrong alias
  expectError(
    db
      .selectFrom("users as u")
      .where(({ eb }) => eb("x.id", "=", 1))
      .selectAll()
  );
}

// ❌ Invalid columns with eb should fail
function testEbInvalidColumns() {
  // Non-existent column with alias
  expectError(
    db
      .selectFrom("users as u")
      .where(({ eb }) => eb("u.nonexistent", "=", "value"))
      .selectAll()
  );

  // Non-existent column without prefix
  expectError(
    db
      .selectFrom("users as u")
      .where(({ eb }) => eb("nonexistent", "=", "value"))
      .selectAll()
  );
}

// ❌ Type mismatches with eb should fail
function testEbTypeMismatches() {
  // Wrong value type for column
  expectError(
    db
      .selectFrom("users as u")
      .where(({ eb }) => eb("u.id", "=", "not_a_number"))
      .selectAll()
  );

  // Boolean column with string value
  expectError(
    db
      .selectFrom("users as u")
      .where(({ eb }) => eb("u.active", "=", "not_boolean"))
      .selectAll()
  );
}

// ❌ Invalid operators with eb should fail
function testEbInvalidOperators() {
  // Using LIKE on number column
  expectError(
    db
      .selectFrom("users as u")
      .where(({ eb }) => eb("u.id", "like", "%123%"))
      .selectAll()
  );

  // Using comparison operators on boolean
  expectError(
    db
      .selectFrom("users as u")
      .where(({ eb }) => eb("u.active", ">", true))
      .selectAll()
  );
}
