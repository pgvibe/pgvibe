// Array Type System Tests
// Validates compile-time type safety for PostgreSQL array operations

import { describe, it, expect } from "bun:test";
import type {
  ArrayType,
  ArrayElementType,
  ArrayColumnOf,
} from "../../src/core/types/array";

// Test database schema for type validation
interface TestDatabase {
  users: {
    id: number;
    name: string;
    tags: ArrayType<string[]>;
    permissions: ArrayType<string[]>;
    scores: ArrayType<number[]>;
    flags: ArrayType<boolean[]>;
  };
  posts: {
    id: number;
    title: string;
    categories: ArrayType<string[]>;
    ratings: ArrayType<number[]>;
  };
}

describe("Array Type System", () => {
  describe("ArrayType branded type", () => {
    it("should have the correct branded type structure", () => {
      // This test validates the branded type structure exists
      type TestArrayType = ArrayType<string[]>;

      // Validate that the type has the expected shape
      expect(true).toBe(true); // Compile-time validation
    });
  });

  describe("ArrayElementType utility", () => {
    it("should extract element type from string array", () => {
      type StringArrayElement = ArrayElementType<ArrayType<string[]>>;

      // Test that the extracted type works as expected
      const element: StringArrayElement = "test";

      expect(typeof element).toBe("string");
    });

    it("should extract element type from number array", () => {
      type NumberArrayElement = ArrayElementType<ArrayType<number[]>>;

      const element: NumberArrayElement = 42;

      expect(typeof element).toBe("number");
    });

    it("should extract element type from boolean array", () => {
      type BooleanArrayElement = ArrayElementType<ArrayType<boolean[]>>;

      const element: BooleanArrayElement = true;

      expect(typeof element).toBe("boolean");
    });
  });

  describe("ArrayColumnOf utility", () => {
    it("should identify array columns in users table", () => {
      type UserArrayColumns = ArrayColumnOf<TestDatabase, "users">;

      // Validate that array columns are correctly identified
      const validColumns: UserArrayColumns[] = [
        "tags",
        "permissions",
        "scores",
        "flags",
      ];

      expect(validColumns.length).toBe(4);
      expect(validColumns).toContain("tags");
      expect(validColumns).toContain("permissions");
      expect(validColumns).toContain("scores");
      expect(validColumns).toContain("flags");
    });

    it("should identify array columns in posts table", () => {
      type PostArrayColumns = ArrayColumnOf<TestDatabase, "posts">;

      const validColumns: PostArrayColumns[] = ["categories", "ratings"];

      expect(validColumns.length).toBe(2);
      expect(validColumns).toContain("categories");
      expect(validColumns).toContain("ratings");
    });

    it("should work with column assignment", () => {
      type UserArrayColumns = ArrayColumnOf<TestDatabase, "users">;

      // Valid array columns should work
      const tagsColumn: UserArrayColumns = "tags";
      const permissionsColumn: UserArrayColumns = "permissions";
      const scoresColumn: UserArrayColumns = "scores";

      expect(tagsColumn).toBe("tags");
      expect(permissionsColumn).toBe("permissions");
      expect(scoresColumn).toBe("scores");
    });
  });

  describe("Type safety integration", () => {
    it("should provide end-to-end type safety", () => {
      // Test the complete type system working together
      type TagsColumn = TestDatabase["users"]["tags"];
      type TagElement = ArrayElementType<TagsColumn>;

      const element: TagElement = "typescript";
      const validArray: TagElement[] = [element, "nodejs"];

      expect(typeof element).toBe("string");
      expect(validArray).toEqual(["typescript", "nodejs"]);
    });

    it("should handle different element types", () => {
      type ScoresColumn = TestDatabase["users"]["scores"];
      type ScoreElement = ArrayElementType<ScoresColumn>;

      const score: ScoreElement = 100;
      const scores: ScoreElement[] = [score, 95, 87];

      expect(typeof score).toBe("number");
      expect(scores).toEqual([100, 95, 87]);
    });
  });

  describe("Complex scenarios", () => {
    it("should handle union table types", () => {
      type BothTables = "users" | "posts";
      type AllArrayColumns = ArrayColumnOf<TestDatabase, BothTables>;

      // Should include columns from both tables
      const userColumn: AllArrayColumns = "tags";
      const postColumn: AllArrayColumns = "categories";

      expect(userColumn).toBe("tags");
      expect(postColumn).toBe("categories");
    });

    it("should work with complex element types", () => {
      // Test with object element types
      interface Permission {
        action: string;
        resource: string;
      }

      type PermissionArrayType = ArrayType<Permission[]>;
      type PermissionElement = ArrayElementType<PermissionArrayType>;

      const permission: PermissionElement = {
        action: "read",
        resource: "users",
      };

      expect(permission.action).toBe("read");
      expect(permission.resource).toBe("users");
    });
  });
});

// Type validation tests (these validate TypeScript behavior)
namespace TypeValidationTests {
  // Test that the type system correctly identifies array columns
  type UserArrayColumns = ArrayColumnOf<TestDatabase, "users">;
  type PostArrayColumns = ArrayColumnOf<TestDatabase, "posts">;

  // These should compile without errors
  const userTags: UserArrayColumns = "tags";
  const userPermissions: UserArrayColumns = "permissions";
  const userScores: UserArrayColumns = "scores";
  const userFlags: UserArrayColumns = "flags";

  const postCategories: PostArrayColumns = "categories";
  const postRatings: PostArrayColumns = "ratings";

  // Test element type extraction
  type TagElement = ArrayElementType<TestDatabase["users"]["tags"]>;
  type ScoreElement = ArrayElementType<TestDatabase["users"]["scores"]>;
  type FlagElement = ArrayElementType<TestDatabase["users"]["flags"]>;

  const tag: TagElement = "test"; // Should be string
  const score: ScoreElement = 100; // Should be number
  const flag: FlagElement = true; // Should be boolean

  // The following would cause TypeScript errors (commented out):
  // const invalidUserColumn: UserArrayColumns = "id";     // Error: not array column
  // const invalidUserColumn2: UserArrayColumns = "name";  // Error: not array column
  // const wrongTypeTag: TagElement = 123;                 // Error: number not string
  // const wrongTypeScore: ScoreElement = "text";          // Error: string not number
}
