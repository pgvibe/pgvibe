// Invalid result type operations - these should cause compilation errors

import {expectError} from 'tsd';
import {QueryBuilder} from '../../../src/query-builder';
import type {TestDB} from '../../__shared__/fixtures/test-schema';

const qb = new QueryBuilder<TestDB>();

// ❌ Invalid operations that should never work
expectError(qb.selectFrom('invalid_table')); // This should fail at the selectFrom level
expectError(qb.selectFrom('users').select(['invalid_column'])); // This should fail at the select level

// ❌ Invalid join operations should fail
expectError(qb.selectFrom('users').innerJoin('invalid_table', 'users.id', 'invalid_table.id'));
expectError(qb.selectFrom('users').innerJoin('posts', 'users.invalid_column', 'posts.user_id'));