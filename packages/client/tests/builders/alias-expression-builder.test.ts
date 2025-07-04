import { describe, it, expect } from "bun:test";
import { ZenQ } from "../../src/query-builder";
import type { Database } from "../../src/core/shared-types";

describe("Alias Expression Builder Tests", () => {
  const db = new ZenQ<Database>({
    connectionString: "postgresql://test:test@localhost:5432/test",
  });

  describe("Current Alias Support - What Works", () => {
    it("should support basic table aliases in SELECT", () => {
      const query = db.selectFrom("users as u").select(["u.name", "u.email"]);

      expect(query).toBeDefined();

      const compiled = query.compile();
      console.log("Basic alias SELECT SQL:", compiled.sql);

      expect(compiled.sql).toContain("FROM users AS u");
      expect(compiled.sql).toContain('"u.name"');
      expect(compiled.sql).toContain('"u.email"');
    });

    it("should support mixed qualified and unqualified columns", () => {
      const query = db
        .selectFrom("users as u")
        .select(["u.name", "email", "u.id", "active"]);

      expect(query).toBeDefined();

      const compiled = query.compile();
      console.log("Mixed columns SQL:", compiled.sql);

      expect(compiled.sql).toContain("FROM users AS u");
      expect(compiled.sql).toContain('"u.name"');
      expect(compiled.sql).toContain("email");
      expect(compiled.sql).toContain('"u.id"');
      expect(compiled.sql).toContain("active");
    });

    it("should support JOIN operations with aliases", () => {
      const query = db
        .selectFrom("users as u")
        .innerJoin("posts as p", "u.id", "p.user_id")
        .select(["u.name", "p.title", "content"]);

      expect(query).toBeDefined();

      const compiled = query.compile();
      console.log("JOIN with aliases SQL:", compiled.sql);

      expect(compiled.sql).toContain("FROM users AS u");
      expect(compiled.sql).toContain("INNER JOIN posts AS p");
      expect(compiled.sql).toContain("ON u.id = p.user_id");
      expect(compiled.sql).toContain('"u.name"');
      expect(compiled.sql).toContain('"p.title"');
      expect(compiled.sql).toContain("content");
    });

    it("should support multiple JOINs with aliases", () => {
      const query = db
        .selectFrom("users as u")
        .innerJoin("posts as p", "u.id", "p.user_id")
        .leftJoin("comments as c", "p.id", "c.post_id")
        .select(["u.name", "p.title", "c.content"]);

      expect(query).toBeDefined();

      const compiled = query.compile();
      console.log("Multiple JOINs SQL:", compiled.sql);

      expect(compiled.sql).toContain("FROM users AS u");
      expect(compiled.sql).toContain("INNER JOIN posts AS p");
      expect(compiled.sql).toContain('"u.name"');
      expect(compiled.sql).toContain('"p.title"');
      expect(compiled.sql).toContain('"c.content"');
    });
  });

  describe("Expression Builder Support - TODO", () => {
    it("should document WHERE clause with aliases (not yet implemented)", () => {
      // This test documents what should work in the future
      const query = db.selectFrom("users as u").select(["u.name", "u.email"]);

      // TODO: This should work in the future
      // .where(({ eb, or }) => [
      //   or([
      //     eb("u.active", "=", true),
      //     eb("u.name", "=", "johan"),
      //     eb("u.created_at", ">", "2025-01-01"),
      //   ]),
      // ]);

      expect(query).toBeDefined();

      const compiled = query.compile();
      console.log("Current query (without WHERE):", compiled.sql);

      // Currently works
      expect(compiled.sql).toContain("FROM users AS u");
      expect(compiled.sql).toContain('"u.name"');
      expect(compiled.sql).toContain('"u.email"');

      // TODO: Should contain WHERE clause with aliases
      // expect(compiled.sql).toContain("WHERE (u.active = $1 OR u.name = $2 OR u.created_at > $3)");
    });

    it("should document ORDER BY with aliases (not yet implemented)", () => {
      // This test documents what should work in the future
      const query = db.selectFrom("users as u").select(["u.name", "u.email"]);

      // TODO: This should work in the future
      // .orderBy("u.created_at", "desc")
      // .orderBy("u.name", "asc");

      expect(query).toBeDefined();

      const compiled = query.compile();
      console.log("Current query (without ORDER BY):", compiled.sql);

      // Currently works
      expect(compiled.sql).toContain("FROM users AS u");

      // TODO: Should contain ORDER BY with aliases
      // expect(compiled.sql).toContain("ORDER BY u.created_at DESC, u.name ASC");
    });

    it("should document multi-table WHERE with aliases (not yet implemented)", () => {
      // This test documents what should work in the future
      const query = db
        .selectFrom("users as u")
        .innerJoin("posts as p", "u.id", "p.user_id")
        .select(["u.name", "p.title"]);

      // TODO: This should work in the future
      // .where(({ eb, and, or }) => [
      //   and([
      //     eb("u.active", "=", true),
      //     or([
      //       eb("p.published", "=", true),
      //       eb("u.name", "=", "admin"),
      //     ]),
      //   ]),
      // ]);

      expect(query).toBeDefined();

      const compiled = query.compile();
      console.log("Current multi-table query (without WHERE):", compiled.sql);

      // Currently works
      expect(compiled.sql).toContain("FROM users AS u");
      expect(compiled.sql).toContain("INNER JOIN posts AS p");
      expect(compiled.sql).toContain('"u.name"');
      expect(compiled.sql).toContain('"p.title"');

      // TODO: Should contain complex WHERE clause with aliases
      // expect(compiled.sql).toContain("WHERE (u.active = $1 AND (p.published = $2 OR u.name = $3))");
    });
  });

  describe("Type Safety with Expression Builder", () => {
    it("should provide correct type hints for aliased columns", () => {
      const query = db
        .selectFrom("users as u")
        .innerJoin("posts as p", "u.id", "p.user_id");

      // These should all work for SELECT
      const validQuery = query.select([
        "u.id", // Qualified from users
        "u.name", // Qualified from users
        "p.id", // Qualified from posts
        "p.title", // Qualified from posts
        "id", // Unqualified (should work)
        "name", // Unqualified (should work)
        "title", // Unqualified (should work)
      ]);

      expect(validQuery).toBeDefined();

      const compiled = validQuery.compile();
      console.log("Multi-table type safety SQL:", compiled.sql);

      expect(compiled.sql).toContain("FROM users AS u");
      expect(compiled.sql).toContain("INNER JOIN posts AS p");
    });

    it("should NOT allow original table names when using aliases", () => {
      const query = db
        .selectFrom("users as u")
        .innerJoin("posts as p", "u.id", "p.user_id");

      // This should be a TypeScript error in SELECT
      // Note: Currently the @ts-expect-error might not work as expected
      // This is a placeholder for future type safety improvements
      console.log(
        "✅ Type safety for original table names needs implementation"
      );

      // TODO: This should also be a TypeScript error in WHERE (when implemented)
      // Future: WHERE clause should prevent original table names when using aliases
    });
  });

  describe("Real-world Scenarios - Current Capabilities", () => {
    it("should handle complex SELECT with aliases", () => {
      const query = db
        .selectFrom("users as u")
        .innerJoin("posts as p", "u.id", "p.user_id")
        .leftJoin("comments as c", "p.id", "c.post_id")
        .select([
          "u.name", // TODO: Column aliases like "u.name as author" not yet supported
          "u.email",
          "p.title", // TODO: Column aliases like "p.title as post_title" not yet supported
          "p.content",
          "c.content", // TODO: Column aliases like "c.content as comment_text" not yet supported
          "created_at", // Unqualified
        ]);

      expect(query).toBeDefined();

      const compiled = query.compile();
      console.log("Complex real-world SELECT SQL:", compiled.sql);

      expect(compiled.sql).toContain("FROM users AS u");
      expect(compiled.sql).toContain("INNER JOIN posts AS p");
      expect(compiled.sql).toContain('"u.name"');
      expect(compiled.sql).toContain('"u.email"');
      expect(compiled.sql).toContain('"p.title"');
      expect(compiled.sql).toContain('"p.content"');
      expect(compiled.sql).toContain('"c.content"');
      expect(compiled.sql).toContain("created_at");
    });

    it("should demonstrate what a complete query will look like (future)", () => {
      // This shows what the complete implementation should support
      const query = db
        .selectFrom("users as u")
        .innerJoin("posts as p", "u.id", "p.user_id")
        .select(["u.name", "u.email", "p.title", "p.content"]);

      // TODO: Add WHERE with expression builder support
      // .where(({ eb, and, or }) => [
      //   and([
      //     eb("u.active", "=", true),
      //     or([
      //       eb("u.name", "like", "johan%"),
      //       eb("u.email", "like", "%johan%"),
      //     ]),
      //     eb("p.published", "=", true),
      //   ]),
      // ])
      // .orderBy("p.created_at", "desc")
      // .orderBy("u.name", "asc")
      // .limit(10);

      expect(query).toBeDefined();

      const compiled = query.compile();
      console.log("Future complete query (current state):", compiled.sql);

      expect(compiled.sql).toContain("FROM users AS u");
      expect(compiled.sql).toContain("INNER JOIN posts AS p");

      // TODO: Should also contain:
      // - WHERE clause with complex conditions using aliases
      // - ORDER BY with aliases
      // - LIMIT clause
    });
  });
});
