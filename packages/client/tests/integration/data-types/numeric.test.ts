// Numeric Data Types Integration Tests
// Tests INTEGER, DECIMAL, FLOAT, BIGINT operations with isolated test tables

import { describe, test, expect, beforeAll, afterAll } from "bun:test";
import { pgvibe } from "../../../src/query-builder";
import {
  generateTestId,
  createTestDatabase,
  waitForDatabase,
} from "../utils/test-helpers";
import { performTestCleanup } from "../utils/cleanup";

describe("Numeric Data Types Integration Tests", () => {
  const testId = generateTestId();
  const tableName = `test_numeric_${testId}`;
  let db: pgvibe<any>;

  beforeAll(async () => {
    db = createTestDatabase();
    await waitForDatabase();

    // Create isolated test table with various numeric columns
    await db.query(`
      CREATE TABLE ${tableName} (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        age INTEGER,
        score DECIMAL(5,2),
        rating FLOAT,
        large_number BIGINT,
        small_number SMALLINT,
        real_number REAL,
        double_number DOUBLE PRECISION,
        money_amount NUMERIC(10,2),
        percentage DECIMAL(5,2),
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);
  });

  afterAll(async () => {
    await performTestCleanup(db, [tableName]);
  });

  describe("Integer Type Operations", () => {
    test("should insert and select INTEGER values", async () => {
      const testAge = 25;

      const insertResult = await db
        .insertInto(tableName)
        .values({
          name: "Integer Test User",
          age: testAge,
        })
        .returning(["id", "name", "age"])
        .execute();

      expect(insertResult).toHaveLength(1);
      const user = insertResult[0];
      expect(user?.age).toBe(testAge);
      expect(typeof user?.age).toBe("number");

      // Verify with SELECT
      const selectResult = await db
        .selectFrom(tableName)
        .select(["name", "age"])
        .where("name", "=", "Integer Test User")
        .execute();

      expect(selectResult).toHaveLength(1);
      expect(selectResult[0]?.age).toBe(testAge);
    });

    test("should handle integer edge cases", async () => {
      const edgeCases = [
        { name: "Zero", age: 0 },
        { name: "Negative", age: -100 },
        { name: "Large Positive", age: 999999 },
        { name: "Large Negative", age: -999999 },
      ];

      const insertResult = await db
        .insertInto(tableName)
        .values(edgeCases)
        .returning(["name", "age"])
        .execute();

      expect(insertResult).toHaveLength(4);
      expect(insertResult[0]?.age).toBe(0);
      expect(insertResult[1]?.age).toBe(-100);
      expect(insertResult[2]?.age).toBe(999999);
      expect(insertResult[3]?.age).toBe(-999999);
    });

    test("should handle null INTEGER values", async () => {
      const insertResult = await db
        .insertInto(tableName)
        .values({
          name: "Null Age User",
          age: null,
        })
        .returning(["name", "age"])
        .execute();

      expect(insertResult[0]?.age).toBeNull();
    });
  });

  describe("DECIMAL/NUMERIC Type Operations", () => {
    test("should insert and select DECIMAL values", async () => {
      const testScore = 87.5;

      const insertResult = await db
        .insertInto(tableName)
        .values({
          name: "Decimal Test User",
          score: testScore,
        })
        .returning(["name", "score"])
        .execute();

      expect(insertResult).toHaveLength(1);
      expect(Number(insertResult[0]?.score)).toBe(testScore);
    });

    test("should handle DECIMAL precision and scale", async () => {
      const precisionTests = [
        { name: "Two Decimals", score: 99.99 },
        { name: "One Decimal", score: 85.5 },
        { name: "No Decimals", score: 100.0 },
        { name: "Small Decimal", score: 0.01 },
      ];

      const insertResult = await db
        .insertInto(tableName)
        .values(precisionTests)
        .returning(["name", "score"])
        .execute();

      expect(insertResult).toHaveLength(4);
      expect(Number(insertResult[0]?.score)).toBe(99.99);
      expect(Number(insertResult[1]?.score)).toBe(85.5);
      expect(Number(insertResult[2]?.score)).toBe(100.0);
      expect(Number(insertResult[3]?.score)).toBe(0.01);
    });

    test("should handle NUMERIC money amounts", async () => {
      const moneyAmounts = [
        { name: "Expensive", money_amount: 999999.99 },
        { name: "Free", money_amount: 0.0 },
        { name: "Cheap", money_amount: 1.99 },
      ];

      const insertResult = await db
        .insertInto(tableName)
        .values(moneyAmounts)
        .returning(["name", "money_amount"])
        .execute();

      expect(insertResult).toHaveLength(3);
      expect(Number(insertResult[0]?.money_amount)).toBe(999999.99);
      expect(Number(insertResult[1]?.money_amount)).toBe(0.0);
      expect(Number(insertResult[2]?.money_amount)).toBe(1.99);
    });
  });

  describe("FLOAT/REAL Type Operations", () => {
    test("should insert and select FLOAT values", async () => {
      const testRating = 4.567;

      const insertResult = await db
        .insertInto(tableName)
        .values({
          name: "Float Test User",
          rating: testRating,
        })
        .returning(["name", "rating"])
        .execute();

      expect(insertResult).toHaveLength(1);
      expect(insertResult[0]?.rating).toBeCloseTo(testRating, 3);
      expect(typeof insertResult[0]?.rating).toBe("number");
    });

    test("should handle REAL number precision", async () => {
      const realNumbers = [
        { name: "Pi", real_number: 3.14159 },
        { name: "E", real_number: 2.71828 },
        { name: "Golden Ratio", real_number: 1.61803 },
      ];

      const insertResult = await db
        .insertInto(tableName)
        .values(realNumbers)
        .returning(["name", "real_number"])
        .execute();

      expect(insertResult).toHaveLength(3);
      expect(insertResult[0]?.real_number).toBeCloseTo(3.14159, 4);
      expect(insertResult[1]?.real_number).toBeCloseTo(2.71828, 4);
      expect(insertResult[2]?.real_number).toBeCloseTo(1.61803, 4);
    });

    test("should handle DOUBLE PRECISION values", async () => {
      const preciseNumbers = [
        { name: "Very Precise", double_number: 123.456789012345 },
        { name: "Scientific", double_number: 1.23e-10 },
        { name: "Large Scientific", double_number: 1.23e15 },
      ];

      const insertResult = await db
        .insertInto(tableName)
        .values(preciseNumbers)
        .returning(["name", "double_number"])
        .execute();

      expect(insertResult).toHaveLength(3);
      expect(typeof insertResult[0]?.double_number).toBe("number");
      expect(typeof insertResult[1]?.double_number).toBe("number");
      expect(typeof insertResult[2]?.double_number).toBe("number");
    });
  });

  describe("BIGINT Type Operations", () => {
    test("should insert and select BIGINT values", async () => {
      const largeBigInt = 9223372036854775807n; // Max BIGINT value

      const insertResult = await db
        .insertInto(tableName)
        .values({
          name: "BigInt Test User",
          large_number: largeBigInt.toString(), // Convert to string for transport
        })
        .returning(["name", "large_number"])
        .execute();

      expect(insertResult).toHaveLength(1);
      expect(typeof insertResult[0]?.large_number).toBe("string"); // BigInt comes back as string
    });

    test("should handle various BIGINT sizes", async () => {
      const bigIntTests = [
        { name: "Small BigInt", large_number: "1000000" },
        { name: "Medium BigInt", large_number: "1000000000000" },
        { name: "Large BigInt", large_number: "9223372036854775000" },
      ];

      const insertResult = await db
        .insertInto(tableName)
        .values(bigIntTests)
        .returning(["name", "large_number"])
        .execute();

      expect(insertResult).toHaveLength(3);
      expect(insertResult[0]?.large_number).toBe("1000000");
      expect(insertResult[1]?.large_number).toBe("1000000000000");
      expect(insertResult[2]?.large_number).toBe("9223372036854775000");
    });
  });

  describe("SMALLINT Type Operations", () => {
    test("should insert and select SMALLINT values", async () => {
      const smallNumbers = [
        { name: "Max SmallInt", small_number: 32767 },
        { name: "Min SmallInt", small_number: -32768 },
        { name: "Zero SmallInt", small_number: 0 },
      ];

      const insertResult = await db
        .insertInto(tableName)
        .values(smallNumbers)
        .returning(["name", "small_number"])
        .execute();

      expect(insertResult).toHaveLength(3);
      expect(insertResult[0]?.small_number).toBe(32767);
      expect(insertResult[1]?.small_number).toBe(-32768);
      expect(insertResult[2]?.small_number).toBe(0);
    });
  });

  describe("Numeric Queries and Operations", () => {
    test("should perform numeric comparisons", async () => {
      await db
        .insertInto(tableName)
        .values([
          { name: "High Score", score: 95.5 },
          { name: "Medium Score", score: 75.0 },
          { name: "Low Score", score: 55.5 },
        ])
        .execute();

      // Find high scorers
      const highScorers = await db
        .selectFrom(tableName)
        .select(["name", "score"])
        .where("score", ">=", 90)
        .execute();

      expect(highScorers.length).toBeGreaterThan(0);
      const names = highScorers.map((h) => h.name);
      expect(names).toContain("High Score");
      expect(names).not.toContain("Medium Score");
    });

    test("should handle numeric ranges", async () => {
      await db
        .insertInto(tableName)
        .values([
          { name: "Young", age: 18 },
          { name: "Adult", age: 35 },
          { name: "Senior", age: 65 },
        ])
        .execute();

      const adults = await db
        .selectFrom(tableName)
        .select(["name", "age"])
        .where("name", "in", ["Young", "Adult", "Senior"])
        .where("age", ">=", 25)
        .where("age", "<", 60)
        .execute();

      expect(adults).toHaveLength(1);
      expect(adults[0]?.name).toBe("Adult");
    });

    test("should order by numeric values", async () => {
      await db
        .insertInto(tableName)
        .values([
          { name: "Third", score: 70.0 },
          { name: "First", score: 90.0 },
          { name: "Second", score: 80.0 },
        ])
        .execute();

      const ordered = await db
        .selectFrom(tableName)
        .select(["name", "score"])
        .where("name", "in", ["First", "Second", "Third"])
        .orderBy("score", "desc")
        .execute();

      expect(ordered[0]?.name).toBe("First");
      expect(ordered[1]?.name).toBe("Second");
      expect(ordered[2]?.name).toBe("Third");
    });
  });

  describe("Type Safety and Validation", () => {
    test("should return correct JavaScript types", async () => {
      const insertResult = await db
        .insertInto(tableName)
        .values({
          name: "Type Test User",
          age: 30,
          score: 85.5,
          rating: 4.2,
          large_number: "1234567890",
          small_number: 100,
        })
        .returning([
          "name",
          "age",
          "score",
          "rating",
          "large_number",
          "small_number",
        ])
        .execute();

      const user = insertResult[0];
      expect(typeof user?.age).toBe("number");
      expect(typeof user?.score).toBe("string"); // DECIMAL comes as string
      expect(typeof user?.rating).toBe("number"); // FLOAT comes as number
      expect(typeof user?.large_number).toBe("string"); // BIGINT comes as string
      expect(typeof user?.small_number).toBe("number"); // SMALLINT comes as number
    });

    test("should handle null numeric values", async () => {
      const result = await db
        .insertInto(tableName)
        .values({
          name: "Null Numeric User",
          age: null,
          score: null,
          rating: null,
        })
        .returning(["name", "age", "score", "rating"])
        .execute();

      expect(result[0]?.age).toBeNull();
      expect(result[0]?.score).toBeNull();
      expect(result[0]?.rating).toBeNull();
    });

    test("should preserve precision in DECIMAL calculations", async () => {
      const result = await db
        .insertInto(tableName)
        .values({
          name: "Precision Test",
          score: 99.99,
          percentage: 15.25,
        })
        .returning(["name", "score", "percentage"])
        .execute();

      // DECIMAL values should preserve exact precision
      expect(Number(result[0]?.score)).toBe(99.99);
      expect(Number(result[0]?.percentage)).toBe(15.25);
    });
  });

  describe("Edge Cases and Boundaries", () => {
    test("should handle numeric boundary values", async () => {
      const boundaryTests = [
        { name: "Max Integer", age: 2147483647 },
        { name: "Min Integer", age: -2147483648 },
        { name: "Zero", age: 0 },
      ];

      const insertResult = await db
        .insertInto(tableName)
        .values(boundaryTests)
        .returning(["name", "age"])
        .execute();

      expect(insertResult).toHaveLength(3);
      expect(insertResult[0]?.age).toBe(2147483647);
      expect(insertResult[1]?.age).toBe(-2147483648);
      expect(insertResult[2]?.age).toBe(0);
    });

    test("should handle very small decimal values", async () => {
      const smallDecimals = [
        { name: "Tiny", score: 0.01 },
        { name: "Micro", score: 0.001 }, // Will be rounded to 0.00 due to scale(2)
      ];

      const insertResult = await db
        .insertInto(tableName)
        .values(smallDecimals)
        .returning(["name", "score"])
        .execute();

      expect(Number(insertResult[0]?.score)).toBe(0.01);
      expect(Number(insertResult[1]?.score)).toBe(0.0); // Rounded due to DECIMAL(5,2)
    });
  });
});
