// Valid basic .select() tests - column selection without aliases

import {QueryBuilder} from '../../../src/query-builder';
import type {TestDB} from '../../__shared__/fixtures/test-schema';

const qb = new QueryBuilder<TestDB>();

// ✅ Single column selection
qb.selectFrom('users').select(['id']);
qb.selectFrom('users').select(['name']);
qb.selectFrom('users').select(['email']);
qb.selectFrom('users').select(['active']);

// ✅ Multiple column selection from users table
qb.selectFrom('users').select(['id', 'name']);
qb.selectFrom('users').select(['id', 'name', 'email']);
qb.selectFrom('users').select(['id', 'name', 'email', 'active']);

// ✅ Column selection from posts table
qb.selectFrom('posts').select(['id']);
qb.selectFrom('posts').select(['title']);
qb.selectFrom('posts').select(['content']);
qb.selectFrom('posts').select(['user_id']);
qb.selectFrom('posts').select(['id', 'title', 'content']);

// ✅ Column selection from comments table
qb.selectFrom('comments').select(['id']);
qb.selectFrom('comments').select(['content']);
qb.selectFrom('comments').select(['post_id']);
qb.selectFrom('comments').select(['user_id']);
qb.selectFrom('comments').select(['id', 'content', 'post_id']);

// ✅ Qualified column names (table.column) - no aliases
qb.selectFrom('users').select(['users.id', 'users.name']);
qb.selectFrom('posts').select(['posts.title', 'posts.content']);
qb.selectFrom('comments').select(['comments.content', 'comments.post_id']);

// ✅ Mixed qualified and unqualified columns
qb.selectFrom('users').select(['id', 'users.name', 'email']);
qb.selectFrom('posts').select(['posts.id', 'title', 'posts.user_id']);