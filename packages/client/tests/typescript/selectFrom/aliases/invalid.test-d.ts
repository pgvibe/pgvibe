// Invalid .selectFrom() with table aliases - these should cause compilation errors

import {expectError} from 'tsd';
import {QueryBuilder} from '../../../../src/query-builder';
import type {TestDB} from '../../../__shared__/fixtures/test-schema';

const qb = new QueryBuilder<TestDB>();

// ❌ Invalid table names with aliases should cause errors
expectError(qb.selectFrom('invalid_table as i'));
expectError(qb.selectFrom('user as u')); // typo in table name
expectError(qb.selectFrom('post as p')); // typo in table name

// ❌ Malformed alias syntax should cause errors
expectError(qb.selectFrom('users as')); // missing alias name
expectError(qb.selectFrom('users as ')); // empty alias name
expectError(qb.selectFrom('users as  ')); // whitespace only alias
expectError(qb.selectFrom('users as as u')); // double 'as'
expectError(qb.selectFrom('users u')); // missing 'as' keyword

// ❌ Invalid alias characters/formats should cause errors (if applicable)
expectError(qb.selectFrom('users as 123')); // numeric alias
expectError(qb.selectFrom('users as user-alias')); // hyphen in alias