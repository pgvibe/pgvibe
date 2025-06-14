// Comprehensive SELECT Query Type Testing
// Consolidates basic operations, type display, and regression testing
// Tests all aspects of SELECT query type inference and validation

import {
  expectType,
  expectAssignable,
  db,
} from "../utils/test-helpers.test-d.ts";
import type {
  Database,
  UserTable,
  PostTable,
  CommentTable,
} from "../utils/schemas.test-d.ts";
import type { Prettify } from "../../../src/core/types/select-result";

// =============================================================================
// 1. BASIC SELECT OPERATIONS
// =============================================================================

// ✅ Basic selectAll() operations with expanded types
async function testBasicSelectAll() {
  // Users table - should return expanded object type, NOT UserTable[]
  const users = await db.selectFrom("users").selectAll().execute();
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

  // Posts table
  const posts = await db.selectFrom("posts").selectAll().execute();
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

  // Comments table
  const comments = await db.selectFrom("comments").selectAll().execute();
  expectType<
    Array<{
      id: number;
      post_id: number;
      user_id: number;
      content: string;
      created_at: Date;
    }>
  >(comments);
}

// ✅ Single column selection
async function testSingleColumnSelection() {
  // String literal selection
  const userNames = await db.selectFrom("users").select("name").execute();
  expectType<Array<{ name: string }>>(userNames);

  // Different tables, different columns
  const postTitles = await db.selectFrom("posts").select("title").execute();
  expectType<Array<{ title: string }>>(postTitles);

  const commentContent = await db
    .selectFrom("comments")
    .select("content")
    .execute();
  expectType<Array<{ content: string }>>(commentContent);
}

// ✅ Multiple column selection with arrays
async function testMultipleColumnSelection() {
  // Basic multiple columns
  const userBasics = await db
    .selectFrom("users")
    .select(["id", "name"])
    .execute();
  expectType<Array<{ id: number; name: string }>>(userBasics);

  // Mixed column types including nullable fields
  const userMixed = await db
    .selectFrom("users")
    .select(["id", "email", "active"])
    .execute();
  expectType<
    Array<{
      id: number;
      email: string | null;
      active: boolean;
    }>
  >(userMixed);

  // All columns with different types
  const userComplete = await db
    .selectFrom("users")
    .select(["id", "name", "email", "active", "created_at"])
    .execute();
  expectType<
    Array<{
      id: number;
      name: string;
      email: string | null;
      active: boolean;
      created_at: Date;
    }>
  >(userComplete);

  // Posts with specific columns
  const postData = await db
    .selectFrom("posts")
    .select(["id", "title", "published"])
    .execute();
  expectType<
    Array<{
      id: number;
      title: string;
      published: boolean;
    }>
  >(postData);
}

// =============================================================================
// 2. SELECT WITH QUERY CHAINING
// =============================================================================

// ✅ SELECT with WHERE clause - types should remain correct
async function testSelectWithWhere() {
  const activeUsers = await db
    .selectFrom("users")
    .select(["id", "name"])
    .where("active", "=", true)
    .execute();

  expectType<Array<{ id: number; name: string }>>(activeUsers);
}

// ✅ SELECT with ORDER BY clause - types should remain correct
async function testSelectWithOrderBy() {
  const orderedUsers = await db
    .selectFrom("users")
    .select(["name", "created_at"])
    .orderBy("created_at", "desc")
    .execute();

  expectType<Array<{ name: string; created_at: Date }>>(orderedUsers);
}

// ✅ SELECT with LIMIT and OFFSET - types should remain correct
async function testSelectWithLimitOffset() {
  const paginatedPosts = await db
    .selectFrom("posts")
    .select(["title", "published"])
    .limit(10)
    .offset(5)
    .execute();

  expectType<Array<{ title: string; published: boolean }>>(paginatedPosts);
}

// ✅ Complex chaining maintains correct types
async function testComplexChaining() {
  const complexQuery = await db
    .selectFrom("users")
    .select(["id", "name", "email"])
    .where("active", "=", true)
    .orderBy("name", "asc")
    .limit(50)
    .execute();

  expectType<
    Array<{
      id: number;
      name: string;
      email: string | null;
    }>
  >(complexQuery);
}

// =============================================================================
// 3. TYPE DISPLAY OPTIMIZATION (PRETTIFY SYSTEM)
// =============================================================================

// ✅ Prettify utility is working correctly
function testPrettifyUtility() {
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

// ✅ selectFrom() without explicit select() returns expanded types
function testSelectFromTypeDisplay() {
  // Basic selectFrom without explicit select() should return expanded UserTable type
  const usersQuery = db.selectFrom("users");
  const usersPromise = usersQuery.execute();

  // The result should be an array of expanded user objects
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

// ✅ Explicit selectAll() returns expanded types
function testSelectAllTypeDisplay() {
  const usersQuery = db.selectFrom("users").selectAll();
  const usersPromise = usersQuery.execute();

  // Should return the same expanded type as selectFrom alone
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

// ✅ Specific column selection maintains expanded types
function testSpecificColumnsTypeDisplay() {
  const usersQuery = db.selectFrom("users").select(["id", "name", "email"]);
  const usersPromise = usersQuery.execute();

  // Should return only selected columns with expanded types
  expectType<
    Promise<
      Array<{
        id: number;
        name: string;
        email: string | null;
      }>
    >
  >(usersPromise);
}

// ✅ WHERE clauses don't affect type display
function testWhereClauseTypeDisplay() {
  const usersQuery = db.selectFrom("users").where("active", "=", true);
  const usersPromise = usersQuery.execute();

  // Should still return full expanded UserTable type
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

// ✅ ORDER BY clauses don't affect type display
function testOrderByTypeDisplay() {
  const usersQuery = db.selectFrom("users").orderBy("name", "asc");
  const usersPromise = usersQuery.execute();

  // Should still return full expanded UserTable type
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

// ✅ LIMIT/OFFSET don't affect type display
function testLimitOffsetTypeDisplay() {
  const usersQuery = db.selectFrom("users").limit(10).offset(5);
  const usersPromise = usersQuery.execute();

  // Should still return full expanded UserTable type
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

// ✅ Complex chained operations maintain expanded types
function testChainedOperationsTypeDisplay() {
  const usersQuery = db
    .selectFrom("users")
    .where("active", "=", true)
    .orderBy("name", "asc")
    .limit(10);
  const usersPromise = usersQuery.execute();

  // Should still return full expanded UserTable type
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

// =============================================================================
// 4. REGRESSION TESTS (BUG FIXES)
// =============================================================================

// ✅ Regression: All table types return prettified structures
function testAllTablesReturnPrettifiedTypes() {
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

// ✅ Regression: Builder methods work correctly
function testBuilderMethodsWork() {
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

// ✅ Regression: Compile methods return correct types
function testCompileMethodsReturnCorrectTypes() {
  const usersQuery = db.selectFrom("users").where("active", "=", true);

  // Test that compile() method returns the expected type
  const compiled = usersQuery.compile();
  expectType<{ sql: string; parameters: any[] }>(compiled);

  // Test that toSQL() method returns the expected type
  const toSQL = usersQuery.toSQL();
  expectType<{ sql: string; parameters: any[] }>(toSQL);
}

// =============================================================================
// EXPORTS
// =============================================================================

export {
  testBasicSelectAll,
  testSingleColumnSelection,
  testMultipleColumnSelection,
  testSelectWithWhere,
  testSelectWithOrderBy,
  testSelectWithLimitOffset,
  testComplexChaining,
  testPrettifyUtility,
  testSelectFromTypeDisplay,
  testSelectAllTypeDisplay,
  testSpecificColumnsTypeDisplay,
  testWhereClauseTypeDisplay,
  testOrderByTypeDisplay,
  testLimitOffsetTypeDisplay,
  testChainedOperationsTypeDisplay,
  testAllTablesReturnPrettifiedTypes,
  testBuilderMethodsWork,
  testCompileMethodsReturnCorrectTypes,
};
