import { test, expect } from "bun:test";
import { QueryBuilder } from "../../src/query-builder.js";
import { TestDB } from "../fixtures/test-schema.js";

// This file tests the positive developer experience - autocomplete scenarios
// Place your cursor at the indicated positions and press Ctrl+Space to test autocomplete

test("Autocomplete should work for table names in selectFrom", () => {
  const qb = new QueryBuilder<TestDB>();
  
  // Place cursor inside quotes and press Ctrl+Space
  // Should show: "users", "posts", "comments"
  const q1 = qb.selectFrom("users");
  const q2 = qb.selectFrom("posts");
  const q3 = qb.selectFrom("comments");
  
  // Should also work with aliases
  const q4 = qb.selectFrom("users as u");
  const q5 = qb.selectFrom("posts as p");
  
  expect(true).toBe(true);
});

test("Autocomplete should work for column names in select", () => {
  const qb = new QueryBuilder<TestDB>();
  
  // For users table - cursor inside array
  // Should show: "id", "name", "email", "active"
  const usersQuery = qb.selectFrom("users").select(["id", "name"]);
  
  // For posts table
  // Should show: "id", "user_id", "title", "content", "published"
  const postsQuery = qb.selectFrom("posts").select(["title", "content"]);
  
  // For comments table
  // Should show: "id", "post_id", "user_id", "content"
  const commentsQuery = qb.selectFrom("comments").select(["content"]);
  
  expect(true).toBe(true);
});

test("Autocomplete should include qualified columns when using aliases", () => {
  const qb = new QueryBuilder<TestDB>();
  
  // With alias, should show both qualified and unqualified
  // Should show: "u.id", "u.name", "u.email", "u.active", "id", "name", "email", "active"
  const aliasQuery = qb.selectFrom("users as u").select(["u.name", "email"]);
  
  // Should NOT show: "users.id", "users.name" etc (original table name excluded)
  
  expect(true).toBe(true);
});

test("Autocomplete should show columns from all joined tables", () => {
  const qb = new QueryBuilder<TestDB>();
  
  // After JOIN, should show columns from both tables
  const joinQuery = qb
    .selectFrom("users as u")
    .innerJoin("posts as p", "u.id", "p.user_id")
    .select([
      "u.name",      // from users
      "p.title",     // from posts
      "email",       // unqualified from users
      "published"    // unqualified from posts
    ]);
  
  // With three tables
  const tripleJoin = qb
    .selectFrom("users as u")
    .innerJoin("posts as p", "u.id", "p.user_id")
    .leftJoin("comments as c", "p.id", "c.post_id")
    .select([
      "u.name",
      "p.title",
      "c.content",
      "email",      // unqualified
      "published",  // unqualified
      "u.id",       // can use qualified even for unambiguous columns
    ]);
  
  expect(true).toBe(true);
});

test("Autocomplete should work for JOIN conditions", () => {
  const qb = new QueryBuilder<TestDB>();
  
  const query = qb
    .selectFrom("users as u")
    .innerJoin("posts as p", "u.id", "p.user_id");
    // First param should show: u.id, u.name, u.email, u.active, id, name, email, active
    // Second param should show: p.id, p.user_id, p.title, p.content, p.published, + unqualified
  
  // Multiple JOINs
  const multiJoin = qb
    .selectFrom("users as u")
    .innerJoin("posts as p", "u.id", "p.user_id")
    .leftJoin("comments as c", "p.id", "c.post_id");
    // In the leftJoin, both params should show columns from u, p, and unqualified
  
  expect(true).toBe(true);
});

test("Autocomplete should support column aliases", () => {
  const qb = new QueryBuilder<TestDB>();
  
  // Should allow "column as alias" syntax
  const aliasedColumns = qb
    .selectFrom("users")
    .select([
      "id as userId",
      "name as userName",
      "email as userEmail",
      "active as isActive"
    ]);
  
  // Should work with qualified columns too
  const qualifiedAliases = qb
    .selectFrom("users as u")
    .innerJoin("posts as p", "u.id", "p.user_id")
    .select([
      "u.id as authorId",
      "u.name as authorName",
      "p.title as postTitle",
      "p.published as isPublished"
    ]);
  
  expect(true).toBe(true);
});

test("Result types should have correct property names and types", async () => {
  const qb = new QueryBuilder<TestDB>();
  
  // Basic query result
  const users = await qb
    .selectFrom("users")
    .select(["id", "name"])
    .execute();
  
  // TypeScript knows the shape
  if (users[0]) {
    // These properties exist with correct types
    const id: number = users[0].id;
    const name: string = users[0].name;
    
    // @ts-expect-error - email wasn't selected
    const email = users[0].email;
  }
  
  // With aliases
  const aliasedResult = await qb
    .selectFrom("users")
    .select(["id as userId", "name as userName"])
    .execute();
  
  if (aliasedResult[0]) {
    // Properties are renamed
    const userId: number = aliasedResult[0].userId;
    const userName: string = aliasedResult[0].userName;
    
    // @ts-expect-error - "id" doesn't exist, it's "userId" now
    const id = aliasedResult[0].id;
  }
  
  // Complex query with JOINs and aliases
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
    // All properties exist with correct types
    const name: string = complexResult[0].name;
    const postTitle: string = complexResult[0].postTitle;
    const comment: string | null = complexResult[0].comment; // nullable from LEFT JOIN
    const published: boolean = complexResult[0].published;
  }
  
  expect(true).toBe(true);
});

test("Autocomplete should work progressively through the builder chain", () => {
  const qb = new QueryBuilder<TestDB>();
  
  // Step 1: After selectFrom
  const step1 = qb.selectFrom("users as u");
  // Can now call: select(), innerJoin(), leftJoin(), where(), etc.
  
  // Step 2: After first JOIN
  const step2 = step1.innerJoin("posts as p", "u.id", "p.user_id");
  // select() now shows columns from both tables
  
  // Step 3: After second JOIN
  const step3 = step2.leftJoin("comments as c", "p.id", "c.post_id");
  // select() now shows columns from all three tables
  
  // Step 4: After select
  const step4 = step3.select(["u.name", "p.title", "c.content"]);
  // Can now call: where(), orderBy(), limit(), execute()
  
  // Each step preserves type information
  step1.select(["id", "name"]); // only users columns
  step2.select(["u.name", "p.title"]); // users + posts columns
  step3.select(["u.name", "p.title", "c.content"]); // all three tables
  
  expect(true).toBe(true);
});