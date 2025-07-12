// TypeScript autocomplete validation tests
// These demonstrate perfect IDE experience and autocomplete behavior

import { QueryBuilder } from "../../src/query-builder.js";
import { TestDB } from "../__shared__/fixtures/test-schema.js";

const qb = new QueryBuilder<TestDB>();

// ✅ Table names should provide autocomplete
// When typing qb.selectFrom(""), IDE should suggest: "users", "posts", "comments"
const tableAutocomplete1 = qb.selectFrom("users");
const tableAutocomplete2 = qb.selectFrom("posts"); 
const tableAutocomplete3 = qb.selectFrom("comments");

// ✅ Table aliases should work with autocomplete
const aliasAutocomplete = qb.selectFrom("users as u");

// ✅ Column names should provide table-specific autocomplete
// For users table, should suggest: "id", "name", "email", "active"
const userColumns = qb.selectFrom("users").select(["id", "name", "email", "active"]);

// For posts table, should suggest: "id", "title", "content", "user_id", "created_at"
const postColumns = qb.selectFrom("posts").select(["id", "title", "content", "user_id"]);

// ✅ Qualified column names should provide smart autocomplete
// Should suggest "users.id", "users.name", "users.email", "users.active"
const qualifiedColumns = qb.selectFrom("users").select(["users.id", "users.name"]);

// ✅ Alias column references should provide autocomplete
// Should suggest "u.id", "u.name", "u.email", "u.active"  
const aliasColumns = qb.selectFrom("users as u").select(["u.id", "u.name"]);

// ✅ After alias, original table name should NOT appear in autocomplete
// Should only suggest "u.id", "u.name", "id", "name" - NOT "users.id"
const aliasOnly = qb.selectFrom("users as u").select(["u.id", "id"]);

// ✅ Join autocomplete should include columns from all joined tables
const joinAutocomplete = qb
  .selectFrom("users as u")
  .innerJoin("posts as p", "u.id", "p.user_id")
  .select([
    // Should suggest columns from both tables:
    // "u.id", "u.name", "u.email", "u.active"
    // "p.id", "p.title", "p.content", "p.user_id", "p.created_at"
    // "id", "name", "title", etc. (unqualified)
    "u.name",
    "p.title"
  ]);

// ✅ Multiple joins should include all available columns
const multiJoinAutocomplete = qb
  .selectFrom("users as u") 
  .innerJoin("posts as p", "u.id", "p.user_id")
  .leftJoin("comments as c", "p.id", "c.post_id")
  .select([
    // Should include columns from users, posts, AND comments
    "u.name",
    "p.title", 
    "c.content"
  ]);

// ✅ Join condition autocomplete should be smart
const joinConditionAutocomplete = qb
  .selectFrom("users as u")
  // First parameter should suggest "u.id", "u.name", etc.
  // Second parameter should suggest "posts.id", "posts.user_id", etc.
  .innerJoin("posts as p", "u.id", "p.user_id");

// ✅ Column aliases should not interfere with autocomplete
const columnAliasAutocomplete = qb
  .selectFrom("users")
  .select([
    "name as username",  // Should still suggest "name" initially
    "email as userEmail" // Should still suggest "email" initially
  ]);