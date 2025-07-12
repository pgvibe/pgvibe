// Invalid table selection syntax - should fail compilation

import { QueryBuilder } from "../../src/query-builder.js";
import { TestDB } from "../__shared__/fixtures/test-schema.js";

const qb = new QueryBuilder<TestDB>();

// ❌ Non-existent table names
// @ts-expect-error - table doesn't exist
qb.selectFrom("invalid_table");

// @ts-expect-error - typo in table name
qb.selectFrom("user");

// @ts-expect-error - wrong table name
qb.selectFrom("post");

// @ts-expect-error - empty string
qb.selectFrom("");

// @ts-expect-error - undefined
qb.selectFrom(undefined);

// @ts-expect-error - null
qb.selectFrom(null);