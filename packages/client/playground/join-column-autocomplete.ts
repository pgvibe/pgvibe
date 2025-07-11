import { qb } from '../src/query-builder-v5.js'

console.log('=== 🔗 JOIN Column Autocomplete Test ===\n')

// Test JOIN column autocomplete
console.log('Testing JOIN column autocomplete...')

// Example 1: Basic JOIN - should show available columns
const join1 = qb
  .selectFrom('users as u')
  .innerJoin('posts as p', 'u.id', 'p.user_id')

console.log('Join 1 SQL:', join1.toSQL())

// Example 2: Multiple JOINs - should show columns from all tables
const join2 = qb
  .selectFrom('users as u')
  .innerJoin('posts as p', 'u.id', 'p.user_id')
  .leftJoin('comments as c', 'p.id', 'c.post_id')

console.log('Join 2 SQL:', join2.toSQL())

console.log('\n🧪 AUTOCOMPLETE TESTING ZONES:')
console.log('\nPlace cursor in the column parameters and test Ctrl+Space:')

console.log('\nTest 1 - First JOIN columns:')
console.log('// const test1 = qb.selectFrom("users as u").innerJoin("posts as p", "", "")') 
console.log('//   First param should show: u.id, u.name, u.email, u.active, p.id, p.user_id, p.title, p.published')
console.log('//   Second param should show the same columns')

console.log('\nTest 2 - Second JOIN columns:') 
console.log('// const test2 = qb.selectFrom("users as u")')
console.log('//   .innerJoin("posts as p", "u.id", "p.user_id")')
console.log('//   .leftJoin("comments as c", "", "")')
console.log('//   Should show: u.*, p.*, c.* columns')

console.log('\n🎯 Expected Column Autocomplete:')
console.log('   From users (u): u.id, u.name, u.email, u.active, id, name, email, active')
console.log('   From posts (p): p.id, p.user_id, p.title, p.published, user_id, title, published')  
console.log('   From comments (c): c.id, c.post_id, c.user_id, c.content, content, etc.')

export {}