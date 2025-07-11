import { expectType, expectError } from 'tsd'
import { qb } from '../src/query-builder-v4.js'

// Test 1: Basic table selection should work
const basic = qb.selectFrom('users').select(['id', 'name', 'email'])
expectType<{ id: number; name: string; email: string }[]>(basic.execute())

// Test 2: Should error on invalid column
expectError(qb.selectFrom('users').select(['invalid_column']))

// Test 3: Aliased table should work with both qualified and unqualified columns
const aliased = qb.selectFrom('users as u').select(['id', 'u.name'])
expectType<{ id: number; name: string }[]>(aliased.execute())

// Test 4: Should error when using original table name with aliased table
expectError(qb.selectFrom('users as u').select(['users.id']))

// Test 5: JOIN should work with both tables' columns
const joined = qb
  .selectFrom('users as u')
  .innerJoin('posts as p', 'u.id', 'p.user_id')
  .select(['u.name', 'p.title'])

expectType<{ name: string; title: string }[]>(joined.execute())

// Test 6: Should error on invalid join columns
expectError(
  qb
    .selectFrom('users as u')
    .innerJoin('posts as p', 'u.invalid', 'p.user_id')
)

// Test 7: Should error when referencing table not in scope
expectError(
  qb
    .selectFrom('users as u')
    .select(['posts.title'])
)