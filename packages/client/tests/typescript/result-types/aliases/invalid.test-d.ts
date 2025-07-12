// Invalid result type expectations with aliases - these should cause compilation errors

import {expectError, expectType} from 'tsd';
import {QueryBuilder} from '../../../../src/query-builder';
import type {TestDB} from '../../../__shared__/fixtures/test-schema';

const qb = new QueryBuilder<TestDB>();

// ❌ Wrong type expectations for aliased operations should cause errors
const aliasedQuery = qb.selectFrom('users as u').select(['u.id', 'u.name']);
expectError(expectType<any>(aliasedQuery)); // should not be any
expectError(expectType<string>(aliasedQuery)); // should not be string
expectError(expectType<number>(aliasedQuery)); // should not be number

// ❌ Operations that violate alias exclusivity should fail
expectError(qb.selectFrom('users as u').select(['users.id'])); // should use u.id
expectError(qb.selectFrom('posts as p').select(['posts.title'])); // should use p.title

// ❌ Joins that violate alias exclusivity should fail
expectError(qb.selectFrom('users as u').innerJoin('posts as p', 'users.id', 'p.user_id')); // should use u.id
expectError(qb.selectFrom('users as u').innerJoin('posts as p', 'u.id', 'posts.user_id')); // should use p.user_id

// ❌ Complex operations with alias violations should fail
expectError(qb
  .selectFrom('users as u')
  .innerJoin('posts as p', 'u.id', 'p.user_id')
  .select(['users.name', 'p.title'])); // should use u.name

expectError(qb
  .selectFrom('users as u')
  .innerJoin('posts as p', 'u.id', 'p.user_id')
  .select(['u.name', 'posts.title'])); // should use p.title

// ❌ Invalid table/column combinations with aliases should fail
expectError(qb.selectFrom('users as u').select(['u.invalid_column']));
expectError(qb.selectFrom('invalid_table as i').select(['i.any_column']));