// WHERE Clause Logical Operations Tests
// Tests for AND, OR, NOT operations with expression builder
//
// 🔴 TDD RED STATE: These tests define target behavior for logical operations
// Current status: Many logical combinations may not be fully implemented

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
// 1. BASIC LOGICAL OPERATIONS WITH EXPRESSION BUILDER
// =============================================================================

// ✅ AND operations with expression builder
async function testEbAndOperations() {
  const result = await db
    .selectFrom("users")
    .select(["id", "name", "email", "active"])
    .where(({ eb, and }) =>
      and([
        eb("active", "=", true),
        eb("email", "is not", null),
        eb("id", ">", 0),
      ])
    )
    .execute();

  expectType<
    Array<{
      id: number;
      name: string;
      email: string | null;
      active: boolean;
    }>
  >(result);
}

// ✅ OR operations with expression builder
async function testEbOrOperations() {
  const result = await db
    .selectFrom("users")
    .select(["id", "name", "email"])
    .where(({ eb, or }) =>
      or([
        eb("name", "like", "John%"),
        eb("name", "like", "Jane%"),
        eb("email", "like", "%@admin.com"),
      ])
    )
    .execute();

  expectType<
    Array<{
      id: number;
      name: string;
      email: string | null;
    }>
  >(result);
}

// ✅ NOT operations with expression builder
async function testEbNotOperations() {
  const result = await db
    .selectFrom("users")
    .select(["id", "name", "active"])
    .where(({ eb, not }) => not(eb("active", "=", false)))
    .execute();

  expectType<
    Array<{
      id: number;
      name: string;
      active: boolean;
    }>
  >(result);
}

// =============================================================================
// 2. COMPLEX LOGICAL COMBINATIONS
// =============================================================================

// ✅ Nested AND/OR combinations
async function testEbNestedLogicalOperations() {
  const result = await db
    .selectFrom("users")
    .select(["id", "name", "email", "active"])
    .where(({ eb, and, or }) =>
      and([
        eb("active", "=", true),
        or([
          eb("name", "like", "Admin%"),
          eb("email", "like", "%@company.com"),
        ]),
      ])
    )
    .execute();

  expectType<
    Array<{
      id: number;
      name: string;
      email: string | null;
      active: boolean;
    }>
  >(result);
}

// ✅ Complex nested logical operations
async function testEbComplexNested() {
  const result = await db
    .selectFrom("posts")
    .select(["id", "title", "published", "user_id"])
    .where(({ eb, and, or, not }) =>
      and([
        eb("published", "=", true),
        or([
          and([
            eb("title", "like", "%TypeScript%"),
            eb("user_id", "in", [1, 2, 3]),
          ]),
          and([
            eb("title", "like", "%JavaScript%"),
            not(eb("user_id", "=", 999)),
          ]),
        ]),
      ])
    )
    .execute();

  expectType<
    Array<{
      id: number;
      title: string;
      published: boolean;
      user_id: number;
    }>
  >(result);
}

// ✅ Multiple NOT operations
async function testEbMultipleNotOperations() {
  const result = await db
    .selectFrom("users")
    .select(["id", "name", "email"])
    .where(({ eb, and, not }) =>
      and([
        not(eb("active", "=", false)),
        not(eb("email", "is", null)),
        not(eb("name", "like", "test%")),
      ])
    )
    .execute();

  expectType<
    Array<{
      id: number;
      name: string;
      email: string | null;
    }>
  >(result);
}

// =============================================================================
// 3. LOGICAL OPERATIONS WITH ALIASES
// =============================================================================

// ✅ AND operations with table aliases (TDD - should work)
async function testEbAndWithAliases() {
  const result = await db
    .selectFrom("users as u")
    .select(["u.id", "u.name", "u.active"])
    .where(({ eb, and }) =>
      and([
        eb("u.active", "=", true),
        eb("u.id", ">", 0),
        eb("email", "is not", null), // Mixed with non-prefixed
      ])
    )
    .execute();

  expectType<
    Array<{
      id: number;
      name: string;
      active: boolean;
    }>
  >(result);
}

// ✅ Complex logical operations with joins and aliases (TDD - target state)
async function testEbLogicalWithJoinsAndAliases() {
  const result = await db
    .selectFrom("posts as p")
    .innerJoin("users as u", "p.user_id", "u.id")
    .select(["p.id", "p.title", "u.name"])
    .where(({ eb, and, or }) =>
      and([
        eb("p.published", "=", true),
        eb("u.active", "=", true),
        or([
          eb("p.title", "like", "%TypeScript%"),
          eb("u.name", "like", "Admin%"),
        ]),
      ])
    )
    .execute();

  expectType<
    Array<{
      id: number;
      title: string;
      name: string;
    }>
  >(result);
}

// =============================================================================
// 4. MIXED LOGICAL AND REGULAR WHERE OPERATIONS
// =============================================================================

// ✅ Mixing logical operations with regular where clauses
async function testMixedLogicalAndRegularWhere() {
  const result = await db
    .selectFrom("posts")
    .select(["id", "title", "published"])
    .where("published", "=", true) // Regular where
    .where(({ eb, or }) =>
      or([eb("title", "like", "%React%"), eb("title", "like", "%Vue%")])
    ) // Logical where
    .where("user_id", ">", 0) // Another regular where
    .execute();

  expectType<
    Array<{
      id: number;
      title: string;
      published: boolean;
    }>
  >(result);
}

// ✅ Chaining multiple logical operations
async function testChainedLogicalOperations() {
  const result = await db
    .selectFrom("users")
    .select(["id", "name", "email", "active"])
    .where(({ eb, and }) => and([eb("active", "=", true), eb("id", ">", 0)]))
    .where(({ eb, or }) =>
      or([eb("name", "like", "John%"), eb("email", "like", "%@admin.com")])
    )
    .execute();

  expectType<
    Array<{
      id: number;
      name: string;
      email: string | null;
      active: boolean;
    }>
  >(result);
}

// =============================================================================
// 5. LOGICAL OPERATIONS WITH DIFFERENT COLUMN TYPES
// =============================================================================

// ✅ Logical operations with different data types
async function testEbLogicalWithVariousTypes() {
  const result = await db
    .selectFrom("posts")
    .select(["id", "title", "published", "created_at", "categories"])
    .where(({ eb, and, or }) =>
      and([
        eb("published", "=", true), // boolean
        eb("id", ">", 5), // number
        eb("created_at", ">", new Date("2024-01-01")), // Date
        or([
          eb("title", "like", "%TypeScript%"), // string
          eb("categories", "!=", []), // array (empty check might not work exactly like this)
        ]),
      ])
    )
    .execute();

  expectType<
    Array<{
      id: number;
      title: string;
      published: boolean;
      created_at: Date;
      categories: string[];
    }>
  >(result);
}

// =============================================================================
// 6. ERROR CASES - LOGICAL OPERATIONS
// =============================================================================

// ❌ Invalid column references in logical operations should fail
function testLogicalOperationErrors() {
  // Non-existent column in AND
  expectError(
    db
      .selectFrom("users")
      .where(({ eb, and }) =>
        and([eb("active", "=", true), eb("nonexistent", "=", "value")])
      )
      .selectAll()
  );

  // Type mismatch in OR
  expectError(
    db
      .selectFrom("users")
      .where(({ eb, or }) =>
        or([eb("id", "=", 123), eb("id", "=", "not_a_number")])
      )
      .selectAll()
  );

  // Invalid operator in NOT
  expectError(
    db
      .selectFrom("users")
      .where(({ eb, not }) => not(eb("id", "invalid_operator", 123)))
      .selectAll()
  );
}

// ❌ Empty logical operations should fail appropriately
function testEmptyLogicalOperations() {
  // Empty AND array
  expectError(
    db
      .selectFrom("users")
      .where(({ eb, and }) => and([]))
      .selectAll()
  );

  // Empty OR array
  expectError(
    db
      .selectFrom("users")
      .where(({ eb, or }) => or([]))
      .selectAll()
  );
}

// =============================================================================
// 7. IMPLICIT AND BEHAVIOR (ARRAY RETURN FROM WHERE CALLBACK)
// =============================================================================

// ✅ Implicit AND when returning array from where callback
async function testImplicitAndFromArray() {
  const result = await db
    .selectFrom("users")
    .select(["id", "name", "active"])
    .where(({ eb }) => [
      eb("active", "=", true),
      eb("id", ">", 0),
      eb("email", "is not", null),
    ])
    .execute();

  expectType<
    Array<{
      id: number;
      name: string;
      active: boolean;
    }>
  >(result);
}
