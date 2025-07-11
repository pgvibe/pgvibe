import { qb } from '../src/index.js'

// Test basic single table autocomplete
const basicQuery = qb.selectFrom('users')

// This should show autocomplete for 'id', 'name', 'email'
const basicSelect = basicQuery.select(['id', 'name', 'email'])

// Test aliased table autocomplete  
const aliasedQuery = qb.selectFrom('users as u')

// This should show autocomplete for 'id', 'name', 'email' (unqualified)
// AND 'u.id', 'u.name', 'u.email' (qualified with alias)
// But NOT 'users.id', 'users.name', 'users.email' (original table name should be forbidden)
const aliasedSelect = aliasedQuery.select(['id', 'u.name'])

// Test JOIN autocomplete
const joinQuery = qb
  .selectFrom('users as u')
  .innerJoin('posts as p', 'u.id', 'p.user_id')

// This should show autocomplete for:
// - 'id', 'name', 'email' (unqualified from users)
// - 'title', 'content', 'user_id' (unqualified from posts) 
// - 'u.id', 'u.name', 'u.email' (qualified from users)
// - 'p.title', 'p.content', 'p.user_id' (qualified from posts)
// But NOT 'users.id' or 'posts.title' (original table names forbidden)
const joinSelect = joinQuery.select(['u.name', 'p.title'])

console.log('Basic SQL:', basicSelect.toSQL())
console.log('Aliased SQL:', aliasedSelect.toSQL())
console.log('Join SQL:', joinSelect.toSQL())