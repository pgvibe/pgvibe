// Valid .innerJoin() with table aliases - these should all compile successfully

import {QueryBuilder} from '../../../../../src/query-builder';
import type {TestDB} from '../../../../__shared__/fixtures/test-schema';

const qb = new QueryBuilder<TestDB>();

// ✅ Inner joins with table aliases in FROM clause
qb.selectFrom('users as u').innerJoin('posts as p', 'u.id', 'p.user_id');
qb.selectFrom('posts as p').innerJoin('users as u', 'p.user_id', 'u.id');
qb.selectFrom('posts as p').innerJoin('comments as c', 'p.id', 'c.post_id');

// ✅ Mixed - alias in FROM, no alias in JOIN
qb.selectFrom('users as u').innerJoin('posts', 'u.id', 'posts.user_id');
qb.selectFrom('posts as p').innerJoin('comments', 'p.id', 'comments.post_id');

// ✅ No alias in FROM, alias in JOIN
qb.selectFrom('users').innerJoin('posts as p', 'users.id', 'p.user_id');
qb.selectFrom('posts').innerJoin('comments as c', 'posts.id', 'c.post_id');

// ✅ Chain multiple joins with aliases
qb.selectFrom('users as u')
  .innerJoin('posts as p', 'u.id', 'p.user_id')
  .innerJoin('comments as c', 'p.id', 'c.post_id');

qb.selectFrom('comments as c')
  .innerJoin('posts as p', 'c.post_id', 'p.id')
  .innerJoin('users as u', 'p.user_id', 'u.id');

// ✅ Inner joins with aliases and column selection
qb.selectFrom('users as u')
  .innerJoin('posts as p', 'u.id', 'p.user_id')
  .select(['u.name', 'p.title']);

qb.selectFrom('posts as p')
  .innerJoin('comments as c', 'p.id', 'c.post_id')
  .select(['p.title', 'c.content']);

// ✅ Unqualified column selection with table aliases
qb.selectFrom('users as u')
  .innerJoin('posts as p', 'u.id', 'p.user_id')
  .select(['name', 'title']); // Should work with aliases

// ✅ Different alias names
qb.selectFrom('users as authors').innerJoin('posts as articles', 'authors.id', 'articles.user_id');
qb.selectFrom('posts as content').innerJoin('comments as feedback', 'content.id', 'feedback.post_id');