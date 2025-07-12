// Valid basic .innerJoin() tests - inner joins without aliases

import {QueryBuilder} from '../../../../src/query-builder';
import type {TestDB} from '../../../__shared__/fixtures/test-schema';

const qb = new QueryBuilder<TestDB>();

// ✅ Basic inner joins between related tables
qb.selectFrom('users').innerJoin('posts', 'users.id', 'posts.user_id');
qb.selectFrom('posts').innerJoin('users', 'posts.user_id', 'users.id');
qb.selectFrom('posts').innerJoin('comments', 'posts.id', 'comments.post_id');
qb.selectFrom('comments').innerJoin('posts', 'comments.post_id', 'posts.id');

// ✅ Reverse order join conditions should work
qb.selectFrom('users').innerJoin('posts', 'posts.user_id', 'users.id');
qb.selectFrom('posts').innerJoin('comments', 'comments.post_id', 'posts.id');

// ✅ Self-referential joins (if supported)
qb.selectFrom('users').innerJoin('posts', 'users.id', 'posts.user_id');
qb.selectFrom('posts').innerJoin('users', 'posts.user_id', 'users.id');

// ✅ Chain multiple inner joins
qb.selectFrom('users')
  .innerJoin('posts', 'users.id', 'posts.user_id')
  .innerJoin('comments', 'posts.id', 'comments.post_id');

qb.selectFrom('comments')
  .innerJoin('posts', 'comments.post_id', 'posts.id')
  .innerJoin('users', 'posts.user_id', 'users.id');

// ✅ Inner joins with column selection
qb.selectFrom('users')
  .innerJoin('posts', 'users.id', 'posts.user_id')
  .select(['users.name', 'posts.title']);

qb.selectFrom('posts')
  .innerJoin('comments', 'posts.id', 'comments.post_id')
  .select(['posts.title', 'comments.content']);