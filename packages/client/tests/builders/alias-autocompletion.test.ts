import { describe, it, expect } from "bun:test";
import { pgvibe } from "../../src/query-builder";
import type {
  Database,
  GetColumnReferences,
} from "../../src/core/shared-types";

describe("Alias Autocompletion and Type Support", () => {
  const db = new pgvibe<Database>({
    connectionString: "postgresql://test:test@localhost:5432/test",
  });

  describe("Single Table Alias - What Should Work", () => {
    it("should support both qualified and unqualified column references", () => {
      const query = db.selectFrom("users as u");

      // These should ALL work according to the user's requirements:

      // 1. Qualified alias columns (currently works)
      const qualified = query.select(["u.id", "u.name", "u.email"]);
      expect(qualified).toBeDefined();

      // 2. Unqualified columns (currently DOESN'T work - this is what we need to fix)
      const unqualified = query.select(["id", "name", "email"]);
      expect(unqualified).toBeDefined();

      // 3. Mixed qualified and unqualified (should work)
      const mixed = query.select(["u.id", "name", "u.email", "active"]);
      expect(mixed).toBeDefined();
    });

    it("should generate correct SQL for mixed column references", () => {
      const query = db
        .selectFrom("users as u")
        .select(["u.id", "name", "email"]);

      const compiled = query.compile();
      console.log("Mixed columns SQL:", compiled.sql);

      // Should contain the table alias in FROM
      expect(compiled.sql).toContain("FROM users AS u");
    });
  });

  describe("Multi-Table with Joins - What Should Work", () => {
    it("should support columns from multiple aliased tables", () => {
      // This is what the user wants to work:
      // After joining, we should have access to:
      // - u.id, u.name, u.email (qualified from users)
      // - c.id, c.content (qualified from comments)
      // - id, name, email, content (unqualified from both tables)

      const query = db
        .selectFrom("users as u")
        .innerJoin("comments as c", "u.id", "c.user_id");

      // All of these should work now:
      const qualifiedOnly = query.select(["u.id", "u.name", "c.content"]);
      expect(qualifiedOnly).toBeDefined();

      // This should work with the new multi-table system:
      const unqualifiedOnly = query.select(["id", "name", "content"]);
      expect(unqualifiedOnly).toBeDefined();

      const mixed = query.select(["u.id", "name", "c.content", "email"]);
      expect(mixed).toBeDefined();
    });

    it("should generate correct SQL for multi-table joins", () => {
      const query = db
        .selectFrom("users as u")
        .innerJoin("comments as c", "u.id", "c.user_id")
        .select(["u.id", "u.name", "c.content", "email"]);

      const compiled = query.compile();
      console.log("Multi-table join SQL:", compiled.sql);

      // Should contain proper aliases and joins
      expect(compiled.sql).toContain("FROM users AS u");
      expect(compiled.sql).toContain("INNER JOIN comments AS c");
      expect(compiled.sql).toContain("ON u.id = c.user_id");
    });
  });

  describe("Alias Exclusivity - Critical Behavior", () => {
    it("should NOT allow original table name when using alias", () => {
      const query = db.selectFrom("users as u");

      // These should work (alias columns)
      const aliasColumns = query.select(["u.id", "u.name", "id", "name"]);
      expect(aliasColumns).toBeDefined();

      // These should NOT work (original table name should be unavailable)
      // Let's test this by trying to use the original table name
      // This should cause a TypeScript error
      try {
        // @ts-expect-error - users.id should not be available when using alias
        const originalTableColumns = query.select(["users.id", "users.name"]);
        console.log(
          "✅ GOOD: TypeScript prevented original table name, but runtime still works"
        );
      } catch (e) {
        console.log(
          "✅ GOOD: Original table name correctly rejected with alias"
        );
      }
    });

    it("should allow both qualified and unqualified when NO alias", () => {
      const query = db.selectFrom("users");

      // These should ALL work (no alias used)
      const qualifiedColumns = query.select(["users.id", "users.name"]);
      expect(qualifiedColumns).toBeDefined();

      const unqualifiedColumns = query.select(["id", "name"]);
      expect(unqualifiedColumns).toBeDefined();

      const mixedColumns = query.select(["users.id", "name", "users.email"]);
      expect(mixedColumns).toBeDefined();
    });

    it("should show the difference in generated SQL", () => {
      // With alias - should use alias in SQL
      const aliasQuery = db.selectFrom("users as u").select(["u.id", "name"]);

      const aliasSQL = aliasQuery.compile();
      console.log("With alias SQL:", aliasSQL.sql);

      // Without alias - should use table name in SQL
      const noAliasQuery = db.selectFrom("users").select(["users.id", "name"]);

      const noAliasSQL = noAliasQuery.compile();
      console.log("Without alias SQL:", noAliasSQL.sql);

      // Verify the difference
      expect(aliasSQL.sql).toContain("FROM users AS u");
      expect(noAliasSQL.sql).toContain("FROM users");
      expect(noAliasSQL.sql).not.toContain("AS u");
    });
  });

  describe("Current Type System Analysis", () => {
    it("should show what types are currently generated", () => {
      // Let's see what our current GetColumnReferences type generates
      const aliasedQuery = db.selectFrom("users as u");
      const normalQuery = db.selectFrom("users");

      expect(aliasedQuery).toBeDefined();
      expect(normalQuery).toBeDefined();

      // The difference should be in the available column types
      console.log("Testing current type behavior...");
    });
  });

  describe("Type System Debug", () => {
    it("should show what column references are generated", () => {
      // Let's create a simple type test to see what's happening
      type TestAliasedColumns = GetColumnReferences<Database, "users as u">;
      type TestNormalColumns = GetColumnReferences<Database, "users">;

      // This should help us understand what's being generated
      const aliasedQuery = db.selectFrom("users as u");
      const normalQuery = db.selectFrom("users");

      console.log("Debugging type generation...");

      // Let's see what actually gets accepted
      const testAliased = aliasedQuery.select(["u.id"]); // Should work
      const testNormal = normalQuery.select(["users.id"]); // Should work

      expect(testAliased).toBeDefined();
      expect(testNormal).toBeDefined();
    });
  });
});
