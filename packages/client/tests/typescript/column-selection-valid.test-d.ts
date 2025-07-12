// Valid column selection syntax - should compile without errors

import { QueryBuilder } from "../../src/query-builder.js";
import { TestDB } from "../__shared__/fixtures/test-schema.js";

const qb = new QueryBuilder<TestDB>();

// ✅ Basic column selection
const userColumns = qb.selectFrom("users").select(["id", "name", "email"]);
const postColumns = qb.selectFrom("posts").select(["title", "content"]);

// ✅ Single column selection
const singleColumn = qb.selectFrom("users").select(["name"]);

// ✅ All available columns for a table
const allUserColumns = qb.selectFrom("users").select(["id", "name", "email", "active"]);

// ✅ Qualified column names (table.column)
const qualifiedColumns = qb.selectFrom("users").select(["users.id", "users.name"]);

// ✅ Column aliases
const columnAliases = qb.selectFrom("users").select(["name as username", "email as userEmail"]);

// ✅ With table aliases - using alias prefix
const aliasedTableColumns = qb.selectFrom("users as u").select(["u.id", "u.name"]);

// ✅ With table aliases - unqualified columns
const unqualifiedWithAlias = qb.selectFrom("users as u").select(["id", "name"]);

// ✅ Mixed qualified and unqualified
const mixedColumns = qb.selectFrom("users as u").select(["u.id", "name", "email"]);