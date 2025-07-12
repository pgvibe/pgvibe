// Invalid column selection syntax - should fail compilation

import { QueryBuilder } from "../../src/query-builder.js";
import { TestDB } from "../__shared__/fixtures/test-schema.js";

const qb = new QueryBuilder<TestDB>();

// ❌ Non-existent columns
// @ts-expect-error - column doesn't exist
qb.selectFrom("users").select(["invalid_column"]);

// @ts-expect-error - typo in column name
qb.selectFrom("users").select(["nam"]);

// @ts-expect-error - column from different table
qb.selectFrom("users").select(["title"]);

// ❌ Wrong qualified column references
// @ts-expect-error - wrong table qualifier
qb.selectFrom("users").select(["posts.title"]);

// @ts-expect-error - non-existent table qualifier
qb.selectFrom("users").select(["invalid.name"]);

// ❌ Alias violations - using original table name after alias
// @ts-expect-error - cannot use original table name with alias
qb.selectFrom("users as u").select(["users.id"]);

// @ts-expect-error - mixing original and alias references
qb.selectFrom("users as u").select(["users.name", "u.email"]);

// ❌ Invalid alias references
// @ts-expect-error - alias doesn't exist
qb.selectFrom("users").select(["u.name"]);

// @ts-expect-error - wrong alias name
qb.selectFrom("users as u").select(["usr.name"]);

// ❌ Empty or invalid selections
// @ts-expect-error - empty array not valid
qb.selectFrom("users").select([]);

// @ts-expect-error - null not valid
qb.selectFrom("users").select(null);

// @ts-expect-error - undefined not valid
qb.selectFrom("users").select(undefined);