import { qb } from '../src/query-builder-v4.js'

// Test 1: Basic table selection should work
const basic = qb.selectFrom('users').select(['id', 'name', 'email'])

console.log('Basic SQL:', basic.toSQL())

// Test 2: Aliased table should work  
const aliased = qb.selectFrom('users as u').select(['id', 'u.name'])

console.log('Aliased SQL:', aliased.toSQL())