// pgvibe Playground
// Test and experiment with the PostgreSQL-native query builder

import { pgvibe, sql, raw } from "../src/query-builder";
import type { ExampleDatabase } from "./types";

console.log("🚀 pgvibe PostgreSQL-Native Query Builder");
console.log("==========================================\n");

// Create pgvibe instance with PostgreSQL
const db = new pgvibe<ExampleDatabase>({
  connectionString:
    "postgresql://pgvibe_user:pgvibe_password@localhost:54322/pgvibe_test",
});

async function playground() {
  try {
    console.log("🧪 Testing INSERT with optional columns...\n");

    // Test 1: Insert with only required fields (name)
    // All other fields are optional because they are:
    // - Generated (id)
    // - WithDefault (active, created_at, tags, permissions, scores)
    // - Nullable (email)
    const result1 = await db
      .insertInto("users as u")
      .values({
        name: "John Doe",
        email: "john@example.com",
      })
      .returning(["id", "name", "u.email"])
      .execute();

    console.log("✅ Insert with minimal data:", result1);

    // Test 2: Insert with some optional fields provided
    const result2 = await db
      .insertInto("users as u")
      .values({
        name: "Jane Smith",
        email: "jane@example.com", // Providing nullable field
        active: false, // Overriding default
        tags: ["admin", "user"], // Providing array default
      })
      .returning(["id", "name", "email", "active", "u.active"])
      .execute();

    console.log("✅ Insert with optional fields:", result2);

    const results = await db
      .selectFrom("users as u")
      .select(["id", "name", "tags"])
      .where(({ array }) => array("u.name").overlaps(["admin", "user"]))
      .execute();

    // Test 3: Insert with explicit null (should work for nullable fields)
    const result3 = await db
      .insertInto("users as u")
      .values({
        name: "Bob Wilson",
        email: null, // Explicitly setting nullable field to null
      })
      .returning(["id", "name", "email"])
      .execute();

    console.log("✅ Insert with explicit null:", result3);
  } catch (error) {
    console.error("❌ Error:", error instanceof Error ? error.message : error);
  } finally {
    // Clean shutdown
    await db.destroy();
    console.log("\n🔐 Database connection closed.");
  }
}

// Run the playground
playground().catch(console.error);

// Export for testing
export { db };
