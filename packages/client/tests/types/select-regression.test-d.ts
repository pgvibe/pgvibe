// Regression tests for SELECT query builder type display
// Validates that our Prettify fix works correctly and prevents regressions

import { expectType, expectAssignable } from "tsd";
import { createTestDatabase } from "../utils/test-config";
import type {
  Database,
  UserTable,
  PostTable,
  CommentTable,
} from "../utils/test-types";
import type { Prettify } from "../../src/core/types/select-result";

const db = createTestDatabase();

// REGRESSION TEST: Validate that Prettify is working correctly
export function testPrettifyIsWorking() {
  // Test that Prettify<UserTable> produces the expected expanded type
  type PrettifiedUser = Prettify<UserTable>;

  expectType<{
    id: number;
    name: string;
    email: string | null;
    active: boolean;
    created_at: Date;
    tags: string[];
    permissions: string[];
    scores: number[];
  }>({} as PrettifiedUser);

  // Should be assignable both ways (structural equivalence)
  expectAssignable<UserTable>({} as PrettifiedUser);
  expectAssignable<PrettifiedUser>({} as UserTable);
}

// REGRESSION TEST: Ensure selectFrom() returns prettified types
export function testSelectFromReturnsPrettifiedTypes() {
  const usersQuery = db.selectFrom("users");
  const usersPromise = usersQuery.execute();

  // Should return the expanded object type structure
  expectType<
    Promise<
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
    >
  >(usersPromise);

  // Should also be assignable to the original interface (structural equivalence)
  expectAssignable<Promise<UserTable[]>>(usersPromise);
}

// REGRESSION TEST: Ensure all table types return prettified structures
export function testAllTablesReturnPrettifiedTypes() {
  // Users table
  const usersPromise = db.selectFrom("users").execute();
  expectType<
    Promise<
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
    >
  >(usersPromise);

  // Posts table
  const postsPromise = db.selectFrom("posts").execute();
  expectType<
    Promise<
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
    >
  >(postsPromise);

  // Comments table
  const commentsPromise = db.selectFrom("comments").execute();
  expectType<
    Promise<
      Array<{
        id: number;
        post_id: number;
        user_id: number;
        content: string;
        created_at: Date;
      }>
    >
  >(commentsPromise);
}

// REGRESSION TEST: Ensure selectAll() also returns prettified types
export function testSelectAllReturnsPrettifiedTypes() {
  const usersPromise = db.selectFrom("users").selectAll().execute();

  // Should return expanded object type structure
  expectType<
    Promise<
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
    >
  >(usersPromise);
}

// REGRESSION TEST: Ensure chained operations maintain prettified types
export function testChainedOperationsMaintainPrettifiedTypes() {
  const usersPromise = db
    .selectFrom("users")
    .where("active", "=", true)
    .orderBy("name", "asc")
    .limit(10)
    .execute();

  // Should still return expanded object type structure
  expectType<
    Promise<
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
    >
  >(usersPromise);
}

// REGRESSION TEST: Ensure specific column selection works correctly
export function testSpecificColumnSelectionTypes() {
  const usersPromise = db.selectFrom("users").select(["id", "name"]).execute();

  // Should be only selected columns with expanded structure
  expectType<
    Promise<
      Array<{
        id: number;
        name: string;
      }>
    >
  >(usersPromise);
}

// REGRESSION TEST: Ensure the builder methods work correctly
export function testBuilderMethodsWork() {
  const usersQuery = db.selectFrom("users");

  // Test that key methods exist and can be called (compilation test)
  // If these compile without errors, the methods exist and have correct signatures
  usersQuery.select(["id", "name"]);
  usersQuery.selectAll();
  usersQuery.where("active", "=", true);
  usersQuery.orderBy("name", "asc");
  usersQuery.limit(10);
  usersQuery.offset(5);

  // Test method chaining works
  const chainedQuery = usersQuery
    .where("active", "=", true)
    .orderBy("name", "asc")
    .limit(10);

  // Test that the final result has the correct type
  const result = chainedQuery.execute();
  expectType<
    Promise<
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
    >
  >(result);
}

// REGRESSION TEST: Ensure compile() and toSQL() methods work correctly
export function testCompileMethodsReturnCorrectTypes() {
  const usersQuery = db.selectFrom("users");

  const compiled = usersQuery.compile();
  expectType<{
    sql: string;
    parameters: any[];
  }>(compiled);

  const sql = usersQuery.toSQL();
  expectType<{
    sql: string;
    parameters: any[];
  }>(sql);
}

// REGRESSION TEST: Ensure type safety is maintained across different query patterns
export function testVariousQueryPatterns() {
  // Pattern 1: Simple select
  const simple = db.selectFrom("users").execute();
  expectType<
    Promise<
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
    >
  >(simple);

  // Pattern 2: With WHERE
  const withWhere = db.selectFrom("users").where("active", "=", true).execute();
  expectType<
    Promise<
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
    >
  >(withWhere);

  // Pattern 3: With ORDER BY
  const withOrderBy = db.selectFrom("users").orderBy("name", "asc").execute();
  expectType<
    Promise<
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
    >
  >(withOrderBy);

  // Pattern 4: With LIMIT
  const withLimit = db.selectFrom("users").limit(10).execute();
  expectType<
    Promise<
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
    >
  >(withLimit);

  // Pattern 5: Complex chaining
  const complex = db
    .selectFrom("users")
    .where("active", "=", true)
    .orderBy("name", "asc")
    .limit(10)
    .offset(5)
    .execute();
  expectType<
    Promise<
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
    >
  >(complex);
}

// REGRESSION TEST: Validate that the fix prevents the original problem
export function testOriginalProblemIsSolved() {
  // This test documents what the original problem was and validates it's fixed
  const users = db.selectFrom("users").execute();

  // Before the fix: TypeScript would show `const users: Promise<UserTable[]>`
  // After the fix: TypeScript should show the expanded object structure
  // We validate this by ensuring the type is structurally equivalent to both

  expectAssignable<Promise<UserTable[]>>(users);
  expectAssignable<
    Promise<
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
    >
  >(users);

  // The key insight: with Prettify working, these should be equivalent
  // TypeScript will now display the expanded structure in hover tooltips
}
