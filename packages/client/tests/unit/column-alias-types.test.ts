import { test, expect } from "bun:test";
import { QueryBuilder } from "../../src/query-builder.js";
import { TestDB } from "../fixtures/test-schema.js";

test("should infer correct types for column aliases", async () => {
  const qb = new QueryBuilder<TestDB>();
  
  // Test basic column alias
  const result1 = await qb
    .selectFrom("users")
    .select(["name as userName", "email"])
    .execute();
  
  // TypeScript should infer: { userName: string, email: string }[]
  expect(result1).toEqual([]);
  
  // Test with JOINs and aliases
  const result2 = await qb
    .selectFrom("users as u")
    .innerJoin("posts as p", "u.id", "p.user_id")
    .select(["u.name as authorName", "p.title as postTitle"])
    .execute();
  
  // TypeScript should infer: { authorName: string, postTitle: string }[]
  expect(result2).toEqual([]);
  
  // Test complex query like demo5
  const demo5 = await qb
    .selectFrom("users as u")
    .innerJoin("posts as pasta", "u.id", "pasta.user_id")
    .leftJoin("comments as c", "pasta.id", "c.post_id")
    .select(["u.name", "pasta.title as ttiii", "c.content", "c.user_id"])
    .execute();
  
  // TypeScript should infer: { name: string, ttiii: string, content: string | null, user_id: number | null }[]
  expect(demo5).toEqual([]);
  
  // Type assertions to verify inference
  type Demo5Type = typeof demo5;
  type ExpectedType = {
    name: string;
    ttiii: string;
    content: string | null;
    user_id: number | null;
  }[];
  
  // This should compile without errors
  const _typeCheck: ExpectedType = demo5;
});

test("should handle multiple aliases in selection", async () => {
  const qb = new QueryBuilder<TestDB>();
  
  const result = await qb
    .selectFrom("users")
    .select([
      "id as userId",
      "name as userName",
      "email as userEmail",
      "active as isActive"
    ])
    .execute();
  
  // TypeScript should infer properly renamed properties
  type ResultType = typeof result;
  type ExpectedType = {
    userId: number;
    userName: string;
    userEmail: string;
    isActive: boolean;
  }[];
  
  // This should compile without errors
  const _typeCheck: ExpectedType = result;
  expect(result).toEqual([]);
});