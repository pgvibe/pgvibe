// Invalid JOIN syntax - should fail compilation

import { QueryBuilder } from "../../src/query-builder.js";
import { TestDB } from "../__shared__/fixtures/test-schema.js";

const qb = new QueryBuilder<TestDB>();

// ❌ Invalid join table names
// @ts-expect-error - joining non-existent table
qb.selectFrom("users as u")
  .innerJoin("invalid_table as i", "u.id", "i.user_id");

// @ts-expect-error - typo in join table name
qb.selectFrom("users as u")
  .innerJoin("post as p", "u.id", "p.user_id");

// ❌ Invalid join column references
// @ts-expect-error - non-existent column in left table
qb.selectFrom("users as u")
  .innerJoin("posts as p", "u.invalid_column", "p.user_id");

// @ts-expect-error - non-existent column in right table  
qb.selectFrom("users as u")
  .innerJoin("posts as p", "u.id", "p.invalid_column");

// ❌ Using original table name instead of alias in joins
// @ts-expect-error - should use alias 'u', not 'users'
qb.selectFrom("users as u")
  .innerJoin("posts as p", "users.id", "p.user_id");

// @ts-expect-error - should use alias 'p', not 'posts'
qb.selectFrom("users as u")
  .innerJoin("posts as p", "u.id", "posts.user_id");

// ❌ Wrong alias references in joins
// @ts-expect-error - wrong alias name
qb.selectFrom("users as u")
  .innerJoin("posts as p", "usr.id", "p.user_id");

// ❌ Selecting columns from non-joined tables
// @ts-expect-error - comments table not joined
qb.selectFrom("users as u")
  .innerJoin("posts as p", "u.id", "p.user_id")
  .select(["u.name", "p.title", "comments.content"]);

// @ts-expect-error - trying to use non-joined table with alias
qb.selectFrom("users as u")
  .innerJoin("posts as p", "u.id", "p.user_id")
  .select(["u.name", "p.title", "c.content"]);

// ❌ Invalid column references after joins with aliases
// @ts-expect-error - cannot use original table name after alias
qb.selectFrom("users as u")
  .innerJoin("posts as p", "u.id", "p.user_id") 
  .select(["users.name", "p.title"]);