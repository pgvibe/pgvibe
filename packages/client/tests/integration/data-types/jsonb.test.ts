// JSONB Operations Integration Tests
// Tests PostgreSQL JSONB operations with isolated test tables

import { describe, test, expect, beforeAll, afterAll } from "bun:test";
import { pgvibe } from "../../../src/query-builder";
import {
  generateTestId,
  createTestDatabase,
  waitForDatabase,
} from "../utils/test-helpers";
import { performTestCleanup } from "../utils/cleanup";

// Table schema for JSONB tests
function createJsonbTestTables(testId: string) {
  return {
    users: {
      name: `test_jsonb_users_${testId}`,
      schema: `
        CREATE TABLE test_jsonb_users_${testId} (
          id SERIAL PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          email VARCHAR(255) UNIQUE,
          settings JSONB DEFAULT '{}',
          metadata JSONB DEFAULT '{}',
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        )
      `,
    },
    products: {
      name: `test_jsonb_products_${testId}`,
      schema: `
        CREATE TABLE test_jsonb_products_${testId} (
          id SERIAL PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          attributes JSONB DEFAULT '{}',
          analytics JSONB DEFAULT '{}',
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        )
      `,
    },
  };
}

async function createJsonbTables(db: pgvibe<any>, tables: any) {
  await db.query(tables.users.schema);
  await db.query(tables.products.schema);
}

async function seedJsonbData(db: pgvibe<any>, tables: any) {
  // Insert users with JSONB data
  await db.query(`
    INSERT INTO ${tables.users.name} (name, email, settings, metadata)
    VALUES 
      ('John Doe', 'john@test.com', 
       '{"theme": "dark", "language": "en", "notifications": {"email": true, "push": false}}',
       '{"premium": true, "verified": true, "subscription": "pro"}'),
      ('Jane Smith', 'jane@test.com', 
       '{"theme": "light", "language": "es", "notifications": {"email": false, "push": true}}',
       '{"premium": false, "verified": true, "trial_expires": "2024-12-31"}'),
      ('Charlie Brown', 'charlie@test.com', 
       '{"theme": "auto", "language": "fr", "notifications": {"email": true, "push": true}}',
       '{"premium": true, "verified": false, "beta_tester": true}'),
      ('Bob Johnson', 'bob@test.com', 
       '{"theme": "dark", "language": "en", "notifications": {"email": true, "push": true}}',
       '{"premium": true, "verified": true, "beta_tester": true, "admin": true}'),
      ('Alice Wilson', 'alice@test.com', 
       '{"theme": "light", "language": "de", "notifications": {"email": false, "push": false}}',
       '{"premium": false, "verified": false, "new_user": true}')
  `);

  // Insert products with JSONB data
  await db.query(`
    INSERT INTO ${tables.products.name} (name, attributes, analytics)
    VALUES 
      ('Blue T-Shirt', 
       '{"category": "clothing", "color": "blue", "size": ["S", "M", "L", "XL"], "sale": true, "price": 29.99}',
       '{"views": 1250, "sales": 45, "rating": 4.5, "reviews": ["Great quality", "Nice color"]}'),
      ('Red Sneakers', 
       '{"category": "shoes", "color": "red", "size": [7, 8, 9, 10, 11], "sale": false, "price": 89.99}',
       '{"views": 850, "sales": 23, "rating": 4.2, "trending": true}'),
      ('Green Laptop Bag', 
       '{"category": "accessories", "color": "green", "material": "canvas", "sale": true, "price": 45.00}',
       '{"views": 320, "sales": 12, "rating": 4.0, "new_arrival": true}'),
      ('Black Hoodie', 
       '{"category": "clothing", "color": "black", "size": ["XS", "S", "M", "L", "XL"], "sale": false, "price": 55.00}',
       '{"views": 920, "sales": 34, "rating": 4.7, "bestseller": true}'),
      ('White Desk Lamp', 
       '{"category": "home", "color": "white", "material": "metal", "sale": true, "price": 35.00}',
       '{"views": 680, "sales": 18, "rating": 4.3, "eco_friendly": true}')
  `);
}

describe("JSONB Operations Integration Tests", () => {
  const testId = generateTestId();
  const tables = createJsonbTestTables(testId);
  let db: pgvibe<any>;

  beforeAll(async () => {
    db = createTestDatabase();
    await waitForDatabase();

    // Create isolated test tables with JSONB columns
    await createJsonbTables(db, tables);

    // Seed with test data containing JSONB
    await seedJsonbData(db, tables);
  });

  afterAll(async () => {
    // Clean up our isolated tables
    await performTestCleanup(db, [tables.users.name, tables.products.name]);
  });

  describe("Basic JSONB Fluent Operations", () => {
    test("should execute contains (@>) operations", async () => {
      // Find users with dark theme preference
      const darkThemeUsers = await db
        .selectFrom(tables.users.name)
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
        .selectFrom(tables.products.name)
        .select(["name"])
        .where(({ jsonb }) =>
          jsonb("attributes").containedBy({
            category: "clothing",
            color: "blue",
            sale: true,
            size: ["S", "M", "L", "XL"],
            price: 29.99,
          })
        )
        .execute();

      expect(Array.isArray(basicProducts)).toBe(true);
      // This tests the operation executes correctly - the Blue T-Shirt should match
      const names = basicProducts.map((p) => p.name);
      expect(names).toContain("Blue T-Shirt");
    });

    test("should execute key existence (?) operations", async () => {
      // Find users with 'premium' key in metadata
      const premiumUsers = await db
        .selectFrom(tables.users.name)
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
        .selectFrom(tables.users.name)
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
      expect(names).toContain("Charlie Brown"); // has beta_tester
    });

    test("should execute all keys existence (?&) operations", async () => {
      // Find users that have all specified keys
      const fullyQualifiedUsers = await db
        .selectFrom(tables.users.name)
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
      expect(names).toContain("Bob Johnson"); // has both
    });
  });

  describe("Field and Path Operations", () => {
    test("should execute field extraction and comparison", async () => {
      // Find users with English language setting
      const englishUsers = await db
        .selectFrom(tables.users.name)
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
        .selectFrom(tables.users.name)
        .select(["name"])
        .where(({ jsonb }) =>
          jsonb("settings").field("notifications").field("email").equals(true)
        )
        .execute();

      expect(Array.isArray(emailNotificationUsers)).toBe(true);
      expect(emailNotificationUsers.length).toBeGreaterThan(0);

      const names = emailNotificationUsers.map((u) => u.name);
      expect(names).toContain("John Doe");
      expect(names).toContain("Charlie Brown");
      expect(names).toContain("Bob Johnson");
    });

    test("should execute path-based operations", async () => {
      // Find users using path syntax for nested access
      const pathUsers = await db
        .selectFrom(tables.users.name)
        .select(["name"])
        .where(({ jsonb }) =>
          jsonb("settings").path(["notifications", "push"]).equals(true)
        )
        .execute();

      expect(Array.isArray(pathUsers)).toBe(true);
      expect(pathUsers.length).toBeGreaterThan(0);

      const names = pathUsers.map((u) => u.name);
      expect(names).toContain("Jane Smith");
      expect(names).toContain("Charlie Brown");
      expect(names).toContain("Bob Johnson");
    });

    test("should execute field existence checks", async () => {
      // Find products that have a 'color' field (all products have this)
      const coloredProducts = await db
        .selectFrom(tables.products.name)
        .select(["name"])
        .where(({ jsonb }) => jsonb("attributes").field("color").exists())
        .execute();

      expect(Array.isArray(coloredProducts)).toBe(true);
      expect(coloredProducts.length).toBeGreaterThan(0);

      const names = coloredProducts.map((p) => p.name);
      expect(names).toContain("Blue T-Shirt");
      expect(names).toContain("Red Sneakers");
      expect(names).toContain("Green Laptop Bag");
    });

    test("should execute field null checks", async () => {
      // Find products where a specific analytics field is null
      const productsWithoutTrending = await db
        .selectFrom(tables.products.name)
        .select(["name"])
        .where(({ jsonb }) => jsonb("analytics").field("trending").isNull())
        .execute();

      expect(Array.isArray(productsWithoutTrending)).toBe(true);
      // Most products don't have trending field, so they should be returned
      expect(productsWithoutTrending.length).toBeGreaterThan(0);
    });
  });

  describe("Complex JSONB Combinations", () => {
    test("should execute complex AND/OR combinations with JSONB", async () => {
      // Find users with dark theme OR premium account
      const premiumOrDarkUsers = await db
        .selectFrom(tables.users.name)
        .select(["name"])
        .where(({ jsonb, or }) =>
          or([
            jsonb("settings").contains({ theme: "dark" }),
            jsonb("metadata").contains({ premium: true }),
          ])
        )
        .execute();

      expect(Array.isArray(premiumOrDarkUsers)).toBe(true);
      expect(premiumOrDarkUsers.length).toBeGreaterThan(0);

      const names = premiumOrDarkUsers.map((u) => u.name);
      expect(names).toContain("John Doe"); // dark theme AND premium
      expect(names).toContain("Bob Johnson"); // dark theme AND premium
      expect(names).toContain("Charlie Brown"); // premium but not dark
    });

    test("should execute mixed regular and JSONB operations", async () => {
      // Find users with specific email domain AND dark theme
      const gmailDarkUsers = await db
        .selectFrom(tables.users.name)
        .select(["name", "email"])
        .where("email", "like", "%@test.com")
        .where(({ jsonb }) => jsonb("settings").contains({ theme: "dark" }))
        .execute();

      expect(Array.isArray(gmailDarkUsers)).toBe(true);
      expect(gmailDarkUsers.length).toBeGreaterThan(0);

      gmailDarkUsers.forEach((user) => {
        expect(user.email).toContain("@test.com");
      });
    });

    test("should execute NOT operations with JSONB", async () => {
      // Find users who do NOT have light theme
      const nonLightUsers = await db
        .selectFrom(tables.users.name)
        .select(["name"])
        .where(({ jsonb, not }) =>
          not(jsonb("settings").contains({ theme: "light" }))
        )
        .execute();

      expect(Array.isArray(nonLightUsers)).toBe(true);
      expect(nonLightUsers.length).toBeGreaterThan(0);

      const names = nonLightUsers.map((u) => u.name);
      expect(names).toContain("John Doe"); // dark theme
      expect(names).toContain("Bob Johnson"); // dark theme
      expect(names).toContain("Charlie Brown"); // auto theme
      expect(names).not.toContain("Jane Smith"); // light theme
      expect(names).not.toContain("Alice Wilson"); // light theme
    });
  });

  describe("Real-World Use Cases", () => {
    test("should handle user preference filtering", async () => {
      // Find active premium users with email notifications enabled
      const targetUsers = await db
        .selectFrom(tables.users.name)
        .select(["name", "email"])
        .where(({ jsonb, and }) =>
          and([
            jsonb("metadata").contains({ premium: true }),
            jsonb("metadata").contains({ verified: true }),
            jsonb("settings").path(["notifications", "email"]).equals(true),
          ])
        )
        .execute();

      expect(Array.isArray(targetUsers)).toBe(true);
      expect(targetUsers.length).toBeGreaterThan(0);

      const names = targetUsers.map((u) => u.name);
      expect(names).toContain("John Doe");
      expect(names).toContain("Bob Johnson");
    });

    test("should handle e-commerce product filtering", async () => {
      // Find products on sale in specific categories with good ratings
      const saleProducts = await db
        .selectFrom(tables.products.name)
        .select(["name"])
        .where(({ jsonb }) => jsonb("attributes").contains({ sale: true }))
        .where(({ jsonb }) =>
          jsonb("attributes").field("category").equals("clothing")
        )
        .where(({ jsonb }) => jsonb("analytics").field("rating").equals(4.5))
        .execute();

      expect(Array.isArray(saleProducts)).toBe(true);
      expect(saleProducts.length).toBeGreaterThan(0);

      const names = saleProducts.map((p) => p.name);
      expect(names).toContain("Blue T-Shirt"); // On sale, clothing, good rating
    });

    test("should handle analytics queries with field existence", async () => {
      // Find trending or bestseller products
      const featuredProducts = await db
        .selectFrom(tables.products.name)
        .select(["name"])
        .where(({ jsonb, or }) =>
          or([
            jsonb("analytics").hasKey("trending"),
            jsonb("analytics").hasKey("bestseller"),
          ])
        )
        .execute();

      expect(Array.isArray(featuredProducts)).toBe(true);
      expect(featuredProducts.length).toBeGreaterThan(0);

      const names = featuredProducts.map((p) => p.name);
      expect(names).toContain("Red Sneakers"); // trending
      expect(names).toContain("Black Hoodie"); // bestseller
    });

    test("should handle permission-style queries", async () => {
      // Find users with admin permissions or beta testing access
      const privilegedUsers = await db
        .selectFrom(tables.users.name)
        .select(["name"])
        .where(({ jsonb, or }) =>
          or([
            jsonb("metadata").hasKey("admin"),
            jsonb("metadata").contains({ beta_tester: true }),
          ])
        )
        .execute();

      expect(Array.isArray(privilegedUsers)).toBe(true);
      expect(privilegedUsers.length).toBeGreaterThan(0);

      const names = privilegedUsers.map((u) => u.name);
      expect(names).toContain("Bob Johnson"); // admin AND beta_tester
      expect(names).toContain("Charlie Brown"); // beta_tester
    });
  });

  describe("Performance Testing", () => {
    test("should handle complex queries efficiently", async () => {
      const startTime = Date.now();

      const complexQuery = await db
        .selectFrom(tables.users.name)
        .select(["name", "email"])
        .where(({ jsonb, and, or }) =>
          and([
            or([
              jsonb("settings").contains({ theme: "dark" }),
              jsonb("metadata").contains({ premium: true }),
            ]),
            jsonb("metadata").contains({ verified: true }),
            jsonb("settings").hasKey("notifications"),
          ])
        )
        .execute();

      const endTime = Date.now();
      const executionTime = endTime - startTime;

      expect(Array.isArray(complexQuery)).toBe(true);
      expect(complexQuery.length).toBeGreaterThan(0);

      // Should execute reasonably quickly
      expect(executionTime).toBeLessThan(100);
    });
  });

  describe("Edge Cases and Error Handling", () => {
    test("should handle empty JSONB objects", async () => {
      // Test querying for empty objects
      const emptyJsonbQuery = await db
        .selectFrom(tables.users.name)
        .select(["name"])
        .where(({ jsonb }) => jsonb("metadata").contains({}))
        .execute();

      expect(Array.isArray(emptyJsonbQuery)).toBe(true);
      // Empty object should match all records (PostgreSQL behavior)
      expect(emptyJsonbQuery.length).toBe(5);
    });

    test("should handle null JSONB columns gracefully", async () => {
      // Insert a user with null metadata
      await db.query(`
        INSERT INTO ${tables.users.name} (name, email, settings, metadata)
        VALUES ('Test User', 'test@example.com', '{"theme": "light"}', NULL)
      `);

      const nullJsonbQuery = await db
        .selectFrom(tables.users.name)
        .select(["name"])
        .where("metadata", "is", null)
        .execute();

      expect(Array.isArray(nullJsonbQuery)).toBe(true);
      expect(nullJsonbQuery.length).toBeGreaterThan(0);

      const names = nullJsonbQuery.map((u) => u.name);
      expect(names).toContain("Test User");
    });

    test("should return proper TypeScript types for JSONB data", async () => {
      const user = await db
        .selectFrom(tables.users.name)
        .select(["name", "settings", "metadata"])
        .where("name", "=", "John Doe")
        .execute();

      expect(user.length).toBe(1);
      if (user[0]) {
        expect(user[0]).toHaveProperty("settings");
        expect(user[0]).toHaveProperty("metadata");

        // JSONB fields should be returned as objects
        if (user[0].settings) {
          expect(typeof user[0].settings).toBe("object");
        }
        if (user[0].metadata) {
          expect(typeof user[0].metadata).toBe("object");
        }
      }
    });
  });
});
