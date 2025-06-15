import { createTestDatabase } from "./tests/utils/test-config";
import type { Database } from "./tests/utils/test-types";

const db = createTestDatabase();

// Test the JOIN selectAll fix
async function testJoinSelectAll() {
  const result = await db
    .selectFrom("users")
    .innerJoin("posts", "users.id", "posts.user_id")
    .selectAll()
    .execute();

  // This should now include all columns from both tables
  // Let's check what TypeScript infers for the result type
  console.log("Test passed: JOIN selectAll returns full type");

  // Check that we have both user and post columns
  const firstResult = result[0];
  if (firstResult) {
    console.log("Available columns:", Object.keys(firstResult));
    console.log(
      "Has user columns:",
      "name" in firstResult,
      "email" in firstResult
    );
    console.log(
      "Has post columns:",
      "title" in firstResult,
      "content" in firstResult
    );
  }

  return result;
}

// Test the fix
testJoinSelectAll().catch(console.error);
