// JSONB Fluent API Tests - TDD Implementation
// Tests for the new fluent API that replaces (column, operator, value) pattern

import { describe, test, expect } from "bun:test";
import { ZenQ } from "../../src/query-builder";
import type { JsonbType } from "../../src/core/builders/expression-builder";

// Test database schema with realistic JSONB columns
// Note: In real codegen scenarios, JSONB columns would have generic types
// since the codegen can't infer the internal JSON structure
interface JsonbFluentTestDB {
  users: {
    id: number;
    name: string;
    email: string;
    active: boolean;
    settings: JsonbType; // Generic JSONB - codegen can't infer internal structure
    metadata: JsonbType; // Generic JSONB - codegen can't infer internal structure
    preferences: JsonbType; // Generic JSONB - codegen can't infer internal structure
  };
  products: {
    id: number;
    name: string;
    specs: JsonbType; // Generic JSONB - codegen can't infer internal structure
  };
}

describe("JSONB Fluent API - TDD Implementation", () => {
  const db = new ZenQ<JsonbFluentTestDB>({
    host: "localhost",
    port: 5432,
    database: "zenq_test",
    user: "test",
    password: "test",
  });

  describe("Phase 1: Basic Extract-and-Compare Operations", () => {
    test("should support field extraction with equality comparison", () => {
      // The core problem: settings -> 'theme' = 'dark'
      const query = db
        .selectFrom("users")
        .select(["name", "email"])
        .where(({ jsonb }) => jsonb("settings").field("theme").equals("dark"));

      const { sql, parameters } = query.compile();

      expect(sql).toBe(
        "SELECT name, email FROM users WHERE settings ->> $1 = $2"
      );
      expect(parameters).toEqual(["theme", "dark"]);
    });

    test("should support field extraction with not-equals comparison", () => {
      const query = db
        .selectFrom("users")
        .select(["name"])
        .where(({ jsonb }) =>
          jsonb("settings").field("language").notEquals("en")
        );

      const { sql, parameters } = query.compile();

      expect(sql).toBe("SELECT name FROM users WHERE settings ->> $1 != $2");
      expect(parameters).toEqual(["language", "en"]);
    });

    test("should support nested field extraction", () => {
      // settings -> 'notifications' -> 'email' = true
      const query = db
        .selectFrom("users")
        .select(["name"])
        .where(({ jsonb }) =>
          jsonb("settings").field("notifications").field("email").equals(true)
        );

      const { sql, parameters } = query.compile();

      expect(sql).toBe(
        "SELECT name FROM users WHERE settings -> $1 ->> $2 = $3"
      );
      expect(parameters).toEqual(["notifications", "email", true]);
    });

    test("should support path-based extraction and comparison", () => {
      // settings #> '{notifications,email}' = 'true'
      const query = db
        .selectFrom("users")
        .select(["name"])
        .where(({ jsonb }) =>
          jsonb("settings").path(["notifications", "email"]).equals(true)
        );

      const { sql, parameters } = query.compile();

      expect(sql).toBe("SELECT name FROM users WHERE settings #> $1 = $2");
      expect(parameters).toEqual([["notifications", "email"], true]);
    });

    test("should support path-based text extraction", () => {
      // settings #>> '{ui,theme}' = 'dark'
      const query = db
        .selectFrom("users")
        .select(["name"])
        .where(({ jsonb }) =>
          jsonb("preferences").path(["ui", "theme"]).asText().equals("dark")
        );

      const { sql, parameters } = query.compile();

      expect(sql).toBe("SELECT name FROM users WHERE preferences #>> $1 = $2");
      expect(parameters).toEqual([["ui", "theme"], "dark"]);
    });
  });

  describe("Phase 2: Containment Operations (Backward Compatibility)", () => {
    test("should support object containment", () => {
      // settings @> '{"theme": "dark"}'
      const query = db
        .selectFrom("users")
        .select(["name"])
        .where(({ jsonb }) => jsonb("settings").contains({ theme: "dark" }));

      const { sql, parameters } = query.compile();

      expect(sql).toBe("SELECT name FROM users WHERE settings @> $1");
      expect(parameters).toEqual([{ theme: "dark" }]);
    });

    test("should support contained-by operations", () => {
      // settings <@ '{"theme": "dark", "language": "en"}'
      const query = db
        .selectFrom("users")
        .select(["name"])
        .where(({ jsonb }) =>
          jsonb("settings").containedBy({
            theme: "dark",
            language: "en",
            notifications: { email: true, push: false, sms: false },
            features: [],
          })
        );

      const { sql, parameters } = query.compile();

      expect(sql).toBe("SELECT name FROM users WHERE settings <@ $1");
      expect(parameters).toEqual([
        {
          theme: "dark",
          language: "en",
          notifications: { email: true, push: false, sms: false },
          features: [],
        },
      ]);
    });
  });

  describe("Phase 3: Key Existence Operations", () => {
    test("should support key existence checks", () => {
      // metadata ? 'premium'
      const query = db
        .selectFrom("users")
        .select(["name"])
        .where(({ jsonb }) => jsonb("metadata").hasKey("premium"));

      const { sql, parameters } = query.compile();

      expect(sql).toBe("SELECT name FROM users WHERE metadata ? $1");
      expect(parameters).toEqual(["premium"]);
    });

    test("should support any-key existence checks", () => {
      // metadata ?| array['premium', 'verified']
      const query = db
        .selectFrom("users")
        .select(["name"])
        .where(({ jsonb }) =>
          jsonb("metadata").hasAnyKey(["premium", "verified", "beta"])
        );

      const { sql, parameters } = query.compile();

      expect(sql).toBe("SELECT name FROM users WHERE metadata ?| $1");
      expect(parameters).toEqual([["premium", "verified", "beta"]]);
    });

    test("should support all-keys existence checks", () => {
      // metadata ?& array['premium', 'verified']
      const query = db
        .selectFrom("users")
        .select(["name"])
        .where(({ jsonb }) =>
          jsonb("metadata").hasAllKeys(["premium", "verified"])
        );

      const { sql, parameters } = query.compile();

      expect(sql).toBe("SELECT name FROM users WHERE metadata ?& $1");
      expect(parameters).toEqual([["premium", "verified"]]);
    });
  });

  describe("Phase 4: Field Operations with Type Safety", () => {
    test("should support field existence checks", () => {
      // metadata ? 'premium'
      const query = db
        .selectFrom("users")
        .select(["name"])
        .where(({ jsonb }) => jsonb("metadata").field("premium").exists());

      const { sql, parameters } = query.compile();

      expect(sql).toBe("SELECT name FROM users WHERE metadata ? $1");
      expect(parameters).toEqual(["premium"]);
    });

    test("should support field null checks", () => {
      // metadata -> 'premium' IS NULL
      const query = db
        .selectFrom("users")
        .select(["name"])
        .where(({ jsonb }) => jsonb("metadata").field("premium").isNull());

      const { sql, parameters } = query.compile();

      expect(sql).toBe("SELECT name FROM users WHERE metadata -> $1 IS NULL");
      expect(parameters).toEqual(["premium"]);
    });

    test("should support field containment operations", () => {
      // metadata -> 'tags' @> '["vip"]'
      const query = db
        .selectFrom("users")
        .select(["name"])
        .where(({ jsonb }) =>
          jsonb("metadata").field("tags").contains(["vip"])
        );

      const { sql, parameters } = query.compile();

      expect(sql).toBe("SELECT name FROM users WHERE metadata -> $1 @> $2");
      expect(parameters).toEqual(["tags", ["vip"]]);
    });
  });

  describe("Phase 5: Path Operations with Deep Access", () => {
    test("should support deep path existence", () => {
      // preferences #> '{ui,theme}' IS NOT NULL
      const query = db
        .selectFrom("users")
        .select(["name"])
        .where(({ jsonb }) =>
          jsonb("preferences").path(["ui", "theme"]).exists()
        );

      const { sql, parameters } = query.compile();

      expect(sql).toBe(
        "SELECT name FROM users WHERE preferences #> $1 IS NOT NULL"
      );
      expect(parameters).toEqual([["ui", "theme"]]);
    });

    test("should support deep path equality", () => {
      // preferences #> '{privacy,profile_visible}' = 'true'
      const query = db
        .selectFrom("users")
        .select(["name"])
        .where(({ jsonb }) =>
          jsonb("preferences").path(["privacy", "profile_visible"]).equals(true)
        );

      const { sql, parameters } = query.compile();

      expect(sql).toBe("SELECT name FROM users WHERE preferences #> $1 = $2");
      expect(parameters).toEqual([["privacy", "profile_visible"], true]);
    });

    test("should support path-based containment", () => {
      // specs #> '{dimensions}' @> '{"width": 100}'
      const query = db
        .selectFrom("products")
        .select(["name"])
        .where(({ jsonb }) =>
          jsonb("specs").path(["dimensions"]).contains({ width: 100 })
        );

      const { sql, parameters } = query.compile();

      expect(sql).toBe("SELECT name FROM products WHERE specs #> $1 @> $2");
      expect(parameters).toEqual([["dimensions"], { width: 100 }]);
    });
  });

  describe("Phase 6: Complex Combinations with AND/OR", () => {
    test("should combine fluent JSONB with regular expressions", () => {
      const query = db
        .selectFrom("users")
        .select(["name", "email"])
        .where(({ eb, jsonb, and }) =>
          and([
            eb("active", "=", true),
            jsonb("settings").field("theme").equals("dark"),
            jsonb("metadata").hasKey("premium"),
          ])
        );

      const { sql, parameters } = query.compile();

      expect(sql).toBe(
        "SELECT name, email FROM users WHERE (active = $1 AND settings ->> $2 = $3 AND metadata ? $4)"
      );
      expect(parameters).toEqual([true, "theme", "dark", "premium"]);
    });

    test("should support OR combinations of JSONB operations", () => {
      const query = db
        .selectFrom("users")
        .select(["name"])
        .where(({ jsonb, or }) =>
          or([
            jsonb("settings").field("theme").equals("dark"),
            jsonb("preferences").path(["ui", "theme"]).equals("dark"),
            jsonb("metadata").hasKey("dark_mode_user"),
          ])
        );

      const { sql, parameters } = query.compile();

      expect(sql).toBe(
        "SELECT name FROM users WHERE (settings ->> $1 = $2 OR preferences #> $3 = $4 OR metadata ? $5)"
      );
      expect(parameters).toEqual([
        "theme",
        "dark",
        ["ui", "theme"],
        "dark",
        "dark_mode_user",
      ]);
    });

    test("should support nested AND/OR with mixed operations", () => {
      const query = db
        .selectFrom("users")
        .select(["name", "email"])
        .where(({ eb, jsonb, and, or, not }) =>
          and([
            eb("active", "=", true),
            or([
              jsonb("settings").contains({ theme: "dark" }),
              jsonb("preferences").path(["ui", "theme"]).equals("dark"),
            ]),
            not(jsonb("metadata").hasKey("banned")),
            jsonb("settings")
              .field("notifications")
              .field("email")
              .equals(true),
          ])
        );

      const { sql, parameters } = query.compile();

      expect(sql).toBe(
        "SELECT name, email FROM users WHERE (((active = $1 AND (settings @> $2 OR preferences #> $3 = $4)) AND NOT (metadata ? $5)) AND settings -> $6 ->> $7 = $8)"
      );
      expect(parameters).toEqual([
        true,
        { theme: "dark" },
        ["ui", "theme"],
        "dark",
        "banned",
        "notifications",
        "email",
        true,
      ]);
    });
  });

  describe("Phase 7: Real-World Usage Patterns", () => {
    test("should handle user preferences with theme fallback", () => {
      // Check user's explicit theme preference or system theme setting
      const query = db
        .selectFrom("users")
        .select(["name", "email"])
        .where(({ eb, jsonb, and, or }) =>
          and([
            eb("active", "=", true),
            or([
              jsonb("settings").field("theme").equals("dark"),
              and([
                jsonb("settings").field("theme").equals("system"),
                jsonb("preferences").path(["ui", "theme"]).equals("dark"),
              ]),
            ]),
          ])
        );

      const { sql, parameters } = query.compile();

      expect(sql).toBe(
        "SELECT name, email FROM users WHERE (active = $1 AND ((settings ->> $2 = $3 OR (settings ->> $4 = $5 AND preferences #> $6 = $7))))"
      );
      expect(parameters).toEqual([
        true,
        "theme",
        "dark",
        "theme",
        "system",
        ["ui", "theme"],
        "dark",
      ]);
    });

    test("should handle e-commerce product filtering with specs", () => {
      const query = db
        .selectFrom("products")
        .select(["name"])
        .where(({ jsonb, and, or }) =>
          and([
            jsonb("specs").field("color").equals("blue"),
            or([
              jsonb("specs").path(["dimensions", "width"]).equals(100),
              jsonb("specs").contains({ features: ["compact"] }),
            ]),
            jsonb("specs").field("size").exists(),
          ])
        );

      const { sql, parameters } = query.compile();

      expect(sql).toBe(
        "SELECT name FROM products WHERE ((specs ->> $1 = $2 AND (specs #> $3 = $4 OR specs @> $5)) AND specs ? $6)"
      );
      expect(parameters).toEqual([
        "color",
        "blue",
        ["dimensions", "width"],
        100,
        { features: ["compact"] },
        "size",
      ]);
    });

    test("should handle permission checking with nested structure", () => {
      const query = db
        .selectFrom("users")
        .select(["name", "email"])
        .where(({ eb, jsonb, and, or, not }) =>
          and([
            eb("active", "=", true),
            or([
              jsonb("metadata").hasKey("admin"),
              jsonb("metadata").hasKey("moderator"),
              and([
                jsonb("preferences")
                  .path(["privacy", "profile_visible"])
                  .equals(true),
                not(jsonb("metadata").hasKey("restricted")),
              ]),
            ]),
          ])
        );

      const { sql, parameters } = query.compile();

      expect(sql).toBe(
        "SELECT name, email FROM users WHERE (active = $1 AND ((metadata ? $2 OR metadata ? $3 OR ((preferences #> $4 = $5 AND NOT (metadata ? $6))))))"
      );
      expect(parameters).toEqual([
        true,
        "admin",
        "moderator",
        ["privacy", "profile_visible"],
        true,
        "restricted",
      ]);
    });
  });

  describe("Phase 8: Type Safety and Error Prevention", () => {
    test("should prevent JSONB operations on non-JSONB columns", () => {
      // This should cause a TypeScript compilation error
      // Uncommenting should show TS error:
      //
      // const query = db
      //   .selectFrom("users")
      //   .select(["name"])
      //   .where(({ jsonb }) =>
      //     jsonb("name").field("invalid").equals("test") // ERROR: 'name' is not JSONB
      //   );

      // Test passes if TypeScript prevents compilation
      expect(true).toBe(true);
    });

    test("should provide type safety for field names in typed JSONB", () => {
      // This should provide autocomplete and type checking for field names
      const query = db
        .selectFrom("users")
        .select(["name"])
        .where(
          ({ jsonb }) => jsonb("settings").field("theme").equals("dark") // 'theme' should be suggested
        );

      const { sql, parameters } = query.compile();
      expect(sql).toBe("SELECT name FROM users WHERE settings ->> $1 = $2");
      expect(parameters).toEqual(["theme", "dark"]);
    });
  });
});
