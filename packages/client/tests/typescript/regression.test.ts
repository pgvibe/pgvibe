import { test, expect } from "bun:test";
import { QueryBuilder } from "../../src/query-builder.js";
import { TestDB } from "../fixtures/test-schema.js";

/**
 * COMPREHENSIVE TYPESCRIPT REGRESSION PREVENTION TESTS
 * 
 * This file serves as a comprehensive test suite to prevent TypeScript regressions.
 * It covers all critical developer experience scenarios for pgvibe query builder.
 * 
 * POSITIVE TESTS: These should all compile and provide excellent autocomplete
 * NEGATIVE TESTS: These should all fail TypeScript compilation with @ts-expect-error
 * 
 * If any of these tests fail, it indicates a regression in the TypeScript experience.
 */

test("REGRESSION PREVENTION: Complete TypeScript validation suite", async () => {
  const qb = new QueryBuilder<TestDB>();

  // ===== POSITIVE TESTS - THESE SHOULD ALL WORK =====
  
  // 1. Basic table selection
  qb.selectFrom("users");
  qb.selectFrom("posts");  
  qb.selectFrom("comments");
  
  // 2. Table aliases
  qb.selectFrom("users as u");
  qb.selectFrom("posts as p");
  qb.selectFrom("comments as c");
  
  // 3. Column selection - unqualified
  qb.selectFrom("users").select(["id", "name", "email", "active"]);
  qb.selectFrom("posts").select(["id", "user_id", "title", "content", "published"]);
  qb.selectFrom("comments").select(["id", "post_id", "user_id", "content"]);
  
  // 4. Column selection - qualified with aliases
  qb.selectFrom("users as u").select(["u.id", "u.name", "u.email", "u.active"]);
  qb.selectFrom("posts as p").select(["p.id", "p.user_id", "p.title", "p.content", "p.published"]);
  
  // 5. Mixed qualified/unqualified with aliases
  qb.selectFrom("users as u").select(["u.id", "name", "u.email", "active"]);
  
  // 6. Column aliases
  qb.selectFrom("users").select(["id as userId", "name as userName"]);
  qb.selectFrom("users as u").select(["u.id as userId", "u.name as userName"]);
  
  // 7. Basic JOINs
  qb.selectFrom("users as u")
    .innerJoin("posts as p", "u.id", "p.user_id");
  
  qb.selectFrom("users as u")
    .leftJoin("posts as p", "u.id", "p.user_id");
  
  // 8. Multiple JOINs
  qb.selectFrom("users as u")
    .innerJoin("posts as p", "u.id", "p.user_id")
    .leftJoin("comments as c", "p.id", "c.post_id");
  
  // 9. Selection after JOINs - all valid combinations
  qb.selectFrom("users as u")
    .innerJoin("posts as p", "u.id", "p.user_id")
    .select(["u.name", "p.title"]); // qualified
  
  qb.selectFrom("users as u")
    .innerJoin("posts as p", "u.id", "p.user_id")
    .select(["name", "title"]); // unqualified
  
  qb.selectFrom("users as u")
    .innerJoin("posts as p", "u.id", "p.user_id")
    .select(["u.name", "title", "p.published", "email"]); // mixed
  
  // 10. Complex selection with aliases
  qb.selectFrom("users as u")
    .innerJoin("posts as p", "u.id", "p.user_id")
    .leftJoin("comments as c", "p.id", "c.post_id")
    .select([
      "u.name as authorName",
      "p.title as postTitle", 
      "c.content as comment",
      "published"
    ]);

  // ===== NEGATIVE TESTS - THESE SHOULD ALL FAIL =====
  
  // 1. Invalid table names
  // @ts-expect-error
  qb.selectFrom("invalid_table");
  
  // @ts-expect-error  
  qb.selectFrom("user"); // singular instead of plural
  
  // 2. Invalid column names
  // @ts-expect-error
  qb.selectFrom("users").select(["invalid_column"]);
  
  // @ts-expect-error
  qb.selectFrom("users").select(["title"]); // title is in posts, not users
  
  // 3. Alias exclusivity violations
  // @ts-expect-error - can't use original table name after aliasing
  qb.selectFrom("users as u").select(["users.id"]);
  
  // @ts-expect-error
  qb.selectFrom("users as u").select(["u.name", "users.email"]);
  
  // 4. Invalid JOIN columns
  // @ts-expect-error
  qb.selectFrom("users as u")
    .innerJoin("posts as p", "u.invalid", "p.user_id");
  
  // @ts-expect-error
  qb.selectFrom("users as u")
    .innerJoin("posts as p", "u.id", "p.invalid");
  
  // @ts-expect-error - can't use original table name in JOIN
  qb.selectFrom("users as u")
    .innerJoin("posts as p", "users.id", "p.user_id");
  
  // 5. Columns from non-joined tables
  // @ts-expect-error - comments not joined
  qb.selectFrom("users as u")
    .innerJoin("posts as p", "u.id", "p.user_id")
    .select(["u.name", "p.title", "c.content"]);
  
  // @ts-expect-error - qualified reference to non-joined table
  qb.selectFrom("users").select(["posts.title"]);
  
  // 6. Invalid column aliases
  // @ts-expect-error
  qb.selectFrom("users").select(["invalid_col as alias"]);
  
  // @ts-expect-error
  qb.selectFrom("users as u").select(["users.name as userName"]); // alias exclusivity
  
  // ===== TYPE INFERENCE VALIDATION =====
  
  // Result types should be correctly inferred
  const basicResult = await qb.selectFrom("users").select(["id", "name"]).execute();
  if (basicResult[0]) {
    // These should be correctly typed
    const id: number = basicResult[0].id;
    const name: string = basicResult[0].name;
    
    // @ts-expect-error - email wasn't selected
    const email = basicResult[0].email;
  }
  
  // Aliased results
  const aliasedResult = await qb
    .selectFrom("users")
    .select(["id as userId", "name as userName"])
    .execute();
  
  if (aliasedResult[0]) {
    const userId: number = aliasedResult[0].userId;
    const userName: string = aliasedResult[0].userName;
    
    // @ts-expect-error - properties are renamed
    const id = aliasedResult[0].id;
  }
  
  // LEFT JOIN nullable types
  const leftJoinResult = await qb
    .selectFrom("users as u")
    .leftJoin("posts as p", "u.id", "p.user_id")
    .select(["u.name", "p.title"])
    .execute();
  
  if (leftJoinResult[0]) {
    const name: string = leftJoinResult[0].name; // non-nullable
    const title: string | null = leftJoinResult[0].title; // nullable from LEFT JOIN
    
    // @ts-expect-error - can't assign nullable to non-nullable
    const titleNotNull: string = leftJoinResult[0].title;
  }
  
  // Complex query type inference
  const complexResult = await qb
    .selectFrom("users as u")
    .innerJoin("posts as p", "u.id", "p.user_id") 
    .leftJoin("comments as c", "p.id", "c.post_id")
    .select([
      "u.name",
      "p.title as postTitle",
      "c.content as comment", 
      "p.published"
    ])
    .execute();
  
  if (complexResult[0]) {
    const name: string = complexResult[0].name;
    const postTitle: string = complexResult[0].postTitle;
    const comment: string | null = complexResult[0].comment; // nullable from LEFT JOIN
    const published: boolean = complexResult[0].published;
  }
  
  expect(true).toBe(true);
});

test("REGRESSION PREVENTION: Real-world query patterns", async () => {
  const qb = new QueryBuilder<TestDB>();
  
  // Pattern 1: User with their posts
  const userPosts = await qb
    .selectFrom("users as u")
    .leftJoin("posts as p", "u.id", "p.user_id")
    .select([
      "u.id as userId",
      "u.name as userName", 
      "p.title as postTitle",
      "p.published as isPublished"
    ])
    .execute();
  
  // Pattern 2: Posts with comments and authors
  const postsWithDetails = await qb
    .selectFrom("posts as p")
    .innerJoin("users as u", "p.user_id", "u.id")
    .leftJoin("comments as c", "p.id", "c.post_id")
    .select([
      "p.title",
      "p.content", 
      "u.name as authorName",
      "c.content as commentText"
    ])
    .execute();
  
  // Pattern 3: User activity summary
  const userActivity = await qb
    .selectFrom("users as u")
    .leftJoin("posts as p", "u.id", "p.user_id")
    .leftJoin("comments as c", "u.id", "c.user_id")
    .select([
      "u.name",
      "u.email",
      "p.title as latestPost",
      "c.content as latestComment"
    ])
    .execute();
  
  // All these should have proper type inference
  expect(userPosts).toEqual([]);
  expect(postsWithDetails).toEqual([]);
  expect(userActivity).toEqual([]);
});