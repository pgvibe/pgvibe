// Invalid .innerJoin() with aliases - these should cause compilation errors

import {expectError} from 'tsd';
import {QueryBuilder} from '../../../../../src/query-builder';
import type {TestDB} from '../../../../__shared__/fixtures/test-schema';

const qb = new QueryBuilder<TestDB>();

// ❌ Using original table name after alias should cause errors (alias exclusivity)
expectError(qb.selectFrom('users as u').innerJoin('posts as p', 'users.id', 'p.user_id')); // should use u.id
expectError(qb.selectFrom('users as u').innerJoin('posts as p', 'u.id', 'posts.user_id')); // should use p.user_id
expectError(qb.selectFrom('posts as p').innerJoin('comments as c', 'posts.id', 'c.post_id')); // should use p.id

// ❌ Using wrong alias should cause errors
expectError(qb.selectFrom('users as u').innerJoin('posts as p', 'x.id', 'p.user_id')); // x doesn't exist
expectError(qb.selectFrom('users as u').innerJoin('posts as p', 'u.id', 'x.user_id')); // x doesn't exist
expectError(qb.selectFrom('users as u').innerJoin('posts as p', 'p.id', 'u.user_id')); // wrong alias usage

// ❌ Mixed alias violations in chains should cause errors
expectError(qb.selectFrom('users as u')
  .innerJoin('posts as p', 'u.id', 'p.user_id')
  .innerJoin('comments as c', 'posts.id', 'c.post_id')); // should use p.id

expectError(qb.selectFrom('users as u')
  .innerJoin('posts as p', 'u.id', 'p.user_id')
  .innerJoin('comments as c', 'p.id', 'comments.post_id')); // should use c.post_id

// ❌ Invalid table names with aliases should cause errors
expectError(qb.selectFrom('users as u').innerJoin('invalid_table as i', 'u.id', 'i.user_id'));
expectError(qb.selectFrom('users as u').innerJoin('post as p', 'u.id', 'p.user_id')); // typo in table

// ❌ Invalid column references with aliases should cause errors
expectError(qb.selectFrom('users as u').innerJoin('posts as p', 'u.invalid_column', 'p.user_id'));
expectError(qb.selectFrom('users as u').innerJoin('posts as p', 'u.id', 'p.invalid_column'));

// ❌ Column selection violations with aliases should cause errors
expectError(qb.selectFrom('users as u')
  .innerJoin('posts as p', 'u.id', 'p.user_id')
  .select(['users.name', 'p.title'])); // should use u.name

expectError(qb.selectFrom('users as u')
  .innerJoin('posts as p', 'u.id', 'p.user_id')
  .select(['u.name', 'posts.title'])); // should use p.title

// ❌ Malformed alias syntax should cause errors
expectError(qb.selectFrom('users as u').innerJoin('posts as', 'u.id', 'posts.user_id')); // missing alias name
expectError(qb.selectFrom('users as u').innerJoin('posts p', 'u.id', 'p.user_id')); // missing 'as' keyword