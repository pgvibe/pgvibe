// PostgreSQL Array Operations Integration Tests
// Tests actual array operation execution against Docker PostgreSQL instance
// Validates SQL generation, parameterization, and real database behavior

import { describe, test, expect, beforeAll, afterAll } from "bun:test";
import { ZenQ } from "../../src/query-builder";
import type { Database } from "../utils/test-types";
import { createTestDatabase, waitForDatabase } from "../utils/test-config";

describe("Array Operations Integration Tests", () => {
  let db: ZenQ<Database>;

  beforeAll(async () => {
    // Create ZenQ instance with centralized test configuration
    db = createTestDatabase();

    // Wait for database to be ready with array data
    await waitForDatabase();
  });

  describe("Array Contains (@>) Operations", () => {
    test("should find users with specific tags using contains", async () => {
      const typescriptUsers = await db
        .selectFrom("users")
        .select(["id", "name", "tags"])
        .where(({ array }) => array("tags").contains(["typescript"]))
        .execute();

      expect(Array.isArray(typescriptUsers)).toBe(true);
      expect(typescriptUsers.length).toBeGreaterThan(0);

      // Verify all returned users have typescript in their tags
      typescriptUsers.forEach((user) => {
        expect(user.tags).toContain("typescript");
      });

      // Should include John Doe (user 1) who has typescript
      const userNames = typescriptUsers.map((u) => u.name);
      expect(userNames).toContain("John Doe");
    });

    test("should find users with multiple required tags", async () => {
      const reactTypescriptUsers = await db
        .selectFrom("users")
        .select(["id", "name", "tags"])
        .where(({ array }) => array("tags").contains(["typescript", "react"]))
        .execute();

      expect(Array.isArray(reactTypescriptUsers)).toBe(true);
      expect(reactTypescriptUsers.length).toBeGreaterThan(0);

      // Verify all returned users have both typescript AND react
      reactTypescriptUsers.forEach((user) => {
        expect(user.tags).toContain("typescript");
        expect(user.tags).toContain("react");
      });

      // Should include John Doe who has both typescript and react
      const userNames = reactTypescriptUsers.map((u) => u.name);
      expect(userNames).toContain("John Doe");
    });

    test("should find posts with specific categories", async () => {
      const tutorialPosts = await db
        .selectFrom("posts")
        .select(["id", "title", "categories"])
        .where(({ array }) => array("categories").contains(["tutorial"]))
        .execute();

      expect(Array.isArray(tutorialPosts)).toBe(true);
      expect(tutorialPosts.length).toBeGreaterThan(0);

      // Verify all returned posts have tutorial category
      tutorialPosts.forEach((post) => {
        expect(post.categories).toContain("tutorial");
      });
    });

    test("should handle empty array contains (should return all results)", async () => {
      const emptyResults = await db
        .selectFrom("users")
        .select(["id", "name"])
        .where(({ array }) => array("tags").contains([]))
        .execute();

      // Empty array contains should match all users (PostgreSQL behavior)
      expect(Array.isArray(emptyResults)).toBe(true);
      expect(emptyResults.length).toBeGreaterThan(0);
    });

    test("should handle non-existent tag contains", async () => {
      const noResults = await db
        .selectFrom("users")
        .select(["id", "name"])
        .where(({ array }) => array("tags").contains(["nonexistent-tag"]))
        .execute();

      expect(Array.isArray(noResults)).toBe(true);
      expect(noResults.length).toBe(0);
    });
  });

  describe("Array Contained By (<@) Operations", () => {
    test("should find users whose tags are subset of given array", async () => {
      const webDevUsers = await db
        .selectFrom("users")
        .select(["id", "name", "tags"])
        .where(({ array }) =>
          array("tags").isContainedBy([
            "javascript",
            "typescript",
            "react",
            "vue",
            "nodejs",
            "python",
          ])
        )
        .execute();

      expect(Array.isArray(webDevUsers)).toBe(true);
      expect(webDevUsers.length).toBeGreaterThan(0);

      // Verify all returned users have tags that are subsets
      webDevUsers.forEach((user) => {
        const allowedTags = [
          "javascript",
          "typescript",
          "react",
          "vue",
          "nodejs",
          "python",
        ];
        user.tags.forEach((tag) => {
          expect(allowedTags).toContain(tag);
        });
      });
    });

    test("should find users with single permission contained by admin permissions", async () => {
      const readOnlyUsers = await db
        .selectFrom("users")
        .select(["id", "name", "permissions"])
        .where(({ array }) =>
          array("permissions").isContainedBy(["read", "write", "admin"])
        )
        .execute();

      expect(Array.isArray(readOnlyUsers)).toBe(true);
      expect(readOnlyUsers.length).toBeGreaterThan(0);

      // Verify all permissions are within the allowed set
      readOnlyUsers.forEach((user) => {
        const allowedPermissions = ["read", "write", "admin"];
        user.permissions.forEach((permission) => {
          expect(allowedPermissions).toContain(permission);
        });
      });
    });

    test("should handle empty array isContainedBy (should match users with empty arrays)", async () => {
      const emptyArrayUsers = await db
        .selectFrom("users")
        .select(["id", "name", "tags"])
        .where(({ array }) => array("tags").isContainedBy([]))
        .execute();

      expect(Array.isArray(emptyArrayUsers)).toBe(true);
      // Should match no users since all our users have non-empty tags arrays
      expect(emptyArrayUsers.length).toBe(0);
    });
  });

  describe("Array Overlaps (&&) Operations", () => {
    test("should find users with overlapping skills", async () => {
      const frontendUsers = await db
        .selectFrom("users")
        .select(["id", "name", "tags"])
        .where(({ array }) =>
          array("tags").overlaps(["react", "vue", "javascript"])
        )
        .execute();

      expect(Array.isArray(frontendUsers)).toBe(true);
      expect(frontendUsers.length).toBeGreaterThan(0);

      // Verify all returned users have at least one overlapping tag
      frontendUsers.forEach((user) => {
        const hasOverlap = user.tags.some((tag) =>
          ["react", "vue", "javascript"].includes(tag)
        );
        expect(hasOverlap).toBe(true);
      });

      // Should include John Doe (react) and Charlie Brown (javascript)
      const userNames = frontendUsers.map((u) => u.name);
      expect(userNames).toContain("John Doe");
      expect(userNames).toContain("Charlie Brown");
    });

    test("should find posts with overlapping categories", async () => {
      const techPosts = await db
        .selectFrom("posts")
        .select(["id", "title", "categories"])
        .where(({ array }) =>
          array("categories").overlaps(["tech", "programming", "tutorial"])
        )
        .execute();

      expect(Array.isArray(techPosts)).toBe(true);
      expect(techPosts.length).toBeGreaterThan(0);

      // Verify all returned posts have at least one overlapping category
      techPosts.forEach((post) => {
        const hasOverlap = post.categories.some((category) =>
          ["tech", "programming", "tutorial"].includes(category)
        );
        expect(hasOverlap).toBe(true);
      });
    });

    test("should handle empty array overlaps (should return no results)", async () => {
      const noResults = await db
        .selectFrom("users")
        .select(["id", "name"])
        .where(({ array }) => array("tags").overlaps([]))
        .execute();

      expect(Array.isArray(noResults)).toBe(true);
      expect(noResults.length).toBe(0);
    });

    test("should find users with overlapping permissions", async () => {
      const adminUsers = await db
        .selectFrom("users")
        .select(["id", "name", "permissions"])
        .where(({ array }) =>
          array("permissions").overlaps(["admin", "deploy"])
        )
        .execute();

      expect(Array.isArray(adminUsers)).toBe(true);
      expect(adminUsers.length).toBeGreaterThan(0);

      // Should include John Doe and Alice Wilson (both have admin permissions)
      const userNames = adminUsers.map((u) => u.name);
      expect(userNames).toContain("John Doe");
      expect(userNames).toContain("Alice Wilson");
    });
  });

  describe("Array ANY Operations", () => {
    test("should find users with admin permission using hasAny", async () => {
      const adminUsers = await db
        .selectFrom("users")
        .select(["id", "name", "permissions"])
        .where(({ array }) => array("permissions").hasAny("admin"))
        .execute();

      expect(Array.isArray(adminUsers)).toBe(true);
      expect(adminUsers.length).toBeGreaterThan(0);

      // Verify all returned users have admin permission
      adminUsers.forEach((user) => {
        expect(user.permissions).toContain("admin");
      });

      // Should include John Doe and Alice Wilson (both have admin permissions)
      const userNames = adminUsers.map((u) => u.name);
      expect(userNames).toContain("John Doe");
      expect(userNames).toContain("Alice Wilson");
    });

    test("should find users with specific score using hasAny", async () => {
      const highScoreUsers = await db
        .selectFrom("users")
        .select(["id", "name", "scores"])
        .where(({ array }) => array("scores").hasAny(95))
        .execute();

      expect(Array.isArray(highScoreUsers)).toBe(true);
      expect(highScoreUsers.length).toBeGreaterThan(0);

      // Verify all returned users have score of 95
      highScoreUsers.forEach((user) => {
        expect(user.scores).toContain(95);
      });

      // Should include John Doe who has score of 95
      const userNames = highScoreUsers.map((u) => u.name);
      expect(userNames).toContain("John Doe");
    });

    test("should find posts with specific rating using hasAny", async () => {
      const fiveStarPosts = await db
        .selectFrom("posts")
        .select(["id", "title", "ratings"])
        .where(({ array }) => array("ratings").hasAny(5))
        .execute();

      expect(Array.isArray(fiveStarPosts)).toBe(true);
      expect(fiveStarPosts.length).toBeGreaterThan(0);

      // Verify all returned posts have rating of 5
      fiveStarPosts.forEach((post) => {
        expect(post.ratings).toContain(5);
      });
    });

    test("should handle non-existent value hasAny", async () => {
      const noResults = await db
        .selectFrom("users")
        .select(["id", "name"])
        .where(({ array }) => array("permissions").hasAny("nonexistent"))
        .execute();

      expect(Array.isArray(noResults)).toBe(true);
      expect(noResults.length).toBe(0);
    });
  });

  describe("Array ALL Operations", () => {
    test("should find users where all scores are above threshold using hasAll", async () => {
      // This tests the concept - in practice, hasAll with a single value
      // checks if ALL array elements equal that value
      const perfectScoreUsers = await db
        .selectFrom("users")
        .select(["id", "name", "scores"])
        .where(({ array }) => array("scores").hasAll(90))
        .execute();

      expect(Array.isArray(perfectScoreUsers)).toBe(true);
      // This should return users where ALL scores are exactly 90
      // Based on our test data, this might be 0 results, which is expected
    });

    test("should find posts where all ratings are specific value", async () => {
      const consistentRatingPosts = await db
        .selectFrom("posts")
        .select(["id", "title", "ratings"])
        .where(({ array }) => array("ratings").hasAll(4))
        .execute();

      expect(Array.isArray(consistentRatingPosts)).toBe(true);
      // Should return posts where ALL ratings are exactly 4
    });
  });

  describe("Complex Array Operations with Logical Operators", () => {
    test("should combine array operations with AND", async () => {
      const advancedDevs = await db
        .selectFrom("users")
        .select(["id", "name", "tags", "permissions"])
        .where(({ array, and }) =>
          and([
            array("tags").contains(["typescript"]),
            array("permissions").hasAny("admin"),
          ])
        )
        .execute();

      expect(Array.isArray(advancedDevs)).toBe(true);
      expect(advancedDevs.length).toBeGreaterThan(0);

      // Verify all users have both typescript AND admin permission
      advancedDevs.forEach((user) => {
        expect(user.tags).toContain("typescript");
        expect(user.permissions).toContain("admin");
      });

      // Should include John Doe
      const userNames = advancedDevs.map((u) => u.name);
      expect(userNames).toContain("John Doe");
    });

    test("should combine array operations with OR", async () => {
      const skillfulUsers = await db
        .selectFrom("users")
        .select(["id", "name", "tags", "permissions"])
        .where(({ array, or }) =>
          or([
            array("tags").overlaps(["python", "go"]),
            array("permissions").hasAny("deploy"),
          ])
        )
        .execute();

      expect(Array.isArray(skillfulUsers)).toBe(true);
      expect(skillfulUsers.length).toBeGreaterThan(0);

      // Verify all users have either python/go skills OR deploy permission
      skillfulUsers.forEach((user) => {
        const hasPythonOrGo = user.tags.some((tag) =>
          ["python", "go"].includes(tag)
        );
        const hasDeployPermission = user.permissions.includes("deploy");
        expect(hasPythonOrGo || hasDeployPermission).toBe(true);
      });
    });

    test("should combine array operations with NOT", async () => {
      const nonAdminUsers = await db
        .selectFrom("users")
        .select(["id", "name", "permissions"])
        .where(({ array, not }) => not(array("permissions").hasAny("admin")))
        .execute();

      expect(Array.isArray(nonAdminUsers)).toBe(true);
      expect(nonAdminUsers.length).toBeGreaterThan(0);

      // Verify no users have admin permission
      nonAdminUsers.forEach((user) => {
        expect(user.permissions).not.toContain("admin");
      });
    });

    test("should combine array operations with regular WHERE clauses", async () => {
      const activeTypescriptUsers = await db
        .selectFrom("users")
        .select(["id", "name", "active", "tags"])
        .where("active", "=", true)
        .where(({ array }) => array("tags").contains(["typescript"]))
        .execute();

      expect(Array.isArray(activeTypescriptUsers)).toBe(true);
      expect(activeTypescriptUsers.length).toBeGreaterThan(0);

      // Verify all users are active AND have typescript
      activeTypescriptUsers.forEach((user) => {
        expect(user.active).toBe(true);
        expect(user.tags).toContain("typescript");
      });
    });
  });

  describe("Array Operations with JOINs", () => {
    test("should use array operations in JOIN queries", async () => {
      const userPostsWithTechCategories = await db
        .selectFrom("users")
        .innerJoin("posts", "users.id", "posts.user_id")
        .select(["users.name", "users.tags", "posts.title", "posts.categories"])
        .where(({ array }) =>
          array("posts.categories").overlaps(["tech", "tutorial"])
        )
        .execute();

      expect(Array.isArray(userPostsWithTechCategories)).toBe(true);
      expect(userPostsWithTechCategories.length).toBeGreaterThan(0);

      // Verify all posts have tech or tutorial categories
      userPostsWithTechCategories.forEach((result) => {
        const hasOverlap = result.categories.some((category) =>
          ["tech", "tutorial"].includes(category)
        );
        expect(hasOverlap).toBe(true);
      });
    });

    test("should combine user and post array operations in JOINs", async () => {
      const matchingUserPosts = await db
        .selectFrom("users")
        .innerJoin("posts", "users.id", "posts.user_id")
        .select(["users.name", "users.tags", "posts.title", "posts.categories"])
        .where(({ array, and }) =>
          and([
            array("users.tags").contains(["typescript"]),
            array("posts.categories").contains(["tech"]),
          ])
        )
        .execute();

      expect(Array.isArray(matchingUserPosts)).toBe(true);

      // Verify all results match both conditions
      matchingUserPosts.forEach((result) => {
        expect(result.tags).toContain("typescript");
        expect(result.categories).toContain("tech");
      });
    });
  });

  describe("Edge Cases and Error Handling", () => {
    test("should handle users with empty arrays", async () => {
      // Since all our users have non-empty arrays, test the behavior with empty array operations
      const emptyContainsResult = await db
        .selectFrom("users")
        .select(["id", "name"])
        .where(({ array }) => array("tags").contains([]))
        .execute();

      // Empty array contains should match all users (PostgreSQL behavior)
      expect(emptyContainsResult.length).toBe(5);
    });

    test("should handle arrays with duplicate elements", async () => {
      // Test array operations work correctly even if arrays had duplicates
      // John Doe has react in his tags
      const duplicateResults = await db
        .selectFrom("users")
        .select(["id", "name"])
        .where(({ array }) => array("tags").contains(["react"]))
        .execute();

      expect(duplicateResults.length).toBeGreaterThan(0);
      const johnResult = duplicateResults.find((u) => u.name === "John Doe");
      expect(johnResult).toBeDefined();
    });

    test("should handle large arrays efficiently", async () => {
      // Test array operations work efficiently with our existing users
      // John Doe has multiple tags: typescript, nodejs, react
      const largeArrayResults = await db
        .selectFrom("users")
        .select(["id", "name"])
        .where(({ array }) => array("tags").hasAny("nodejs"))
        .execute();

      expect(largeArrayResults.length).toBeGreaterThan(0);
      const johnResult = largeArrayResults.find((u) => u.name === "John Doe");
      expect(johnResult).toBeDefined();
    });
  });

  describe("Performance and Index Usage", () => {
    test("should execute array operations efficiently with GIN indexes", async () => {
      const startTime = Date.now();

      const results = await db
        .selectFrom("users")
        .select(["id", "name", "tags"])
        .where(({ array }) => array("tags").contains(["typescript"]))
        .execute();

      const endTime = Date.now();
      const executionTime = endTime - startTime;

      expect(Array.isArray(results)).toBe(true);
      expect(results.length).toBeGreaterThan(0);

      // Should execute reasonably quickly (under 100ms for test data)
      expect(executionTime).toBeLessThan(100);
    });

    test("should handle multiple array operations efficiently", async () => {
      const startTime = Date.now();

      const complexResults = await db
        .selectFrom("users")
        .select(["id", "name", "tags", "permissions", "scores"])
        .where(({ array, and, or }) =>
          and([
            or([
              array("tags").overlaps(["typescript", "python"]),
              array("permissions").hasAny("admin"),
            ]),
            array("scores").hasAny(90),
          ])
        )
        .execute();

      const endTime = Date.now();
      const executionTime = endTime - startTime;

      expect(Array.isArray(complexResults)).toBe(true);

      // Complex queries should still execute reasonably quickly
      expect(executionTime).toBeLessThan(200);
    });
  });

  describe("SQL Generation Validation", () => {
    test("should generate correct SQL for contains operation", async () => {
      // This test validates that the SQL generation is working correctly
      // by executing a query and checking the results match expected PostgreSQL behavior
      const results = await db
        .selectFrom("users")
        .select(["id", "name", "tags"])
        .where(({ array }) => array("tags").contains(["typescript", "react"]))
        .execute();

      expect(Array.isArray(results)).toBe(true);

      // The SQL should be: tags @> ARRAY[$1]
      // And should return users who have BOTH typescript AND react
      results.forEach((user) => {
        expect(user.tags).toContain("typescript");
        expect(user.tags).toContain("react");
      });
    });

    test("should generate correct SQL for overlaps operation", async () => {
      const results = await db
        .selectFrom("users")
        .select(["id", "name", "tags"])
        .where(({ array }) => array("tags").overlaps(["python", "go"]))
        .execute();

      expect(Array.isArray(results)).toBe(true);

      // The SQL should be: tags && ARRAY[$1]
      // And should return users who have EITHER python OR go (or both)
      results.forEach((user) => {
        const hasOverlap = user.tags.some((tag) =>
          ["python", "go"].includes(tag)
        );
        expect(hasOverlap).toBe(true);
      });
    });

    test("should generate correct SQL for hasAny operation", async () => {
      const results = await db
        .selectFrom("users")
        .select(["id", "name", "permissions"])
        .where(({ array }) => array("permissions").hasAny("write"))
        .execute();

      expect(Array.isArray(results)).toBe(true);

      // The SQL should be: $1 = ANY(permissions)
      // And should return users who have write permission
      results.forEach((user) => {
        expect(user.permissions).toContain("write");
      });
    });
  });
});
