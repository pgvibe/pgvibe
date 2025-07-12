// Invalid basic .innerJoin() tests - these should cause compilation errors

import {expectError} from 'tsd';
import {QueryBuilder} from '../../../../src/query-builder';
import type {TestDB} from '../../../__shared__/fixtures/test-schema';

const qb = new QueryBuilder<TestDB>();

// ❌ Invalid table names in joins should cause errors
expectError(qb.selectFrom('users').innerJoin('invalid_table', 'users.id', 'invalid_table.user_id'));
expectError(qb.selectFrom('users').innerJoin('post', 'users.id', 'post.user_id')); // typo

// ❌ Invalid column references should cause errors
expectError(qb.selectFrom('users').innerJoin('posts', 'users.invalid_column', 'posts.user_id'));
expectError(qb.selectFrom('users').innerJoin('posts', 'users.id', 'posts.invalid_column'));
expectError(qb.selectFrom('users').innerJoin('posts', 'users.nam', 'posts.user_id')); // typo

// ❌ Wrong table qualifiers should cause errors
expectError(qb.selectFrom('users').innerJoin('posts', 'posts.id', 'posts.user_id')); // both from posts
expectError(qb.selectFrom('users').innerJoin('posts', 'comments.id', 'posts.user_id')); // wrong table
expectError(qb.selectFrom('posts').innerJoin('users', 'comments.post_id', 'users.id')); // wrong table

// ❌ Non-existent columns should cause errors
expectError(qb.selectFrom('users').innerJoin('posts', 'users.title', 'posts.user_id')); // title not in users
expectError(qb.selectFrom('posts').innerJoin('users', 'posts.active', 'users.id')); // active not in posts

// ❌ Type mismatches in join conditions should cause errors (if type checking is enforced)
// Note: These might not error if join condition type checking is loose
expectError(qb.selectFrom('users').innerJoin('posts', 'users.name', 'posts.id')); // string vs number

// ❌ Invalid argument types should cause errors
expectError(qb.selectFrom('users').innerJoin(null, 'users.id', 'posts.user_id'));
expectError(qb.selectFrom('users').innerJoin(123, 'users.id', 'posts.user_id'));
expectError(qb.selectFrom('users').innerJoin('posts', null, 'posts.user_id'));
expectError(qb.selectFrom('users').innerJoin('posts', 'users.id', null));

// ❌ Empty strings should cause errors
expectError(qb.selectFrom('users').innerJoin('', 'users.id', 'posts.user_id'));
expectError(qb.selectFrom('users').innerJoin('posts', '', 'posts.user_id'));
expectError(qb.selectFrom('users').innerJoin('posts', 'users.id', ''));

// ❌ Mixed valid/invalid in chains should cause errors
expectError(qb.selectFrom('users')
  .innerJoin('posts', 'users.id', 'posts.user_id')
  .innerJoin('invalid_table', 'posts.id', 'invalid_table.post_id'));

expectError(qb.selectFrom('users')
  .innerJoin('posts', 'users.id', 'posts.user_id')
  .innerJoin('comments', 'posts.invalid_column', 'comments.post_id'));