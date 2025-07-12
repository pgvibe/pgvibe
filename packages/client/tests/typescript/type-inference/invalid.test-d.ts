// Invalid TypeScript type inference tests - these should all cause compilation errors

import {expectError} from 'tsd';
import {QueryBuilder} from '../../../src/query-builder';
import type {TestDB} from '../../__shared__/fixtures/test-schema';

const qb = new QueryBuilder<TestDB>();

// ❌ Invalid table names should cause errors
expectError(qb.selectFrom('invalid_table'));
expectError(qb.selectFrom('user')); // typo

// ❌ Invalid column names should cause errors
expectError(qb.selectFrom('users').select(['invalid_column']));
expectError(qb.selectFrom('users').select(['nam'])); // typo
expectError(qb.selectFrom('users').select(['title'])); // wrong table column

// ❌ Wrong qualified column names should cause errors  
expectError(qb.selectFrom('users').select(['posts.title'])); // wrong table qualifier
expectError(qb.selectFrom('posts').select(['users.name'])); // wrong table qualifier

// ❌ Alias violations should cause errors
expectError(qb.selectFrom('users as u').select(['users.id'])); // original name after alias
expectError(qb.selectFrom('posts as p').select(['posts.title'])); // original name after alias

// ❌ Invalid join conditions should cause errors
expectError(qb.selectFrom('users as u').innerJoin('posts as p', 'u.invalid_column', 'p.user_id'));
expectError(qb.selectFrom('users as u').innerJoin('posts as p', 'u.id', 'p.invalid_column'));
expectError(qb.selectFrom('users as u').innerJoin('invalid_table as i', 'u.id', 'i.user_id'));

// ❌ Wrong alias usage in joins should cause errors
expectError(qb.selectFrom('users as u').innerJoin('posts as p', 'users.id', 'p.user_id')); // wrong alias

// ❌ Invalid argument types should cause errors
expectError(qb.selectFrom(null));
expectError(qb.selectFrom(undefined));
expectError(qb.selectFrom(123));
expectError(qb.selectFrom({}));
expectError(qb.selectFrom([]));

// ❌ Invalid select argument types should cause errors
expectError(qb.selectFrom('users').select(null));
expectError(qb.selectFrom('users').select(undefined));
expectError(qb.selectFrom('users').select('id')); // should be array
expectError(qb.selectFrom('users').select([123])); // invalid column type