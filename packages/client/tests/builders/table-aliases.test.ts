import { describe, test, expect } from "bun:test";
import { ZenQ } from "../../src/query-builder";

// Test Database Schema
interface Database {
  users: {
    id: number;
    name: string;
    email: string;
    active: boolean;
    created_at: Date;
  };
  posts: {
    id: number;
    user_id: number;
    title: string;
    content: string;
    published: boolean;
    created_at: Date;
  };
  comments: {
    id: number;
    post_id: number;
    user_id: number;
    content: string;
    created_at: Date;
  };
}

const db = new ZenQ<Database>({
  host: "localhost",
  port: 5432,
  database: "test",
  user: "test",
  password: "test",
});

describe("Table Aliases - TDD Foundation Tests", () => {
  describe("Phase 2: Basic Alias Parsing", () => {
    test("should accept selectFrom with alias syntax", () => {
      // This test SHOULD FAIL initially - TypeScript should reject "users as u"
      const query = db.selectFrom("users as u");
      expect(query).toBeDefined();
    });

    test("should generate correct SQL for basic alias", () => {
      // This test SHOULD FAIL initially - will generate SELECT * FROM "users as u"
      const query = db.selectFrom("users as u");
      const result = query.toSQL();

      expect(result.sql).toBe("SELECT * FROM users AS u");
      expect(result.parameters).toEqual([]);
    });

    test("should handle case insensitive AS keyword", () => {
      // This test SHOULD FAIL initially
      const query1 = db.selectFrom("users AS u");
      const query2 = db.selectFrom("users as u");
      const query3 = db.selectFrom("users As u");

      expect(query1.toSQL().sql).toBe("SELECT * FROM users AS u");
      expect(query2.toSQL().sql).toBe("SELECT * FROM users AS u");
      expect(query3.toSQL().sql).toBe("SELECT * FROM users AS u");
    });

    test("should handle flexible whitespace in alias", () => {
      // This test SHOULD FAIL initially
      const query1 = db.selectFrom("users as u");
      const query2 = db.selectFrom("  users   as   u  ");
      const query3 = db.selectFrom("users\tas\tu");

      expect(query1.toSQL().sql).toBe("SELECT * FROM users AS u");
      expect(query2.toSQL().sql).toBe("SELECT * FROM users AS u");
      expect(query3.toSQL().sql).toBe("SELECT * FROM users AS u");
    });
  });

  describe("Phase 3: Column Reference Flexibility", () => {
    test("should support alias-prefixed columns in select", () => {
      // This test SHOULD FAIL initially - TypeScript should reject "u.id"
      const query = db.selectFrom("users as u").select(["u.id", "u.name"]);

      const result = query.toSQL();
      expect(result.sql).toBe("SELECT u.id, u.name FROM users AS u");
    });

    test("should support mixed alias-prefixed and non-prefixed columns", () => {
      // This test SHOULD FAIL initially - flexible column referencing
      const query = db
        .selectFrom("users as u")
        .select(["u.id", "name", "u.email"]);

      const result = query.toSQL();
      expect(result.sql).toBe("SELECT u.id, name, u.email FROM users AS u");
    });

    test("should support non-prefixed columns with aliases", () => {
      // This test SHOULD FAIL initially - should still work with aliases
      const query = db.selectFrom("users as u").select(["id", "name", "email"]);

      const result = query.toSQL();
      expect(result.sql).toBe("SELECT id, name, email FROM users AS u");
    });
  });

  describe("Phase 4: Query Method Integration", () => {
    test("should support aliases in WHERE clauses", () => {
      // This test SHOULD FAIL initially
      const query = db.selectFrom("users as u").where("u.active", "=", true);

      const result = query.toSQL();
      expect(result.sql).toBe("SELECT * FROM users AS u WHERE u.active = $1");
      expect(result.parameters).toEqual([true]);
    });

    test("should support non-prefixed columns in WHERE with aliases", () => {
      // This test SHOULD FAIL initially
      const query = db.selectFrom("users as u").where("active", "=", true);

      const result = query.toSQL();
      expect(result.sql).toBe("SELECT * FROM users AS u WHERE active = $1");
      expect(result.parameters).toEqual([true]);
    });

    test("should support aliases in ORDER BY clauses", () => {
      // This test SHOULD FAIL initially
      const query = db.selectFrom("users as u").orderBy("u.created_at", "desc");

      const result = query.toSQL();
      expect(result.sql).toBe(
        "SELECT * FROM users AS u ORDER BY u.created_at DESC"
      );
    });

    test("should support non-prefixed columns in ORDER BY with aliases", () => {
      // This test SHOULD FAIL initially
      const query = db.selectFrom("users as u").orderBy("created_at", "desc");

      const result = query.toSQL();
      expect(result.sql).toBe(
        "SELECT * FROM users AS u ORDER BY created_at DESC"
      );
    });

    test("should support complex queries with aliases", () => {
      // This test SHOULD FAIL initially - comprehensive functionality
      const query = db
        .selectFrom("users as u")
        .select(["u.id", "name", "u.email"])
        .where("u.active", "=", true)
        .where("id", ">", 100)
        .orderBy("u.created_at", "desc")
        .limit(10);

      const result = query.toSQL();
      expect(result.sql).toBe(
        "SELECT u.id, name, u.email FROM users AS u WHERE u.active = $1 AND id > $2 ORDER BY u.created_at DESC LIMIT 10"
      );
      expect(result.parameters).toEqual([true, 100]);
    });
  });

  describe("Phase 5: JOIN Operations", () => {
    test("should support aliases in JOIN conditions", () => {
      // This test SHOULD FAIL initially
      const query = db
        .selectFrom("users as u")
        .innerJoin("posts as p", "u.id", "p.user_id")
        .select(["u.name", "p.title"]);

      const result = query.toSQL();
      expect(result.sql).toBe(
        "SELECT u.name, p.title FROM users AS u INNER JOIN posts AS p ON u.id = p.user_id"
      );
    });

    test("should support multiple JOINs with aliases", () => {
      // This test SHOULD FAIL initially
      const query = db
        .selectFrom("users as u")
        .innerJoin("posts as p", "u.id", "p.user_id")
        .innerJoin("comments as c", "p.id", "c.post_id")
        .select(["u.name", "p.title", "c.content"]);

      const result = query.toSQL();
      expect(result.sql).toBe(
        "SELECT u.name, p.title, c.content FROM users AS u INNER JOIN posts AS p ON u.id = p.user_id INNER JOIN comments AS c ON p.id = c.post_id"
      );
    });

    test("should support mixed alias/non-alias JOIN conditions", () => {
      // This test SHOULD FAIL initially
      const query = db
        .selectFrom("users as u")
        .innerJoin("posts", "u.id", "user_id")
        .select(["u.name", "title"]);

      const result = query.toSQL();
      expect(result.sql).toBe(
        "SELECT u.name, title FROM users AS u INNER JOIN posts ON u.id = posts.user_id"
      );
    });
  });

  describe("Phase 6: Edge Cases and Error Handling", () => {
    test("should reject invalid alias syntax", () => {
      // This test should PASS initially (good error handling)
      expect(() => {
        db.selectFrom("users as" as any);
      }).toThrow();

      expect(() => {
        db.selectFrom("as u" as any);
      }).toThrow();

      expect(() => {
        db.selectFrom("users u" as any); // missing 'as' keyword
      }).toThrow();
    });

    test("should reject aliases starting with numbers", () => {
      // This test should PASS initially (good error handling)
      expect(() => {
        db.selectFrom("users as 1invalid" as any);
      }).toThrow();
    });

    test("should reject reserved word aliases", () => {
      // This test should PASS initially (good error handling)
      expect(() => {
        db.selectFrom("users as select" as any);
      }).toThrow();

      expect(() => {
        db.selectFrom("users as from" as any);
      }).toThrow();
    });

    test("should handle aliases with underscores and numbers", () => {
      // This test SHOULD FAIL initially - valid identifiers should work
      const query1 = db.selectFrom("users as user_data");
      const query2 = db.selectFrom("users as table1");
      const query3 = db.selectFrom("users as _internal");

      expect(query1.toSQL().sql).toBe("SELECT * FROM users AS user_data");
      expect(query2.toSQL().sql).toBe("SELECT * FROM users AS table1");
      expect(query3.toSQL().sql).toBe("SELECT * FROM users AS _internal");
    });
  });

  describe("Backward Compatibility", () => {
    test("should maintain existing functionality without aliases", () => {
      // This test should PASS initially - no regression
      const query = db
        .selectFrom("users")
        .select(["id", "name"])
        .where("active", "=", true)
        .orderBy("created_at")
        .limit(5);

      const result = query.toSQL();
      expect(result.sql).toBe(
        "SELECT id, name FROM users WHERE active = $1 ORDER BY created_at ASC LIMIT 5"
      );
      expect(result.parameters).toEqual([true]);
    });

    test("should maintain qualified column references without aliases", () => {
      // This test should PASS initially - existing functionality
      const query = db
        .selectFrom("users")
        .innerJoin("posts", "users.id", "posts.user_id")
        .select(["users.name", "posts.title"]);

      const result = query.toSQL();
      expect(result.sql).toBe(
        "SELECT users.name, posts.title FROM users INNER JOIN posts ON users.id = posts.user_id"
      );
    });
  });
});

describe("Type Safety Tests", () => {
  // These tests verify TypeScript compilation behavior
  // Most will fail initially due to type restrictions

  test("TypeScript should accept alias syntax", () => {
    // This line should NOT cause TypeScript errors after implementation
    const query: any = db.selectFrom("users as u");
    expect(query).toBeDefined();
  });

  test("TypeScript should suggest alias-prefixed columns", () => {
    // After implementation, TypeScript should autocomplete "u.id", "u.name", etc.
    const query: any = db.selectFrom("users as u").select(["u.id", "u.name"]);
    expect(query).toBeDefined();
  });

  test("TypeScript should suggest both prefixed and non-prefixed columns", () => {
    // After implementation, TypeScript should autocomplete both formats
    const query: any = db
      .selectFrom("users as u")
      .select(["u.id", "name", "u.email"]);
    expect(query).toBeDefined();
  });
});

/*
EXPECTED TEST RESULTS (TDD):

Phase 1 (Current): ALL tests should FAIL with:
- TypeScript errors for alias syntax
- Runtime errors for invalid SQL generation
- Missing functionality errors

Phase 2 (After basic parsing): 
- Basic alias syntax tests should PASS
- Column reference tests should still FAIL

Phase 3 (After column flexibility):
- Column reference tests should PASS
- Query method tests should still FAIL

Phase 4 (After query methods):
- Query method tests should PASS 
- JOIN tests should still FAIL

Phase 5 (After JOINs):
- JOIN tests should PASS
- All core functionality complete

Phase 6 (After polish):
- All tests should PASS
- Full feature implementation complete

This TDD approach ensures each phase has clear success criteria
and prevents regression as we build up the functionality.
*/
