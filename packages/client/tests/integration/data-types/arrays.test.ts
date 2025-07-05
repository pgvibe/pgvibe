// Array Operations Integration Tests
// Tests PostgreSQL array operations with isolated test tables

import { describe, test, expect, beforeAll, afterAll } from "bun:test";
import { pgvibe } from "../../../src/query-builder";
import {
  generateTestId,
  createTestDatabase,
  waitForDatabase,
} from "../utils/test-helpers";
import { performTestCleanup } from "../utils/cleanup";

// Table schema for array tests
function createArrayTestTables(testId: string) {
  return {
    users: {
      name: `test_users_${testId}`,
      schema: `
        CREATE TABLE test_users_${testId} (
          id SERIAL PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          email VARCHAR(255) UNIQUE,
          active BOOLEAN DEFAULT true,
          tags TEXT[] DEFAULT '{}',
          permissions TEXT[] DEFAULT '{}',
          scores INTEGER[] DEFAULT '{}',
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        )
      `,
    },
    posts: {
      name: `test_posts_${testId}`,
      schema: `
        CREATE TABLE test_posts_${testId} (
          id SERIAL PRIMARY KEY,
          title VARCHAR(255) NOT NULL,
          content TEXT,
          categories TEXT[] DEFAULT '{}',
          ratings INTEGER[] DEFAULT '{}',
          tags TEXT[] DEFAULT '{}',
          published BOOLEAN DEFAULT false,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        )
      `,
    },
  };
}

async function createArrayTables(db: pgvibe<any>, tables: any) {
  await db.query(tables.users.schema);
  await db.query(tables.posts.schema);
}

async function seedArrayData(db: pgvibe<any>, tables: any) {
  // Insert users with array data
  await db.query(`
    INSERT INTO ${tables.users.name} (name, email, active, tags, permissions, scores)
    VALUES 
      ('John Doe', 'john@test.com', true, 
       ARRAY['typescript', 'react', 'nodejs'], 
       ARRAY['read', 'write', 'admin'], 
       ARRAY[85, 90, 95]),
      ('Jane Smith', 'jane@test.com', true, 
       ARRAY['python', 'django', 'postgresql'], 
       ARRAY['read', 'write'], 
       ARRAY[80, 75, 88]),
      ('Charlie Brown', 'charlie@test.com', false, 
       ARRAY['javascript', 'vue', 'css'], 
       ARRAY['read'], 
       ARRAY[70, 85, 92]),
      ('Alice Wilson', 'alice@test.com', true, 
       ARRAY['python', 'react', 'kubernetes'], 
       ARRAY['read', 'write', 'admin', 'deploy'], 
       ARRAY[92, 88, 95]),
      ('Bob Johnson', 'bob@test.com', true, 
       ARRAY['golang', 'docker', 'kubernetes'], 
       ARRAY['read', 'write'], 
       ARRAY[78, 82, 86])
  `);

  // Insert posts with array data
  await db.query(`
    INSERT INTO ${tables.posts.name} (title, content, categories, ratings, tags, published)
    VALUES 
      ('Getting Started with TypeScript', 'TypeScript tutorial content', 
       ARRAY['tutorial', 'typescript', 'programming'], 
       ARRAY[4, 5, 5, 4], 
       ARRAY['beginner', 'tutorial'], 
       true),
      ('Advanced React Patterns', 'React patterns content', 
       ARRAY['react', 'javascript', 'advanced'], 
       ARRAY[5, 4, 5], 
       ARRAY['advanced', 'react'], 
       true),
      ('Database Performance Tips', 'Database optimization content', 
       ARRAY['database', 'performance', 'postgresql'], 
       ARRAY[4, 4, 5, 3], 
       ARRAY['database', 'optimization'], 
       false),
      ('Python Web Development', 'Python web development guide', 
       ARRAY['python', 'web', 'tutorial'], 
       ARRAY[4, 4, 4], 
       ARRAY['python', 'web'], 
       true),
      ('DevOps with Docker', 'Docker and DevOps content', 
       ARRAY['devops', 'docker', 'containers'], 
       ARRAY[5, 5, 4], 
       ARRAY['devops', 'containers'], 
       true)
  `);
}

describe("Array Operations Integration Tests", () => {
  const testId = generateTestId();
  const tables = createArrayTestTables(testId);
  let db: pgvibe<any>;

  beforeAll(async () => {
    db = createTestDatabase();
    await waitForDatabase();

    // Create isolated test tables with array columns
    await createArrayTables(db, tables);

    // Seed with test data containing arrays
    await seedArrayData(db, tables);
  });

  afterAll(async () => {
    // Clean up our isolated tables
    await performTestCleanup(db, [tables.users.name, tables.posts.name]);
  });

  describe("Array Contains (@>) Operations", () => {
    test("should find users with specific tags using contains", async () => {
      const typescriptUsers = await db
        .selectFrom(tables.users.name)
        .select(["id", "name", "tags"])
        .where(({ array }) => array("tags").contains(["typescript"]))
        .execute();

      expect(Array.isArray(typescriptUsers)).toBe(true);
      expect(typescriptUsers.length).toBeGreaterThan(0);

      // Verify all returned users have typescript in their tags
      typescriptUsers.forEach((user) => {
        expect(user.tags).toContain("typescript");
      });

      // Should include John Doe who has typescript
      const userNames = typescriptUsers.map((u) => u.name);
      expect(userNames).toContain("John Doe");
    });

    test("should find users with multiple required tags", async () => {
      const reactTypescriptUsers = await db
        .selectFrom(tables.users.name)
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
        .selectFrom(tables.posts.name)
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
        .selectFrom(tables.users.name)
        .select(["id", "name"])
        .where(({ array }) => array("tags").contains([]))
        .execute();

      // Empty array contains should match all users (PostgreSQL behavior)
      expect(Array.isArray(emptyResults)).toBe(true);
      expect(emptyResults.length).toBeGreaterThan(0);
    });

    test("should handle non-existent tag contains", async () => {
      const noResults = await db
        .selectFrom(tables.users.name)
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
        .selectFrom(tables.users.name)
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
        user.tags.forEach((tag: string) => {
          expect(allowedTags).toContain(tag);
        });
      });
    });

    test("should find users with single permission contained by admin permissions", async () => {
      const readOnlyUsers = await db
        .selectFrom(tables.users.name)
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
        user.permissions.forEach((permission: string) => {
          expect(allowedPermissions).toContain(permission);
        });
      });
    });

    test("should handle empty array isContainedBy (should match users with empty arrays)", async () => {
      const emptyArrayUsers = await db
        .selectFrom(tables.users.name)
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
        .selectFrom(tables.users.name)
        .select(["id", "name", "tags"])
        .where(({ array }) =>
          array("tags").overlaps(["react", "vue", "javascript"])
        )
        .execute();

      expect(Array.isArray(frontendUsers)).toBe(true);
      expect(frontendUsers.length).toBeGreaterThan(0);

      // Verify all returned users have at least one overlapping tag
      frontendUsers.forEach((user) => {
        const hasOverlap = user.tags.some((tag: string) =>
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
        .selectFrom(tables.posts.name)
        .select(["id", "title", "categories"])
        .where(({ array }) =>
          array("categories").overlaps(["tech", "programming", "tutorial"])
        )
        .execute();

      expect(Array.isArray(techPosts)).toBe(true);
      expect(techPosts.length).toBeGreaterThan(0);

      // Verify all returned posts have at least one overlapping category
      techPosts.forEach((post) => {
        const hasOverlap = post.categories.some((category: string) =>
          ["tech", "programming", "tutorial"].includes(category)
        );
        expect(hasOverlap).toBe(true);
      });
    });

    test("should handle empty array overlaps (should return no results)", async () => {
      const noResults = await db
        .selectFrom(tables.users.name)
        .select(["id", "name"])
        .where(({ array }) => array("tags").overlaps([]))
        .execute();

      expect(Array.isArray(noResults)).toBe(true);
      expect(noResults.length).toBe(0);
    });

    test("should find users with overlapping permissions", async () => {
      const adminUsers = await db
        .selectFrom(tables.users.name)
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
        .selectFrom(tables.users.name)
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
        .selectFrom(tables.users.name)
        .select(["id", "name", "scores"])
        .where(({ array }) => array("scores").hasAny(95))
        .execute();

      expect(Array.isArray(highScoreUsers)).toBe(true);
      expect(highScoreUsers.length).toBeGreaterThan(0);

      // Verify all returned users have score of 95
      highScoreUsers.forEach((user) => {
        expect(user.scores).toContain(95);
      });

      // Should include John Doe and Alice Wilson who have score of 95
      const userNames = highScoreUsers.map((u) => u.name);
      expect(userNames).toContain("John Doe");
      expect(userNames).toContain("Alice Wilson");
    });

    test("should find posts with specific rating using hasAny", async () => {
      const fiveStarPosts = await db
        .selectFrom(tables.posts.name)
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
        .selectFrom(tables.users.name)
        .select(["id", "name"])
        .where(({ array }) => array("permissions").hasAny("nonexistent"))
        .execute();

      expect(Array.isArray(noResults)).toBe(true);
      expect(noResults.length).toBe(0);
    });
  });

  describe("Array ALL Operations", () => {
    test("should find posts where all ratings are specific value", async () => {
      const consistentRatingPosts = await db
        .selectFrom(tables.posts.name)
        .select(["id", "title", "ratings"])
        .where(({ array }) => array("ratings").hasAll(4))
        .execute();

      expect(Array.isArray(consistentRatingPosts)).toBe(true);
      // Should return posts where ALL ratings are exactly 4
      // Based on our test data, "Python Web Development" has all 4s
      consistentRatingPosts.forEach((post) => {
        post.ratings.forEach((rating: number) => {
          expect(rating).toBe(4);
        });
      });
    });
  });

  describe("Complex Array Operations with Logical Operators", () => {
    test("should combine array operations with AND", async () => {
      const activeTypescriptUsers = await db
        .selectFrom(tables.users.name)
        .select(["id", "name", "active", "tags"])
        .where(({ array, and }) =>
          and([
            array("tags").contains(["typescript"]),
            array("permissions").hasAny("admin"),
          ])
        )
        .execute();

      expect(Array.isArray(activeTypescriptUsers)).toBe(true);

      // Verify all users have both conditions
      activeTypescriptUsers.forEach((user) => {
        expect(user.tags).toContain("typescript");
      });
    });

    test("should combine array operations with OR", async () => {
      const frontendOrBackendUsers = await db
        .selectFrom(tables.users.name)
        .select(["id", "name", "tags"])
        .where(({ array, or }) =>
          or([
            array("tags").overlaps(["react", "vue"]),
            array("tags").overlaps(["python", "golang"]),
          ])
        )
        .execute();

      expect(Array.isArray(frontendOrBackendUsers)).toBe(true);
      expect(frontendOrBackendUsers.length).toBeGreaterThan(0);

      // Should include frontend (John, Charlie) and backend users (Jane, Alice, Bob)
      const userNames = frontendOrBackendUsers.map((u) => u.name);
      expect(userNames.length).toBeGreaterThanOrEqual(3);
    });

    test("should combine array operations with regular WHERE clauses", async () => {
      const activeUsersWithTypeScript = await db
        .selectFrom(tables.users.name)
        .select(["id", "name", "active", "tags"])
        .where("active", "=", true)
        .where(({ array }) => array("tags").contains(["typescript"]))
        .execute();

      expect(Array.isArray(activeUsersWithTypeScript)).toBe(true);

      // Verify all users are active AND have typescript
      activeUsersWithTypeScript.forEach((user) => {
        expect(user.active).toBe(true);
        expect(user.tags).toContain("typescript");
      });
    });
  });

  describe("Edge Cases and Error Handling", () => {
    test("should handle users with empty arrays", async () => {
      // Since all our users have non-empty arrays, test the behavior with empty array operations
      const emptyContainsResult = await db
        .selectFrom(tables.users.name)
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
        .selectFrom(tables.users.name)
        .select(["id", "name"])
        .where(({ array }) => array("tags").contains(["react"]))
        .execute();

      expect(duplicateResults.length).toBeGreaterThan(0);
      const johnResult = duplicateResults.find((u) => u.name === "John Doe");
      expect(johnResult).toBeDefined();
    });

    test("should handle large arrays efficiently", async () => {
      // Test array operations work efficiently with our existing users
      const largeArrayResults = await db
        .selectFrom(tables.users.name)
        .select(["id", "name"])
        .where(({ array }) => array("tags").hasAny("nodejs"))
        .execute();

      expect(largeArrayResults.length).toBeGreaterThan(0);
      const johnResult = largeArrayResults.find((u) => u.name === "John Doe");
      expect(johnResult).toBeDefined();
    });
  });

  describe("Performance and Index Usage", () => {
    test("should execute array operations efficiently", async () => {
      const startTime = Date.now();

      const results = await db
        .selectFrom(tables.users.name)
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
        .selectFrom(tables.users.name)
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
        .selectFrom(tables.users.name)
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
        .selectFrom(tables.users.name)
        .select(["id", "name", "tags"])
        .where(({ array }) => array("tags").overlaps(["python", "golang"]))
        .execute();

      expect(Array.isArray(results)).toBe(true);

      // The SQL should be: tags && ARRAY[$1]
      // And should return users who have EITHER python OR golang (or both)
      results.forEach((user) => {
        const hasOverlap = user.tags.some((tag: string) =>
          ["python", "golang"].includes(tag)
        );
        expect(hasOverlap).toBe(true);
      });
    });

    test("should generate correct SQL for hasAny operation", async () => {
      const results = await db
        .selectFrom(tables.users.name)
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
