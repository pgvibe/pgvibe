import { describe, it, expect } from "bun:test";
import { pgvibe } from "../../src/index";

// Test database schema
interface TestDB {
  users: {
    id: number;
    name: string;
    email: string;
    active: boolean;
    created_at: Date;
  };
  posts: {
    id: number;
    user_id: number;
    title: string;
    content: string;
    published: boolean;
    created_at: Date;
  };
  comments: {
    id: number;
    post_id: number;
    user_id: number;
    content: string;
    created_at: Date;
  };
}

describe("Column Aliases in SELECT Clause Tests", () => {
  const db = new pgvibe<TestDB>({
    host: "localhost",
    port: 5432,
    database: "test",
    user: "test",
    password: "test",
  });

  describe("Single Table Column Aliases", () => {
    it("should support column aliases with single table", () => {
      const query = db
        .selectFrom("users as u")
        .select([
          "u.name as user_name",
          "u.email as user_email",
          "u.active as is_active",
        ]);

      const compiled = query.compile();
      expect(compiled.sql).toBe(
        "SELECT u.name AS user_name, u.email AS user_email, u.active AS is_active FROM users AS u"
      );
      expect(compiled.parameters).toEqual([]);
    });

    it("should support mixed aliased and non-aliased columns", () => {
      const query = db
        .selectFrom("users as u")
        .select([
          "u.id",
          "u.name as user_name",
          "u.email",
          "u.active as is_active",
        ]);

      const compiled = query.compile();
      expect(compiled.sql).toBe(
        "SELECT u.id, u.name AS user_name, u.email, u.active AS is_active FROM users AS u"
      );
      expect(compiled.parameters).toEqual([]);
    });

    it("should support column aliases without table prefix", () => {
      const query = db
        .selectFrom("users as u")
        .select(["name as user_name", "email as user_email"]);

      const compiled = query.compile();
      expect(compiled.sql).toBe(
        "SELECT name AS user_name, email AS user_email FROM users AS u"
      );
      expect(compiled.parameters).toEqual([]);
    });

    it("should support single column alias", () => {
      const query = db.selectFrom("users as u").select("u.name as user_name");

      const compiled = query.compile();
      expect(compiled.sql).toBe("SELECT u.name AS user_name FROM users AS u");
      expect(compiled.parameters).toEqual([]);
    });
  });

  describe("Multi-Table Column Aliases with JOINs", () => {
    it("should support column aliases with INNER JOIN", () => {
      const query = db
        .selectFrom("users as u")
        .innerJoin("posts as p", "u.id", "p.user_id")
        .select([
          "u.name as author_name",
          "p.title as post_title",
          "p.published as is_published",
        ]);

      const compiled = query.compile();
      expect(compiled.sql).toBe(
        "SELECT u.name AS author_name, p.title AS post_title, p.published AS is_published FROM users AS u INNER JOIN posts AS p ON u.id = p.user_id"
      );
      expect(compiled.parameters).toEqual([]);
    });

    it("should support column aliases with LEFT JOIN", () => {
      const query = db
        .selectFrom("users as u")
        .leftJoin("posts as p", "u.id", "p.user_id")
        .select([
          "u.name as user_name",
          "p.title as post_title",
          "p.content as post_content",
        ]);

      const compiled = query.compile();
      expect(compiled.sql).toBe(
        "SELECT u.name AS user_name, p.title AS post_title, p.content AS post_content FROM users AS u LEFT JOIN posts AS p ON u.id = p.user_id"
      );
      expect(compiled.parameters).toEqual([]);
    });

    it("should support column aliases with three-table JOINs", () => {
      const query = db
        .selectFrom("users as u")
        .innerJoin("posts as p", "u.id", "p.user_id")
        .leftJoin("comments as c", "p.id", "c.post_id")
        .select([
          "u.name as author_name",
          "p.title as post_title",
          "c.content as comment_text",
          "c.created_at as comment_date",
        ]);

      const compiled = query.compile();
      expect(compiled.sql).toBe(
        "SELECT u.name AS author_name, p.title AS post_title, c.content AS comment_text, c.created_at AS comment_date FROM users AS u INNER JOIN posts AS p ON u.id = p.user_id LEFT JOIN comments AS c ON p.id = c.post_id"
      );
      expect(compiled.parameters).toEqual([]);
    });

    it("should support mixed qualified and unqualified column aliases", () => {
      const query = db
        .selectFrom("users as u")
        .innerJoin("posts as p", "u.id", "p.user_id")
        .select([
          "u.name as author_name",
          "title as post_title", // unqualified
          "p.published as is_published",
          "active as is_active", // unqualified
        ]);

      const compiled = query.compile();
      expect(compiled.sql).toBe(
        "SELECT u.name AS author_name, title AS post_title, p.published AS is_published, active AS is_active FROM users AS u INNER JOIN posts AS p ON u.id = p.user_id"
      );
      expect(compiled.parameters).toEqual([]);
    });
  });

  describe("Column Aliases with WHERE and ORDER BY", () => {
    it("should support column aliases with WHERE clause", () => {
      const query = db
        .selectFrom("users as u")
        .select(["u.name as user_name", "u.email as user_email"])
        .where("u.active", "=", true);

      const compiled = query.compile();
      expect(compiled.sql).toBe(
        "SELECT u.name AS user_name, u.email AS user_email FROM users AS u WHERE u.active = $1"
      );
      expect(compiled.parameters).toEqual([true]);
    });

    it("should support column aliases with ORDER BY", () => {
      const query = db
        .selectFrom("users as u")
        .select([
          "u.name as user_name",
          "u.email as user_email",
          "u.created_at",
        ])
        .orderBy("u.created_at", "desc");

      const compiled = query.compile();
      expect(compiled.sql).toBe(
        "SELECT u.name AS user_name, u.email AS user_email, u.created_at FROM users AS u ORDER BY u.created_at DESC"
      );
      expect(compiled.parameters).toEqual([]);
    });

    it("should support column aliases with WHERE, ORDER BY, and LIMIT", () => {
      const query = db
        .selectFrom("users as u")
        .innerJoin("posts as p", "u.id", "p.user_id")
        .select([
          "u.name as author_name",
          "p.title as post_title",
          "p.created_at as publish_date",
        ])
        .where("u.active", "=", true)
        .where("p.published", "=", true)
        .orderBy("p.created_at", "desc")
        .limit(10);

      const compiled = query.compile();
      expect(compiled.sql).toBe(
        "SELECT u.name AS author_name, p.title AS post_title, p.created_at AS publish_date FROM users AS u INNER JOIN posts AS p ON u.id = p.user_id WHERE u.active = $1 AND p.published = $2 ORDER BY p.created_at DESC LIMIT 10"
      );
      expect(compiled.parameters).toEqual([true, true]);
    });
  });

  describe("Complex Column Alias Scenarios", () => {
    it("should support column aliases with special characters", () => {
      const query = db
        .selectFrom("users as u")
        .select([
          'u.name as "User Name"',
          'u.email as "Email Address"',
          'u.created_at as "Registration Date"',
        ]);

      const compiled = query.compile();
      expect(compiled.sql).toBe(
        'SELECT u.name AS "User Name", u.email AS "Email Address", u.created_at AS "Registration Date" FROM users AS u'
      );
      expect(compiled.parameters).toEqual([]);
    });

    it("should support column aliases with underscores and numbers", () => {
      const query = db
        .selectFrom("users as u")
        .select([
          "u.id as user_id_123",
          "u.name as user_name_v2",
          "u.email as email_address_primary",
        ]);

      const compiled = query.compile();
      expect(compiled.sql).toBe(
        "SELECT u.id AS user_id_123, u.name AS user_name_v2, u.email AS email_address_primary FROM users AS u"
      );
      expect(compiled.parameters).toEqual([]);
    });

    it("should support column aliases in self-joins", () => {
      const query = db
        .selectFrom("users as u1")
        .innerJoin("users as u2", "u1.id", "u2.id")
        .select([
          "u1.name as first_user_name",
          "u2.email as second_user_email",
        ]);

      const compiled = query.compile();
      expect(compiled.sql).toBe(
        "SELECT u1.name AS first_user_name, u2.email AS second_user_email FROM users AS u1 INNER JOIN users AS u2 ON u1.id = u2.id"
      );
      expect(compiled.parameters).toEqual([]);
    });
  });
});
