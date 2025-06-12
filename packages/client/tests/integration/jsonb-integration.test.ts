// JSONB Integration Tests - Fluent API with Real PostgreSQL Database
// Tests the new fluent JSONB API against actual database operations

import { describe, test, expect, beforeAll } from "bun:test";
import { ZenQ } from "../../src/query-builder";
import type { JsonbType } from "../../src/core/builders/expression-builder";
import { TEST_DATABASE_CONFIG, waitForDatabase } from "../utils/test-config";

// Database schema for integration testing
interface JsonbDatabase {
  jsonb_users: {
    id: number;
    name: string;
    email: string;
    settings: JsonbType; // Generic JSONB - codegen won't know structure
    metadata: JsonbType; // Generic JSONB - codegen won't know structure
    created_at: Date;
  };
  jsonb_products: {
    id: number;
    name: string;
    attributes: JsonbType; // Generic JSONB - codegen won't know structure
    analytics: JsonbType; // Generic JSONB - codegen won't know structure
    created_at: Date;
  };
}

const db = new ZenQ<JsonbDatabase>(TEST_DATABASE_CONFIG);

describe("JSONB Fluent API Integration Tests", () => {
  beforeAll(async () => {
    // Wait for database to be ready
    await waitForDatabase();
    console.log("JSONB Integration tests starting - using existing test data");
  });

  describe("Basic JSONB Fluent Operations", () => {
    test("should execute contains (@>) operations", async () => {
      // Find users with dark theme preference
      const darkThemeUsers = await db
        .selectFrom("jsonb_users")
        .select(["name", "email"])
        .where(({ jsonb }) => jsonb("settings").contains({ theme: "dark" }))
        .execute();

      expect(Array.isArray(darkThemeUsers)).toBe(true);
      expect(darkThemeUsers.length).toBeGreaterThan(0);

      const names = darkThemeUsers.map((u) => u.name);
      expect(names).toContain("John Doe");
      expect(names).toContain("Bob Johnson");
      expect(names).not.toContain("Jane Smith"); // Jane has light theme
    });

    test("should execute containedBy (<@) operations", async () => {
      // Find products that are contained within specific attributes
      const basicProducts = await db
        .selectFrom("jsonb_products")
        .select(["name"])
        .where(({ jsonb }) =>
          jsonb("attributes").containedBy({
            category: "clothing",
            color: "blue",
            sale: true,
            size: ["S", "M", "L", "XL"],
          })
        )
        .execute();

      expect(Array.isArray(basicProducts)).toBe(true);
      // This tests the operation executes correctly
    });

    test("should execute key existence (?) operations", async () => {
      // Find users with 'premium' key in metadata
      const premiumUsers = await db
        .selectFrom("jsonb_users")
        .select(["name"])
        .where(({ jsonb }) => jsonb("metadata").hasKey("premium"))
        .execute();

      expect(Array.isArray(premiumUsers)).toBe(true);
      expect(premiumUsers.length).toBeGreaterThan(0);

      const names = premiumUsers.map((u) => u.name);
      expect(names).toContain("John Doe");
      expect(names).toContain("Jane Smith"); // Jane has premium: false, but still has the key
      expect(names).toContain("Bob Johnson");
      expect(names).toContain("Charlie Brown"); // Charlie has premium: true
    });

    test("should execute any key existence (?|) operations", async () => {
      // Find users with either 'premium' or 'beta_tester' keys
      const qualifiedUsers = await db
        .selectFrom("jsonb_users")
        .select(["name"])
        .where(({ jsonb }) =>
          jsonb("metadata").hasAnyKey(["premium", "beta_tester"])
        )
        .execute();

      expect(Array.isArray(qualifiedUsers)).toBe(true);
      expect(qualifiedUsers.length).toBeGreaterThan(0);

      const names = qualifiedUsers.map((u) => u.name);
      expect(names).toContain("John Doe"); // has premium
      expect(names).toContain("Bob Johnson"); // has beta_tester
      expect(names).toContain("Jane Smith"); // has premium
    });

    test("should execute all keys existence (?&) operations", async () => {
      // Find users that have all specified keys
      const fullyQualifiedUsers = await db
        .selectFrom("jsonb_users")
        .select(["name"])
        .where(({ jsonb }) =>
          jsonb("metadata").hasAllKeys(["premium", "verified"])
        )
        .execute();

      expect(Array.isArray(fullyQualifiedUsers)).toBe(true);
      expect(fullyQualifiedUsers.length).toBeGreaterThan(0);

      const names = fullyQualifiedUsers.map((u) => u.name);
      expect(names).toContain("John Doe"); // has both
      expect(names).toContain("Jane Smith"); // has both
    });
  });

  describe("Field and Path Operations", () => {
    test("should execute field extraction and comparison", async () => {
      // Find users with English language setting
      const englishUsers = await db
        .selectFrom("jsonb_users")
        .select(["name", "email"])
        .where(({ jsonb }) => jsonb("settings").field("language").equals("en"))
        .execute();

      expect(Array.isArray(englishUsers)).toBe(true);
      expect(englishUsers.length).toBeGreaterThan(0);

      const names = englishUsers.map((u) => u.name);
      expect(names).toContain("John Doe");
      expect(names).toContain("Bob Johnson");
      expect(names).not.toContain("Jane Smith"); // Spanish
    });

    test("should execute nested field extraction", async () => {
      // Find users with email notifications enabled
      const emailNotificationUsers = await db
        .selectFrom("jsonb_users")
        .select(["name"])
        .where(({ jsonb }) =>
          jsonb("settings").field("notifications").field("email").equals(true)
        )
        .execute();

      expect(Array.isArray(emailNotificationUsers)).toBe(true);
      expect(emailNotificationUsers.length).toBeGreaterThan(0);

      const names = emailNotificationUsers.map((u) => u.name);
      expect(names).toContain("John Doe");
      expect(names).toContain("Bob Johnson");
    });

    test("should execute path-based operations", async () => {
      // Find users using path syntax for nested access
      const pathUsers = await db
        .selectFrom("jsonb_users")
        .select(["name"])
        .where(({ jsonb }) =>
          jsonb("settings").path(["notifications", "push"]).equals(true)
        )
        .execute();

      expect(Array.isArray(pathUsers)).toBe(true);
      expect(pathUsers.length).toBeGreaterThan(0);

      const names = pathUsers.map((u) => u.name);
      expect(names).toContain("Jane Smith");
      expect(names).toContain("Bob Johnson");
    });

    test("should execute field existence checks", async () => {
      // Find products that have a 'color' field (all products have this)
      const coloredProducts = await db
        .selectFrom("jsonb_products")
        .select(["name"])
        .where(({ jsonb }) => jsonb("attributes").field("color").exists())
        .execute();

      expect(Array.isArray(coloredProducts)).toBe(true);
      expect(coloredProducts.length).toBeGreaterThan(0);

      const names = coloredProducts.map((p) => p.name);
      expect(names).toContain("Blue T-Shirt");
      expect(names).toContain("Red Sneakers");
    });

    test("should execute field null checks", async () => {
      // Find users where a specific field is null
      const query = db
        .selectFrom("jsonb_users")
        .select(["name"])
        .where(({ jsonb }) =>
          jsonb("metadata").field("missing_field").isNull()
        );

      const { sql, parameters } = query.compile();
      expect(sql).toContain("metadata -> $1 IS NULL");
      expect(parameters).toContain("missing_field");
    });
  });

  describe("Complex JSONB Combinations", () => {
    test("should execute complex AND/OR combinations with JSONB", async () => {
      // Find users with dark theme AND (premium OR verified)
      const advancedUsers = await db
        .selectFrom("jsonb_users")
        .select(["name", "email"])
        .where(({ jsonb, and, or }) =>
          and([
            jsonb("settings").contains({ theme: "dark" }),
            or([
              jsonb("metadata").hasKey("premium"),
              jsonb("metadata").hasKey("verified"),
            ]),
          ])
        )
        .execute();

      expect(Array.isArray(advancedUsers)).toBe(true);
      expect(advancedUsers.length).toBeGreaterThan(0);

      const names = advancedUsers.map((u) => u.name);
      expect(names).toContain("John Doe");
      expect(names).toContain("Bob Johnson");
    });

    test("should execute mixed regular and JSONB operations", async () => {
      // Combine regular WHERE with JSONB operations
      const specificUsers = await db
        .selectFrom("jsonb_users")
        .select(["name", "email"])
        .where("name", "like", "J%")
        .where(({ jsonb }) => jsonb("settings").contains({ theme: "dark" }))
        .where(({ jsonb }) => jsonb("metadata").hasKey("premium"))
        .execute();

      expect(Array.isArray(specificUsers)).toBe(true);
      expect(specificUsers.length).toBeGreaterThan(0);

      const names = specificUsers.map((u) => u.name);
      expect(names).toContain("John Doe"); // Starts with J, dark theme, premium
    });

    test("should execute NOT operations with JSONB", async () => {
      // Find users who DON'T have churned flag
      const activeUsers = await db
        .selectFrom("jsonb_users")
        .select(["name"])
        .where(({ jsonb, not }) => not(jsonb("metadata").hasKey("churned")))
        .execute();

      expect(Array.isArray(activeUsers)).toBe(true);
      expect(activeUsers.length).toBeGreaterThan(0);

      const names = activeUsers.map((u) => u.name);
      expect(names).not.toContain("Alice Wilson"); // Alice has churned
      expect(names).toContain("John Doe");
      expect(names).toContain("Bob Johnson");
      expect(names).toContain("Jane Smith");
    });
  });

  describe("Real-World Use Cases", () => {
    test("should handle user preference filtering", async () => {
      // Find users with specific notification preferences
      const emailAndPushUsers = await db
        .selectFrom("jsonb_users")
        .select(["name", "email"])
        .where(({ jsonb, and }) =>
          and([
            jsonb("settings")
              .field("notifications")
              .field("email")
              .equals(true),
            jsonb("settings").field("notifications").field("push").equals(true),
          ])
        )
        .execute();

      expect(Array.isArray(emailAndPushUsers)).toBe(true);

      const names = emailAndPushUsers.map((u) => u.name);
      expect(names).toContain("Bob Johnson"); // Only Bob has both email and push enabled
    });

    test("should handle e-commerce product filtering", async () => {
      // Find products that are on sale OR featured
      const promotedProducts = await db
        .selectFrom("jsonb_products")
        .select(["name"])
        .where(({ jsonb, or }) =>
          or([
            jsonb("attributes").hasKey("sale"),
            jsonb("attributes").hasKey("featured"),
          ])
        )
        .execute();

      expect(Array.isArray(promotedProducts)).toBe(true);
      expect(promotedProducts.length).toBeGreaterThan(0);

      const names = promotedProducts.map((p) => p.name);
      expect(names).toContain("Blue T-Shirt"); // on sale
      expect(names).toContain("Red Sneakers"); // featured
      expect(names).toContain("Black Jeans"); // both sale and featured
    });

    test("should handle analytics queries with field existence", async () => {
      // Find products that have analytics data (field existence check)
      const analyticsProducts = await db
        .selectFrom("jsonb_products")
        .select(["name"])
        .where(({ jsonb }) => jsonb("analytics").field("views").exists())
        .execute();

      expect(Array.isArray(analyticsProducts)).toBe(true);
      expect(analyticsProducts.length).toBeGreaterThan(0);

      // Should include products that have analytics tracking
      const names = analyticsProducts.map((p) => p.name);
      expect(names.length).toBeGreaterThan(0);
    });

    test("should handle permission-style queries", async () => {
      // Complex nested permission checking
      const premiumVerifiedUsers = await db
        .selectFrom("jsonb_users")
        .select(["name", "email"])
        .where(({ jsonb, and }) =>
          and([
            jsonb("metadata").field("premium").equals(true),
            jsonb("metadata").field("verified").equals(true),
            jsonb("settings").field("language").equals("en"),
          ])
        )
        .execute();

      expect(Array.isArray(premiumVerifiedUsers)).toBe(true);
      expect(premiumVerifiedUsers.length).toBeGreaterThan(0);

      const names = premiumVerifiedUsers.map((u) => u.name);
      expect(names).toContain("John Doe"); // premium + verified + English
    });
  });

  describe("Performance Testing", () => {
    test("should handle complex queries efficiently", async () => {
      const startTime = Date.now();

      const complexResults = await db
        .selectFrom("jsonb_users")
        .select(["name", "email"])
        .where(({ jsonb, and, or }) =>
          and([
            jsonb("settings").field("language").equals("en"),
            or([
              jsonb("metadata").hasKey("premium"),
              jsonb("metadata").hasKey("beta_tester"),
            ]),
            jsonb("settings").hasAllKeys(["theme", "notifications"]),
          ])
        )
        .execute();

      const duration = Date.now() - startTime;

      expect(Array.isArray(complexResults)).toBe(true);
      expect(duration).toBeLessThan(1000); // Should complete quickly
    });
  });

  describe("Edge Cases and Error Handling", () => {
    test("should handle empty JSONB objects", async () => {
      const emptyResults = await db
        .selectFrom("jsonb_users")
        .select(["name"])
        .where(({ jsonb }) => jsonb("settings").contains({}))
        .execute();

      expect(Array.isArray(emptyResults)).toBe(true);
      // Empty object should match all records with non-null settings
      expect(emptyResults.length).toBeGreaterThan(0);
    });

    test("should handle null JSONB columns gracefully", async () => {
      // Test that we can query against potentially null JSONB columns
      const allUsers = await db
        .selectFrom("jsonb_users")
        .select(["name", "metadata"])
        .execute();

      expect(Array.isArray(allUsers)).toBe(true);
      expect(allUsers.length).toBeGreaterThan(0);

      // Verify some users have non-null metadata
      const hasMetadata = allUsers.filter((u) => u.metadata !== null);
      expect(hasMetadata.length).toBeGreaterThan(0);
    });

    test("should return proper TypeScript types for JSONB data", async () => {
      const users = await db
        .selectFrom("jsonb_users")
        .select(["name", "settings", "metadata"])
        .limit(1)
        .execute();

      expect(users.length).toBeGreaterThan(0);
      const user = users[0];

      // TypeScript should properly type these as JsonbType (which is 'unknown')
      expect(typeof user.name).toBe("string");
      expect(user.settings !== null).toBe(true);
      expect(user.metadata === null || typeof user.metadata === "object").toBe(
        true
      );
    });
  });
});
