// Date and Timestamp Data Types Integration Tests
// Tests DATE, TIMESTAMP, TIMESTAMPTZ operations with isolated test tables

import { describe, test, expect, beforeAll, afterAll } from "bun:test";
import { ZenQ } from "../../../src/query-builder";
import {
  generateTestId,
  createTestDatabase,
  waitForDatabase,
} from "../utils/test-helpers";
import { performTestCleanup } from "../utils/cleanup";

describe("Date and Timestamp Data Types Integration Tests", () => {
  const testId = generateTestId();
  const tableName = `test_dates_${testId}`;
  let db: ZenQ<any>;

  beforeAll(async () => {
    db = createTestDatabase();
    await waitForDatabase();

    // Create isolated test table with various date/timestamp columns
    await db.query(`
      CREATE TABLE ${tableName} (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        birth_date DATE,
        created_at TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE,
        scheduled_time TIME,
        interval_duration INTERVAL,
        created_timestamp TIMESTAMP DEFAULT NOW(),
        updated_timestamptz TIMESTAMPTZ DEFAULT NOW()
      )
    `);
  });

  afterAll(async () => {
    await performTestCleanup(db, [tableName]);
  });

  describe("Date Type Operations", () => {
    test("should insert and select DATE values", async () => {
      const testDate = "2024-01-15";

      const insertResult = await db
        .insertInto(tableName)
        .values({
          name: "Date Test User",
          birth_date: testDate,
        })
        .returning(["id", "name", "birth_date"])
        .execute();

      expect(insertResult).toHaveLength(1);
      expect(insertResult[0]?.birth_date).toBeInstanceOf(Date);
      expect(insertResult[0]?.birth_date).toEqual(new Date(testDate));

      // Verify with SELECT
      const selectResult = await db
        .selectFrom(tableName)
        .select(["name", "birth_date"])
        .where("name", "=", "Date Test User")
        .execute();

      expect(selectResult).toHaveLength(1);
      expect(selectResult[0]?.birth_date).toBeInstanceOf(Date);
      expect(selectResult[0]?.birth_date).toEqual(new Date(testDate));
    });

    test("should handle null DATE values", async () => {
      const insertResult = await db
        .insertInto(tableName)
        .values({
          name: "Null Date User",
          birth_date: null,
        })
        .returning(["id", "name", "birth_date"])
        .execute();

      expect(insertResult[0]!.birth_date).toBeNull();
    });

    test("should handle date comparisons in WHERE clauses", async () => {
      // Insert multiple dates
      await db
        .insertInto(tableName)
        .values([
          { name: "User 1990", birth_date: "1990-05-15" },
          { name: "User 2000", birth_date: "2000-12-25" },
          { name: "User 2010", birth_date: "2010-03-10" },
        ])
        .execute();

      // Test date range queries
      const result = await db
        .selectFrom(tableName)
        .select(["name", "birth_date"])
        .where("birth_date", ">=", "2000-01-01")
        .where("birth_date", "<", "2011-01-01")
        .orderBy("birth_date", "asc")
        .execute();

      expect(result).toHaveLength(2);
      expect(result[0]!.name).toBe("User 2000");
      expect(result[1]!.name).toBe("User 2010");
    });
  });

  describe("Timestamp Type Operations", () => {
    test("should insert and select TIMESTAMP values", async () => {
      const testTimestamp = "2024-01-15 14:30:00";

      const insertResult = await db
        .insertInto(tableName)
        .values({
          name: "Timestamp Test User",
          created_at: testTimestamp,
        })
        .returning(["id", "name", "created_at"])
        .execute();

      expect(insertResult).toHaveLength(1);
      expect(insertResult[0]!.created_at).toBeInstanceOf(Date);
      const createdAtDate = insertResult[0]!.created_at as Date;
      expect(createdAtDate.toISOString()).toContain("2024-01-15");
      expect(createdAtDate.toISOString()).toContain("14:30:00");
    });

    test("should insert and select TIMESTAMPTZ values", async () => {
      const testTimestampTz = "2024-01-15 14:30:00+00:00";

      const insertResult = await db
        .insertInto(tableName)
        .values({
          name: "TimestampTZ Test User",
          updated_at: testTimestampTz,
        })
        .returning(["id", "name", "updated_at"])
        .execute();

      expect(insertResult).toHaveLength(1);
      expect(insertResult[0]!.updated_at).toBeDefined();
    });

    test("should handle default NOW() timestamps", async () => {
      const beforeInsert = new Date();

      const insertResult = await db
        .insertInto(tableName)
        .values({
          name: "Default Timestamp User",
        })
        .returning(["id", "name", "created_timestamp", "updated_timestamptz"])
        .execute();

      const afterInsert = new Date();

      expect(insertResult).toHaveLength(1);
      expect(insertResult[0]!.created_timestamp).toBeDefined();
      expect(insertResult[0]!.updated_timestamptz).toBeDefined();

      // Verify timestamps are reasonable
      const createdTimestamp = new Date(insertResult[0]!.created_timestamp);
      expect(createdTimestamp.getTime()).toBeGreaterThanOrEqual(
        beforeInsert.getTime() - 1000
      );
      expect(createdTimestamp.getTime()).toBeLessThanOrEqual(
        afterInsert.getTime() + 1000
      );
    });
  });

  describe("Time Type Operations", () => {
    test("should insert and select TIME values", async () => {
      const testTime = "14:30:00";

      const insertResult = await db
        .insertInto(tableName)
        .values({
          name: "Time Test User",
          scheduled_time: testTime,
        })
        .returning(["id", "name", "scheduled_time"])
        .execute();

      expect(insertResult).toHaveLength(1);
      expect(insertResult[0]!.scheduled_time).toBe(testTime);
    });

    test("should handle TIME with milliseconds", async () => {
      const testTime = "14:30:15.123";

      const insertResult = await db
        .insertInto(tableName)
        .values({
          name: "Time Milliseconds User",
          scheduled_time: testTime,
        })
        .returning(["id", "name", "scheduled_time"])
        .execute();

      expect(insertResult).toHaveLength(1);
      expect(insertResult[0]!.scheduled_time).toContain("14:30:15");
    });
  });

  describe("Interval Type Operations", () => {
    test("should insert and select INTERVAL values", async () => {
      const testInterval = "2 hours 30 minutes";

      const insertResult = await db
        .insertInto(tableName)
        .values({
          name: "Interval Test User",
          interval_duration: testInterval,
        })
        .returning(["id", "name", "interval_duration"])
        .execute();

      expect(insertResult).toHaveLength(1);
      expect(insertResult[0]!.interval_duration).toBeDefined();
    });

    test("should handle various INTERVAL formats", async () => {
      const intervals = [
        { name: "Days Interval", interval_duration: "5 days" },
        { name: "Hours Interval", interval_duration: "3 hours" },
        { name: "Minutes Interval", interval_duration: "45 minutes" },
        {
          name: "Complex Interval",
          interval_duration: "1 day 2 hours 30 minutes",
        },
      ];

      const insertResult = await db
        .insertInto(tableName)
        .values(intervals)
        .returning(["name", "interval_duration"])
        .execute();

      expect(insertResult).toHaveLength(4);
      insertResult.forEach((row) => {
        expect(row.interval_duration).toBeDefined();
        expect(typeof row.interval_duration).toBe("object");
      });
    });
  });

  describe("Date/Time Edge Cases", () => {
    test("should handle edge date values", async () => {
      const edgeDates = [
        { name: "Leap Year", birth_date: "2020-02-29" },
        { name: "Year 2000", birth_date: "2000-01-01" },
        { name: "End of Year", birth_date: "2023-12-31" },
      ];

      const insertResult = await db
        .insertInto(tableName)
        .values(edgeDates)
        .returning(["name", "birth_date"])
        .execute();

      expect(insertResult).toHaveLength(3);
      expect(insertResult[0]!.birth_date).toEqual(new Date("2020-02-29"));
      expect(insertResult[1]!.birth_date).toEqual(new Date("2000-01-01"));
      expect(insertResult[2]!.birth_date).toEqual(new Date("2023-12-31"));
    });

    test("should handle timezone-aware timestamps", async () => {
      const timezoneTimestamps = [
        { name: "UTC", updated_at: "2024-01-15 12:00:00+00:00" },
        { name: "EST", updated_at: "2024-01-15 12:00:00-05:00" },
        { name: "PST", updated_at: "2024-01-15 12:00:00-08:00" },
      ];

      const insertResult = await db
        .insertInto(tableName)
        .values(timezoneTimestamps)
        .returning(["name", "updated_at"])
        .execute();

      expect(insertResult).toHaveLength(3);
      insertResult.forEach((row) => {
        expect(row.updated_at).toBeDefined();
      });
    });
  });

  describe("Date/Time Queries and Filtering", () => {
    test("should perform date arithmetic and comparisons", async () => {
      await db
        .insertInto(tableName)
        .values([
          { name: "Recent User", birth_date: "2020-01-01" },
          { name: "Older User", birth_date: "1990-01-01" },
        ])
        .execute();

      // Find users born after 2000
      const recentUsers = await db
        .selectFrom(tableName)
        .select(["name", "birth_date"])
        .where("birth_date", ">", "2000-01-01")
        .execute();

      const recentNames = recentUsers.map((u) => u.name);
      expect(recentNames).toContain("Recent User");
      expect(recentNames).not.toContain("Older User");
    });

    test("should handle timestamp ordering", async () => {
      const now = new Date();
      const timestamps = [
        { name: "First", created_at: "2024-01-01 10:00:00" },
        { name: "Second", created_at: "2024-01-01 12:00:00" },
        { name: "Third", created_at: "2024-01-01 14:00:00" },
      ];

      await db.insertInto(tableName).values(timestamps).execute();

      const result = await db
        .selectFrom(tableName)
        .select(["name", "created_at"])
        .where("name", "in", ["First", "Second", "Third"])
        .orderBy("created_at", "desc")
        .execute();

      expect(result[0]!.name).toBe("Third");
      expect(result[1]!.name).toBe("Second");
      expect(result[2]!.name).toBe("First");
    });
  });

  describe("Type Safety and Validation", () => {
    test("should return proper JavaScript Date types where appropriate", async () => {
      const insertResult = await db
        .insertInto(tableName)
        .values({
          name: "Type Test User",
          birth_date: "2024-01-15",
          created_at: "2024-01-15 14:30:00",
        })
        .returning(["name", "birth_date", "created_at", "created_timestamp"])
        .execute();

      const user = insertResult[0]!;
      expect(user.birth_date).toBeInstanceOf(Date); // Dates come back as Date objects
      expect(user.created_at).toBeInstanceOf(Date); // Timestamps come back as Date objects
      expect(user.created_timestamp).toBeDefined(); // Default timestamp should exist
    });

    test("should handle null vs undefined date values", async () => {
      const result = await db
        .insertInto(tableName)
        .values({
          name: "Null Test User",
          birth_date: null,
          // created_at is omitted (undefined)
        })
        .returning(["name", "birth_date", "created_at"])
        .execute();

      expect(result[0]!.birth_date).toBeNull();
      expect(result[0]!.created_at).toBeNull();
    });
  });
});
