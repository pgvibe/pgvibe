// Valid .selectFrom() with table aliases - these should all compile successfully

import {QueryBuilder} from '../../../../src/query-builder';
import type {TestDB} from '../../../__shared__/fixtures/test-schema';

const qb = new QueryBuilder<TestDB>();

// ✅ Basic table aliases should compile
qb.selectFrom('users as u');
qb.selectFrom('posts as p');
qb.selectFrom('comments as c');

// ✅ Different alias names should compile
qb.selectFrom('users as authors');
qb.selectFrom('posts as articles');
qb.selectFrom('comments as feedback');

// ✅ Single letter aliases should compile
qb.selectFrom('users as u');
qb.selectFrom('posts as p');
qb.selectFrom('comments as c');

// ✅ Longer descriptive aliases should compile
qb.selectFrom('users as user_accounts');
qb.selectFrom('posts as blog_posts');
qb.selectFrom('comments as user_comments');