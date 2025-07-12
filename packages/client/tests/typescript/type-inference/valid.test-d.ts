// Valid TypeScript type inference tests - these should all compile with correct types

import {QueryBuilder} from '../../../src/query-builder';
import type {TestDB} from '../../__shared__/fixtures/test-schema';

const qb = new QueryBuilder<TestDB>();

// ✅ Basic select should compile correctly
qb.selectFrom("users").select(["id", "name"]);

// ✅ Single column select should compile correctly  
qb.selectFrom("users").select(["email"]);

// ✅ All columns select should compile
qb.selectFrom("users");

// ✅ Table aliases should compile correctly
qb.selectFrom("users as u");

// ✅ Join should compile correctly
qb.selectFrom("users as u")
  .innerJoin("posts as p", "u.id", "p.user_id")
  .select(["u.name", "p.title"]);

// ✅ Left join should compile (exact nullable type checking would be more complex)
qb.selectFrom("users as u")
  .leftJoin("posts as p", "u.id", "p.user_id")
  .select(["u.name", "p.title"]);

// ✅ Column aliases should compile (compilation test)
qb.selectFrom("users").select(["name as username", "email as userEmail"]);

// ✅ Complex multi-table query should compile
qb.selectFrom("users as u")
  .innerJoin("posts as p", "u.id", "p.user_id")
  .leftJoin("comments as c", "p.id", "c.post_id")
  .select(["u.name", "p.title", "c.content"]);

// ✅ Qualified column names should compile
qb.selectFrom("users as u").select(["u.id", "u.name"]);

// ✅ Unqualified columns with aliases should compile
qb.selectFrom("users as u").select(["id", "name"]);