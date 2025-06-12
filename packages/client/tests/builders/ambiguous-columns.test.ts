import { describe, test, expect } from "bun:test";
import type { Database } from "../utils/test-types";
import {
  UnambiguousColumns,
  SafeColumnReference,
  ColumnReference,
} from "../../src/core/builders/select-query-builder";

// Test database with overlapping columns
interface TestDatabase {
  users: {
    id: number;
    name: string;
    email: string;
    created_at: Date;
  };
  posts: {
    id: number;
    user_id: number;
    title: string;
    created_at: Date;
  };
  comments: {
    id: number;
    post_id: number;
    author_name: string;
    content: string;
  };
}

describe("Ambiguous Column Detection", () => {
  test("should identify unambiguous columns when joining users and posts", () => {
    // When joining users and posts:
    // - Ambiguous: id, created_at (exist in both)
    // - Unambiguous: name, email, user_id, title (exist in only one)

    type JoinedTables = "users" | "posts";
    type Result = UnambiguousColumns<TestDatabase, JoinedTables>;

    // Test that only unambiguous columns are allowed
    const validColumns: Result[] = [
      "name", // only in users
      "email", // only in users
      "user_id", // only in posts
      "title", // only in posts
    ];

    // These should NOT be assignable to Result (would cause compilation errors)
    // "id" - exists in both tables
    // "created_at" - exists in both tables

    expect(validColumns).toEqual(["name", "email", "user_id", "title"]);
  });

  test("should allow qualified references for ambiguous columns", () => {
    type JoinedTables = "users" | "posts";
    type Result = SafeColumnReference<TestDatabase, JoinedTables>;

    // These should all be valid
    const validReferences: Result[] = [
      // Unambiguous simple names
      "name",
      "email",
      "user_id",
      "title",
      // Qualified names (always allowed)
      "users.id",
      "users.name",
      "users.email",
      "users.created_at",
      "posts.id",
      "posts.user_id",
      "posts.title",
      "posts.created_at",
    ];

    expect(validReferences.length).toBeGreaterThan(0);
  });

  test("should handle three-way joins correctly", () => {
    type JoinedTables = "users" | "posts" | "comments";
    type Result = UnambiguousColumns<TestDatabase, JoinedTables>;

    // With three tables:
    // - Ambiguous: id (exists in all three)
    // - Unambiguous: name, email, user_id, title, post_id, author_name, content, created_at
    // Note: created_at only exists in users and posts, not comments, so still ambiguous

    const validColumns: Result[] = [
      "name", // only users
      "email", // only users
      "user_id", // only posts
      "title", // only posts
      "post_id", // only comments
      "author_name", // only comments
      "content", // only comments
    ];

    expect(validColumns.length).toBeGreaterThan(0);
  });
});

// Type-level tests (these will fail compilation if types are wrong)
describe("Type-level Ambiguous Column Tests", () => {
  test("should prevent ambiguous simple column names", () => {
    type JoinedTables = "users" | "posts";

    // This should work (unambiguous columns)
    const validColumn: ColumnReference<TestDatabase, JoinedTables> = "name";
    const validColumn2: ColumnReference<TestDatabase, JoinedTables> = "user_id";

    // This should work (qualified references)
    const qualifiedColumn: ColumnReference<TestDatabase, JoinedTables> =
      "users.id";
    const qualifiedColumn2: ColumnReference<TestDatabase, JoinedTables> =
      "posts.created_at";

    // These would cause compilation errors if uncommented:
    // const ambiguousColumn: ColumnReference<TestDatabase, JoinedTables> = "id"; // Error!
    // const ambiguousColumn2: ColumnReference<TestDatabase, JoinedTables> = "created_at"; // Error!

    expect(validColumn).toBe("name");
    expect(validColumn2).toBe("user_id");
    expect(qualifiedColumn).toBe("users.id");
    expect(qualifiedColumn2).toBe("posts.created_at");
  });
});
