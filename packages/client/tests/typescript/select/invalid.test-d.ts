// Invalid basic .select() tests - these should cause compilation errors

import {expectError} from 'tsd';
import {QueryBuilder} from '../../../src/query-builder';
import type {TestDB} from '../../__shared__/fixtures/test-schema';

const qb = new QueryBuilder<TestDB>();

// ❌ Invalid column names should cause errors
expectError(qb.selectFrom('users').select(['invalid_column']));
expectError(qb.selectFrom('users').select(['nam'])); // typo in 'name'
expectError(qb.selectFrom('users').select(['emil'])); // typo in 'email'

// ❌ Columns from wrong tables should cause errors
expectError(qb.selectFrom('users').select(['title'])); // title is from posts
expectError(qb.selectFrom('users').select(['content'])); // content is from posts/comments
expectError(qb.selectFrom('posts').select(['active'])); // active is from users
expectError(qb.selectFrom('comments').select(['name'])); // name is from users

// ❌ Wrong qualified column names should cause errors
expectError(qb.selectFrom('users').select(['posts.title'])); // wrong table qualifier
expectError(qb.selectFrom('posts').select(['users.name'])); // wrong table qualifier
expectError(qb.selectFrom('comments').select(['posts.content'])); // wrong table qualifier

// ❌ Non-existent qualified columns should cause errors
expectError(qb.selectFrom('users').select(['users.title'])); // title not in users
expectError(qb.selectFrom('posts').select(['posts.active'])); // active not in posts

// ❌ Mixed valid/invalid columns should cause errors
expectError(qb.selectFrom('users').select(['id', 'invalid_column']));
expectError(qb.selectFrom('users').select(['name', 'title'])); // title not in users

// ❌ Invalid argument types should cause errors
expectError(qb.selectFrom('users').select(null));
expectError(qb.selectFrom('users').select(undefined));
expectError(qb.selectFrom('users').select('id')); // should be array
expectError(qb.selectFrom('users').select([123])); // invalid column type
expectError(qb.selectFrom('users').select([null]));
expectError(qb.selectFrom('users').select([{}]));

// ❌ Empty arrays should cause errors (need at least one column)
expectError(qb.selectFrom('users').select([]));