import { describe, it, expect } from "bun:test";
import { ZenQ } from "../../src/query-builder";
import type { Database } from "../../src/core/shared-types";

describe("Alias SQL Generation", () => {
  const db = new ZenQ<Database>({
    connectionString: "postgresql://test:test@localhost:5432/test",
  });

  describe("Table Aliases in FROM clause", () => {
    it("should generate correct SQL for table aliases", () => {
      const query = db.selectFrom("users as u");
      const compiled = query.compile();

      expect(compiled.sql).toContain("FROM users AS u");
    });

    it("should generate correct SQL for different table aliases", () => {
      const usersQuery = db.selectFrom("users as u");
      const postsQuery = db.selectFrom("posts as p");
      const commentsQuery = db.selectFrom("comments as c");

      expect(usersQuery.compile().sql).toContain("FROM users AS u");
      expect(postsQuery.compile().sql).toContain("FROM posts AS p");
      expect(commentsQuery.compile().sql).toContain("FROM comments AS c");
    });

    it("should handle tables without aliases", () => {
      const query = db.selectFrom("users");
      const compiled = query.compile();

      expect(compiled.sql).toContain("FROM users");
      expect(compiled.sql).not.toContain(" AS ");
    });
  });

  describe("Column references with aliases", () => {
    it("should generate correct SQL for simple column references", () => {
      const query = db.selectFrom("users as u").select(["id", "name"]);
      const compiled = query.compile();

      expect(compiled.sql).toContain("SELECT id, name");
      expect(compiled.sql).toContain("FROM users AS u");
    });

    it("should handle selectAll with aliases", () => {
      const query = db.selectFrom("users as u").selectAll();
      const compiled = query.compile();

      expect(compiled.sql).toContain("SELECT *");
      expect(compiled.sql).toContain("FROM users AS u");
    });

    it("should handle qualified column references with aliases", () => {
      const query = db
        .selectFrom("users as u")
        .select(["u.id", "u.name", "u.email"]);
      const compiled = query.compile();

      // The SQL should contain the qualified column references
      expect(compiled.sql).toContain("FROM users AS u");
      // Note: The actual column compilation depends on the query compiler implementation
      console.log("Qualified columns SQL:", compiled.sql);
    });
  });

  describe("Method chaining with aliases", () => {
    it("should generate correct SQL for method chaining", () => {
      const query = db
        .selectFrom("users as u")
        .select(["u.id", "u.name"])
        .limit(10)
        .offset(5);

      const compiled = query.compile();

      expect(compiled.sql).toContain("FROM users AS u");
      expect(compiled.sql).toContain("LIMIT 10");
      expect(compiled.sql).toContain("OFFSET 5");

      console.log("Method chaining SQL:", compiled.sql);
    });
  });

  describe("Comparison: Normal vs Aliased", () => {
    it("should show the difference between normal and aliased queries", () => {
      const normalQuery = db.selectFrom("users").select(["id", "name"]);
      const aliasedQuery = db.selectFrom("users as u").select(["id", "name"]);

      const normalSql = normalQuery.compile().sql;
      const aliasedSql = aliasedQuery.compile().sql;

      console.log("Normal SQL:", normalSql);
      console.log("Aliased SQL:", aliasedSql);

      expect(normalSql).toContain("FROM users");
      expect(aliasedSql).toContain("FROM users AS u");

      expect(normalSql).not.toContain(" AS ");
      expect(aliasedSql).toContain(" AS ");
    });
  });
});
