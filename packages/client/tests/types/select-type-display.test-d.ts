// Type tests for SELECT query result type display
// Ensures TypeScript shows expanded object types instead of interface names

import { expectType } from "tsd";
import { createTestDatabase } from "../utils/test-config";
import type { Database } from "../utils/test-types";

const db = createTestDatabase();

// Test that selectFrom() returns expanded object types, not just interface names
export function testSelectFromTypeDisplay() {
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
}

// Test that explicit selectAll() also returns expanded types
export function testSelectAllTypeDisplay() {
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

// Test that specific column selection works correctly
export function testSelectSpecificColumnsTypeDisplay() {
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

// Test different table types
export function testPostsTypeDisplay() {
  const postsQuery = db.selectFrom("posts");
  const postsPromise = postsQuery.execute();

  // Should return expanded PostTable type
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
}

// Test comments table
export function testCommentsTypeDisplay() {
  const commentsQuery = db.selectFrom("comments");
  const commentsPromise = commentsQuery.execute();

  // Should return expanded CommentTable type
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

// Test that WHERE clauses don't affect type display
export function testWhereClauseTypeDisplay() {
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

// Test that ORDER BY clauses don't affect type display
export function testOrderByTypeDisplay() {
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

// Test that LIMIT/OFFSET don't affect type display
export function testLimitOffsetTypeDisplay() {
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

// Test chained operations
export function testChainedOperationsTypeDisplay() {
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

// Test that compile() method also returns correct types
export function testCompileMethodTypeDisplay() {
  const usersQuery = db.selectFrom("users");
  const compiled = usersQuery.compile();

  // compile() should return SQL and parameters
  expectType<{
    sql: string;
    parameters: any[];
  }>(compiled);
}

// Test that toSQL() method works correctly
export function testToSQLMethodTypeDisplay() {
  const usersQuery = db.selectFrom("users");
  const sql = usersQuery.toSQL();

  // toSQL() should return SQL and parameters
  expectType<{
    sql: string;
    parameters: any[];
  }>(sql);
}
