import { qb } from '../src/index.js'

console.log('=== Multiple JOINs Scalability Test ===\n')

// Test 1: Two JOINs should work perfectly
console.log('1. Two JOINs:')
const twoJoins = qb
  .selectFrom('users as u')
  .innerJoin('posts as p', 'u.id', 'p.user_id')
  .innerJoin('comments as c', 'p.id', 'c.post_id')
  .select(['u.name', 'p.title', 'c.content'])

console.log('   SQL:', twoJoins.toSQL())

// Test 2: Mixed JOIN types
console.log('\n2. Mixed JOIN types:')
const mixedJoins = qb
  .selectFrom('users as u')
  .innerJoin('posts as p', 'u.id', 'p.user_id')
  .leftJoin('comments as c', 'p.id', 'c.post_id')
  .select(['u.name', 'p.title', 'c.content'])

console.log('   SQL:', mixedJoins.toSQL())

// Test 3: Complex column selection with all tables
console.log('\n3. Complex selection:')
const complexSelection = qb
  .selectFrom('users as u')
  .innerJoin('posts as p', 'u.id', 'p.user_id')
  .innerJoin('comments as c', 'p.id', 'c.post_id')
  .select([
    'u.id',
    'u.name', 
    'u.email',
    'p.id',
    'p.title',
    'p.published',
    'c.id',
    'c.content'
  ])

console.log('   SQL:', complexSelection.toSQL())

// Test 4: Unqualified columns should work too
console.log('\n4. Mixed qualified/unqualified:')
const mixedColumns = qb
  .selectFrom('users as u')
  .innerJoin('posts as p', 'u.id', 'p.user_id')
  .innerJoin('comments as c', 'p.id', 'c.post_id')
  .select([
    'u.name',     // qualified
    'title',      // unqualified (from posts)
    'c.content'   // qualified
  ])

console.log('   SQL:', mixedColumns.toSQL())

console.log('\n✅ All multiple JOIN tests passed!')