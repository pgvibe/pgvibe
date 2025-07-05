// Text and Boolean Data Types Integration Tests
// Tests VARCHAR, TEXT, CHAR, BOOLEAN operations with isolated test tables

import { describe, test, expect, beforeAll, afterAll } from "bun:test";
import { pgvibe } from "../../../src/query-builder";
import {
  generateTestId,
  createTestDatabase,
  waitForDatabase,
} from "../utils/test-helpers";
import { performTestCleanup } from "../utils/cleanup";

describe("Text and Boolean Data Types Integration Tests", () => {
  const testId = generateTestId();
  const tableName = `test_text_bool_${testId}`;
  let db: pgvibe<any>;

  beforeAll(async () => {
    db = createTestDatabase();
    await waitForDatabase();

    // Create isolated test table with various text and boolean columns
    await db.query(`
      CREATE TABLE ${tableName} (
        id SERIAL PRIMARY KEY,
        short_name VARCHAR(50),
        full_name VARCHAR(255),
        bio TEXT,
        fixed_code CHAR(10),
        description TEXT,
        active BOOLEAN DEFAULT true,
        verified BOOLEAN,
        settings BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);
  });

  afterAll(async () => {
    await performTestCleanup(db, [tableName]);
  });

  describe("VARCHAR Type Operations", () => {
    test("should insert and select VARCHAR values", async () => {
      const shortName = "JohnD";
      const fullName = "John Doe";

      const insertResult = await db
        .insertInto(tableName)
        .values({
          short_name: shortName,
          full_name: fullName,
        })
        .returning(["id", "short_name", "full_name"])
        .execute();

      expect(insertResult).toHaveLength(1);
      const user = insertResult[0];
      expect(user?.short_name).toBe(shortName);
      expect(user?.full_name).toBe(fullName);
      expect(typeof user?.short_name).toBe("string");
      expect(typeof user?.full_name).toBe("string");

      // Verify with SELECT
      const selectResult = await db
        .selectFrom(tableName)
        .select(["short_name", "full_name"])
        .where("short_name", "=", shortName)
        .execute();

      expect(selectResult).toHaveLength(1);
      expect(selectResult[0]?.short_name).toBe(shortName);
      expect(selectResult[0]?.full_name).toBe(fullName);
    });

    test("should handle VARCHAR with special characters", async () => {
      const specialNames = [
        { short_name: "José", full_name: "José María García" },
        { short_name: "李明", full_name: "李明 (Li Ming)" },
        { short_name: "Müller", full_name: "Hans Müller" },
        { short_name: "O'Brien", full_name: "Patrick O'Brien" },
      ];

      const insertResult = await db
        .insertInto(tableName)
        .values(specialNames)
        .returning(["short_name", "full_name"])
        .execute();

      expect(insertResult).toHaveLength(4);
      expect(insertResult[0]?.short_name).toBe("José");
      expect(insertResult[1]?.short_name).toBe("李明");
      expect(insertResult[2]?.short_name).toBe("Müller");
      expect(insertResult[3]?.short_name).toBe("O'Brien");
    });

    test("should handle VARCHAR length constraints", async () => {
      const longName = "A".repeat(255); // Max length for full_name
      const shortCode = "B".repeat(50); // Max length for short_name

      const insertResult = await db
        .insertInto(tableName)
        .values({
          short_name: shortCode,
          full_name: longName,
        })
        .returning(["short_name", "full_name"])
        .execute();

      expect(insertResult[0]?.short_name).toBe(shortCode);
      expect(insertResult[0]?.full_name).toBe(longName);
      expect(insertResult[0]?.short_name?.length).toBe(50);
      expect(insertResult[0]?.full_name?.length).toBe(255);
    });

    test("should handle null VARCHAR values", async () => {
      const insertResult = await db
        .insertInto(tableName)
        .values({
          short_name: null,
          full_name: null,
        })
        .returning(["short_name", "full_name"])
        .execute();

      expect(insertResult[0]?.short_name).toBeNull();
      expect(insertResult[0]?.full_name).toBeNull();
    });
  });

  describe("TEXT Type Operations", () => {
    test("should insert and select TEXT values", async () => {
      const longBio =
        "This is a very long biography that could contain thousands of characters. ".repeat(
          10
        );

      const insertResult = await db
        .insertInto(tableName)
        .values({
          short_name: "TextUser",
          bio: longBio,
        })
        .returning(["short_name", "bio"])
        .execute();

      expect(insertResult).toHaveLength(1);
      expect(insertResult[0]?.bio).toBe(longBio);
      expect(typeof insertResult[0]?.bio).toBe("string");
    });

    test("should handle TEXT with line breaks and formatting", async () => {
      const formattedText = `Line 1
Line 2 with spaces  
Line 3 with\ttabs
Line 4 with "quotes" and 'apostrophes'
Line 5 with special chars: @#$%^&*()`;

      const insertResult = await db
        .insertInto(tableName)
        .values({
          short_name: "FormattedUser",
          description: formattedText,
        })
        .returning(["short_name", "description"])
        .execute();

      expect(insertResult[0]?.description).toBe(formattedText);
    });

    test("should handle very large TEXT values", async () => {
      const hugeBio = "A".repeat(10000); // 10KB text

      const insertResult = await db
        .insertInto(tableName)
        .values({
          short_name: "HugeUser",
          bio: hugeBio,
        })
        .returning(["short_name", "bio"])
        .execute();

      expect(insertResult[0]?.bio).toBe(hugeBio);
      expect(insertResult[0]?.bio?.length).toBe(10000);
    });

    test("should handle empty TEXT values", async () => {
      const insertResult = await db
        .insertInto(tableName)
        .values({
          short_name: "EmptyUser",
          bio: "",
          description: "",
        })
        .returning(["short_name", "bio", "description"])
        .execute();

      expect(insertResult[0]?.bio).toBe("");
      expect(insertResult[0]?.description).toBe("");
    });
  });

  describe("CHAR Type Operations", () => {
    test("should insert and select CHAR values", async () => {
      const fixedCode = "ABC1234567"; // Exactly 10 characters

      const insertResult = await db
        .insertInto(tableName)
        .values({
          short_name: "CharUser",
          fixed_code: fixedCode,
        })
        .returning(["short_name", "fixed_code"])
        .execute();

      expect(insertResult).toHaveLength(1);
      expect(insertResult[0]?.fixed_code).toBe(fixedCode);
    });

    test("should handle CHAR padding", async () => {
      const shortCode = "ABC"; // Less than 10 characters - should be padded

      const insertResult = await db
        .insertInto(tableName)
        .values({
          short_name: "PaddedUser",
          fixed_code: shortCode,
        })
        .returning(["short_name", "fixed_code"])
        .execute();

      // PostgreSQL CHAR fields are typically right-padded with spaces
      expect(insertResult[0]?.fixed_code).toBe(shortCode + "       "); // 7 spaces to make 10 total
    });

    test("should handle null CHAR values", async () => {
      const insertResult = await db
        .insertInto(tableName)
        .values({
          short_name: "NullCharUser",
          fixed_code: null,
        })
        .returning(["short_name", "fixed_code"])
        .execute();

      expect(insertResult[0]?.fixed_code).toBeNull();
    });
  });

  describe("BOOLEAN Type Operations", () => {
    test("should insert and select BOOLEAN values", async () => {
      const insertResult = await db
        .insertInto(tableName)
        .values({
          short_name: "BoolUser",
          active: true,
          verified: false,
          settings: true,
        })
        .returning(["short_name", "active", "verified", "settings"])
        .execute();

      expect(insertResult).toHaveLength(1);
      const user = insertResult[0];
      expect(user?.active).toBe(true);
      expect(user?.verified).toBe(false);
      expect(user?.settings).toBe(true);
      expect(typeof user?.active).toBe("boolean");
      expect(typeof user?.verified).toBe("boolean");
      expect(typeof user?.settings).toBe("boolean");
    });

    test("should handle BOOLEAN default values", async () => {
      const insertResult = await db
        .insertInto(tableName)
        .values({
          short_name: "DefaultUser",
          // active should default to true
          // settings should default to false
          verified: null, // explicitly null
        })
        .returning(["short_name", "active", "verified", "settings"])
        .execute();

      expect(insertResult[0]?.active).toBe(true); // DEFAULT true
      expect(insertResult[0]?.settings).toBe(false); // DEFAULT false
      expect(insertResult[0]?.verified).toBeNull(); // explicitly null
    });

    test("should handle null BOOLEAN values", async () => {
      const insertResult = await db
        .insertInto(tableName)
        .values({
          short_name: "NullBoolUser",
          active: null,
          verified: null,
          settings: null,
        })
        .returning(["short_name", "active", "verified", "settings"])
        .execute();

      expect(insertResult[0]?.active).toBeNull();
      expect(insertResult[0]?.verified).toBeNull();
      expect(insertResult[0]?.settings).toBeNull();
    });

    test("should handle boolean queries and filtering", async () => {
      await db
        .insertInto(tableName)
        .values([
          { short_name: "ActiveUser", active: true, verified: true },
          { short_name: "InactiveUser", active: false, verified: false },
          { short_name: "UnverifiedUser", active: true, verified: false },
        ])
        .execute();

      // Find active users
      const activeUsers = await db
        .selectFrom(tableName)
        .select(["short_name", "active"])
        .where("active", "=", true)
        .execute();

      const activeNames = activeUsers.map((u) => u.short_name);
      expect(activeNames).toContain("ActiveUser");
      expect(activeNames).toContain("UnverifiedUser");
      expect(activeNames).not.toContain("InactiveUser");

      // Find verified users
      const verifiedUsers = await db
        .selectFrom(tableName)
        .select(["short_name", "verified"])
        .where("verified", "=", true)
        .execute();

      const verifiedNames = verifiedUsers.map((u) => u.short_name);
      expect(verifiedNames).toContain("ActiveUser");
      expect(verifiedNames).not.toContain("InactiveUser");
      expect(verifiedNames).not.toContain("UnverifiedUser");
    });
  });

  describe("Text Search and Pattern Matching", () => {
    test("should perform LIKE pattern matching", async () => {
      await db
        .insertInto(tableName)
        .values([
          { short_name: "Smith", full_name: "John Smith" },
          { short_name: "Smithson", full_name: "Jane Smithson" },
          { short_name: "Johnson", full_name: "Bob Johnson" },
        ])
        .execute();

      const smithUsers = await db
        .selectFrom(tableName)
        .select(["short_name", "full_name"])
        .where("short_name", "like", "Smith%")
        .execute();

      expect(smithUsers).toHaveLength(2);
      const names = smithUsers.map((u) => u.short_name);
      expect(names).toContain("Smith");
      expect(names).toContain("Smithson");
      expect(names).not.toContain("Johnson");
    });

    test("should perform case-sensitive text comparisons", async () => {
      await db
        .insertInto(tableName)
        .values([
          { short_name: "test", full_name: "Test User" },
          { short_name: "TEST", full_name: "TEST USER" },
          { short_name: "Test", full_name: "Test User Mixed" },
        ])
        .execute();

      const exactMatch = await db
        .selectFrom(tableName)
        .select(["short_name", "full_name"])
        .where("short_name", "=", "test")
        .execute();

      expect(exactMatch).toHaveLength(1);
      expect(exactMatch[0]?.short_name).toBe("test");
    });

    test("should handle text ordering", async () => {
      await db
        .insertInto(tableName)
        .values([
          { short_name: "Charlie", full_name: "Charlie Brown" },
          { short_name: "Alice", full_name: "Alice Wilson" },
          { short_name: "Bob", full_name: "Bob Davis" },
        ])
        .execute();

      const ordered = await db
        .selectFrom(tableName)
        .select(["short_name"])
        .where("short_name", "in", ["Alice", "Bob", "Charlie"])
        .orderBy("short_name", "asc")
        .execute();

      expect(ordered[0]?.short_name).toBe("Alice");
      expect(ordered[1]?.short_name).toBe("Bob");
      expect(ordered[2]?.short_name).toBe("Charlie");
    });
  });

  describe("Mixed Type Operations", () => {
    test("should handle mixed text and boolean operations", async () => {
      const insertResult = await db
        .insertInto(tableName)
        .values({
          short_name: "MixedUser",
          full_name: "Mixed Type User",
          bio: "This user tests mixed types",
          fixed_code: "MIXED12345",
          active: true,
          verified: false,
        })
        .returning([
          "short_name",
          "full_name",
          "bio",
          "fixed_code",
          "active",
          "verified",
        ])
        .execute();

      const user = insertResult[0];
      expect(typeof user?.short_name).toBe("string");
      expect(typeof user?.full_name).toBe("string");
      expect(typeof user?.bio).toBe("string");
      expect(typeof user?.fixed_code).toBe("string");
      expect(typeof user?.active).toBe("boolean");
      expect(typeof user?.verified).toBe("boolean");
    });

    test("should filter by both text and boolean conditions", async () => {
      await db
        .insertInto(tableName)
        .values([
          {
            short_name: "ActiveAdmin",
            full_name: "Active Admin User",
            active: true,
            verified: true,
          },
          {
            short_name: "ActiveUser",
            full_name: "Active Regular User",
            active: true,
            verified: false,
          },
          {
            short_name: "InactiveAdmin",
            full_name: "Inactive Admin User",
            active: false,
            verified: true,
          },
        ])
        .execute();

      const activeAdmins = await db
        .selectFrom(tableName)
        .select(["short_name", "active", "verified"])
        .where("active", "=", true)
        .where("verified", "=", true)
        .where("full_name", "like", "%Admin%")
        .execute();

      expect(activeAdmins).toHaveLength(1);
      expect(activeAdmins[0]?.short_name).toBe("ActiveAdmin");
    });
  });

  describe("Edge Cases and Special Values", () => {
    test("should handle empty strings vs null", async () => {
      const insertResult = await db
        .insertInto(tableName)
        .values({
          short_name: "", // empty string
          full_name: null, // null
          bio: "", // empty string
          fixed_code: null, // null
        })
        .returning(["short_name", "full_name", "bio", "fixed_code"])
        .execute();

      expect(insertResult[0]?.short_name).toBe("");
      expect(insertResult[0]?.full_name).toBeNull();
      expect(insertResult[0]?.bio).toBe("");
      expect(insertResult[0]?.fixed_code).toBeNull();
    });

    test("should handle SQL injection prevention", async () => {
      const maliciousInput = "'; DROP TABLE users; --";

      const insertResult = await db
        .insertInto(tableName)
        .values({
          short_name: "SafeUser",
          bio: maliciousInput, // This should be safely escaped
        })
        .returning(["short_name", "bio"])
        .execute();

      expect(insertResult[0]?.bio).toBe(maliciousInput);

      // Verify table still exists by querying it
      const verifyResult = await db
        .selectFrom(tableName)
        .select(["short_name"])
        .where("short_name", "=", "SafeUser")
        .execute();

      expect(verifyResult).toHaveLength(1);
    });

    test("should handle Unicode and emoji characters", async () => {
      const unicodeData = {
        short_name: "🚀User",
        full_name: "🚀 Rocket User 🎉",
        bio: "This user loves emojis! 😀🎈🌟✨💫",
      };

      const insertResult = await db
        .insertInto(tableName)
        .values(unicodeData)
        .returning(["short_name", "full_name", "bio"])
        .execute();

      expect(insertResult[0]?.short_name).toBe("🚀User");
      expect(insertResult[0]?.full_name).toBe("🚀 Rocket User 🎉");
      expect(insertResult[0]?.bio).toBe("This user loves emojis! 😀🎈🌟✨💫");
    });
  });

  describe("Type Safety and Validation", () => {
    test("should return proper JavaScript types", async () => {
      const insertResult = await db
        .insertInto(tableName)
        .values({
          short_name: "TypeTest",
          full_name: "Type Test User",
          bio: "Bio text",
          fixed_code: "TYPE123456",
          active: true,
          verified: false,
          settings: null,
        })
        .returning([
          "short_name",
          "full_name",
          "bio",
          "fixed_code",
          "active",
          "verified",
          "settings",
        ])
        .execute();

      const user = insertResult[0];
      expect(typeof user?.short_name).toBe("string");
      expect(typeof user?.full_name).toBe("string");
      expect(typeof user?.bio).toBe("string");
      expect(typeof user?.fixed_code).toBe("string");
      expect(typeof user?.active).toBe("boolean");
      expect(typeof user?.verified).toBe("boolean");
      expect(user?.settings).toBeNull();
    });
  });
});
