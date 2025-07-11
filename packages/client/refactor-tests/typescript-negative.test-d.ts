// TypeScript Negative Tests - Things that SHOULD NOT compile
// These test cases verify that invalid usage produces TypeScript errors

import { expectError } from 'expect-type';
import { QueryBuilder } from '../src/query-builder';
import type { TestDB } from './test-schema';

const qb = new QueryBuilder<TestDB>();

// === INVALID TABLE NAMES ===

// @ts-expect-error - nonexistent table should not be allowed
expectError(qb.selectFrom('nonexistent_table'));

// @ts-expect-error - typo in table name should not be allowed  
expectError(qb.selectFrom('user'));

// @ts-expect-error - typo in table name should not be allowed
expectError(qb.selectFrom('post'));

// === INVALID COLUMN NAMES ===

// @ts-expect-error - nonexistent column should not be allowed
expectError(qb.selectFrom('users').select(['nonexistent_column']));

// @ts-expect-error - typo in column name should not be allowed
expectError(qb.selectFrom('users').select(['nam'])); // typo: 'name'

// @ts-expect-error - column from wrong table should not be allowed
expectError(qb.selectFrom('users').select(['title'])); // title is from posts table

// @ts-expect-error - column from wrong table should not be allowed  
expectError(qb.selectFrom('posts').select(['email'])); // email is from users table

// === ALIAS EXCLUSIVITY VIOLATIONS ===

// When using alias, original table name should be forbidden

// @ts-expect-error - users.id should not be allowed when using alias 'u'
expectError(qb.selectFrom('users as u').select(['users.id']));

// @ts-expect-error - users.name should not be allowed when using alias 'u'
expectError(qb.selectFrom('users as u').select(['users.name', 'users.email']));

// @ts-expect-error - posts.title should not be allowed when using alias 'p'
expectError(qb.selectFrom('posts as p').select(['posts.title']));

// @ts-expect-error - mixed invalid: users.id not allowed with alias
expectError(qb.selectFrom('users as u').select(['u.name', 'users.id']));

// === INVALID QUALIFIED COLUMNS ===

// @ts-expect-error - wrong table qualifier
expectError(qb.selectFrom('users').select(['posts.id']));

// @ts-expect-error - wrong table qualifier
expectError(qb.selectFrom('posts').select(['users.name']));

// @ts-expect-error - nonexistent table qualifier
expectError(qb.selectFrom('users').select(['comments.id']));

// @ts-expect-error - alias not defined
expectError(qb.selectFrom('users').select(['u.id'])); // no alias defined

// @ts-expect-error - wrong alias
expectError(qb.selectFrom('users as u').select(['p.id'])); // p alias not defined

// === INVALID JOIN SCENARIOS ===

// @ts-expect-error - invalid table in JOIN
expectError(qb.selectFrom('users').innerJoin('nonexistent_table', 'users.id', 'nonexistent_table.user_id'));

// @ts-expect-error - invalid column in JOIN condition  
expectError(qb.selectFrom('users').innerJoin('posts', 'users.nonexistent', 'posts.user_id'));

// @ts-expect-error - invalid column in JOIN condition
expectError(qb.selectFrom('users').innerJoin('posts', 'users.id', 'posts.nonexistent'));

// @ts-expect-error - alias exclusivity in JOIN: users.id not allowed with alias
expectError(
  qb.selectFrom('users as u')
    .innerJoin('posts as p', 'users.id', 'p.user_id') // should be 'u.id'
    .select(['u.name'])
);

// @ts-expect-error - alias exclusivity in JOIN: posts.user_id not allowed with alias
expectError(
  qb.selectFrom('users as u')
    .innerJoin('posts as p', 'u.id', 'posts.user_id') // should be 'p.user_id'
    .select(['u.name'])
);

// === INVALID SELECT AFTER JOIN ===

// @ts-expect-error - column from non-joined table
expectError(
  qb.selectFrom('users as u')
    .innerJoin('posts as p', 'u.id', 'p.user_id')
    .select(['u.name', 'comments.content']) // comments not joined
);

// @ts-expect-error - alias exclusivity after JOIN
expectError(
  qb.selectFrom('users as u')
    .innerJoin('posts as p', 'u.id', 'p.user_id')
    .select(['users.name', 'p.title']) // should be 'u.name'
);

// @ts-expect-error - alias exclusivity after JOIN
expectError(
  qb.selectFrom('users as u')
    .innerJoin('posts as p', 'u.id', 'p.user_id')
    .select(['u.name', 'posts.title']) // should be 'p.title'
);

// === INVALID WHERE CLAUSES ===

// @ts-expect-error - nonexistent column in WHERE
expectError(qb.selectFrom('users').where('nonexistent_column', '=', 'value'));

// @ts-expect-error - column from wrong table in WHERE
expectError(qb.selectFrom('users').where('title', '=', 'value')); // title is from posts

// @ts-expect-error - alias exclusivity in WHERE
expectError(qb.selectFrom('users as u').where('users.active', '=', true)); // should be 'u.active' or 'active'

// === INVALID ORDER BY ===

// @ts-expect-error - nonexistent column in ORDER BY
expectError(qb.selectFrom('users').orderBy('nonexistent_column', 'ASC'));

// @ts-expect-error - column from wrong table in ORDER BY
expectError(qb.selectFrom('users').orderBy('title', 'ASC')); // title is from posts

// @ts-expect-error - alias exclusivity in ORDER BY
expectError(qb.selectFrom('users as u').orderBy('users.name', 'ASC')); // should be 'u.name' or 'name'

// @ts-expect-error - invalid ORDER BY direction
expectError(qb.selectFrom('users').orderBy('name', 'INVALID'));

// === INVALID METHOD CHAINING ===

// @ts-expect-error - trying to use invalid methods
expectError(qb.selectFrom('users').invalidMethod());

// @ts-expect-error - wrong parameter types
expectError(qb.selectFrom('users').limit('invalid')); // should be number

// @ts-expect-error - wrong parameter types  
expectError(qb.selectFrom('users').offset('invalid')); // should be number