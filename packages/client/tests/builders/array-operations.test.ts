// Array Operations Tests
// Validates PostgreSQL array operations SQL compilation and AST generation

import { describe, it, expect } from "bun:test";
import { pgvibe } from "../../src/query-builder";
import type { ArrayType } from "../../src/core/types/array";

// Test database schema with array columns
interface TestDatabase {
  users: {
    id: number;
    name: string;
    tags: ArrayType<string[]>;
    permissions: ArrayType<string[]>;
    scores: ArrayType<number[]>;
    preferences: ArrayType<boolean[]>;
  };
  posts: {
    id: number;
    title: string;
    categories: ArrayType<string[]>;
    ratings: ArrayType<number[]>;
  };
}

const db = new pgvibe<TestDatabase>({
  host: "localhost",
  port: 5432,
  database: "pgvibe_test",
  user: "test",
  password: "test",
});

describe("Array Operations", () => {
  describe("Array Contains (@>) SQL Generation", () => {
    it("should generate correct SQL for string array contains", () => {
      const query = db
        .selectFrom("users")
        .where(({ array }) => array("tags").contains(["typescript", "nodejs"]))
        .selectAll();

      const compiled = query.compile();

      expect(compiled.sql).toBe(
        "SELECT * FROM users WHERE tags @> ARRAY[$1, $2]"
      );
      expect(compiled.parameters).toEqual(["typescript", "nodejs"]);
    });

    it("should generate correct SQL for number array contains", () => {
      const query = db
        .selectFrom("users")
        .where(({ array }) => array("scores").contains([95, 100]))
        .selectAll();

      const compiled = query.compile();

      expect(compiled.sql).toBe(
        "SELECT * FROM users WHERE scores @> ARRAY[$1, $2]"
      );
      expect(compiled.parameters).toEqual([95, 100]);
    });

    it("should generate correct SQL for boolean array contains", () => {
      const query = db
        .selectFrom("users")
        .where(({ array }) => array("preferences").contains([true, false]))
        .selectAll();

      const compiled = query.compile();

      expect(compiled.sql).toBe(
        "SELECT * FROM users WHERE preferences @> ARRAY[$1, $2]"
      );
      expect(compiled.parameters).toEqual([true, false]);
    });
  });

  describe("Array Contained By (<@) SQL Generation", () => {
    it("should generate correct SQL for isContainedBy operation", () => {
      const query = db
        .selectFrom("users")
        .where(({ array }) =>
          array("tags").isContainedBy(["frontend", "backend", "fullstack"])
        )
        .selectAll();

      const compiled = query.compile();

      expect(compiled.sql).toBe(
        "SELECT * FROM users WHERE tags <@ ARRAY[$1, $2, $3]"
      );
      expect(compiled.parameters).toEqual(["frontend", "backend", "fullstack"]);
    });

    it("should work with different table in FROM clause", () => {
      const query = db
        .selectFrom("posts")
        .where(({ array }) =>
          array("categories").isContainedBy(["tech", "programming", "tutorial"])
        )
        .selectAll();

      const compiled = query.compile();

      expect(compiled.sql).toBe(
        "SELECT * FROM posts WHERE categories <@ ARRAY[$1, $2, $3]"
      );
      expect(compiled.parameters).toEqual(["tech", "programming", "tutorial"]);
    });
  });

  describe("Array Overlap (&&) SQL Generation", () => {
    it("should generate correct SQL for overlaps operation", () => {
      const query = db
        .selectFrom("users")
        .where(({ array }) =>
          array("tags").overlaps(["react", "vue", "angular"])
        )
        .selectAll();

      const compiled = query.compile();

      expect(compiled.sql).toBe(
        "SELECT * FROM users WHERE tags && ARRAY[$1, $2, $3]"
      );
      expect(compiled.parameters).toEqual(["react", "vue", "angular"]);
    });

    it("should work with number arrays", () => {
      const query = db
        .selectFrom("posts")
        .where(({ array }) => array("ratings").overlaps([4, 5]))
        .selectAll();

      const compiled = query.compile();

      expect(compiled.sql).toBe(
        "SELECT * FROM posts WHERE ratings && ARRAY[$1, $2]"
      );
      expect(compiled.parameters).toEqual([4, 5]);
    });
  });

  describe("Array ANY() SQL Generation", () => {
    it("should generate correct SQL for hasAny operation", () => {
      const query = db
        .selectFrom("users")
        .where(({ array }) => array("permissions").hasAny("admin"))
        .selectAll();

      const compiled = query.compile();

      expect(compiled.sql).toBe(
        "SELECT * FROM users WHERE $1 = ANY(permissions)"
      );
      expect(compiled.parameters).toEqual(["admin"]);
    });

    it("should work with number values", () => {
      const query = db
        .selectFrom("users")
        .where(({ array }) => array("scores").hasAny(100))
        .selectAll();

      const compiled = query.compile();

      expect(compiled.sql).toBe("SELECT * FROM users WHERE $1 = ANY(scores)");
      expect(compiled.parameters).toEqual([100]);
    });

    it("should work with boolean values", () => {
      const query = db
        .selectFrom("users")
        .where(({ array }) => array("preferences").hasAny(true))
        .selectAll();

      const compiled = query.compile();

      expect(compiled.sql).toBe(
        "SELECT * FROM users WHERE $1 = ANY(preferences)"
      );
      expect(compiled.parameters).toEqual([true]);
    });
  });

  describe("Array ALL() SQL Generation", () => {
    it("should generate correct SQL for hasAll operation", () => {
      const query = db
        .selectFrom("users")
        .where(({ array }) => array("scores").hasAll(95))
        .selectAll();

      const compiled = query.compile();

      expect(compiled.sql).toBe("SELECT * FROM users WHERE $1 = ALL(scores)");
      expect(compiled.parameters).toEqual([95]);
    });

    it("should work with string values", () => {
      const query = db
        .selectFrom("users")
        .where(({ array }) => array("tags").hasAll("required"))
        .selectAll();

      const compiled = query.compile();

      expect(compiled.sql).toBe("SELECT * FROM users WHERE $1 = ALL(tags)");
      expect(compiled.parameters).toEqual(["required"]);
    });
  });

  describe("Complex Array Operations", () => {
    it("should combine array operations with AND", () => {
      const query = db
        .selectFrom("users")
        .where(({ array, and }) =>
          and([
            array("tags").contains(["typescript"]),
            array("permissions").hasAny("admin"),
          ])
        )
        .selectAll();

      const compiled = query.compile();

      expect(compiled.sql).toBe(
        "SELECT * FROM users WHERE (tags @> ARRAY[$1] AND $2 = ANY(permissions))"
      );
      expect(compiled.parameters).toEqual(["typescript", "admin"]);
    });

    it("should combine array operations with OR", () => {
      const query = db
        .selectFrom("users")
        .where(({ array, or }) =>
          or([
            array("tags").overlaps(["frontend"]),
            array("tags").overlaps(["backend"]),
          ])
        )
        .selectAll();

      const compiled = query.compile();

      expect(compiled.sql).toBe(
        "SELECT * FROM users WHERE (tags && ARRAY[$1] OR tags && ARRAY[$2])"
      );
      expect(compiled.parameters).toEqual(["frontend", "backend"]);
    });

    it("should combine array operations with regular WHERE conditions", () => {
      const query = db
        .selectFrom("users")
        .where("name", "like", "%John%")
        .where(({ array }) => array("tags").contains(["expert"]))
        .selectAll();

      const compiled = query.compile();

      expect(compiled.sql).toBe(
        "SELECT * FROM users WHERE (name LIKE $1 AND tags @> ARRAY[$2])"
      );
      expect(compiled.parameters).toEqual(["%John%", "expert"]);
    });

    it("should work with nested logical operations", () => {
      const query = db
        .selectFrom("users")
        .where(({ array, and, or }) =>
          and([
            or([
              array("permissions").hasAny("admin"),
              array("permissions").hasAny("moderator"),
            ]),
            array("tags").overlaps(["active"]),
          ])
        )
        .selectAll();

      const compiled = query.compile();

      expect(compiled.sql).toBe(
        "SELECT * FROM users WHERE ((($1 = ANY(permissions) OR $2 = ANY(permissions))) AND tags && ARRAY[$3])"
      );
      expect(compiled.parameters).toEqual(["admin", "moderator", "active"]);
    });

    it("should work with NOT operations", () => {
      const query = db
        .selectFrom("users")
        .where(({ array, not }) => not(array("tags").contains(["deprecated"])))
        .selectAll();

      const compiled = query.compile();

      expect(compiled.sql).toBe(
        "SELECT * FROM users WHERE NOT (tags @> ARRAY[$1])"
      );
      expect(compiled.parameters).toEqual(["deprecated"]);
    });
  });

  describe("Array Operations with SELECT and other clauses", () => {
    it("should work with specific column selection", () => {
      const query = db
        .selectFrom("users")
        .select(["name", "tags"])
        .where(({ array }) => array("tags").contains(["featured"]))
        .orderBy("name");

      const compiled = query.compile();

      expect(compiled.sql).toBe(
        "SELECT name, tags FROM users WHERE tags @> ARRAY[$1] ORDER BY name ASC"
      );
      expect(compiled.parameters).toEqual(["featured"]);
    });

    it("should work with LIMIT and OFFSET", () => {
      const query = db
        .selectFrom("users")
        .where(({ array }) => array("permissions").hasAny("read"))
        .selectAll()
        .orderBy("id")
        .limit(10)
        .offset(20);

      const compiled = query.compile();

      expect(compiled.sql).toBe(
        "SELECT * FROM users WHERE $1 = ANY(permissions) ORDER BY id ASC LIMIT 10 OFFSET 20"
      );
      expect(compiled.parameters).toEqual(["read"]);
    });
  });

  describe("Edge Cases and Error Handling", () => {
    it("should handle empty arrays in contains operation", () => {
      const query = db
        .selectFrom("users")
        .where(({ array }) => array("tags").contains([]))
        .selectAll();

      const compiled = query.compile();

      expect(compiled.sql).toBe(
        "SELECT * FROM users WHERE tags @> ARRAY[]::text[]"
      );
      expect(compiled.parameters).toEqual([]);
    });

    it("should handle single element arrays", () => {
      const query = db
        .selectFrom("users")
        .where(({ array }) => array("tags").overlaps(["single"]))
        .selectAll();

      const compiled = query.compile();

      expect(compiled.sql).toBe("SELECT * FROM users WHERE tags && ARRAY[$1]");
      expect(compiled.parameters).toEqual(["single"]);
    });

    it("should handle arrays with mixed primitive types (numbers)", () => {
      const query = db
        .selectFrom("posts")
        .where(({ array }) => array("ratings").contains([1, 2, 3, 4, 5]))
        .selectAll();

      const compiled = query.compile();

      expect(compiled.sql).toBe(
        "SELECT * FROM posts WHERE ratings @> ARRAY[$1, $2, $3, $4, $5]"
      );
      expect(compiled.parameters).toEqual([1, 2, 3, 4, 5]);
    });
  });

  describe("Type Safety Validation", () => {
    it("should maintain parameter type safety", () => {
      const query = db
        .selectFrom("users")
        .where(({ array }) => array("scores").hasAny(85))
        .selectAll();

      const compiled = query.compile();

      // Validate that number parameter is preserved correctly
      expect(typeof compiled.parameters[0]).toBe("number");
      expect(compiled.parameters[0]).toBe(85);
    });

    it("should preserve array parameter structure", () => {
      const testArray = ["test1", "test2", "test3"];
      const query = db
        .selectFrom("users")
        .where(({ array }) => array("tags").contains(testArray))
        .selectAll();

      const compiled = query.compile();

      // Validate that individual parameters are used (not nested arrays)
      expect(Array.isArray(compiled.parameters[0])).toBe(false);
      expect(compiled.parameters).toEqual(testArray);
    });
  });
});
