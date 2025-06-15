// Alias Types Test - Verify that alias type utilities work correctly
// This file tests the core alias extraction and column generation logic

import { expectType } from "tsd";
import type {
  ExtractAlias,
  AliasColumnReferences,
  HasAlias,
  GetAliasColumns,
} from "../src/core/utils/alias-types";

// Test database structure
type TestDB = {
  users: {
    id: number;
    name: string;
    email: string;
    active: boolean;
  };
  posts: {
    id: number;
    user_id: number;
    title: string;
    content: string;
    published: boolean;
  };
  comments: {
    id: number;
    post_id: number;
    user_id: number;
    content: string;
  };
};

// =============================================================================
// 1. ALIAS EXTRACTION TESTS
// =============================================================================

// ✅ Should extract alias from "table as alias" syntax
type ExtractAliasTest1 = ExtractAlias<"users as u">;
expectType<"u">("" as ExtractAliasTest1);

// ✅ Should extract alias from "table AS alias" syntax (uppercase)
type ExtractAliasTest2 = ExtractAlias<"posts AS p">;
expectType<"p">("" as ExtractAliasTest2);

// ✅ Should extract alias from "table As alias" syntax (mixed case)
type ExtractAliasTest3 = ExtractAlias<"comments As c">;
expectType<"c">("" as ExtractAliasTest3);

// ✅ Should handle whitespace around alias
type ExtractAliasTest4 = ExtractAlias<"users  as   u  ">;
expectType<"u">("" as ExtractAliasTest4);

// ✅ Should return never for tables without aliases
type ExtractAliasTest5 = ExtractAlias<"users">;
expectType<never>("" as ExtractAliasTest5);

// =============================================================================
// 2. ALIAS COLUMN GENERATION TESTS
// =============================================================================

// ✅ Should generate all alias-prefixed columns for users table
type AliasColumnsTest1 = AliasColumnReferences<TestDB, "u", "users">;
expectType<"u.id" | "u.name" | "u.email" | "u.active">("" as AliasColumnsTest1);

// ✅ Should generate all alias-prefixed columns for posts table
type AliasColumnsTest2 = AliasColumnReferences<TestDB, "p", "posts">;
expectType<"p.id" | "p.user_id" | "p.title" | "p.content" | "p.published">(
  "" as AliasColumnsTest2
);

// ✅ Should generate all alias-prefixed columns for comments table
type AliasColumnsTest3 = AliasColumnReferences<TestDB, "c", "comments">;
expectType<"c.id" | "c.post_id" | "c.user_id" | "c.content">(
  "" as AliasColumnsTest3
);

// =============================================================================
// 3. HAS ALIAS TESTS
// =============================================================================

// ✅ Should detect when table expression has alias
type HasAliasTest1 = HasAlias<"users as u">;
expectType<true>(true as HasAliasTest1);

// ✅ Should detect when table expression has no alias
type HasAliasTest2 = HasAlias<"users">;
expectType<false>(false as HasAliasTest2);

// =============================================================================
// 4. GET ALIAS COLUMNS TESTS
// =============================================================================

// ✅ Should get all alias columns for table expression with alias
type GetAliasColumnsTest1 = GetAliasColumns<TestDB, "users as u">;
expectType<"u.id" | "u.name" | "u.email" | "u.active">(
  "" as GetAliasColumnsTest1
);

// ✅ Should get all alias columns for uppercase AS
type GetAliasColumnsTest2 = GetAliasColumns<TestDB, "posts AS p">;
expectType<"p.id" | "p.user_id" | "p.title" | "p.content" | "p.published">(
  "" as GetAliasColumnsTest2
);

// ✅ Should return never for table expressions without aliases
type GetAliasColumnsTest3 = GetAliasColumns<TestDB, "users">;
expectType<never>("" as GetAliasColumnsTest3);

// =============================================================================
// 5. PRACTICAL USAGE TESTS
// =============================================================================

// ✅ Test that we can assign specific alias columns
function testAliasColumnAssignment() {
  type UserAliasColumns = GetAliasColumns<TestDB, "users as u">;

  // These should all be valid assignments
  const col1: UserAliasColumns = "u.id";
  const col2: UserAliasColumns = "u.name";
  const col3: UserAliasColumns = "u.email";
  const col4: UserAliasColumns = "u.active";

  // This should NOT compile (column doesn't exist)
  // const invalidCol: UserAliasColumns = "u.nonexistent";

  return [col1, col2, col3, col4];
}

// ✅ Test that we can build arrays of alias columns
function testAliasColumnArrays() {
  type UserAliasColumns = GetAliasColumns<TestDB, "users as u">;

  const columns: UserAliasColumns[] = ["u.id", "u.name", "u.email", "u.active"];

  return columns;
}

export {};
