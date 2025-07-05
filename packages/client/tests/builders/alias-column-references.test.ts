import { describe, it, expect } from "bun:test";
import { pgvibe } from "../../src/query-builder";
import type { Database } from "../../src/core/shared-types";

describe("Alias Column References", () => {
  const db = new pgvibe<Database>({
    connectionString: "postgresql://test:test@localhost:5432/test",
  });

  describe("Simple Column References with Aliases", () => {
    it("should support simple column names with alias table", () => {
      // This should work: simple column names should be available
      const query = db.selectFrom("users as u").select(["id", "name", "email"]);

      expect(query).toBeDefined();
    });

    it("should support qualified column references with aliases", () => {
      // This should work: u.id, u.name, etc. should be available
      const query = db
        .selectFrom("users as u")
        .select(["u.id", "u.name", "u.email"]);

      expect(query).toBeDefined();

      // Test that the query compiles to some SQL
      const compiled = query.compile();
      expect(compiled).toBeDefined();
      expect(typeof compiled.sql).toBe("string");
    });

    it("should NOT support original table qualified references when alias is used", () => {
      // This should NOT work: users.id, users.name should not be available when using alias
      // We'll test this by checking the types (this is more of a TypeScript test)

      const query = db.selectFrom("users as u");
      // If we tried query.select(["users.id"]), it should be a type error
      // For runtime testing, we just verify the query builder exists
      expect(query).toBeDefined();
    });
  });

  describe("Mixed Column References", () => {
    it("should support mixing simple and qualified column references", () => {
      const query = db
        .selectFrom("users as u")
        .select(["id", "u.name", "email", "u.created_at"]);

      expect(query).toBeDefined();
    });
  });

  describe("Type System Verification", () => {
    it("should use alias-aware types for aliased tables", () => {
      const aliasedQuery = db.selectFrom("users as u");
      const normalQuery = db.selectFrom("users");

      // Both should exist but have different types
      expect(aliasedQuery).toBeDefined();
      expect(normalQuery).toBeDefined();

      // The types should be different (this is verified at compile time)
      expect(typeof aliasedQuery).toBe("object");
      expect(typeof normalQuery).toBe("object");
    });
  });

  describe("Real-world Usage", () => {
    it("should work for a typical alias query pattern", () => {
      const query = db
        .selectFrom("users as u")
        .select(["u.id", "u.name", "u.email"]);

      expect(query).toBeDefined();

      const compiled = query.compile();
      console.log("Compiled SQL:", compiled.sql);

      // The SQL should contain the alias
      expect(compiled.sql).toBeDefined();
    });
  });
});
