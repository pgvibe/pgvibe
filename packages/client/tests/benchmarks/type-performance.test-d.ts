// TypeScript compilation performance benchmark tests
// These tests measure type instantiation depth and compilation speed

import {expectType} from 'tsd';
import {QueryBuilder} from '../../src/query-builder';
import type {TestDB} from '../__shared__/fixtures/test-schema';

const qb = new QueryBuilder<TestDB>();

// === BASELINE PERFORMANCE TESTS ===

// Test 1: Simple operations (should be fast)
const simple = qb.selectFrom('users').select(['id', 'name']);
expectType<{ id: number; name: string }[]>(await simple.execute());

// Test 2: Complex chaining (measure type instantiation depth)
const complex = qb
  .selectFrom('users as u')
  .innerJoin('posts as p', 'u.id', 'p.user_id')
  .leftJoin('comments as c', 'p.id', 'c.post_id')
  .select(['u.name', 'p.title', 'c.content']);

expectType<{ 
  name: string; 
  title: string; 
  content: string; 
}[]>(await complex.execute());

// Test 3: Deep nesting (stress test for type system)
const deepNested = qb
  .selectFrom('users as u1')
  .innerJoin('posts as p1', 'u1.id', 'p1.user_id')
  .innerJoin('comments as c1', 'p1.id', 'c1.post_id')
  .select(['u1.id as user_id', 'p1.id as post_id', 'c1.id as comment_id'])
  .toSQL();

expectType<string>(deepNested);

// Test 4: Large selection arrays (test tuple type performance)
const largeSelection = qb.selectFrom('users').select([
  'id', 'name', 'email', 'active',
  'id as user_id', 'name as user_name', 'email as user_email'
]);

expectType<{
  id: number;
  name: string;
  email: string | null;
  active: boolean;
  user_id: number;
  user_name: string;
  user_email: string | null;
}[]>(await largeSelection.execute());

// Test 5: Multiple aliases (test alias exclusivity performance)
const multipleAliases = qb
  .selectFrom('users as u')
  .innerJoin('posts as p', 'u.id', 'p.user_id')
  .select(['u.name as author_name', 'p.title as post_title']);

expectType<{
  author_name: string;
  post_title: string;
}[]>(await multipleAliases.execute());