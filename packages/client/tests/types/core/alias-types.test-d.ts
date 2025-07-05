import { expectType } from "tsd";
import { pgvibe } from "../../../src/query-builder";
import type { Database } from "../../../src/core/shared-types";

const db = new pgvibe<Database>({
  connectionString: "postgresql://test:test@localhost:5432/test",
});

// Test basic table alias types
// Should allow qualified columns with alias
const query1 = db.selectFrom("users as u").select(["u.name", "u.email"]);
expectType<unknown>(query1);

// Should allow unqualified columns with alias
const query2 = db.selectFrom("users as u").select(["name", "email"]);
expectType<unknown>(query2);

// Should allow mixed qualified and unqualified
const query3 = db.selectFrom("users as u").select(["u.name", "email"]);
expectType<unknown>(query3);

// Test multi-table alias types
// Should allow qualified columns from both tables
const query4 = db
  .selectFrom("users as u")
  .innerJoin("posts as p", "u.id", "p.user_id")
  .select(["u.name", "p.title"]);
expectType<unknown>(query4);

// Should allow unqualified columns from both tables
const query5 = db
  .selectFrom("users as u")
  .innerJoin("posts as p", "u.id", "p.user_id")
  .select(["name", "title"]);
expectType<unknown>(query5);

// Should allow mixed qualified and unqualified
const query6 = db
  .selectFrom("users as u")
  .innerJoin("posts as p", "u.id", "p.user_id")
  .select(["u.name", "title", "p.content", "email"]);
expectType<unknown>(query6);

// Test complex multi-table scenarios
// Should handle three-way joins with aliases
const query7 = db
  .selectFrom("users as u")
  .innerJoin("posts as p", "u.id", "p.user_id")
  .leftJoin("comments as c", "p.id", "c.post_id")
  .select(["u.name", "p.title", "c.content"]);
expectType<unknown>(query7);

// Should handle unqualified columns from all tables
const query8 = db
  .selectFrom("users as u")
  .innerJoin("posts as p", "u.id", "p.user_id")
  .leftJoin("comments as c", "p.id", "c.post_id")
  .select(["name", "title", "content"]);
expectType<unknown>(query8);

// Should handle mixed qualified and unqualified from all tables
const query9 = db
  .selectFrom("users as u")
  .innerJoin("posts as p", "u.id", "p.user_id")
  .leftJoin("comments as c", "p.id", "c.post_id")
  .select(["u.name", "title", "c.content", "email"]);
expectType<unknown>(query9);

// Test JOIN condition types with aliases
// Should allow aliased columns in JOIN conditions
const query10 = db
  .selectFrom("users as u")
  .innerJoin("posts as p", "u.id", "p.user_id")
  .select(["u.name"]);
expectType<unknown>(query10);

// Should allow multiple JOINs with aliases
const query11 = db
  .selectFrom("users as u")
  .innerJoin("posts as p", "u.id", "p.user_id")
  .leftJoin("comments as c", "p.id", "c.post_id")
  .select(["u.name"]);
expectType<unknown>(query11);

// Test no alias scenarios (should still work)
// Should allow original table names when no alias is used
const query12 = db.selectFrom("users").select(["users.name", "users.email"]);
expectType<unknown>(query12);

// Should allow unqualified columns when no alias is used
const query13 = db.selectFrom("users").select(["name", "email"]);
expectType<unknown>(query13);

// Should allow mixed qualified and unqualified when no alias is used
const query14 = db.selectFrom("users").select(["users.name", "email"]);
expectType<unknown>(query14);

// Should allow JOINs without aliases
const query15 = db
  .selectFrom("users")
  .innerJoin("posts", "users.id", "posts.user_id")
  .select(["users.name", "posts.title"]);
expectType<unknown>(query15);

// Test self-joins with different aliases
const query16 = db
  .selectFrom("users as u1")
  .innerJoin("users as u2", "u1.id", "u2.id")
  .select(["u1.name", "u2.name"]);
expectType<unknown>(query16);

// Test same table with different aliases in different contexts
const query17 = db
  .selectFrom("users as manager")
  .innerJoin("users as employee", "manager.id", "employee.id")
  .select(["manager.name", "employee.name"]);
expectType<unknown>(query17);

// TODO: These should be type errors when alias exclusivity is fully implemented
// Should prevent original table names when using aliases
// expectError(db.selectFrom("users as u").select(["users.name"]));
// expectError(db.selectFrom("users as u").innerJoin("posts as p", "u.id", "p.user_id").select(["users.name", "posts.title"]));

// TODO: Should prevent mixed alias and original table names
// expectError(db.selectFrom("users as u").innerJoin("posts as p", "u.id", "p.user_id").select(["u.name", "posts.title"]));

// TODO: Should prevent using aliases that don't exist
// expectError(db.selectFrom("users as u").select(["x.name"]));
// expectError(db.selectFrom("users as u").innerJoin("posts as p", "u.id", "p.user_id").select(["z.title"]));

// TODO: Expression builder types - these should work when implemented
// Should allow aliases in WHERE clause expression builder
// const query18 = db
//   .selectFrom("users as u")
//   .select(["u.name"])
//   .where(({ eb }) => eb("u.active", "=", true));
// expectType<unknown>(query18);

// Should allow aliases in complex WHERE expressions
// const query19 = db
//   .selectFrom("users as u")
//   .innerJoin("posts as p", "u.id", "p.user_id")
//   .select(["u.name", "p.title"])
//   .where(({ eb, and, or }) => and([
//     eb("u.active", "=", true),
//     or([
//       eb("p.published", "=", true),
//       eb("u.name", "=", "admin")
//     ])
//   ]));
// expectType<unknown>(query19);

// Should NOT allow original table names in expression builder
// expectError(db.selectFrom("users as u").where(({ eb }) => eb("users.active", "=", true)));
