import { expectError } from "tsd";
import { pgvibe } from "../../../src/index";

// Test database schema
interface Database {
  users: {
    id: number;
    name: string;
    email: string;
    active: boolean;
    created_at: string;
  };
  posts: {
    id: number;
    user_id: number;
    title: string;
    content: string;
    published: boolean;
    created_at: string;
  };
}

const db = new pgvibe<Database>({
  host: "localhost",
  port: 5432,
  database: "test",
  user: "test",
  password: "test",
});

// Test 1: Single table alias exclusivity
const singleTableQuery = db.selectFrom("users as u");

// ❌ Original table names should be blocked
expectError(singleTableQuery.select(["users.name", "users.email"]));
expectError(singleTableQuery.select(["name", "email"])); // unqualified should fail too
expectError(singleTableQuery.where("users.active", "=", true));
expectError(singleTableQuery.where("name", "=", "test"));
expectError(singleTableQuery.orderBy("users.created_at"));
expectError(singleTableQuery.orderBy("created_at"));

// Test 2: Multi-table alias exclusivity
const multiTableQuery = db
  .selectFrom("users as u")
  .innerJoin("posts as p", "u.id", "p.user_id");

// ❌ Original table names should be blocked
expectError(multiTableQuery.select(["users.name", "posts.title"]));
expectError(multiTableQuery.select(["name", "title"])); // unqualified should fail
expectError(multiTableQuery.where("users.active", "=", true));
expectError(multiTableQuery.where("posts.published", "=", true));
expectError(multiTableQuery.orderBy("users.created_at"));
expectError(multiTableQuery.orderBy("posts.created_at"));

// Test 3: Expression builder exclusivity
const exprQuery = db.selectFrom("users as u");

// ❌ Original table names should be blocked in expression builder
expectError(exprQuery.where(({ eb }) => eb("users.active", "=", true)));
expectError(exprQuery.where(({ eb }) => eb("active", "=", true)));

// Test 4: JOIN condition exclusivity
const joinQuery = db.selectFrom("users as u");

// ❌ Original table names should be blocked in JOIN conditions
expectError(joinQuery.innerJoin("posts as p", "users.id", "p.user_id"));
expectError(joinQuery.innerJoin("posts as p", "u.id", "posts.user_id"));
expectError(joinQuery.innerJoin("posts as p", "id", "user_id")); // unqualified should fail

// Test 5: Column alias exclusivity
const columnAliasQuery = db.selectFrom("users as u");

// ❌ Original table names should be blocked in column aliases
expectError(columnAliasQuery.select(["users.name as user_name"]));
expectError(columnAliasQuery.select(["name as user_name"])); // unqualified should fail

// Test 6: Verify that alias references DO work (positive test)
// These should NOT throw errors - they should compile successfully
const positiveTest = db.selectFrom("users as u");
positiveTest.select(["u.name", "u.email"]);
positiveTest.where("u.active", "=", true);
positiveTest.orderBy("u.created_at");
positiveTest.where(({ eb }) => eb("u.active", "=", true));

const positiveMultiTable = db
  .selectFrom("users as u")
  .innerJoin("posts as p", "u.id", "p.user_id");
positiveMultiTable.select(["u.name", "p.title"]);
positiveMultiTable.where("u.active", "=", true);
positiveMultiTable.where("p.published", "=", true);
positiveMultiTable.orderBy("u.created_at");
positiveMultiTable.orderBy("p.created_at");

// Column aliases should work
positiveTest.select(["u.name as user_name", "u.email as user_email"]);
