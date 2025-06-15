// Standalone test for alias autocomplete functionality

import type {
  ExtractAlias,
  GetAliasColumns,
} from "../src/core/utils/alias-extraction";

// Test database type
interface TestDatabase {
  users: {
    id: number;
    name: string;
    email: string;
    active: boolean;
  };
  posts: {
    id: number;
    title: string;
    content: string;
  };
}

// Test alias extraction
type TestAlias1 = ExtractAlias<"users as u">; // Should be "u"
type TestAlias2 = ExtractAlias<"posts as p">; // Should be "p"
type TestAlias3 = ExtractAlias<"users">; // Should be never

// Test alias column generation
type TestColumns1 = GetAliasColumns<TestDatabase, "users as u">; // Should be "u.id" | "u.name" | "u.email" | "u.active"
type TestColumns2 = GetAliasColumns<TestDatabase, "posts as p">; // Should be "p.id" | "p.title" | "p.content"

// Verify types work correctly
const alias1: TestAlias1 = "u";
const alias2: TestAlias2 = "p";

const column1: TestColumns1 = "u.id";
const column2: TestColumns1 = "u.name";
const column3: TestColumns2 = "p.title";

export { alias1, alias2, column1, column2, column3 };
