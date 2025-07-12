import { test, expect } from "bun:test";
import { pgvibe } from "../../../src/index";
import type { TestDB } from "../../__shared__/fixtures/test-schema";

/**
 * EDGE CASE REGRESSION PREVENTION TESTS
 * 
 * Tests all the weird, complex, and edge case scenarios that could break type inference
 */

test("EDGE CASE: Multiple aliases with same table should work", async () => {
  const db = pgvibe<TestDB>();

  const result = await db
    .selectFrom("users as u1")
    .innerJoin("users as u2", "u1.id", "u2.id")
    .select(["u1.name as name1", "u2.name as name2", "u1.email", "u2.active"])
    .execute();

  if (result[0]) {
    const _name1: string = result[0].name1;
    const _name2: string = result[0].name2;
    const _email: string | null = result[0].email;
    const _active: boolean = result[0].active;
  }
});

test("EDGE CASE: Complex nested alias expressions", async () => {
  const db = pgvibe<TestDB>();

  const result = await db
    .selectFrom("posts as p")
    .innerJoin("users as author", "p.user_id", "author.id")
    .innerJoin("comments as feedback", "p.id", "feedback.post_id")
    .select([
      "p.title as postTitle",
      "author.name as authorName", 
      "feedback.content as feedbackText",
      "p.published as isPublished"
    ])
    .execute();

  if (result[0]) {
    const _title: string = result[0].postTitle;
    const _author: string = result[0].authorName;
    const _feedback: string = result[0].feedbackText;
    const _published: boolean = result[0].isPublished;
  }
});

test("EDGE CASE: Very long alias chain with mixed JOINs", async () => {
  const db = pgvibe<TestDB>();

  const result = await db
    .selectFrom("users as u")
    .innerJoin("posts as p", "u.id", "p.user_id")
    .leftJoin("comments as c1", "p.id", "c1.post_id")
    .leftJoin("comments as c2", "p.id", "c2.post_id")
    .select([
      "u.name as userName",
      "u.email as userEmail",
      "p.title as postTitle",
      "p.content as postContent",
      "c1.content as firstComment",
      "c2.content as secondComment"
    ])
    .execute();

  if (result[0]) {
    const _userName: string = result[0].userName;
    const _userEmail: string | null = result[0].userEmail;
    const _postTitle: string = result[0].postTitle;
    const _postContent: string = result[0].postContent;
    const _firstComment: string | null = result[0].firstComment;   // LEFT JOIN = nullable
    const _secondComment: string | null = result[0].secondComment; // LEFT JOIN = nullable
  }
});

test("EDGE CASE: All different alias patterns in one query", async () => {
  const db = pgvibe<TestDB>();

  const result = await db
    .selectFrom("users as u")
    .innerJoin("posts as p", "u.id", "p.user_id")
    .select([
      "u.id",                     // qualified, no alias
      "name",                     // unqualified, no alias  
      "p.title as post_title",    // qualified with alias
      "published as is_live",     // unqualified with alias
      "u.email as contact_email", // qualified with alias
      "content"                   // unqualified, no alias
    ])
    .execute();

  if (result[0]) {
    const _id: number = result[0].id;
    const _name: string = result[0].name;
    const _postTitle: string = result[0].post_title;
    const _isLive: boolean = result[0].is_live;
    const _email: string | null = result[0].contact_email;
    const _content: string = result[0].content;
  }
});

test("EDGE CASE: Single character aliases", async () => {
  const db = pgvibe<TestDB>();

  const result = await db
    .selectFrom("users as u")
    .innerJoin("posts as p", "u.id", "p.user_id")
    .innerJoin("comments as c", "p.id", "c.post_id")
    .select(["u.name", "p.title", "c.content"])
    .execute();

  if (result[0]) {
    const _name: string = result[0].name;
    const _title: string = result[0].title;
    const _content: string = result[0].content;
  }
});

test("EDGE CASE: Numeric-like aliases", async () => {
  const db = pgvibe<TestDB>();

  const result = await db
    .selectFrom("users as u1")
    .innerJoin("posts as p2", "u1.id", "p2.user_id")
    .select(["u1.name as name1", "p2.title as title2", "u1.active"])
    .execute();

  if (result[0]) {
    const _name: string = result[0].name1;
    const _title: string = result[0].title2;
    const _active: boolean = result[0].active;
  }
});

test("EDGE CASE: Keywords as alias names", async () => {
  const db = pgvibe<TestDB>();

  const result = await db
    .selectFrom("users as user")
    .innerJoin("posts as post", "user.id", "post.user_id")
    .select([
      "user.name as username",
      "post.title as title",
      "user.email as email"
    ])
    .execute();

  if (result[0]) {
    const _username: string = result[0].username;
    const _title: string = result[0].title;
    const _email: string | null = result[0].email;
  }
});

test("EDGE CASE: Empty selection should default to all columns", async () => {
  const db = pgvibe<TestDB>();

  // Note: This tests the default behavior when no select() is called
  const query = db.selectFrom("users");
  const sql = query.toSQL();
  
  expect(sql).toBe("SELECT * FROM users");
});

test("EDGE CASE: Mixed INNER and LEFT JOINs affect nullability correctly", async () => {
  const db = pgvibe<TestDB>();

  const result = await db
    .selectFrom("users as u")
    .innerJoin("posts as p", "u.id", "p.user_id")     // INNER = non-nullable
    .leftJoin("comments as c", "p.id", "c.post_id")   // LEFT = nullable
    .select([
      "u.name",      // Base table = non-nullable
      "p.title",     // INNER JOIN = non-nullable  
      "c.content"    // LEFT JOIN = nullable
    ])
    .execute();

  if (result[0]) {
    const _userName: string = result[0].name;        // string (base table)
    const _postTitle: string = result[0].title;     // string (INNER JOIN)
    const _comment: string | null = result[0].content; // string | null (LEFT JOIN)
  }
});

test("EDGE CASE: Deeply nested table aliases", async () => {
  const db = pgvibe<TestDB>();

  const result = await db
    .selectFrom("users as deeply_nested_user_alias")
    .innerJoin("posts as extremely_long_post_alias_name", "deeply_nested_user_alias.id", "extremely_long_post_alias_name.user_id")
    .select([
      "deeply_nested_user_alias.name as very_long_username",
      "extremely_long_post_alias_name.title as super_descriptive_post_title"
    ])
    .execute();

  if (result[0]) {
    const _name: string = result[0].very_long_username;
    const _title: string = result[0].super_descriptive_post_title;
  }
});