// Invalid basic .selectFrom() tests - these should cause compilation errors

import {expectError} from 'tsd';
import {QueryBuilder} from '../../../src/query-builder';
import type {TestDB} from '../../__shared__/fixtures/test-schema';

const qb = new QueryBuilder<TestDB>();

// ❌ Invalid table names should cause errors
expectError(qb.selectFrom('invalid_table'));
expectError(qb.selectFrom('user')); // typo
expectError(qb.selectFrom('post')); // typo
expectError(qb.selectFrom('comment')); // typo
expectError(qb.selectFrom('')); // empty string

// ❌ Invalid argument types should cause errors
expectError(qb.selectFrom(null));
expectError(qb.selectFrom(undefined));
expectError(qb.selectFrom(123));
expectError(qb.selectFrom({}));
expectError(qb.selectFrom([]));