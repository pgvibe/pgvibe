// Debug file to test GetColumnReferences type step by step
import type {
  GetColumnReferences,
  ParseTableExpression,
  ExtractColumnNames,
} from "./src/core/shared-types";
import type {
  IntegrationTestDatabase,
  TestUserTable,
} from "./tests/types/utils/schemas.test-d.ts";

// Test the exact logic path in GetColumnReferences
type DatabaseKeys = keyof IntegrationTestDatabase;
//   ^? Should be: "test_users" | "test_posts"

// Test if "test_users" extends keyof IntegrationTestDatabase
type IsTestUsersKey = "test_users" extends keyof IntegrationTestDatabase
  ? true
  : false;
//   ^? Should be: true

// Test ParseTableExpression for basic table
type ParseBasic = ParseTableExpression<"test_users">;
//   ^? Should be: { table: "test_users"; alias: never }

// Test the table name extraction
type TableName = ParseBasic extends { table: infer T } ? T : never;
//   ^? Should be: "test_users"

// Test if the table name is a valid key
type IsValidKey = TableName extends keyof IntegrationTestDatabase
  ? true
  : false;
//   ^? Should be: true

// Test the alias extraction
type AliasName = ParseBasic extends { alias: infer A } ? A : never;
//   ^? Should be: never

// Test if alias is never
type IsAliasNever = AliasName extends never ? true : false;
//   ^? Should be: true

// Test the database lookup
type LookupResult = IntegrationTestDatabase["test_users"];
//   ^? Should be: TestUserTable

// Test ExtractColumnNames on the lookup result
type ExtractedColumns = ExtractColumnNames<LookupResult>;
//   ^? Should be: "id" | "name" | "email" | "active" | "created_at"

// Now test the actual GetColumnReferences
type BasicColumns = GetColumnReferences<IntegrationTestDatabase, "test_users">;
//   ^? Should be: "id" | "name" | "email" | "active" | "created_at" | "test_users.id" | ...

// Test assignments to see what actually works
const extractedTest: ExtractedColumns = "id"; // Should work
const basicTest: BasicColumns = "id"; // Should work
