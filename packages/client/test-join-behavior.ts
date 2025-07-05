import { createTestDatabase } from "./tests/utils/test-config";

const db = createTestDatabase();

async function testJoinBehavior() {
  console.log("=== Testing JOIN behavior ===\n");

  // Test 1: Regular JOIN without aliases (does this work?)
  console.log("1. Regular JOIN without aliases:");
  try {
    const result1 = await db
      .selectFrom("users")
      .innerJoin("posts", "users.id", "posts.user_id")
      .select(["users.id", "posts.title"])
      .execute();
    console.log("✅ Works! Can select from both tables");
  } catch (error) {
    console.log(
      "❌ Failed:",
      error instanceof Error ? error.message : String(error)
    );
  }

  // Test 2: Alias on first table only
  console.log("\n2. Alias on first table only:");
  try {
    const result2 = await db
      .selectFrom("users as u")
      .innerJoin("posts", "u.id", "posts.user_id")
      .select(["u.id", "posts.title"])
      .execute();
    console.log("✅ Works! Can select from both tables");
  } catch (error) {
    console.log(
      "❌ Failed:",
      error instanceof Error ? error.message : String(error)
    );
  }

  // Test 3: Alias on both tables (the failing case)
  console.log("\n3. Alias on both tables:");
  try {
    const result3 = await db
      .selectFrom("users as u")
      .innerJoin("posts as p", "u.id", "p.user_id")
      .select(["u.id", "p.title"])
      .execute();
    console.log("✅ Works! Can select from both tables");
  } catch (error) {
    console.log(
      "❌ Failed:",
      error instanceof Error ? error.message : String(error)
    );
  }

  // Test 4: Check what columns TypeScript thinks are available
  console.log("\n4. TypeScript column inference:");
  const query = db
    .selectFrom("users as u")
    .innerJoin("posts as p", "u.id", "p.user_id");

  // Try to see what's available in the select
  // @ts-expect-error - Intentionally checking what TypeScript allows
  const testSelect = query.select;
  console.log("Query builder type:", query.constructor.name);
}

testJoinBehavior();
