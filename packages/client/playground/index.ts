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
    console.log("🔍 Testing PostgreSQL queries...\n");

    // === Basic SELECT queries ===
    console.log("1. Basic SELECT queries:");

    // Simple SELECT *
    console.log("  📋 SELECT * FROM users:");
    const allUsers = await db.selectFrom("users").execute();
    console.log(`    Found ${allUsers.length} users`);
    console.log(`    First user: ${allUsers[0]?.name || "None"}\n`);

    // SELECT specific columns
    console.log("  📋 SELECT id, name FROM users WHERE active = true:");

    const activeUsers = await db
      .selectFrom("users as u")
      .select(["id", "name"])
      .where(({ eb, or }) => [
        or([
          eb("u.active", "=", false),
          eb("name", "=", "johan"),
          eb("created_at", ">", "2025-01-01"),
        ]),
      ])
      .where("created_at", "<", "2024-02-02")
      .execute();

    console.log(`    Found ${activeUsers.length} active users`);
    activeUsers.forEach((user) =>
      console.log(`    - ${user.name} (ID: ${user.id})`)
    );
    console.log();

    // === WHERE clauses ===
    console.log("2. WHERE clause operations:");

    // IS NULL
    const usersWithoutEmail = await db
      .selectFrom("users")
      .select(["name", "email"])
      .where("email", "is", null)
      .execute();
    console.log(`  📋 Users without email: ${usersWithoutEmail.length}`);

    // LIKE
    const johnUsers = await db
      .selectFrom("users")
      .select(["name", "email"])
      .where("name", "like", "%John%")
      .execute();
    console.log(`  📋 Users with 'John' in name: ${johnUsers.length}`);

    // IN clause
    const specificUsers = await db
      .selectFrom("users")
      .select(["id", "name"])
      .where("id", "in", [1, 2, 3])
      .execute();
    console.log(`  📋 Users with ID 1, 2, or 3: ${specificUsers.length}\n`);

    // === JOINs ===
    console.log("3. JOIN operations:");

    const usersWithPosts = await db
      .selectFrom("users")
      .innerJoin("posts", "users.id", "posts.user_id")
      .select(["users.name", "posts.title", "posts.published"])
      .where("posts.published", "=", true)
      .orderBy("users.created_at", "desc")
      .limit(3)
      .execute();
    console.log(`  📋 Users with published posts (first 3):`);
    usersWithPosts.forEach((row) => {
      // PostgreSQL returns qualified column names in JOIN results
      const name = (row as any)["users.name"] || (row as any).name;
      const title = (row as any)["posts.title"] || (row as any).title;
      console.log(`    - ${name}: "${title}"`);
    });
    console.log();

    // === Raw SQL ===
    console.log("4. Raw SQL expressions:");

    const recentUsers = await db
      .selectFrom("users")
      .select(["name", "created_at"])
      .where(sql`created_at > NOW() - INTERVAL '30 days'`)
      .execute();
    console.log(`  📋 Users created in last 30 days: ${recentUsers.length}`);

    // Complex raw SQL
    const userStats = await db
      .selectFrom("users")
      .select(["name", "email"])
      .where(sql`EXTRACT(YEAR FROM created_at) = ${2024}`)
      .where(({ eb }) => [eb("active", "=", true), eb("id", ">", 1)])
      .execute();
    console.log(`  📋 Active users created in 2024: ${userStats.length}\n`);

    // === ORDER BY and LIMIT ===
    console.log("5. Sorting and pagination:");

    const sortedUsers = await db
      .selectFrom("users")
      .select(["name", "created_at"])
      .orderBy("created_at", "desc")
      .limit(3)
      .execute();
    console.log(`  📋 3 most recently created users:`);
    sortedUsers.forEach((user) =>
      console.log(
        `    - ${user.name} (${
          user.created_at?.toLocaleDateString() || "Unknown date"
        })`
      )
    );
    console.log();

    // === SQL inspection ===
    console.log("6. SQL generation (without execution):");

    const complexQuery = db
      .selectFrom("users")
      .innerJoin("posts", "users.id", "posts.user_id")
      .select(["users.name", "posts.title"])
      .where("users.active", "=", true)
      .where("posts.published", "=", true)
      .orderBy("posts.created_at", "desc")
      .limit(5);

    const { sql: generatedSQL, parameters } = complexQuery.toSQL();
    console.log("  📋 Generated SQL:");
    console.log(`    ${generatedSQL}`);
    console.log(`  📋 Parameters: [${parameters.join(", ")}]\n`);

    console.log("✅ All queries executed successfully!");
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
