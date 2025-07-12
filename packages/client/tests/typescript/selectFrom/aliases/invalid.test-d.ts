// Invalid .selectFrom() with table aliases - these should cause compilation errors

import {expectError} from 'tsd';
import {QueryBuilder} from '../../../../src/query-builder';
import type {TestDB} from '../../../__shared__/fixtures/test-schema';

const qb = new QueryBuilder<TestDB>();

// ❌ Invalid table names with aliases should cause errors
expectError(qb.selectFrom('invalid_table as i'));
expectError(qb.selectFrom('user as u')); // typo in table name
expectError(qb.selectFrom('post as p')); // typo in table name

// Note: Malformed alias syntax is handled by PostgreSQL at runtime
// TypeScript template literals can't validate these syntactic edge cases
// We focus on semantic validation (table existence) which TypeScript can handle