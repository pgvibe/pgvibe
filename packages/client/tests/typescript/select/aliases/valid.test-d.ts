// Valid .select() with column aliases - these should all compile successfully

import {QueryBuilder} from '../../../../src/query-builder';
import type {TestDB} from '../../../__shared__/fixtures/test-schema';

const qb = new QueryBuilder<TestDB>();

// ✅ Basic column aliases
qb.selectFrom('users').select(['name as username']);
qb.selectFrom('users').select(['email as userEmail']);
qb.selectFrom('users').select(['active as isActive']);

// ✅ Multiple column aliases
qb.selectFrom('users').select(['name as username', 'email as userEmail']);
qb.selectFrom('users').select(['id as userId', 'name as fullName', 'active as isActive']);

// ✅ Mixed regular columns and aliases
qb.selectFrom('users').select(['id', 'name as username']);
qb.selectFrom('users').select(['id', 'name as username', 'email']);

// ✅ Column aliases from different tables
qb.selectFrom('posts').select(['title as postTitle']);
qb.selectFrom('posts').select(['content as postContent']);
qb.selectFrom('comments').select(['content as commentText']);

// ✅ Qualified column aliases (table.column as alias)
qb.selectFrom('users').select(['users.name as username']);
qb.selectFrom('posts').select(['posts.title as postTitle']);

// ✅ Table aliases with column selection (no column aliases)
qb.selectFrom('users as u').select(['u.id']);
qb.selectFrom('users as u').select(['u.name']);
qb.selectFrom('users as u').select(['id', 'name']); // unqualified with table alias

// ✅ Table aliases with column aliases
qb.selectFrom('users as u').select(['u.name as username']);
qb.selectFrom('users as u').select(['name as username']); // unqualified column with alias
qb.selectFrom('posts as p').select(['p.title as postTitle']);

// ✅ Complex combinations
qb.selectFrom('users as u').select(['u.id', 'name as username', 'u.email as userEmail']);