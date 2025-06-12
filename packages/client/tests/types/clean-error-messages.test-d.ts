/**
 * Test clean error messages - should show single, helpful errors instead of verbose unions
 */
import { expectType } from "tsd";
import type { SmartColumnValidation } from "../../src/core/builders/select-query-builder";

// Test database interface
interface TestDatabase {
  users: {
    id: number;
    name: string;
    email: string;
    active: boolean;
    created_at: Date;
    updated_at: Date;
  };
  posts: {
    id: number;
    user_id: number;
    title: string;
    content: string;
    published: boolean;
    created_at: Date;
    updated_at: Date;
  };
  comments: {
    id: number;
    post_id: number;
    user_id: number;
    content: string;
    created_at: Date;
  };
}

// ✅ Valid columns should return themselves
expectType<"id">(
  null as unknown as SmartColumnValidation<
    TestDatabase,
    "users",
    "id",
    "SELECT"
  >
);

expectType<"name">(
  null as unknown as SmartColumnValidation<
    TestDatabase,
    "users",
    "name",
    "SELECT"
  >
);

expectType<"email">(
  null as unknown as SmartColumnValidation<
    TestDatabase,
    "users",
    "email",
    "SELECT"
  >
);

// ✅ Invalid columns should show clean, helpful error messages
expectType<"❌ Column 'nonexistent' does not exist in table 'users'. Available: id | name | email | active | created_at | updated_at">(
  null as unknown as SmartColumnValidation<
    TestDatabase,
    "users",
    "nonexistent",
    "SELECT"
  >
);

// ✅ Context-aware errors for WHERE clause
expectType<"❌ Column 'invalid_field' cannot be used in WHERE clause for table 'users'. Available: id | name | email | active | created_at | updated_at">(
  null as unknown as SmartColumnValidation<
    TestDatabase,
    "users",
    "invalid_field",
    "WHERE"
  >
);

// ✅ Context-aware errors for ORDER BY clause
expectType<"❌ Column 'bad_column' cannot be used in ORDER BY clause for table 'users'. Available: id | name | email | active | created_at | updated_at">(
  null as unknown as SmartColumnValidation<
    TestDatabase,
    "users",
    "bad_column",
    "ORDER BY"
  >
);

// ✅ Cross-table intelligence for posts table
expectType<"❌ Column 'nonexistent' does not exist in table 'posts'. Available: id | user_id | title | content | published | created_at | updated_at">(
  null as unknown as SmartColumnValidation<
    TestDatabase,
    "posts",
    "nonexistent",
    "SELECT"
  >
);

// ✅ Cross-table column confusion detection
expectType<"❌ Column 'title' does not exist in table 'users', but it exists in table 'posts'. Available: id | name | email | active | created_at | updated_at">(
  null as unknown as SmartColumnValidation<
    TestDatabase,
    "users",
    "title",
    "SELECT"
  >
);

// ✅ Comments table validation
expectType<"❌ Column 'nonexistent' does not exist in table 'comments'. Available: id | post_id | user_id | content | created_at">(
  null as unknown as SmartColumnValidation<
    TestDatabase,
    "comments",
    "nonexistent",
    "SELECT"
  >
);

console.log("✅ All clean error message types validated successfully!");
console.log(
  "💡 These should show single, clean error messages when you hover over them in your IDE"
);
console.log("🚫 No more verbose union distributions!");
