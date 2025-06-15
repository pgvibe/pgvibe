// Table Aliases Type Tests - Comprehensive TDD Suite
// This file tests all aspects of table alias functionality with proper type validation

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
// 1. BASIC ALIAS FUNCTIONALITY
// =============================================================================

// ✅ Basic table alias syntax should work
async function testBasicAliasSyntax() {
  // Single table with alias
  const users = await db.selectFrom("users as u").selectAll().execute();
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

  // Different tables with aliases
  const posts = await db.selectFrom("posts as p").selectAll().execute();
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
}

// ✅ Alias-prefixed column selection
async function testAliasPrefixedColumns() {
  // Single column with alias prefix
  const userIds = await db.selectFrom("users as u").select("u.id").execute();
  expectType<Array<{ id: number }>>(userIds);

  // Multiple columns with alias prefix
  const userBasics = await db
    .selectFrom("users as u")
    .select(["u.id", "u.name"])
    .execute();
  expectType<Array<{ id: number; name: string }>>(userBasics);

  // Mixed types with alias prefix
  const userMixed = await db
    .selectFrom("users as u")
    .select(["u.id", "u.email", "u.active"])
    .execute();
  expectType<
    Array<{
      id: number;
      email: string | null;
      active: boolean;
    }>
  >(userMixed);
}

// ✅ Non-prefixed columns should work with aliases (flexible referencing)
async function testFlexibleColumnReferencing() {
  // Mix of alias-prefixed and non-prefixed columns
  const mixed = await db
    .selectFrom("users as u")
    .select(["u.id", "name", "u.email", "active"])
    .execute();
  expectType<
    Array<{
      id: number;
      name: string;
      email: string | null;
      active: boolean;
    }>
  >(mixed);

  // All non-prefixed columns with alias
  const nonPrefixed = await db
    .selectFrom("users as u")
    .select(["id", "name", "email"])
    .execute();
  expectType<
    Array<{
      id: number;
      name: string;
      email: string | null;
    }>
  >(nonPrefixed);
}

// =============================================================================
// 2. ALIAS WITH QUERY OPERATIONS
// =============================================================================

// ✅ WHERE clauses with aliases
async function testAliasInWhere() {
  // Alias-prefixed WHERE conditions
  const activeUsers = await db
    .selectFrom("users as u")
    .select(["u.id", "u.name"])
    .where("u.active", "=", true)
    .execute();
  expectType<Array<{ id: number; name: string }>>(activeUsers);

  // Non-prefixed WHERE conditions with alias
  const usersByEmail = await db
    .selectFrom("users as u")
    .select(["u.id", "u.name"])
    .where("email", "like", "%@example.com")
    .execute();
  expectType<Array<{ id: number; name: string }>>(usersByEmail);

  // Mixed WHERE conditions
  const complexWhere = await db
    .selectFrom("users as u")
    .select(["u.id", "u.name"])
    .where("u.active", "=", true)
    .where("email", "is not", null)
    .execute();
  expectType<Array<{ id: number; name: string }>>(complexWhere);
}

// ✅ ORDER BY with aliases
async function testAliasInOrderBy() {
  // Alias-prefixed ORDER BY
  const orderedByAlias = await db
    .selectFrom("users as u")
    .select(["u.id", "u.name"])
    .orderBy("u.created_at", "desc")
    .execute();
  expectType<Array<{ id: number; name: string }>>(orderedByAlias);

  // Non-prefixed ORDER BY with alias
  const orderedNonPrefixed = await db
    .selectFrom("users as u")
    .select(["u.id", "u.name"])
    .orderBy("name", "asc")
    .execute();
  expectType<Array<{ id: number; name: string }>>(orderedNonPrefixed);
}

// ✅ Complex query chaining with aliases
async function testComplexAliasChaining() {
  const complexQuery = await db
    .selectFrom("posts as p")
    .select(["p.id", "p.title", "p.published"])
    .where("p.published", "=", true)
    .where("user_id", "=", 123)
    .orderBy("p.created_at", "desc")
    .limit(10)
    .execute();

  expectType<
    Array<{
      id: number;
      title: string;
      published: boolean;
    }>
  >(complexQuery);
}

// =============================================================================
// 3. ERROR CASES - WHAT SHOULD FAIL
// =============================================================================

// ❌ Invalid alias syntax should fail
function testInvalidAliasSyntax() {
  // Multiple "as" keywords
  expectError(db.selectFrom("users as u as x"));

  // Empty alias
  expectError(db.selectFrom("users as "));

  // Invalid characters in alias
  expectError(db.selectFrom("users as u-ser"));
  expectError(db.selectFrom("users as 123"));
}

// ❌ Wrong table prefix should fail when using aliases
function testWrongTablePrefix() {
  // Using original table name when alias is defined
  expectError(db.selectFrom("users as u").select("users.id"));

  // Using wrong alias
  expectError(db.selectFrom("users as u").select("x.id"));
}

// ❌ Invalid columns should still fail
function testInvalidColumns() {
  // Non-existent column with alias
  expectError(db.selectFrom("users as u").select("u.nonexistent"));

  // Non-existent column without prefix
  expectError(db.selectFrom("users as u").select("nonexistent"));
}

// =============================================================================
// 4. EDGE CASES
// =============================================================================

// ✅ Case sensitivity in aliases
async function testCaseSensitivity() {
  // Lowercase alias
  const lowercase = await db
    .selectFrom("users as u")
    .select(["u.id", "u.name"])
    .execute();
  expectType<Array<{ id: number; name: string }>>(lowercase);

  // Uppercase alias
  const uppercase = await db
    .selectFrom("users as U")
    .select(["U.id", "U.name"])
    .execute();
  expectType<Array<{ id: number; name: string }>>(uppercase);
}

// ✅ Single character aliases
async function testSingleCharAliases() {
  const singleChar = await db
    .selectFrom("users as u")
    .select(["u.id", "u.name"])
    .execute();
  expectType<Array<{ id: number; name: string }>>(singleChar);
}

// ✅ Longer aliases
async function testLongerAliases() {
  const longerAlias = await db
    .selectFrom("users as user_table")
    .select(["user_table.id", "user_table.name"])
    .execute();
  expectType<Array<{ id: number; name: string }>>(longerAlias);
}

// =============================================================================
// 5. COMPATIBILITY WITH NON-ALIAS QUERIES (REGRESSION TESTS)
// =============================================================================

// ✅ Non-alias queries should still work (regression test)
async function testNonAliasCompatibility() {
  // Basic non-alias query
  const basic = await db.selectFrom("users").select(["id", "name"]).execute();
  expectType<Array<{ id: number; name: string }>>(basic);

  // Complex non-alias query
  const complex = await db
    .selectFrom("users")
    .select(["id", "name", "email"])
    .where("active", "=", true)
    .orderBy("created_at", "desc")
    .execute();
  expectType<
    Array<{
      id: number;
      name: string;
      email: string | null;
    }>
  >(complex);
}

// =============================================================================
// 6. TDD STATUS SUMMARY
// =============================================================================

/*
🎯 TDD TEST STATUS:

✅ WHAT SHOULD WORK (Target Green State):
- Basic alias syntax: db.selectFrom("users as u")
- Alias-prefixed columns: select(["u.id", "u.name"])
- Non-prefixed columns with aliases: select(["id", "name"])
- Mixed column references: select(["u.id", "name"])
- WHERE/ORDER BY with aliases
- Complex query chaining
- Error cases for invalid syntax
- Non-alias queries (regression protection)

❌ CURRENT RED STATE:
- Many type errors showing what needs to be fixed
- "Type string is not assignable to type never" - core issue
- Basic non-alias queries broken

🎯 TDD APPROACH:
1. RED: Run `bun run test:types` - see current failures
2. GREEN: Fix the ColumnReference type system
3. REFACTOR: Ensure all tests pass

This comprehensive test suite will guide us to the correct implementation.
*/
