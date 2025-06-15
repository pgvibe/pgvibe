// Quick test to check if alias-prefixed autocomplete works

import { db } from "./types/utils/test-helpers.test-d.ts";

// This should now provide autocomplete for u.id, u.name, u.email, etc.
const testQuery = db.selectFrom("users as u").select([
  "u.id", // Should autocomplete
  "u.name", // Should autocomplete
  "", // Should autocomplete
]);

// Test alias extraction type directly
import type {
  ExtractAlias,
  GetAliasColumns,
} from "../src/core/utils/alias-extraction";
import type { Database } from "../src/core/shared-types";

type TestAlias = ExtractAlias<"users as u">; // Should be "u"
type TestColumns = GetAliasColumns<Database, "users as u">; // Should be "u.id" | "u.name" | etc.

// These should be valid assignments
const alias: TestAlias = "u";
const column: TestColumns = "u.id";

export { testQuery, alias, column };
