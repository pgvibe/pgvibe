// Valid basic .leftJoin() tests - left joins without aliases

import {QueryBuilder} from '../../../../src/query-builder';
import type {TestDB} from '../../../__shared__/fixtures/test-schema';

const qb = new QueryBuilder<TestDB>();

// ✅ Basic left joins between related tables
qb.selectFrom('users').leftJoin('posts', 'users.id', 'posts.user_id');
qb.selectFrom('posts').leftJoin('users', 'posts.user_id', 'users.id');
qb.selectFrom('posts').leftJoin('comments', 'posts.id', 'comments.post_id');
qb.selectFrom('comments').leftJoin('posts', 'comments.post_id', 'posts.id');

// ✅ Reverse order join conditions should work
qb.selectFrom('users').leftJoin('posts', 'posts.user_id', 'users.id');
qb.selectFrom('posts').leftJoin('comments', 'comments.post_id', 'posts.id');

// ✅ Left joins to get optional related data
qb.selectFrom('users').leftJoin('posts', 'users.id', 'posts.user_id');
qb.selectFrom('posts').leftJoin('users', 'posts.user_id', 'users.id');

// ✅ Chain multiple left joins
qb.selectFrom('users')
  .leftJoin('posts', 'users.id', 'posts.user_id')
  .leftJoin('comments', 'posts.id', 'comments.post_id');

qb.selectFrom('comments')
  .leftJoin('posts', 'comments.post_id', 'posts.id')
  .leftJoin('users', 'posts.user_id', 'users.id');

// ✅ Mixed inner and left joins
qb.selectFrom('users')
  .innerJoin('posts', 'users.id', 'posts.user_id')
  .leftJoin('comments', 'posts.id', 'comments.post_id');

qb.selectFrom('posts')
  .leftJoin('users', 'posts.user_id', 'users.id')
  .innerJoin('comments', 'posts.id', 'comments.post_id');

// ✅ Left joins with column selection
qb.selectFrom('users')
  .leftJoin('posts', 'users.id', 'posts.user_id')
  .select(['users.name', 'posts.title']);

qb.selectFrom('posts')
  .leftJoin('comments', 'posts.id', 'comments.post_id')
  .select(['posts.title', 'comments.content']);