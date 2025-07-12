// Valid JOIN syntax - should compile without errors

import { QueryBuilder } from "../../src/query-builder.js";
import { TestDB } from "../__shared__/fixtures/test-schema.js";

const qb = new QueryBuilder<TestDB>();

// ✅ Basic inner join
const basicInnerJoin = qb
  .selectFrom("users as u")
  .innerJoin("posts as p", "u.id", "p.user_id")
  .select(["u.name", "p.title"]);

// ✅ Basic left join
const basicLeftJoin = qb
  .selectFrom("users as u")  
  .leftJoin("posts as p", "u.id", "p.user_id")
  .select(["u.name", "p.title"]);

// ✅ Multiple joins
const multipleJoins = qb
  .selectFrom("users as u")
  .innerJoin("posts as p", "u.id", "p.user_id")
  .leftJoin("comments as c", "p.id", "c.post_id")
  .select(["u.name", "p.title", "c.content"]);

// ✅ Joining without aliases (using table names)
const noAliasJoin = qb
  .selectFrom("users")
  .innerJoin("posts", "users.id", "posts.user_id")
  .select(["users.name", "posts.title"]);

// ✅ Mixed alias and non-alias joins
const mixedJoins = qb
  .selectFrom("users as u")
  .innerJoin("posts", "u.id", "posts.user_id")
  .select(["u.name", "posts.title"]);

// ✅ Selecting from joined tables
const joinedSelection = qb
  .selectFrom("users as u")
  .innerJoin("posts as p", "u.id", "p.user_id")
  .select(["u.id", "u.name", "p.id", "p.title", "p.user_id"]);

// ✅ Unqualified columns after joins
const unqualifiedAfterJoin = qb
  .selectFrom("users as u")
  .innerJoin("posts as p", "u.id", "p.user_id")
  .select(["name", "title"]);