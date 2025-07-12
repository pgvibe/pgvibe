// Valid result type inference tests - these should all compile correctly

import {QueryBuilder} from '../../../src/query-builder';
import type {TestDB} from '../../__shared__/fixtures/test-schema';

const qb = new QueryBuilder<TestDB>();

// ✅ Basic selectFrom should compile (compilation test)
qb.selectFrom('users');
qb.selectFrom('posts');
qb.selectFrom('comments');

// ✅ Basic select operations should compile
qb.selectFrom('users').select(['id', 'name']);
qb.selectFrom('posts').select(['id', 'title']);

// ✅ Join operations should compile
qb.selectFrom('users').innerJoin('posts', 'users.id', 'posts.user_id');
qb.selectFrom('users').leftJoin('posts', 'users.id', 'posts.user_id');

// ✅ Chained operations should compile
qb.selectFrom('users')
  .innerJoin('posts', 'users.id', 'posts.user_id')
  .select(['users.name', 'posts.title']);

// ✅ With table aliases should compile
qb.selectFrom('users as u').select(['u.id', 'u.name']);

// ✅ Complex join with aliases should compile
qb.selectFrom('users as u')
  .innerJoin('posts as p', 'u.id', 'p.user_id')
  .leftJoin('comments as c', 'p.id', 'c.post_id')
  .select(['u.name', 'p.title', 'c.content']);