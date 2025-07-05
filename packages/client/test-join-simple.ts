import { createTestDatabase } from "./tests/utils/test-config";

const db = createTestDatabase();

// Simple test to understand the JOIN issue
async function testJoinTypes() {
  console.log("Testing JOIN types...");

  // This works - basic alias
  const query1 = db.selectFrom("users as u").select(["u.id", "u.name"]);
  console.log("✅ Basic alias works");

  // This should work but fails - JOIN with alias
  const query2 = db
    .selectFrom("users as u")
    .innerJoin("posts as p", "u.id", "p.user_id")
    .select(["u.id", "p.title"]); // ← This fails

  console.log("✅ JOIN with alias should work");
}

testJoinTypes();
