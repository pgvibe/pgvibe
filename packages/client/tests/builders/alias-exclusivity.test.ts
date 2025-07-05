import { describe, it, expect } from "bun:test";
import { pgvibe } from "../../src/query-builder";
import type {
  Database,
  GetColumnReferences,
} from "../../src/core/shared-types";

describe("Alias Exclusivity Tests", () => {
  const db = new pgvibe<Database>({
    connectionString: "postgresql://test:test@localhost:5432/test",
  });

  describe("Type-level testing", () => {
    it("should verify what column references are actually generated", () => {
      // Test what our type system generates
      type AliasedColumns = GetColumnReferences<Database, "users as u">;
      type NormalColumns = GetColumnReferences<Database, "users">;

      // Let's create explicit tests for each case
      const aliasedQuery = db.selectFrom("users as u");
      const normalQuery = db.selectFrom("users");

      // These should work for aliased query
      aliasedQuery.select(["u.id"]); // ✅ Should work
      aliasedQuery.select(["id"]); // ✅ Should work

      // These should work for normal query
      normalQuery.select(["users.id"]); // ✅ Should work
      normalQuery.select(["id"]); // ✅ Should work

      // This should NOT work for aliased query
      // Let's test this more explicitly
      console.log("Testing alias exclusivity...");
    });
  });

  describe("Runtime behavior", () => {
    it("should show the actual column types being generated", () => {
      const aliasedQuery = db.selectFrom("users as u");

      // Let's see what happens when we try to use the original table name
      try {
        // This should fail at TypeScript level, but let's see what happens at runtime
        // @ts-expect-error - users.id should NOT be allowed when using alias
        const result = aliasedQuery.select(["users.id", "users.name"]);
        console.log("❌ PROBLEM: Original table name was accepted!");
        console.log("Generated SQL:", result.compile().sql);
      } catch (error) {
        console.log("✅ GOOD: Original table name was rejected");
      }
    });
  });
});
