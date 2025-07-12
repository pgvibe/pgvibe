// Invalid .select() with aliases - these should cause compilation errors

import {expectError} from 'tsd';
import {QueryBuilder} from '../../../../src/query-builder';
import type {TestDB} from '../../../__shared__/fixtures/test-schema';

const qb = new QueryBuilder<TestDB>();

// ❌ Using original table name after alias should cause errors (alias exclusivity)
expectError(qb.selectFrom('users as u').select(['users.id'])); // should use u.id
expectError(qb.selectFrom('posts as p').select(['posts.title'])); // should use p.title
expectError(qb.selectFrom('comments as c').select(['comments.content'])); // should use c.content

// ❌ Using wrong alias should cause errors
expectError(qb.selectFrom('users as u').select(['p.id'])); // p alias doesn't exist
expectError(qb.selectFrom('posts as p').select(['u.title'])); // u alias doesn't exist

// ❌ Invalid column aliases - malformed syntax
expectError(qb.selectFrom('users').select(['name as'])); // missing alias name
expectError(qb.selectFrom('users').select(['name as '])); // empty alias name
expectError(qb.selectFrom('users').select(['name as as username'])); // double 'as'
expectError(qb.selectFrom('users').select(['name username'])); // missing 'as' keyword

// ❌ Invalid column names with aliases should still cause errors
expectError(qb.selectFrom('users').select(['invalid_column as alias']));
expectError(qb.selectFrom('users').select(['title as postTitle'])); // title not in users

// ❌ Wrong qualified columns with aliases should cause errors
expectError(qb.selectFrom('users').select(['posts.title as postTitle'])); // wrong table
expectError(qb.selectFrom('users as u').select(['posts.title as alias'])); // wrong table with alias

// ❌ Mixed valid/invalid with aliases should cause errors
expectError(qb.selectFrom('users').select(['name as username', 'invalid_column as alias']));
expectError(qb.selectFrom('users as u').select(['u.name as username', 'users.id as userId'])); // mixed alias usage