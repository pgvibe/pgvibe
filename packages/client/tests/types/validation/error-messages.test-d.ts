// Comprehensive Error Message Testing
// Consolidates all error message validation tests from multiple files
// Tests clean error messages, smart validation, and error conditions

import {
  expectType,
  expectError,
  db,
  integrationDb,
} from "../utils/test-helpers.test-d.ts";
import type {
  Database,
  IntegrationTestDatabase,
} from "../utils/schemas.test-d.ts";
import type { SmartColumnValidation } from "../../../src/core/builders/select-query-builder";

// =============================================================================
// 1. SMART COLUMN VALIDATION ERROR MESSAGES
// =============================================================================

// Test database interface for smart validation
interface TestDatabase {
  users: {
    id: number;
    name: string;
    email: string;
    active: boolean;
    created_at: Date;
    updated_at: Date;
  };
  posts: {
    id: number;
    user_id: number;
    title: string;
    content: string;
    published: boolean;
    created_at: Date;
    updated_at: Date;
  };
  comments: {
    id: number;
    post_id: number;
    user_id: number;
    content: string;
    created_at: Date;
  };
}

// ✅ Valid columns should return themselves
function testValidationPositiveControls() {
  expectType<"id">(
    null as unknown as SmartColumnValidation<
      TestDatabase,
      "users",
      "id",
      "SELECT"
    >
  );

  expectType<"name">(
    null as unknown as SmartColumnValidation<
      TestDatabase,
      "users",
      "name",
      "SELECT"
    >
  );

  expectType<"email">(
    null as unknown as SmartColumnValidation<
      TestDatabase,
      "users",
      "email",
      "SELECT"
    >
  );
}

// ❌ Invalid columns should show clean, helpful error messages
function testInvalidColumnErrorMessages() {
  // Basic column validation
  expectType<"❌ Column 'nonexistent' does not exist in table 'users'. Available: id | name | email | active | created_at | updated_at">(
    null as unknown as SmartColumnValidation<
      TestDatabase,
      "users",
      "nonexistent",
      "SELECT"
    >
  );

  // Cross-table column confusion detection
  expectType<"❌ Column 'title' does not exist in table 'users', but it exists in table 'posts'. Available: id | name | email | active | created_at | updated_at">(
    null as unknown as SmartColumnValidation<
      TestDatabase,
      "users",
      "title",
      "SELECT"
    >
  );

  // Different table validation
  expectType<"❌ Column 'nonexistent' does not exist in table 'posts'. Available: id | user_id | title | content | published | created_at | updated_at">(
    null as unknown as SmartColumnValidation<
      TestDatabase,
      "posts",
      "nonexistent",
      "SELECT"
    >
  );

  expectType<"❌ Column 'nonexistent' does not exist in table 'comments'. Available: id | post_id | user_id | content | created_at">(
    null as unknown as SmartColumnValidation<
      TestDatabase,
      "comments",
      "nonexistent",
      "SELECT"
    >
  );
}

// ✅ Context-aware error messages
function testContextAwareErrorMessages() {
  // WHERE clause context
  expectType<"❌ Column 'invalid_field' cannot be used in WHERE clause for table 'users'. Available: id | name | email | active | created_at | updated_at">(
    null as unknown as SmartColumnValidation<
      TestDatabase,
      "users",
      "invalid_field",
      "WHERE"
    >
  );

  // ORDER BY clause context
  expectType<"❌ Column 'bad_column' cannot be used in ORDER BY clause for table 'users'. Available: id | name | email | active | created_at | updated_at">(
    null as unknown as SmartColumnValidation<
      TestDatabase,
      "users",
      "bad_column",
      "ORDER BY"
    >
  );
}

// =============================================================================
// 2. BASIC COLUMN VALIDATION UTILITIES
// =============================================================================

// Helper types for basic validation
type ColumnNames<T> = keyof T & string;

// Better error message for invalid columns
type ValidateColumn<
  TableName extends keyof TestDatabase,
  ColumnName extends string
> = ColumnName extends ColumnNames<TestDatabase[TableName]>
  ? ColumnName
  : `❌ Column '${ColumnName}' does not exist in table '${TableName}'.
📝 Available columns: ${ColumnNames<TestDatabase[TableName]>}`;

// Better error message for invalid tables
type ValidateTable<TableName extends string> =
  TableName extends keyof TestDatabase
    ? TableName
    : `❌ Table '${TableName}' does not exist.
📝 Available tables: ${keyof TestDatabase}`;

// Simple validation function to test improved error messages
function selectColumn<TN extends keyof TestDatabase, CN extends string>(
  tableName: ValidateTable<TN>,
  columnName: ValidateColumn<TN, CN>
): string {
  return `SELECT ${String(columnName)} FROM ${String(tableName)}`;
}

// ✅ Valid cases should work normally
function testBasicValidCases() {
  expectType<string>(selectColumn("users", "id"));
  expectType<string>(selectColumn("users", "name"));
  expectType<string>(selectColumn("posts", "title"));
  expectType<string>(selectColumn("comments", "content"));
}

// =============================================================================
// 3. QUERY BUILDER ERROR CONDITIONS
// =============================================================================

// ❌ Invalid column names should be caught
function testQueryBuilderInvalidColumns() {
  // Non-existent column in users table
  expectError(db.selectFrom("users").select("nonexistent_column").execute());

  // Non-existent column in array
  expectError(db.selectFrom("users").select(["id", "invalid_field"]).execute());

  // Typo in common column name
  expectError(db.selectFrom("users").select("naem").execute()); // typo for "name"

  // Wrong table column (posts columns on users table)
  expectError(db.selectFrom("users").select("title").execute());
}

// ❌ Invalid table names should be caught
function testQueryBuilderInvalidTables() {
  // Non-existent table
  expectError(db.selectFrom("nonexistent_table").selectAll().execute());

  // Typo in table name
  expectError(db.selectFrom("user").selectAll().execute()); // missing 's'
  expectError(db.selectFrom("post").selectAll().execute()); // missing 's'
}

// ❌ WHERE clause column errors
function testWhereClauseColumnErrors() {
  // Non-existent column in WHERE
  expectError(
    db
      .selectFrom("users")
      .selectAll()
      .where("nonexistent_column", "=", true)
      .execute()
  );

  // Column from wrong table in WHERE
  expectError(
    db
      .selectFrom("users")
      .selectAll()
      .where("title", "=", "test") // title is from posts table
      .execute()
  );
}

// ❌ ORDER BY column errors
function testOrderByColumnErrors() {
  // Non-existent column in ORDER BY
  expectError(
    db
      .selectFrom("users")
      .selectAll()
      .orderBy("nonexistent_column", "asc")
      .execute()
  );

  // Column from wrong table in ORDER BY
  expectError(
    db
      .selectFrom("users")
      .selectAll()
      .orderBy("title", "asc") // title is from posts table
      .execute()
  );
}

// ❌ Cross-table column confusion (when not using JOINs)
function testCrossTableColumnErrors() {
  // Trying to select posts columns from users table
  expectError(
    db
      .selectFrom("users")
      .select(["id", "title"]) // title is from posts
      .execute()
  );

  // Trying to select users columns from posts table
  expectError(
    db
      .selectFrom("posts")
      .select(["id", "name"]) // name is from users
      .execute()
  );

  // Trying to select comments columns from users table
  expectError(
    db
      .selectFrom("users")
      .select(["id", "post_id"]) // post_id is from comments
      .execute()
  );
}

// =============================================================================
// 4. POSITIVE CONTROL TESTS
// =============================================================================

// ✅ Verify that VALID operations still work (positive control)
async function testValidOperationsStillWork() {
  // These should NOT error - they're our positive controls
  const validResult1 = await db
    .selectFrom("users")
    .select(["id", "name"])
    .execute();
  expectType<Array<{ id: number; name: string }>>(validResult1);

  const validResult2 = await db
    .selectFrom("posts")
    .selectAll()
    .where("published", "=", true)
    .execute();
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
  >(validResult2);

  // Valid ORDER BY
  const validResult3 = await db
    .selectFrom("users")
    .select(["name", "email"])
    .orderBy("name", "asc")
    .execute();
  expectType<Array<{ name: string; email: string | null }>>(validResult3);
}

// =============================================================================
// 5. FUTURE ERROR CONDITIONS (PLANNED IMPROVEMENTS)
// =============================================================================

/*
Future error conditions to implement:

1. Type mismatches in WHERE clauses:
   - expectError(db.selectFrom("users").where("id", "=", "not_a_number"))
   - expectError(db.selectFrom("users").where("active", "=", "true"))

2. Invalid sort directions:
   - expectError(db.selectFrom("users").orderBy("name", "invalid_direction"))

3. SQL injection patterns:
   - expectError(db.selectFrom("users").select("id; DROP TABLE users; --"))

4. Null/undefined handling:
   - expectError(db.selectFrom("users").select(null))
   - expectError(db.selectFrom(123).selectAll())

5. "DID YOU MEAN?" suggestions:
   - Use Levenshtein distance at type level
   - Suggest closest column/table names for typos

6. Multiple error reporting:
   - Show all invalid columns in an array at once
   - Provide comprehensive error summaries
*/

// =============================================================================
// EXPORTS
// =============================================================================

export {
  testValidationPositiveControls,
  testInvalidColumnErrorMessages,
  testContextAwareErrorMessages,
  testBasicValidCases,
  testQueryBuilderInvalidColumns,
  testQueryBuilderInvalidTables,
  testWhereClauseColumnErrors,
  testOrderByColumnErrors,
  testCrossTableColumnErrors,
  testValidOperationsStillWork,
};

console.log("✅ All error message types validated successfully!");
console.log(
  "💡 These should show single, clean error messages when you hover over them in your IDE"
);
console.log("🚫 No more verbose union distributions!");
