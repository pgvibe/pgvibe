// TypeScript type inference validation tests
// These tests ensure result types are precisely inferred

import { QueryBuilder } from "../../src/query-builder.js";
import { TestDB } from "../__shared__/fixtures/test-schema.js";
import { expectType } from "../__shared__/helpers/test-utils.js";

const qb = new QueryBuilder<TestDB>();

// ✅ Basic select should infer correct types
const basicResult = qb.selectFrom("users").select(["id", "name"]);
type BasicResult = typeof basicResult;
// Should be: { id: number; name: string }[]

// ✅ Single column select should infer correctly
const singleColumn = qb.selectFrom("users").select(["email"]);
type SingleResult = typeof singleColumn;
// Should be: { email: string }[]

// ✅ All columns select should infer full table type
const allColumns = qb.selectFrom("users");
type AllColumnsResult = typeof allColumns;
// Should include all user columns

// ✅ Join should merge types correctly
const joinResult = qb
  .selectFrom("users as u")
  .innerJoin("posts as p", "u.id", "p.user_id")
  .select(["u.name", "p.title"]);
type JoinResult = typeof joinResult;
// Should be: { name: string; title: string }[]

// ✅ Left join should make joined columns nullable
const leftJoinResult = qb
  .selectFrom("users as u")
  .leftJoin("posts as p", "u.id", "p.user_id")
  .select(["u.name", "p.title"]);
type LeftJoinResult = typeof leftJoinResult;
// Should be: { name: string; title: string | null }[]

// ✅ Column aliases should affect result property names
const aliasedResult = qb
  .selectFrom("users")
  .select(["name as username", "email as userEmail"]);
type AliasedResult = typeof aliasedResult;
// Should be: { username: string; userEmail: string }[]

// ✅ Complex multi-table query with mixed nullable columns
const complexResult = qb
  .selectFrom("users as u")
  .innerJoin("posts as p", "u.id", "p.user_id")
  .leftJoin("comments as c", "p.id", "c.post_id")
  .select(["u.name", "p.title", "c.content"]);
type ComplexResult = typeof complexResult;
// Should be: { name: string; title: string; content: string | null }[]

// ✅ Qualified column names should still infer correctly
const qualifiedResult = qb
  .selectFrom("users as u")
  .select(["u.id", "u.name"]);
type QualifiedResult = typeof qualifiedResult;
// Should be: { id: number; name: string }[]