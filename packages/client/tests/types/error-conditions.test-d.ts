// TSD Type Tests for Error Conditions
// These tests verify that our type system properly catches errors and provides helpful messages

import { expectError, expectType } from "tsd";
import { createTestDatabase } from "../utils/test-types";

const db = createTestDatabase();

// ❌ Test 1: Invalid column names should be caught
async function testInvalidColumnNames() {
  // Non-existent column in users table
  expectError(db.selectFrom("users").select("nonexistent_column").execute());

  // Non-existent column in array
  expectError(db.selectFrom("users").select(["id", "invalid_field"]).execute());

  // Typo in common column name
  expectError(
    db.selectFrom("users").select("naem").execute() // typo for "name"
  );

  // Wrong table column (posts columns on users table)
  expectError(db.selectFrom("users").select("title").execute());
}

// ❌ Test 2: Invalid table names should be caught
async function testInvalidTableNames() {
  // Non-existent table
  expectError(db.selectFrom("nonexistent_table").selectAll().execute());

  // Typo in table name
  expectError(
    db.selectFrom("user").selectAll().execute() // missing 's'
  );

  expectError(
    db.selectFrom("post").selectAll().execute() // missing 's'
  );
}

// ❌ Test 3: WHERE clause errors (currently limited - may need improvement)
async function testWhereClauseErrors() {
  // Non-existent column in WHERE
  expectError(
    db
      .selectFrom("users")
      .selectAll()
      .where("nonexistent_column", "=", true)
      .execute()
  );

  // Note: Type mismatches in WHERE values might not be fully implemented yet
  // We'll test these as our type system evolves:

  // TODO: Implement stricter WHERE value type checking
  // expectError(
  //   db.selectFrom("users")
  //     .selectAll()
  //     .where("id", "=", "not_a_number") // id is number, not string
  //     .execute()
  // );
}

// ❌ Test 4: ORDER BY errors
async function testOrderByErrors() {
  // Non-existent column in ORDER BY
  expectError(
    db
      .selectFrom("users")
      .selectAll()
      .orderBy("nonexistent_column", "asc")
      .execute()
  );

  // Column from wrong table
  expectError(
    db
      .selectFrom("users")
      .selectAll()
      .orderBy("title", "asc") // title is from posts table
      .execute()
  );

  // Note: Invalid sort direction might be allowed by current implementation
  // TODO: Add stricter sort direction validation
}

// ❌ Test 5: Cross-table column confusion (when not using JOINs)
async function testCrossTableErrors() {
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

// ✅ Test 6: Verify that VALID operations still work (positive control)
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

// 📋 FUTURE ERROR CONDITIONS TO IMPLEMENT:
//
// These are error conditions we want to catch in the future but don't currently:
//
// async function testFutureErrorConditions() {
//   // Type mismatches in WHERE clauses
//   expectError(
//     db.selectFrom("users")
//       .selectAll()
//       .where("id", "=", "not_a_number") // id is number, not string
//       .execute()
//   );
//
//   // Wrong type for boolean field
//   expectError(
//     db.selectFrom("users")
//       .selectAll()
//       .where("active", "=", "true") // active is boolean, not string
//       .execute()
//   );
//
//   // Invalid sort direction
//   expectError(
//     db.selectFrom("users")
//       .selectAll()
//       .orderBy("name", "invalid_direction" as any)
//       .execute()
//   );
//
//   // Missing selectFrom
//   expectError(
//     (db as any).select("id").execute()
//   );
//
//   // SQL injection patterns
//   expectError(
//     db.selectFrom("users")
//       .select("id; DROP TABLE users; --" as any)
//       .execute()
//   );
//
//   // Null/undefined handling
//   expectError(
//     db.selectFrom("users")
//       .select(null as any)
//       .execute()
//   );
//
//   // Wrong parameter types
//   expectError(
//     db.selectFrom(123 as any).selectAll().execute()
//   );
// }

// Export all test functions to ensure they're processed by TSD
export {
  testInvalidColumnNames,
  testInvalidTableNames,
  testWhereClauseErrors,
  testOrderByErrors,
  testCrossTableErrors,
  testValidOperationsStillWork,
};
