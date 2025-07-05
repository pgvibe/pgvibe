// Comprehensive Alias Operations Tests
// Consolidated test suite for all table alias functionality in pgvibe

import { describe, test, expect, beforeAll, afterAll } from "bun:test";
import { pgvibe } from "../../../src/query-builder";
import type {
  Database,
  GetColumnReferences,
} from "../../../src/core/shared-types";
import {
  generateTestId,
  createTestDatabase,
  waitForDatabase,
} from "../../integration/utils/test-helpers";
import { performTestCleanup } from "../../integration/utils/cleanup";

// Test table schema for alias operations
function createAliasTestTables(testId: string) {
  return {
    users: {
      name: `test_users_${testId}`,
      schema: `
        CREATE TABLE test_users_${testId} (
          id SERIAL PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          email VARCHAR(255) UNIQUE,
          active BOOLEAN DEFAULT true,
          role VARCHAR(50) DEFAULT 'user',
          score INTEGER DEFAULT 0,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        )
      `,
    },
    posts: {
      name: `test_posts_${testId}`,
      schema: `
        CREATE TABLE test_posts_${testId} (
          id SERIAL PRIMARY KEY,
          user_id INTEGER REFERENCES test_users_${testId}(id) ON DELETE CASCADE,
          title VARCHAR(255) NOT NULL,
          content TEXT,
          published BOOLEAN DEFAULT false,
          views INTEGER DEFAULT 0,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        )
      `,
    },
    comments: {
      name: `test_comments_${testId}`,
      schema: `
        CREATE TABLE test_comments_${testId} (
          id SERIAL PRIMARY KEY,
          user_id INTEGER REFERENCES test_users_${testId}(id) ON DELETE CASCADE,
          post_id INTEGER REFERENCES test_posts_${testId}(id) ON DELETE CASCADE,
          content TEXT NOT NULL,
          approved BOOLEAN DEFAULT false,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        )
      `,
    },
  };
}

async function createAliasDbTables(db: pgvibe<any>, tables: any) {
  await db.query(tables.users.schema);
  await db.query(tables.posts.schema);
  await db.query(tables.comments.schema);
}

async function seedAliasTestData(db: pgvibe<any>, tables: any) {
  // Insert test users
  await db.query(`
    INSERT INTO ${tables.users.name} (name, email, active, role, score)
    VALUES 
      ('John Doe', 'john@test.com', true, 'user', 85),
      ('Jane Smith', 'jane@test.com', false, 'admin', 92),
      ('Bob Wilson', 'bob@test.com', true, 'user', 78),
      ('Alice Johnson', 'alice@test.com', true, 'moderator', 88)
  `);

  // Insert test posts
  await db.query(`
    INSERT INTO ${tables.posts.name} (user_id, title, content, published, views)
    VALUES 
      (1, 'First Post', 'Content of first post', true, 150),
      (2, 'Second Post', 'Content of second post', false, 45),
      (1, 'Third Post', 'Content of third post', true, 280),
      (3, 'Fourth Post', 'Content of fourth post', true, 95)
  `);

  // Insert test comments
  await db.query(`
    INSERT INTO ${tables.comments.name} (user_id, post_id, content, approved)
    VALUES 
      (2, 1, 'Great post!', true),
      (3, 1, 'Nice content', false),
      (4, 2, 'Interesting read', true),
      (1, 3, 'Thanks for sharing', true)
  `);
}

describe("Comprehensive Alias Operations", () => {
  let db: pgvibe<any>;
  let tables: any;
  const testId = generateTestId();

  beforeAll(async () => {
    await waitForDatabase();
    db = createTestDatabase();
    tables = createAliasTestTables(testId);
    await createAliasDbTables(db, tables);
    await seedAliasTestData(db, tables);
  });

  afterAll(async () => {
    if (db) {
      await performTestCleanup(db, [
        tables.comments.name,
        tables.posts.name,
        tables.users.name,
      ]);
      await db.destroy();
    }
  });

  describe("Basic Alias Support", () => {
    test("should create query builders for normal table expressions", () => {
      const query = db.selectFrom(tables.users.name);
      expect(query).toBeDefined();
    });

    test("should create query builders for aliased table expressions", () => {
      const query = db.selectFrom(`${tables.users.name} as u`);
      expect(query).toBeDefined();
    });

    test("should create query builders for different tables with aliases", () => {
      const usersQuery = db.selectFrom(`${tables.users.name} as u`);
      const postsQuery = db.selectFrom(`${tables.posts.name} as p`);
      const commentsQuery = db.selectFrom(`${tables.comments.name} as c`);

      expect(usersQuery).toBeDefined();
      expect(postsQuery).toBeDefined();
      expect(commentsQuery).toBeDefined();
    });

    test("should support basic select with aliases", () => {
      const query = db.selectFrom(`${tables.users.name} as u`);
      const selectedQuery = query.select(["id", "name", "email"]);
      expect(selectedQuery).toBeDefined();
    });

    test("should support selectAll with aliases", () => {
      const query = db.selectFrom(`${tables.users.name} as u`);
      const selectedQuery = query.selectAll();
      expect(selectedQuery).toBeDefined();
    });
  });

  describe("Table Expression Parsing", () => {
    test("should parse table expressions correctly", () => {
      const {
        parseTableExpression,
      } = require("../../../src/core/shared-types");

      const parsed1 = parseTableExpression(`${tables.users.name} as u`);
      expect(parsed1.table).toBe(tables.users.name);
      expect(parsed1.alias).toBe("u");

      const parsed2 = parseTableExpression(tables.users.name);
      expect(parsed2.table).toBe(tables.users.name);
      expect(parsed2.alias).toBeUndefined();

      const parsed3 = parseTableExpression(`${tables.posts.name} as p`);
      expect(parsed3.table).toBe(tables.posts.name);
      expect(parsed3.alias).toBe("p");
    });

    test("should parse column expressions correctly", () => {
      const {
        parseColumnExpression,
      } = require("../../../src/core/shared-types");

      const parsed1 = parseColumnExpression("name as user_name");
      expect(parsed1.column).toBe("name");
      expect(parsed1.alias).toBe("user_name");

      const parsed2 = parseColumnExpression("email");
      expect(parsed2.column).toBe("email");
      expect(parsed2.alias).toBeUndefined();
    });
  });

  describe("SQL Generation with Aliases", () => {
    test("should generate correct SQL for table aliases", () => {
      const query = db
        .selectFrom(`${tables.users.name} as u`)
        .select(["id", "name"]);
      const compiled = query.toSQL();

      expect(compiled.sql).toContain(`FROM ${tables.users.name} AS u`);
      expect(compiled.sql).toContain("id");
      expect(compiled.sql).toContain("name");
    });

    test("should generate correct SQL for different table aliases", () => {
      const query1 = db
        .selectFrom(`${tables.users.name} as users_alias`)
        .select(["id"]);
      const query2 = db
        .selectFrom(`${tables.posts.name} as posts_alias`)
        .select(["title"]);

      const compiled1 = query1.toSQL();
      const compiled2 = query2.toSQL();

      expect(compiled1.sql).toContain(
        `FROM ${tables.users.name} AS users_alias`
      );
      expect(compiled2.sql).toContain(
        `FROM ${tables.posts.name} AS posts_alias`
      );
    });

    test("should handle tables without aliases", () => {
      const query = db.selectFrom(tables.users.name).select(["id", "name"]);
      const compiled = query.toSQL();

      expect(compiled.sql).toContain(`FROM ${tables.users.name}`);
      expect(compiled.sql).not.toContain(" AS ");
    });
  });

  describe("Column References with Aliases", () => {
    test("should support qualified column references with aliases", () => {
      const query = db.selectFrom(`${tables.users.name} as u`);
      const qualified = query.select(["u.id", "u.name", "u.email"]);
      expect(qualified).toBeDefined();

      const compiled = qualified.toSQL();
      expect(compiled.sql).toContain(`FROM ${tables.users.name} AS u`);
    });

    test("should support unqualified column references with aliases", () => {
      const query = db.selectFrom(`${tables.users.name} as u`);
      const unqualified = query.select(["id", "name", "email"]);
      expect(unqualified).toBeDefined();

      const compiled = unqualified.toSQL();
      expect(compiled.sql).toContain(`FROM ${tables.users.name} AS u`);
    });

    test("should support mixed qualified and unqualified column references", () => {
      const query = db.selectFrom(`${tables.users.name} as u`);
      const mixed = query.select(["u.id", "name", "u.email", "active"]);
      expect(mixed).toBeDefined();

      const compiled = mixed.toSQL();
      expect(compiled.sql).toContain(`FROM ${tables.users.name} AS u`);
    });

    test("should handle selectAll with aliases", () => {
      const query = db.selectFrom(`${tables.users.name} as u`);
      const selectAll = query.selectAll();
      expect(selectAll).toBeDefined();

      const compiled = selectAll.toSQL();
      expect(compiled.sql).toContain(`FROM ${tables.users.name} AS u`);
      expect(compiled.sql).toContain("SELECT *");
    });
  });

  describe("Alias Exclusivity", () => {
    test("should allow both qualified and unqualified when NO alias", () => {
      const query = db.selectFrom(tables.users.name);

      const qualifiedColumns = query.select([
        `${tables.users.name}.id`,
        `${tables.users.name}.name`,
      ]);
      expect(qualifiedColumns).toBeDefined();

      const unqualifiedColumns = query.select(["id", "name"]);
      expect(unqualifiedColumns).toBeDefined();

      const mixedColumns = query.select([
        `${tables.users.name}.id`,
        "name",
        `${tables.users.name}.email`,
      ]);
      expect(mixedColumns).toBeDefined();
    });

    test("should show the difference in generated SQL", () => {
      // With alias - should use alias in SQL
      const aliasQuery = db
        .selectFrom(`${tables.users.name} as u`)
        .select(["u.id", "name"]);
      const aliasSQL = aliasQuery.toSQL();

      // Without alias - should use table name in SQL
      const noAliasQuery = db
        .selectFrom(tables.users.name)
        .select([`${tables.users.name}.id`, "name"]);
      const noAliasSQL = noAliasQuery.toSQL();

      // Verify the difference
      expect(aliasSQL.sql).toContain(`FROM ${tables.users.name} AS u`);
      expect(noAliasSQL.sql).toContain(`FROM ${tables.users.name}`);
      expect(noAliasSQL.sql).not.toContain("AS u");
    });
  });

  describe("JOIN Operations with Aliases", () => {
    test("should support INNER JOIN with aliases", () => {
      const query = db
        .selectFrom(`${tables.users.name} as u`)
        .innerJoin(`${tables.posts.name} as p`, "u.id", "p.user_id")
        .select(["u.name", "p.title"]);

      const compiled = query.toSQL();
      expect(compiled.sql).toContain(`FROM ${tables.users.name} AS u`);
      expect(compiled.sql).toContain(`INNER JOIN ${tables.posts.name} AS p`);
      expect(compiled.sql).toContain("ON u.id = p.user_id");
    });

    test("should support LEFT JOIN with aliases", () => {
      const query = db
        .selectFrom(`${tables.users.name} as u`)
        .leftJoin(`${tables.posts.name} as p`, "u.id", "p.user_id")
        .select(["u.name", "p.title"]);

      const compiled = query.toSQL();
      expect(compiled.sql).toContain(`FROM ${tables.users.name} AS u`);
      expect(compiled.sql).toContain(`LEFT JOIN ${tables.posts.name} AS p`);
      expect(compiled.sql).toContain("ON u.id = p.user_id");
    });

    test("should support multiple JOINs with aliases", () => {
      const query = db
        .selectFrom(`${tables.users.name} as u`)
        .innerJoin(`${tables.posts.name} as p`, "u.id", "p.user_id")
        .innerJoin(`${tables.comments.name} as c`, "p.id", "c.post_id")
        .select(["u.name", "p.title", "c.content"]);

      const compiled = query.toSQL();
      expect(compiled.sql).toContain(`FROM ${tables.users.name} AS u`);
      expect(compiled.sql).toContain(`INNER JOIN ${tables.posts.name} AS p`);
      expect(compiled.sql).toContain(`INNER JOIN ${tables.comments.name} AS c`);
      expect(compiled.sql).toContain("ON u.id = p.user_id");
      expect(compiled.sql).toContain("ON p.id = c.post_id");
    });
  });

  describe("WHERE Clauses with Aliases", () => {
    test("should support WHERE with alias-qualified columns", () => {
      const query = db
        .selectFrom(`${tables.users.name} as u`)
        .select(["u.id", "u.name"])
        .where("u.active", "=", true);

      const compiled = query.toSQL();
      expect(compiled.sql).toContain(`FROM ${tables.users.name} AS u`);
      expect(compiled.sql).toContain("WHERE u.active = $1");
      expect(compiled.parameters).toEqual([true]);
    });

    test("should support WHERE with unqualified columns", () => {
      const query = db
        .selectFrom(`${tables.users.name} as u`)
        .select(["id", "name"])
        .where("active", "=", true);

      const compiled = query.toSQL();
      expect(compiled.sql).toContain(`FROM ${tables.users.name} AS u`);
      expect(compiled.sql).toContain("WHERE u.active = $1");
      expect(compiled.parameters).toEqual([true]);
    });

    test("should support complex WHERE with aliases", () => {
      const query = db
        .selectFrom(`${tables.users.name} as u`)
        .select(["u.id", "u.name"])
        .where("u.active", "=", true)
        .where("u.score", ">", 80);

      const compiled = query.toSQL();
      expect(compiled.sql).toContain(`FROM ${tables.users.name} AS u`);
      expect(compiled.sql).toContain("WHERE u.active = $1 AND u.score > $2");
      expect(compiled.parameters).toEqual([true, 80]);
    });
  });

  describe("ORDER BY with Aliases", () => {
    test("should support ORDER BY with alias-qualified columns", () => {
      const query = db
        .selectFrom(`${tables.users.name} as u`)
        .select(["u.id", "u.name"])
        .orderBy("u.name", "asc");

      const compiled = query.toSQL();
      expect(compiled.sql).toContain(`FROM ${tables.users.name} AS u`);
      expect(compiled.sql).toContain("ORDER BY u.name ASC");
    });

    test("should support ORDER BY with unqualified columns", () => {
      const query = db
        .selectFrom(`${tables.users.name} as u`)
        .select(["id", "name"])
        .orderBy("name", "desc");

      const compiled = query.toSQL();
      expect(compiled.sql).toContain(`FROM ${tables.users.name} AS u`);
      expect(compiled.sql).toContain("ORDER BY name DESC");
    });

    test("should support multiple ORDER BY clauses with aliases", () => {
      const query = db
        .selectFrom(`${tables.users.name} as u`)
        .select(["u.id", "u.name", "u.score"])
        .orderBy("u.score", "desc")
        .orderBy("u.name", "asc");

      const compiled = query.toSQL();
      expect(compiled.sql).toContain(`FROM ${tables.users.name} AS u`);
      expect(compiled.sql).toContain("ORDER BY u.score DESC, u.name ASC");
    });
  });

  describe("Database Execution with Aliases", () => {
    test("should execute basic SELECT with alias", async () => {
      const result = await db
        .selectFrom(`${tables.users.name} as u`)
        .select(["u.id", "u.name"])
        .where("u.active", "=", true)
        .execute();

      expect(result).toHaveLength(3); // John, Bob, Alice
      expect(result[0]).toHaveProperty("id");
      expect(result[0]).toHaveProperty("name");
      expect(result.every((user) => typeof user.id === "number")).toBe(true);
      expect(result.every((user) => typeof user.name === "string")).toBe(true);
    });

    test("should execute SELECT with unqualified columns", async () => {
      const result = await db
        .selectFrom(`${tables.users.name} as u`)
        .select(["id", "name", "email"])
        .where("active", "=", true)
        .execute();

      expect(result).toHaveLength(3); // John, Bob, Alice
      expect(result[0]).toHaveProperty("id");
      expect(result[0]).toHaveProperty("name");
      expect(result[0]).toHaveProperty("email");
    });

    test("should execute JOIN with aliases", async () => {
      const result = await db
        .selectFrom(`${tables.users.name} as u`)
        .innerJoin(`${tables.posts.name} as p`, "u.id", "p.user_id")
        .select(["u.name", "p.title"])
        .where("p.published", "=", true)
        .execute();

      expect(result.length).toBeGreaterThan(0);
      expect(result[0]).toHaveProperty("name");
      expect(result[0]).toHaveProperty("title");
      expect(result.every((row) => typeof row.name === "string")).toBe(true);
      expect(result.every((row) => typeof row.title === "string")).toBe(true);
    });

    test("should execute complex query with multiple aliases", async () => {
      const result = await db
        .selectFrom(`${tables.users.name} as u`)
        .innerJoin(`${tables.posts.name} as p`, "u.id", "p.user_id")
        .innerJoin(`${tables.comments.name} as c`, "p.id", "c.post_id")
        .select(["u.name", "p.title", "c.content"])
        .where("c.approved", "=", true)
        .orderBy("u.name", "asc")
        .execute();

      expect(result.length).toBeGreaterThan(0);
      expect(result[0]).toHaveProperty("name");
      expect(result[0]).toHaveProperty("title");
      expect(result[0]).toHaveProperty("content");
    });
  });

  describe("INSERT Operations with Aliases", () => {
    test("should support INSERT with table alias", async () => {
      const result = await db
        .insertInto(`${tables.users.name} as u`)
        .values({
          name: "Test User",
          email: "test@example.com",
          active: true,
        })
        .returning(["id", "name"])
        .execute();

      expect(result).toHaveLength(1);
      expect(result[0]).toHaveProperty("id");
      expect(result[0]).toHaveProperty("name", "Test User");
    });

    test("should support INSERT with alias-qualified RETURNING", async () => {
      const result = await db
        .insertInto(`${tables.users.name} as u`)
        .values({
          name: "Alias Test User",
          email: "alias@example.com",
          active: false,
        })
        .returning(["u.id", "u.name", "u.active"])
        .execute();

      expect(result).toHaveLength(1);
      expect(result[0]).toHaveProperty("id");
      expect(result[0]).toHaveProperty("name", "Alias Test User");
      expect(result[0]).toHaveProperty("active", false);
    });

    test("should support bulk INSERT with aliases", async () => {
      const result = await db
        .insertInto(`${tables.users.name} as u`)
        .values([
          {
            name: "Bulk User 1",
            email: "bulk1@example.com",
          },
          {
            name: "Bulk User 2",
            email: "bulk2@example.com",
          },
        ])
        .returning(["u.id", "u.name"])
        .execute();

      expect(result).toHaveLength(2);
      expect(result[0]).toHaveProperty("name", "Bulk User 1");
      expect(result[1]).toHaveProperty("name", "Bulk User 2");
    });
  });

  describe("Column Aliases in SELECT", () => {
    test("should support column aliases with single table", () => {
      const query = db
        .selectFrom(`${tables.users.name} as u`)
        .select(["u.id", "u.name as user_name", "u.email as user_email"]);

      const compiled = query.toSQL();
      expect(compiled.sql).toContain("u.name AS user_name");
      expect(compiled.sql).toContain("u.email AS user_email");
    });

    test("should support mixed aliased and non-aliased columns", () => {
      const query = db.selectFrom(`${tables.users.name} as u`).select([
        "u.id",
        "u.name as user_name",
        "u.email", // No alias
        "u.active as is_active",
      ]);

      const compiled = query.toSQL();
      expect(compiled.sql).toContain("u.name AS user_name");
      expect(compiled.sql).toContain("u.email");
      expect(compiled.sql).not.toContain("u.email AS");
      expect(compiled.sql).toContain("u.active AS is_active");
    });

    test("should execute SELECT with column aliases", async () => {
      const result = await db
        .selectFrom(`${tables.users.name} as u`)
        .select(["u.id", "u.name as user_name", "u.email as user_email"])
        .where("u.active", "=", true)
        .limit(1)
        .execute();

      expect(result).toHaveLength(1);
      expect(result[0]).toHaveProperty("id");
      expect(result[0]).toHaveProperty("user_name");
      expect(result[0]).toHaveProperty("user_email");
      expect(result[0]).not.toHaveProperty("name");
      expect(result[0]).not.toHaveProperty("email");
    });
  });

  describe("Method Chaining with Aliases", () => {
    test("should allow method chaining with aliases", () => {
      const query = db
        .selectFrom(`${tables.users.name} as u`)
        .select(["u.id", "u.name"])
        .where("u.active", "=", true)
        .orderBy("u.name", "asc")
        .limit(10)
        .offset(5);

      expect(query).toBeDefined();
      const compiled = query.toSQL();
      expect(compiled.sql).toContain(`FROM ${tables.users.name} AS u`);
      expect(compiled.sql).toContain("WHERE u.active = $1");
      expect(compiled.sql).toContain("ORDER BY u.name ASC");
      expect(compiled.sql).toContain("LIMIT 10");
      expect(compiled.sql).toContain("OFFSET 5");
    });

    test("should support complex method chaining with JOINs", () => {
      const query = db
        .selectFrom(`${tables.users.name} as u`)
        .innerJoin(`${tables.posts.name} as p`, "u.id", "p.user_id")
        .select(["u.name", "p.title", "p.views"])
        .where("u.active", "=", true)
        .where("p.published", "=", true)
        .orderBy("p.views", "desc")
        .limit(5);

      expect(query).toBeDefined();
      const compiled = query.toSQL();
      expect(compiled.sql).toContain(`FROM ${tables.users.name} AS u`);
      expect(compiled.sql).toContain(`INNER JOIN ${tables.posts.name} AS p`);
      expect(compiled.sql).toContain(
        "WHERE u.active = $1 AND p.published = $2"
      );
      expect(compiled.sql).toContain("ORDER BY p.views DESC");
    });
  });

  describe("Different Alias Names", () => {
    test("should support various alias names", () => {
      const queries = [
        db.selectFrom(`${tables.users.name} as u`),
        db.selectFrom(`${tables.users.name} as users_alias`),
        db.selectFrom(`${tables.users.name} as user_table`),
        db.selectFrom(`${tables.users.name} as usr`),
      ];

      queries.forEach((query) => {
        expect(query).toBeDefined();
        const compiled = query.select(["id", "name"]).toSQL();
        expect(compiled.sql).toContain(`FROM ${tables.users.name} AS`);
      });
    });

    test("should support semantic aliases", () => {
      const query = db
        .selectFrom(`${tables.users.name} as active_users`)
        .select(["active_users.id", "active_users.name"])
        .where("active_users.active", "=", true);

      const compiled = query.toSQL();
      expect(compiled.sql).toContain(
        `FROM ${tables.users.name} AS active_users`
      );
      expect(compiled.sql).toContain("active_users.active = $1");
    });
  });

  describe("Type Safety with Aliases", () => {
    test("should provide type safety for aliased columns", () => {
      const query = db.selectFrom(`${tables.users.name} as u`);

      // These should all be valid
      const validSelects = [
        query.select(["u.id", "u.name"]),
        query.select(["id", "name"]),
        query.select(["u.id", "name", "u.email"]),
      ];

      validSelects.forEach((q) => expect(q).toBeDefined());
    });

    test("should provide type safety for WHERE clauses", () => {
      const query = db.selectFrom(`${tables.users.name} as u`);

      // These should all be valid
      const validWheres = [
        query.where("u.active", "=", true),
        query.where("active", "=", true),
        query.where("u.score", ">", 50),
      ];

      validWheres.forEach((q) => expect(q).toBeDefined());
    });
  });

  describe("Performance with Aliases", () => {
    test("should perform well with simple alias queries", async () => {
      const startTime = performance.now();

      const result = await db
        .selectFrom(`${tables.users.name} as u`)
        .select(["u.id", "u.name"])
        .where("u.active", "=", true)
        .execute();

      const endTime = performance.now();
      const duration = endTime - startTime;

      expect(result.length).toBeGreaterThan(0);
      expect(duration).toBeLessThan(100); // Should complete within 100ms
    });

    test("should perform well with complex alias queries", async () => {
      const startTime = performance.now();

      const result = await db
        .selectFrom(`${tables.users.name} as u`)
        .innerJoin(`${tables.posts.name} as p`, "u.id", "p.user_id")
        .select(["u.name", "p.title"])
        .where("u.active", "=", true)
        .where("p.published", "=", true)
        .orderBy("p.views", "desc")
        .limit(10)
        .execute();

      const endTime = performance.now();
      const duration = endTime - startTime;

      expect(result.length).toBeGreaterThan(0);
      expect(duration).toBeLessThan(200); // Should complete within 200ms
    });
  });
});
