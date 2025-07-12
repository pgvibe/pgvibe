// Valid table selection syntax - should compile without errors

import { QueryBuilder } from "../../src/query-builder.js";
import { TestDB } from "../__shared__/fixtures/test-schema.js";

const qb = new QueryBuilder<TestDB>();

// ✅ Basic table selection
const users = qb.selectFrom("users");
const posts = qb.selectFrom("posts"); 
const comments = qb.selectFrom("comments");

// ✅ Table aliases
const usersAliased = qb.selectFrom("users as u");
const postsAliased = qb.selectFrom("posts as p");
const commentsAliased = qb.selectFrom("comments as c");

// ✅ Table aliases with different alias names
const userWithLongAlias = qb.selectFrom("users as user_table");
const postWithShortAlias = qb.selectFrom("posts as p1");