// Autocomplete Playground - Testing alias-prefixed column autocomplete
// This file is for rapid iteration and testing

import { db } from "./types/utils/test-helpers.test-d.ts";

// =============================================================================
// CURRENT ISSUE REPRODUCTION
// =============================================================================

// ❌ Currently this doesn't work - no autocomplete for u.id, u.name, etc.
const query1 = db.selectFrom("users as u").select([
  "u.i", // <-- Should autocomplete to "u.id" but doesn't
]);

// ❌ Currently this doesn't work - no autocomplete for alias-prefixed columns
const query2 = db.selectFrom("users as u").select([
  "u.", // <-- Should show all u.* columns but doesn't
]);

// ✅ This works fine - regular table columns get autocomplete
const query3 = db.selectFrom("users").select([
  "i", // <-- Does autocomplete to "id"
]);

// =============================================================================
// ANALYSIS SECTION
// =============================================================================

// The issue is in ColumnReference type:
// `${string}.${Extract<AllColumnsFromTables<DB, TB>, string>}`
// This is too generic - TypeScript can't know what specific alias to suggest

// SOLUTION APPROACH:
// 1. Extract the actual alias from table expression "users as u" -> "u"
// 2. Create specific alias-prefixed column types: "u.id" | "u.name" | ...
// 3. Include these in ColumnReference for proper autocomplete

export {};
