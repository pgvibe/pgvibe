// TSD Type Tests for INSERT Operations with Alias Support
// Tests type safety for INSERT queries with table aliases and column references

import { expectType, expectError } from "tsd";
import { integrationDb } from "../utils/test-helpers.test-d.ts";

// ✅ Test 1: Basic INSERT with alias
async function testBasicInsertWithAlias() {
  // Should work - only required fields
  const result = await integrationDb
    .insertInto("test_users as u")
    .values({ name: "John Doe" })
    .execute();

  expectType<{ readonly affectedRows: number }>(result);
}

// ✅ Test 2: INSERT with alias and RETURNING
async function testInsertAliasReturning() {
  // Should return correct types for alias-qualified columns
  const result1 = await integrationDb
    .insertInto("test_users as u")
    .values({
      name: "John Doe",
      email: "john@example.com",
    })
    .returning(["u.id", "u.name"])
    .execute();

  expectType<{ id: number; name: string }[]>(result1);

  // Should return correct types for mixed qualified/unqualified columns
  const result2 = await integrationDb
    .insertInto("test_users as u")
    .values({
      name: "Jane Doe",
    })
    .returning(["u.id", "name", "u.email", "active"])
    .execute();

  expectType<
    {
      id: number;
      name: string;
      email: string | null;
      active: boolean;
    }[]
  >(result2);

  // Should return correct types for returningAll with alias
  const result3 = await integrationDb
    .insertInto("test_users as u")
    .values({
      name: "Bob Wilson",
    })
    .returningAll()
    .execute();

  // Should return all columns from the TestUserTable
  expectType<
    {
      id: number;
      name: string;
      email: string | null;
      active: boolean;
      created_at: Date;
    }[]
  >(result3);

  // Should work with posts table alias returning
  const result4 = await integrationDb
    .insertInto("test_posts as p")
    .values({
      user_id: 1,
      title: "My Post",
    })
    .returning(["p.id", "p.title", "p.user_id"])
    .execute();

  expectType<{ id: number; title: string; user_id: number }[]>(result4);
}

// ✅ Test 3: INSERT with alias bulk operations type safety
async function testInsertAliasBulkOperations() {
  // Should handle bulk insert with alias correctly
  const result1 = await integrationDb
    .insertInto("test_users as u")
    .values([
      { name: "User 1", email: "user1@example.com" },
      { name: "User 2", active: false },
      { name: "User 3" },
    ])
    .execute();

  expectType<{ readonly affectedRows: number }>(result1);

  // Should handle bulk insert with alias and returning
  const result2 = await integrationDb
    .insertInto("test_users as u")
    .values([
      { name: "User A" },
      { name: "User B", email: "userb@example.com" },
    ])
    .returning(["u.id", "u.name", "u.email"])
    .execute();

  expectType<
    {
      id: number;
      name: string;
      email: string | null;
    }[]
  >(result2);
}

// ✅ Test 4: INSERT with alias and ON CONFLICT type safety
async function testInsertAliasOnConflict() {
  // Should handle ON CONFLICT with alias
  const result1 = await integrationDb
    .insertInto("test_users as u")
    .values({
      name: "Conflict User",
      email: "conflict@example.com",
    })
    .onConflict((oc) => oc.column("email").doNothing())
    .execute();

  expectType<{ readonly affectedRows: number }>(result1);

  // Should handle ON CONFLICT DO UPDATE with alias
  const result2 = await integrationDb
    .insertInto("test_users as u")
    .values({
      name: "Update User",
      email: "update@example.com",
    })
    .onConflict((oc) =>
      oc.column("email").doUpdate({
        name: "Updated User",
        active: true,
      })
    )
    .execute();

  expectType<{ readonly affectedRows: number }>(result2);

  // Should handle ON CONFLICT with RETURNING and alias
  const result3 = await integrationDb
    .insertInto("test_users as u")
    .values({
      name: "Conflict Return User",
      email: "conflictreturn@example.com",
    })
    .onConflict((oc) =>
      oc.column("email").doUpdate({ name: "Conflict Updated" })
    )
    .returning(["u.id", "u.name", "u.email"])
    .execute();

  expectType<
    {
      id: number;
      name: string;
      email: string | null;
    }[]
  >(result3);
}

// ✅ Test 5: INSERT with different alias names type safety
async function testInsertDifferentAliases() {
  // Should work with various alias names
  const result1 = await integrationDb
    .insertInto("test_users as user")
    .values({ name: "User" })
    .returning(["user.id", "user.name"])
    .execute();

  expectType<{ id: number; name: string }[]>(result1);

  const result2 = await integrationDb
    .insertInto("test_users as author")
    .values({ name: "Author" })
    .returning(["author.id", "author.name"])
    .execute();

  expectType<{ id: number; name: string }[]>(result2);

  const result3 = await integrationDb
    .insertInto("test_posts as post_table")
    .values({ user_id: 1, title: "Post" })
    .returning(["post_table.id", "post_table.title"])
    .execute();

  expectType<{ id: number; title: string }[]>(result3);
}

// ✅ Test 6: INSERT with alias should preserve utility types
async function testInsertAliasUtilityTypes() {
  // Generated<T> columns should still be optional with alias
  const result1 = await integrationDb
    .insertInto("test_users as u")
    .values({
      name: "Test User",
      // id should be optional (Generated<number>)
      // created_at should be optional (Generated<Date>)
    })
    .returning(["u.id", "u.created_at"]) // Should return Generated types
    .execute();

  expectType<{ id: number; created_at: Date }[]>(result1);

  // WithDefault<T> columns should still be optional with alias
  const result2 = await integrationDb
    .insertInto("test_users as u")
    .values({
      name: "Default User",
      // active should be optional (WithDefault<boolean>)
    })
    .returning(["u.active"])
    .execute();

  expectType<{ active: boolean }[]>(result2);

  // Nullable columns should still be optional with alias
  const result3 = await integrationDb
    .insertInto("test_users as u")
    .values({
      name: "Nullable User",
      // email should be optional (string | null)
    })
    .returning(["u.email"])
    .execute();

  expectType<{ email: string | null }[]>(result3);
}

// ✅ Test 7: Complex alias scenarios type safety
async function testComplexAliasScenarios() {
  // Should handle complex combination with all features
  const result = await integrationDb
    .insertInto("test_users as u")
    .values([
      {
        name: "Complex User 1",
        email: "complex1@example.com",
        active: true,
      },
      {
        name: "Complex User 2",
        active: false,
      },
      {
        name: "Complex User 3",
        email: null,
      },
    ])
    .onConflict((oc) => oc.column("email").doNothing())
    .returning(["u.id", "u.name", "u.email", "u.active", "u.created_at"])
    .execute();

  expectType<
    {
      id: number;
      name: string;
      email: string | null;
      active: boolean;
      created_at: Date;
    }[]
  >(result);
}

// ❌ Test 9: Basic Type Error Scenarios
function testBasicTypeErrors() {
  // Should not allow wrong types for required fields
  expectError(
    integrationDb
      .insertInto("test_users as u")
      .values({
        name: 123, // Should be string, not number
        email: "test@example.com",
      })
      .execute()
  );

  // Should not allow wrong types for optional fields
  expectError(
    integrationDb
      .insertInto("test_users as u")
      .values({
        name: "Test User",
        active: "yes", // Should be boolean, not string
      })
      .execute()
  );

  // Should not allow wrong types for posts
  expectError(
    integrationDb
      .insertInto("test_posts as p")
      .values({
        user_id: "not-a-number", // Should be number, not string
        title: "Test Post",
      })
      .execute()
  );

  // Should not allow empty object in values
  expectError(
    integrationDb
      .insertInto("test_users as u")
      .values({}) // Missing required 'name' field
      .execute()
  );
}

// ❌ Test 10: Runtime Error Scenarios
function testRuntimeErrors() {
  // Should not allow wrong table names
  expectError(
    integrationDb.insertInto("fake_table").values({ name: "Test" }).execute()
  );

  // Should not allow malformed alias syntax
  expectError(
    integrationDb.insertInto("test_users as").values({ name: "Test" }).execute()
  );
}

// ✅ Test 11: Method chaining type safety with alias
async function testMethodChaining() {
  // Should maintain correct types through method chaining
  const query = integrationDb
    .insertInto("test_users as u")
    .values({ name: "Chain Test" });

  const withReturning = query.returning(["u.id", "u.name"]);
  const withConflict = query.onConflict((oc) => oc.column("email").doNothing());

  expectType<Promise<{ id: number; name: string }[]>>(withReturning.execute());
  expectType<Promise<{ readonly affectedRows: number }>>(
    withConflict.execute()
  );
}

// ✅ Test 12: Verify INSERT builder type with alias
function testInsertBuilderTypes() {
  // Should return correct builder type for alias
  const builder1 = integrationDb.insertInto("test_users as u");
  const builder2 = integrationDb.insertInto("test_posts as p");

  // These should have the correct types for their respective operations
  expectType<ReturnType<typeof builder1.values>>(
    builder1.values({ name: "Test" })
  );
  expectType<ReturnType<typeof builder2.values>>(
    builder2.values({ user_id: 1, title: "Test" })
  );
}
