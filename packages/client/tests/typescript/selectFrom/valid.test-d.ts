// Valid basic .selectFrom() tests - table selection without aliases

import {QueryBuilder} from '../../../src/query-builder';
import type {TestDB} from '../../__shared__/fixtures/test-schema';

const qb = new QueryBuilder<TestDB>();

// ✅ Valid table names should compile
qb.selectFrom('users');
qb.selectFrom('posts');
qb.selectFrom('comments');

// ✅ Basic table selection should work (compilation test)
qb.selectFrom('users');
qb.selectFrom('posts');
qb.selectFrom('comments');