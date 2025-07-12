// Valid result type inference with aliases - these should all compile correctly

import {QueryBuilder} from '../../../../src/query-builder';
import type {TestDB} from '../../../__shared__/fixtures/test-schema';

const qb = new QueryBuilder<TestDB>();

// ✅ Table aliases should compile correctly
qb.selectFrom('users as u');
qb.selectFrom('posts as p');
qb.selectFrom('comments as c');

// ✅ Select with table aliases should compile
qb.selectFrom('users as u').select(['u.id', 'u.name']);

// ✅ Joins with aliases should compile
qb.selectFrom('users as u').innerJoin('posts as p', 'u.id', 'p.user_id');
qb.selectFrom('users as u').leftJoin('posts as p', 'u.id', 'p.user_id');

// ✅ Complex operations with aliases should compile
qb.selectFrom('users as u')
  .innerJoin('posts as p', 'u.id', 'p.user_id')
  .leftJoin('comments as c', 'p.id', 'c.post_id')
  .select(['u.name', 'p.title', 'c.content']);

// ✅ Mixed alias and no-alias operations should compile
qb.selectFrom('users as u')
  .innerJoin('posts', 'u.id', 'posts.user_id')
  .select(['u.name', 'posts.title']);

// ✅ Different alias names should compile
qb.selectFrom('users as authors').innerJoin('posts as articles', 'authors.id', 'articles.user_id');