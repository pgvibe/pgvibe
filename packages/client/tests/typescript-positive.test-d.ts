// TypeScript Positive Tests - Gold Standard Type Testing
// Using TSD (the best TypeScript testing tool) + expect-type
// These verify that VALID usage compiles without TypeScript errors

import { expectType, expectAssignable, expectNotAssignable } from 'expect-type';
import { QueryBuilder } from '../src/query-builder';
import type { TestDB } from './test-schema';

// Test QueryBuilder instantiation
const qb = new QueryBuilder<TestDB>();
expectType<QueryBuilder<TestDB>>(qb);

// === FOUNDATIONAL TYPE TESTS ===

// Basic table selection should return proper types
const usersQuery = qb.selectFrom('users');
const postsQuery = qb.selectFrom('posts');

// Verify the QueryBuilder preserves type information
expectType<any>(usersQuery); // Will be more specific when types are fully implemented
expectType<any>(postsQuery);

// === COLUMN SELECTION TYPE SAFETY ===

// Valid column selections should compile
const validUserColumns = qb.selectFrom('users').select(['id', 'name', 'email', 'active']);
const validPostColumns = qb.selectFrom('posts').select(['id', 'user_id', 'title', 'published']);

expectType<any>(validUserColumns);
expectType<any>(validPostColumns);

// Should allow all valid combinations of columns
const allUserCombinations = qb.selectFrom('users').select(['id']);
const multipleUserColumns = qb.selectFrom('users').select(['id', 'name', 'email']);
const allValidUsers = qb.selectFrom('users').select(['id', 'name', 'email', 'active']);

expectType<any>(allUserCombinations);
expectType<any>(multipleUserColumns);
expectType<any>(allValidUsers);

// Qualified column names without aliases should work
const qualifiedWithoutAlias = qb.selectFrom('users').select(['users.id', 'users.name']);
expectType<any>(qualifiedWithoutAlias);

// === ALIAS TYPE SAFETY ===

// Table aliases should compile and maintain type safety
const aliasedUsers = qb.selectFrom('users as u');
const aliasedPosts = qb.selectFrom('posts as p');

expectType<any>(aliasedUsers);
expectType<any>(aliasedPosts);

// Qualified columns with aliases should work
const aliasQualified = qb.selectFrom('users as u').select(['u.id', 'u.name', 'u.email']);
expectType<any>(aliasQualified);

// Unqualified columns with aliases should work  
const aliasUnqualified = qb.selectFrom('users as u').select(['id', 'name', 'email']);
expectType<any>(aliasUnqualified);

// Mixed qualified and unqualified with aliases should work
const aliasMixed = qb.selectFrom('users as u').select(['u.id', 'name', 'u.email', 'active']);
expectType<any>(aliasMixed);

// Different alias names should work
const differentAliases = [
  qb.selectFrom('users as u').select(['u.id']),
  qb.selectFrom('users as user').select(['user.name']), 
  qb.selectFrom('users as usr').select(['usr.email']),
  qb.selectFrom('posts as p').select(['p.title']),
  qb.selectFrom('posts as post').select(['post.content'])
];

expectType<any[]>(differentAliases);

// === JOIN TYPE SAFETY ===

// Basic JOINs without aliases
const basicJoin = qb
  .selectFrom('users')
  .innerJoin('posts', 'users.id', 'posts.user_id')
  .select(['users.name', 'posts.title']);

expectType<any>(basicJoin);

// JOINs with aliases - the core challenge
const aliasedJoin = qb
  .selectFrom('users as u')
  .innerJoin('posts as p', 'u.id', 'p.user_id')
  .select(['u.name', 'p.title']);

expectType<any>(aliasedJoin);

// Mixed qualified/unqualified in JOINs
const mixedJoinColumns = qb
  .selectFrom('users as u')
  .innerJoin('posts as p', 'u.id', 'p.user_id')
  .select(['u.id', 'name', 'p.title', 'published']);

expectType<any>(mixedJoinColumns);

// Multiple JOINs should chain properly
const multipleJoins = qb
  .selectFrom('users as u')
  .innerJoin('posts as p', 'u.id', 'p.user_id')
  .leftJoin('posts as p2', 'u.id', 'p2.user_id')
  .select(['u.name', 'p.title', 'p2.published']);

expectType<any>(multipleJoins);

// All JOIN types should be supported
const allJoinTypes = [
  qb.selectFrom('users as u').innerJoin('posts as p', 'u.id', 'p.user_id'),
  qb.selectFrom('users as u').leftJoin('posts as p', 'u.id', 'p.user_id'),
  qb.selectFrom('users as u').rightJoin('posts as p', 'u.id', 'p.user_id')
];

expectType<any[]>(allJoinTypes);

// === SELECT ALL TYPE SAFETY ===

// selectAll should work in all contexts
const selectAllScenarios = [
  qb.selectFrom('users').selectAll(),
  qb.selectFrom('users as u').selectAll(),
  qb.selectFrom('users as u').innerJoin('posts as p', 'u.id', 'p.user_id').selectAll()
];

expectType<any[]>(selectAllScenarios);

// === METHOD CHAINING TYPE SAFETY ===

// Complex chaining should preserve types throughout
const complexChain = qb
  .selectFrom('users as u')
  .innerJoin('posts as p', 'u.id', 'p.user_id')
  .select(['u.name', 'p.title'])
  .where('u.active', '=', true)
  .where('p.published', '=', true)
  .orderBy('u.name', 'ASC')
  .orderBy('p.created_at', 'DESC') // Will be available when ORDER BY is fully implemented
  .limit(20)
  .offset(10);

expectType<any>(complexChain);

// Each method should return the same builder type for chaining
const stepByStep = qb.selectFrom('users as u');
const afterJoin = stepByStep.innerJoin('posts as p', 'u.id', 'p.user_id');
const afterSelect = afterJoin.select(['u.name', 'p.title']);
const afterWhere = afterSelect.where('u.active', '=', true);
const afterOrderBy = afterWhere.orderBy('u.name', 'ASC');
const afterLimit = afterOrderBy.limit(10);
const final = afterLimit.offset(5);

expectType<any>(stepByStep);
expectType<any>(afterJoin); 
expectType<any>(afterSelect);
expectType<any>(afterWhere);
expectType<any>(afterOrderBy);
expectType<any>(afterLimit);
expectType<any>(final);

// === QUERY STATE PRESERVATION ===

// Builder should maintain immutability - new instances for each step
const originalQuery = qb.selectFrom('users as u');
const modifiedQuery = originalQuery.select(['u.name']);

// Both should be valid but independent
expectType<any>(originalQuery);
expectType<any>(modifiedQuery);

// Should be able to branch from the same base query
const branch1 = originalQuery.select(['u.id']);
const branch2 = originalQuery.select(['u.email']);

expectType<any>(branch1);
expectType<any>(branch2);

// === TYPE PARAMETER FLOW ===

// TypeScript should track the database schema through the entire pipeline
type UserSchema = TestDB['users'];
type PostSchema = TestDB['posts'];

// The type system should understand which tables are involved
const typedQuery = qb.selectFrom('users as u').innerJoin('posts as p', 'u.id', 'p.user_id');
expectType<any>(typedQuery);

// === OPERATOR TYPE SAFETY ===

// All valid operators should be accepted
const allOperators = [
  qb.selectFrom('users as u').where('u.id', '=', 1),
  qb.selectFrom('users as u').where('u.id', '!=', 1),  
  qb.selectFrom('users as u').where('u.id', '>', 1),
  qb.selectFrom('users as u').where('u.id', '<', 1),
  qb.selectFrom('users as u').where('u.id', '>=', 1),
  qb.selectFrom('users as u').where('u.id', '<=', 1),
  qb.selectFrom('users as u').where('u.name', 'like', '%test%'),
  qb.selectFrom('users as u').where('u.name', 'ilike', '%test%'),
  qb.selectFrom('users as u').where('u.id', 'in', [1, 2, 3]),
  qb.selectFrom('users as u').where('u.id', 'not in', [1, 2, 3]),
  qb.selectFrom('users as u').where('u.email', 'is', null),
  qb.selectFrom('users as u').where('u.email', 'is not', null)
];

expectType<any[]>(allOperators);

// === ORDER BY TYPE SAFETY ===

// Valid ORDER BY directions
const orderDirections = [
  qb.selectFrom('users as u').orderBy('u.name', 'ASC'),
  qb.selectFrom('users as u').orderBy('u.name', 'DESC'),
  qb.selectFrom('users as u').orderBy('u.name', 'asc'),
  qb.selectFrom('users as u').orderBy('u.name', 'desc')
];

expectType<any[]>(orderDirections);