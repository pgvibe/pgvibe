import { test, expect } from "bun:test";
import { pgvibe } from "../../src/index";
import type { TestDB } from "../fixtures/test-schema";

/**
 * COMPREHENSIVE VALIDATION TESTS
 * 
 * Exhaustive testing of every feature that should work based on current implementation
 */

test("COMPREHENSIVE: All table selection patterns", () => {
  const db = pgvibe<TestDB>();

  // Direct table names
  const query1 = db.selectFrom("users");
  const query2 = db.selectFrom("posts");
  const query3 = db.selectFrom("comments");
  
  // Table aliases
  const query4 = db.selectFrom("users as u");
  const query5 = db.selectFrom("posts as p");
  const query6 = db.selectFrom("comments as c");
  
  // Creative aliases
  const query7 = db.selectFrom("users as authors");
  const query8 = db.selectFrom("posts as content");
  const query9 = db.selectFrom("comments as feedback");
  
  expect(query1.toSQL()).toBe("SELECT * FROM users");
  expect(query4.toSQL()).toBe("SELECT * FROM users AS u");
  expect(query7.toSQL()).toBe("SELECT * FROM users AS authors");
});

test("COMPREHENSIVE: All column selection patterns for users table", async () => {
  const db = pgvibe<TestDB>();

  // All individual columns
  const result1 = await db.selectFrom("users").select(["id"]).execute();
  const result2 = await db.selectFrom("users").select(["name"]).execute();
  const result3 = await db.selectFrom("users").select(["email"]).execute();
  const result4 = await db.selectFrom("users").select(["active"]).execute();
  
  // Multiple columns
  const result5 = await db.selectFrom("users").select(["id", "name"]).execute();
  const result6 = await db.selectFrom("users").select(["name", "email"]).execute();
  const result7 = await db.selectFrom("users").select(["id", "name", "email", "active"]).execute();

  // Type validation
  if (result1[0]) {
    const _id: number = result1[0].id;
  }
  if (result2[0]) {
    const _name: string = result2[0].name;
  }
  if (result3[0]) {
    const _email: string | null = result3[0].email;
  }
  if (result4[0]) {
    const _active: boolean = result4[0].active;
  }
});

test("COMPREHENSIVE: All column selection patterns for posts table", async () => {
  const db = pgvibe<TestDB>();

  // All individual columns
  const result1 = await db.selectFrom("posts").select(["id"]).execute();
  const result2 = await db.selectFrom("posts").select(["user_id"]).execute();
  const result3 = await db.selectFrom("posts").select(["title"]).execute();
  const result4 = await db.selectFrom("posts").select(["content"]).execute();
  const result5 = await db.selectFrom("posts").select(["published"]).execute();
  
  // Type validation
  if (result1[0]) {
    const _id: number = result1[0].id;
  }
  if (result2[0]) {
    const _userId: number = result2[0].user_id;
  }
  if (result3[0]) {
    const _title: string = result3[0].title;
  }
  if (result4[0]) {
    const _content: string = result4[0].content;
  }
  if (result5[0]) {
    const _published: boolean = result5[0].published;
  }
});

test("COMPREHENSIVE: All qualified column patterns with aliases", async () => {
  const db = pgvibe<TestDB>();

  const result = await db
    .selectFrom("users as u")
    .select([
      "u.id",
      "u.name", 
      "u.email",
      "u.active"
    ])
    .execute();

  if (result[0]) {
    const _id: number = result[0].id;
    const _name: string = result[0].name;
    const _email: string | null = result[0].email;
    const _active: boolean = result[0].active;
  }
});

test("COMPREHENSIVE: All mixed qualified/unqualified patterns", async () => {
  const db = pgvibe<TestDB>();

  const result = await db
    .selectFrom("users as u")
    .select([
      "u.id",     // qualified
      "name",     // unqualified
      "u.email",  // qualified
      "active"    // unqualified
    ])
    .execute();

  if (result[0]) {
    const _id: number = result[0].id;
    const _name: string = result[0].name;
    const _email: string | null = result[0].email;
    const _active: boolean = result[0].active;
  }
});

test("COMPREHENSIVE: All column alias patterns", async () => {
  const db = pgvibe<TestDB>();

  // Simple aliases
  const result1 = await db
    .selectFrom("users")
    .select([
      "id as userId",
      "name as userName",
      "email as userEmail",
      "active as isActive"
    ])
    .execute();

  // Qualified with aliases
  const result2 = await db
    .selectFrom("users as u")
    .select([
      "u.id as userId",
      "u.name as userName",
      "u.email as userEmail",
      "u.active as isActive"
    ])
    .execute();

  // Mixed patterns
  const result3 = await db
    .selectFrom("users as u")
    .select([
      "u.id as userId",
      "name as userName",        // unqualified with alias
      "u.email",                 // qualified without alias
      "active"                   // unqualified without alias
    ])
    .execute();

  // Type validation
  if (result1[0]) {
    const _userId: number = result1[0].userId;
    const _userName: string = result1[0].userName;
    const _userEmail: string | null = result1[0].userEmail;
    const _isActive: boolean = result1[0].isActive;
  }

  if (result3[0]) {
    const _userId: number = result3[0].userId;
    const _userName: string = result3[0].userName;
    const _email: string | null = result3[0].email;
    const _active: boolean = result3[0].active;
  }
});

test("COMPREHENSIVE: All INNER JOIN patterns", async () => {
  const db = pgvibe<TestDB>();

  // Basic INNER JOIN
  const result1 = await db
    .selectFrom("users")
    .innerJoin("posts", "users.id", "posts.user_id")
    .select(["users.name", "posts.title"])
    .execute();

  // INNER JOIN with aliases
  const result2 = await db
    .selectFrom("users as u")
    .innerJoin("posts as p", "u.id", "p.user_id")
    .select(["u.name", "p.title"])
    .execute();

  // INNER JOIN with mixed patterns
  const result3 = await db
    .selectFrom("users as u")
    .innerJoin("posts as p", "u.id", "p.user_id")
    .select(["u.name", "title", "p.published", "active"])
    .execute();

  // Type validation
  if (result1[0]) {
    const _name: string = result1[0].name;
    const _title: string = result1[0].title;
  }

  if (result2[0]) {
    const _name: string = result2[0].name;
    const _title: string = result2[0].title;
  }

  if (result3[0]) {
    const _name: string = result3[0].name;
    const _title: string = result3[0].title;
    const _published: boolean = result3[0].published;
    const _active: boolean = result3[0].active;
  }
});

test("COMPREHENSIVE: All LEFT JOIN patterns", async () => {
  const db = pgvibe<TestDB>();

  // Basic LEFT JOIN
  const result1 = await db
    .selectFrom("users")
    .leftJoin("posts", "users.id", "posts.user_id")
    .select(["users.name", "posts.title"])
    .execute();

  // LEFT JOIN with aliases
  const result2 = await db
    .selectFrom("users as u")
    .leftJoin("posts as p", "u.id", "p.user_id")
    .select(["u.name", "p.title"])
    .execute();

  // Type validation - LEFT JOIN makes joined table columns nullable
  if (result1[0]) {
    const _name: string = result1[0].name;           // Base table = non-nullable
    const _title: string | null = result1[0].title; // LEFT JOIN = nullable
  }

  if (result2[0]) {
    const _name: string = result2[0].name;           // Base table = non-nullable
    const _title: string | null = result2[0].title; // LEFT JOIN = nullable
  }
});

test("COMPREHENSIVE: Multiple JOIN combinations", async () => {
  const db = pgvibe<TestDB>();

  // Two INNER JOINs
  const result1 = await db
    .selectFrom("users as u")
    .innerJoin("posts as p", "u.id", "p.user_id")
    .innerJoin("comments as c", "p.id", "c.post_id")
    .select(["u.name", "p.title", "c.content"])
    .execute();

  // INNER then LEFT JOIN
  const result2 = await db
    .selectFrom("users as u")
    .innerJoin("posts as p", "u.id", "p.user_id")
    .leftJoin("comments as c", "p.id", "c.post_id")
    .select(["u.name", "p.title", "c.content"])
    .execute();

  // LEFT then INNER JOIN
  const result3 = await db
    .selectFrom("users as u")
    .leftJoin("posts as p", "u.id", "p.user_id")
    .innerJoin("comments as c", "p.id", "c.post_id")
    .select(["u.name", "p.title", "c.content"])
    .execute();

  // Type validation
  if (result1[0]) {
    const _name: string = result1[0].name;
    const _title: string = result1[0].title;
    const _content: string = result1[0].content; // All INNER = non-nullable
  }

  if (result2[0]) {
    const _name: string = result2[0].name;
    const _title: string = result2[0].title;
    const _content: string | null = result2[0].content; // LEFT JOIN = nullable
  }

  if (result3[0]) {
    const _name: string = result3[0].name;
    const _title: string | null = result3[0].title; // LEFT JOIN = nullable
    const _content: string = result3[0].content; // But this is complex...
  }
});

test("COMPREHENSIVE: All JOIN column reference patterns", () => {
  const db = pgvibe<TestDB>();

  // Qualified references
  const query1 = db
    .selectFrom("users as u")
    .innerJoin("posts as p", "u.id", "p.user_id");

  // Mixed qualified/unqualified
  const query2 = db
    .selectFrom("users as u")
    .innerJoin("posts as p", "id", "user_id"); // This might be ambiguous

  // Different table combinations
  const query3 = db
    .selectFrom("posts as p")
    .innerJoin("comments as c", "p.id", "c.post_id");

  expect(query1.toSQL()).toContain("INNER JOIN");
  expect(query3.toSQL()).toContain("INNER JOIN");
});

test("COMPREHENSIVE: SQL generation accuracy", () => {
  const db = pgvibe<TestDB>();

  // Basic query
  const sql1 = db.selectFrom("users").toSQL();
  expect(sql1).toBe("SELECT * FROM users");

  // With alias
  const sql2 = db.selectFrom("users as u").toSQL();
  expect(sql2).toBe("SELECT * FROM users AS u");

  // With selection
  const sql3 = db.selectFrom("users").select(["name", "email"]).toSQL();
  expect(sql3).toBe("SELECT name, email FROM users");

  // With JOIN
  const sql4 = db
    .selectFrom("users as u")
    .innerJoin("posts as p", "u.id", "p.user_id")
    .select(["u.name", "p.title"])
    .toSQL();
  expect(sql4).toBe("SELECT u.name, p.title FROM users AS u INNER JOIN posts AS p ON u.id = p.user_id");

  // Complex query
  const sql5 = db
    .selectFrom("users as u")
    .innerJoin("posts as p", "u.id", "p.user_id")
    .leftJoin("comments as c", "p.id", "c.post_id")
    .select(["u.name", "p.title as postTitle", "c.content"])
    .toSQL();
  expect(sql5).toBe("SELECT u.name, p.title as postTitle, c.content FROM users AS u INNER JOIN posts AS p ON u.id = p.user_id LEFT JOIN comments AS c ON p.id = c.post_id");
});

test("COMPREHENSIVE: Builder method chaining", () => {
  const db = pgvibe<TestDB>();

  // Should be able to chain methods in any order
  const query1 = db
    .selectFrom("users as u")
    .select(["u.name"])
    .innerJoin("posts as p", "u.id", "p.user_id");

  const query2 = db
    .selectFrom("users as u")
    .innerJoin("posts as p", "u.id", "p.user_id")
    .select(["u.name"]);

  expect(typeof query1.toSQL()).toBe("string");
  expect(typeof query2.toSQL()).toBe("string");
});