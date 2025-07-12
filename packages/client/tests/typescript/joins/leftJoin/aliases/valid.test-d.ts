// Valid .leftJoin() with table aliases - these should all compile successfully

import {QueryBuilder} from '../../../../../src/query-builder';
import type {TestDB} from '../../../../__shared__/fixtures/test-schema';

const qb = new QueryBuilder<TestDB>();

// ✅ Left joins with table aliases in FROM clause
qb.selectFrom('users as u').leftJoin('posts as p', 'u.id', 'p.user_id');
qb.selectFrom('posts as p').leftJoin('users as u', 'p.user_id', 'u.id');
qb.selectFrom('posts as p').leftJoin('comments as c', 'p.id', 'c.post_id');

// ✅ Mixed - alias in FROM, no alias in JOIN
qb.selectFrom('users as u').leftJoin('posts', 'u.id', 'posts.user_id');
qb.selectFrom('posts as p').leftJoin('comments', 'p.id', 'comments.post_id');

// ✅ No alias in FROM, alias in JOIN
qb.selectFrom('users').leftJoin('posts as p', 'users.id', 'p.user_id');
qb.selectFrom('posts').leftJoin('comments as c', 'posts.id', 'c.post_id');

// ✅ Chain multiple left joins with aliases
qb.selectFrom('users as u')
  .leftJoin('posts as p', 'u.id', 'p.user_id')
  .leftJoin('comments as c', 'p.id', 'c.post_id');

qb.selectFrom('comments as c')
  .leftJoin('posts as p', 'c.post_id', 'p.id')
  .leftJoin('users as u', 'p.user_id', 'u.id');

// ✅ Mixed inner and left joins with aliases
qb.selectFrom('users as u')
  .innerJoin('posts as p', 'u.id', 'p.user_id')
  .leftJoin('comments as c', 'p.id', 'c.post_id');

qb.selectFrom('posts as p')
  .leftJoin('users as u', 'p.user_id', 'u.id')
  .innerJoin('comments as c', 'p.id', 'c.post_id');

// ✅ Left joins with aliases and column selection
qb.selectFrom('users as u')
  .leftJoin('posts as p', 'u.id', 'p.user_id')
  .select(['u.name', 'p.title']);

qb.selectFrom('posts as p')
  .leftJoin('comments as c', 'p.id', 'c.post_id')
  .select(['p.title', 'c.content']);

// ✅ Unqualified column selection with table aliases (should work)
qb.selectFrom('users as u')
  .leftJoin('posts as p', 'u.id', 'p.user_id')
  .select(['name', 'title']); // Should work with aliases

// ✅ Different alias names
qb.selectFrom('users as authors').leftJoin('posts as articles', 'authors.id', 'articles.user_id');
qb.selectFrom('posts as content').leftJoin('comments as feedback', 'content.id', 'feedback.post_id');