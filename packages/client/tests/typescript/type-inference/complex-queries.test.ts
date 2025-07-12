import { test, expect } from "bun:test";
import { pgvibe } from "../../../src/index";
import type { TestDB } from "../../../../__shared__/fixtures/test-schema";

/**
 * CRITICAL REGRESSION PREVENTION: Result Type Inference Tests
 * 
 * These tests ensure that query results are properly typed and never fall back to {[x: string]: any}[]
 * This is essential for TypeScript developer experience.
 */

test("REGRESSION PREVENTION: Complex JOIN query should have precise result types", async () => {
  const db = pgvibe<TestDB>();

  const result = await db
    .selectFrom("users as u")
    .innerJoin("posts as p", "u.id", "p.user_id")
    .leftJoin("comments as c", "p.id", "c.post_id")
    .select(["u.name", "p.title as postTitle", "c.content", "c.user_id"])
    .execute();

  // This test ensures TypeScript can infer the exact result type
  type ResultType = typeof result;
  
  // Force TypeScript to validate the exact shape
  const typeTest: ResultType = [
    {
      name: "string",
      postTitle: "string", 
      content: null, // Can be null from LEFT JOIN
      user_id: 42    // Can be null from LEFT JOIN
    }
  ];

  // Verify the shape at runtime (basic smoke test)
  expect(Array.isArray(result)).toBe(true);
  
  // The key test: if this compiles, our types are working
  if (result[0]) {
    const _name: string = result[0].name;
    const _title: string = result[0].postTitle;
    const _content: string | null = result[0].content;
    const _userId: number | null = result[0].user_id;
  }
});

test("REGRESSION PREVENTION: Table aliases should maintain precise types", async () => {
  const db = pgvibe<TestDB>();

  const result = await db
    .selectFrom("posts as pasta")
    .select(["pasta.title as ttiii", "pasta.content", "pasta.published"])
    .execute();

  // Type validation
  type ResultType = typeof result;
  
  const typeTest: ResultType = [
    {
      ttiii: "string",
      content: "string",
      published: true
    }
  ];

  if (result[0]) {
    const _title: string = result[0].ttiii;
    const _content: string = result[0].content;
    const _published: boolean = result[0].published;
  }
});

test("REGRESSION PREVENTION: Mixed qualified/unqualified columns", async () => {
  const db = pgvibe<TestDB>();

  const result = await db
    .selectFrom("users as u")
    .innerJoin("posts as p", "u.id", "p.user_id")
    .select(["u.name", "title", "u.email", "published"])  // Mixed styles
    .execute();

  if (result[0]) {
    const _name: string = result[0].name;
    const _title: string = result[0].title;
    const _email: string | null = result[0].email;
    const _published: boolean = result[0].published;
  }
});

test("REGRESSION PREVENTION: pgvibe() function should create properly typed instance", () => {
  const db = pgvibe<TestDB>();
  
  // This should not be QueryBuilder<any> but QueryBuilder<TestDB>
  const query = db.selectFrom("users");
  
  // If types work correctly, this should provide proper autocomplete and validation
  expect(typeof query).toBe("object");
});