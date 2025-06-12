// TypeScript Declaration Tests for WHERE Type Validation
// Demonstrates that our enhanced type system now properly catches type errors

import { expectType, expectError } from "tsd";
import { createTestDatabase } from "../utils/test-types";
import type { Database } from "../utils/test-types";

const db = createTestDatabase();

// =============================================================================
// POSITIVE CASES: What works correctly
// =============================================================================

// ✅ Test 1: Valid type combinations work correctly
async function testValidTypeCombinations() {
  const result = await db
    .selectFrom("users")
    .select(["id", "name", "active"])
    .where("id", "=", 42) // number = number ✅
    .where("name", "=", "John") // string = string ✅
    .where("active", "=", true) // boolean = boolean ✅
    .execute();

  expectType<Array<{ id: number; name: string; active: boolean }>>(result);
}

// ✅ Test 2: Column validation works (catches invalid column names)
function testColumnValidation() {
  // These correctly error - our column validation works!
  expectError(
    db
      .selectFrom("users")
      .select(["id"])
      .where("nonexistent_column", "=", "value")
  );

  expectError(
    db.selectFrom("users").select(["id"]).where("posts.title", "=", "value")
  );
}

// =============================================================================
// ENHANCED TYPE VALIDATION: Our type system now catches these errors!
// =============================================================================

// ✅ Test 3: Value type mismatches (NOW CAUGHT!)
function testTypeMismatchesCaught() {
  // Our enhanced type system now properly catches these:

  expectError(
    db
      .selectFrom("users")
      .select(["id", "name"])
      .where("id", "=", "not_a_number") // ✅ String for number column - now caught!
  );

  expectError(
    db.selectFrom("users").select(["id", "name"]).where("name", "=", 42) // ✅ Number for string column - now caught!
  );

  expectError(
    db
      .selectFrom("users")
      .select(["id", "name"])
      .where("active", "=", "not_boolean") // ✅ String for boolean column - now caught!
  );

  // Date columns now accept ISO date strings (TypeScript cannot validate string format)
  db.selectFrom("users")
    .select(["id", "name"])
    .where("created_at", "=", "2023-01-01"); // ✅ ISO date string allowed
}

// ✅ Test 4: Array type consistency (NOW CAUGHT!)
function testArrayTypeCaught() {
  // Our enhanced type system now properly catches these:

  expectError(
    db.selectFrom("users").select(["id", "name"]).where("id", "in", [1, "2", 3]) // ✅ Mixed types in array - now caught!
  );

  expectError(
    db
      .selectFrom("users")
      .select(["id", "name"])
      .where("name", "in", ["John", 42, "Jane"]) // ✅ Mixed types in string array - now caught!
  );

  expectError(
    db
      .selectFrom("users")
      .select(["id", "name"])
      .where("id", "in", [true, false]) // ✅ Boolean array for number column - now caught!
  );
}

// ✅ Test 5: Null handling (NOW CAUGHT!)
function testNullHandlingCaught() {
  // Our enhanced type system now properly catches these:

  expectError(
    db.selectFrom("users").select(["id", "name"]).where("email", "=", null) // ✅ Should use IS instead of = - now caught!
  );

  expectError(
    db.selectFrom("users").select(["id", "name"]).where("email", "!=", null) // ✅ Should use IS NOT instead of != - now caught!
  );

  expectError(
    db.selectFrom("users").select(["id", "name"]).where("name", "like", null) // ✅ LIKE with null - now caught!
  );
}

// ✅ Test 6: Operator/value combination validation (NOW CAUGHT!)
function testOperatorValueCaught() {
  // Our enhanced type system now properly catches these:

  expectError(
    db.selectFrom("users").select(["id", "name"]).where("id", "in", 42) // ✅ IN should require array - now caught!
  );

  expectError(
    db
      .selectFrom("users")
      .select(["id", "name"])
      .where("name", "is", "not_null") // ✅ IS should require null - now caught!
  );

  expectError(
    db.selectFrom("users").select(["id", "name"]).where("id", ">", [1, 2, 3]) // ✅ Comparison with array - now caught!
  );
}

// Export all test functions to ensure they're processed by TSD
export {
  testValidTypeCombinations,
  testColumnValidation,
  testTypeMismatchesCaught,
  testArrayTypeCaught,
  testNullHandlingCaught,
  testOperatorValueCaught,
};
