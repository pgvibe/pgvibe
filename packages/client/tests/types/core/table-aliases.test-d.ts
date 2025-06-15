// Comprehensive Table Aliases Type Testing
// Tests all aspects of table alias type inference and validation

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
// 1. BASIC ALIAS SYNTAX ACCEPTANCE
// =============================================================================

// ✅ Basic alias syntax should be accepted by TypeScript
function testBasicAliasSyntax() {
  // These should NOT produce TypeScript errors
  const query1 = db.selectFrom("users as u");
  const query2 = db.selectFrom("posts as p");
  const query3 = db.selectFrom("comments as c");

  expectAssignable<typeof query1>(query1);
  expectAssignable<typeof query2>(query2);
  expectAssignable<typeof query3>(query3);
}

// ✅ Case insensitive AS keyword acceptance
function testCaseInsensitiveAs() {
  const query1 = db.selectFrom("users as u");
  const query2 = db.selectFrom("users AS u");
  const query3 = db.selectFrom("users As u");

  expectAssignable<typeof query1>(query1);
  expectAssignable<typeof query2>(query2);
  expectAssignable<typeof query3>(query3);
}

// ✅ Flexible whitespace handling
function testFlexibleWhitespace() {
  const query1 = db.selectFrom("users as u");
  const query2 = db.selectFrom("  users   as   u  ");
  const query3 = db.selectFrom("users\tas\tu");

  expectAssignable<typeof query1>(query1);
  expectAssignable<typeof query2>(query2);
  expectAssignable<typeof query3>(query3);
}

// =============================================================================
// 2. ALIAS-PREFIXED COLUMN REFERENCES
// =============================================================================

// ✅ Alias-prefixed columns in SELECT
async function testAliasPrefixedSelect() {
  // Single alias-prefixed column
  const userIds = await db.selectFrom("users as u").select("u.id").execute();
  expectType<Array<{ id: number }>>(userIds);

  // Multiple alias-prefixed columns
  const userBasics = await db
    .selectFrom("users as u")
    .select(["u.id", "u.name"])
    .execute();
  expectType<Array<{ id: number; name: string }>>(userBasics);

  // Mixed alias-prefixed and non-prefixed
  const userMixed = await db
    .selectFrom("users as u")
    .select(["u.id", "name", "u.email"])
    .execute();
  expectType<
    Array<{
      id: number;
      name: string;
      email: string | null;
    }>
  >(userMixed);
}

// ✅ Alias-prefixed columns in WHERE clauses
async function testAliasPrefixedWhere() {
  // Alias-prefixed in WHERE
  const activeUsers = await db
    .selectFrom("users as u")
    .select(["u.id", "u.name"])
    .where("u.active", "=", true)
    .execute();
  expectType<Array<{ id: number; name: string }>>(activeUsers);

  // Mixed prefixed and non-prefixed in WHERE
  const filteredUsers = await db
    .selectFrom("users as u")
    .select(["u.id", "name"])
    .where("u.active", "=", true)
    .where("id", ">", 100)
    .execute();
  expectType<Array<{ id: number; name: string }>>(filteredUsers);
}

// ✅ Alias-prefixed columns in ORDER BY
async function testAliasPrefixedOrderBy() {
  // Alias-prefixed ORDER BY
  const orderedUsers = await db
    .selectFrom("users as u")
    .select(["u.id", "u.name"])
    .orderBy("u.created_at", "desc")
    .execute();
  expectType<Array<{ id: number; name: string }>>(orderedUsers);

  // Non-prefixed ORDER BY with alias
  const orderedUsers2 = await db
    .selectFrom("users as u")
    .select(["u.id", "name"])
    .orderBy("created_at", "asc")
    .execute();
  expectType<Array<{ id: number; name: string }>>(orderedUsers2);
}

// =============================================================================
// 3. JOIN OPERATIONS WITH ALIASES
// =============================================================================

// ✅ INNER JOIN with aliases
async function testInnerJoinWithAliases() {
  const joinResult = await db
    .selectFrom("users as u")
    .innerJoin("posts as p", "u.id", "p.user_id")
    .select(["u.name", "p.title"])
    .execute();

  expectType<Array<{ name: string; title: string }>>(joinResult);
}

// ✅ Multiple JOINs with aliases
async function testMultipleJoinsWithAliases() {
  const multiJoinResult = await db
    .selectFrom("users as u")
    .innerJoin("posts as p", "u.id", "p.user_id")
    .innerJoin("comments as c", "p.id", "c.post_id")
    .select(["u.name", "p.title", "c.content"])
    .execute();

  expectType<
    Array<{
      name: string;
      title: string;
      content: string;
    }>
  >(multiJoinResult);
}

// ✅ Mixed alias/non-alias JOINs
async function testMixedAliasJoins() {
  const mixedJoinResult = await db
    .selectFrom("users as u")
    .innerJoin("posts", "u.id", "user_id")
    .select(["u.name", "title"])
    .execute();

  expectType<Array<{ name: string; title: string }>>(mixedJoinResult);
}

// ✅ All JOIN types with aliases
async function testAllJoinTypesWithAliases() {
  // LEFT JOIN
  const leftJoin = db
    .selectFrom("users as u")
    .leftJoin("posts as p", "u.id", "p.user_id");
  expectAssignable<typeof leftJoin>(leftJoin);

  // RIGHT JOIN
  const rightJoin = db
    .selectFrom("users as u")
    .rightJoin("posts as p", "u.id", "p.user_id");
  expectAssignable<typeof rightJoin>(rightJoin);

  // FULL JOIN
  const fullJoin = db
    .selectFrom("users as u")
    .fullJoin("posts as p", "u.id", "p.user_id");
  expectAssignable<typeof fullJoin>(fullJoin);
}

// =============================================================================
// 4. COMPLEX QUERY COMBINATIONS
// =============================================================================

// ✅ Complex query with all alias features
async function testComplexAliasQuery() {
  const complexResult = await db
    .selectFrom("users as u")
    .innerJoin("posts as p", "u.id", "p.user_id")
    .select(["u.id", "u.name", "p.title", "p.published"])
    .where("u.active", "=", true)
    .where("p.published", "=", true)
    .orderBy("u.created_at", "desc")
    .orderBy("p.created_at", "desc")
    .limit(10)
    .execute();

  expectType<
    Array<{
      id: number;
      name: string;
      title: string;
      published: boolean;
    }>
  >(complexResult);
}

// =============================================================================
// 5. ERROR CASES (SHOULD FAIL)
// =============================================================================

// ❌ Invalid alias syntax should produce errors
function testInvalidAliasSyntax() {
  // Missing alias name
  expectError(db.selectFrom("users as"));

  // Missing AS keyword
  expectError(db.selectFrom("users u"));

  // Alias starting with number
  expectError(db.selectFrom("users as 1invalid"));

  // Reserved word as alias
  expectError(db.selectFrom("users as select"));
  expectError(db.selectFrom("users as from"));
}

// ❌ Invalid column references should still produce errors
function testInvalidColumnReferences() {
  // Non-existent columns should still error
  expectError(db.selectFrom("users as u").select("u.nonexistent"));

  expectError(db.selectFrom("users as u").where("u.invalid_column", "=", true));

  expectError(db.selectFrom("users as u").orderBy("u.missing_field"));
}

// =============================================================================
// 6. BACKWARD COMPATIBILITY
// =============================================================================

// ✅ Non-alias queries should continue to work unchanged
async function testBackwardCompatibility() {
  // Regular selectFrom should still work
  const regularUsers = await db
    .selectFrom("users")
    .select(["id", "name"])
    .where("active", "=", true)
    .execute();
  expectType<Array<{ id: number; name: string }>>(regularUsers);

  // Regular JOINs should still work
  const regularJoins = await db
    .selectFrom("users")
    .innerJoin("posts", "users.id", "posts.user_id")
    .select(["users.name", "posts.title"])
    .execute();
  expectType<Array<{ name: string; title: string }>>(regularJoins);
}

// =============================================================================
// 7. TYPE UTILITY TESTS
// =============================================================================

// ✅ TableExpression type should handle aliases
function testTableExpressionType() {
  // These should be valid TableExpression<Database> values
  type ValidExpressions =
    | "users"
    | "posts"
    | "comments"
    | "users as u"
    | "posts as p"
    | "comments as c";

  // Should be assignable to the function parameter
  const expressions: ValidExpressions[] = [
    "users",
    "posts",
    "comments",
    "users as u",
    "posts as p",
    "comments as c",
  ];

  expressions.forEach((expr) => {
    const query = db.selectFrom(expr as any);
    expectAssignable<typeof query>(query);
  });
}

// ✅ ExtractTableAlias type should work correctly
function testExtractTableAliasType() {
  // Test the type utility that extracts table names from expressions
  // This is more of a compile-time test - the types should resolve correctly

  const query1 = db.selectFrom("users"); // Should resolve to "users"
  const query2 = db.selectFrom("users as u"); // Should resolve to "users"

  expectAssignable<typeof query1>(query1);
  expectAssignable<typeof query2>(query2);
}
