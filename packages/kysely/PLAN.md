# @pgvibe/kysely Development Plan

## 🎯 Vision: The Ultimate PostgreSQL Experience for Kysely

**"Perfect PostgreSQL-native syntax with TypeScript safety that makes developers fall in love with SQL again"**

## ✨ Target API Syntax (The Dream)

### **🎨 Array Operations**
```typescript
import { array } from '@pgvibe/kysely'

// Beautiful, readable array operations
await db
  .selectFrom('products')
  .selectAll()
  .where(array('tags').includes('featured'))           // tags @> ARRAY['featured']
  .where(array('categories').overlaps(['tech', 'ai'])) // categories && ARRAY['tech', 'ai']
  .where(array('colors').contains(['red', 'blue']))    // colors @> ARRAY['red', 'blue']
  .where(array('sizes').containedBy(['S', 'M', 'L'])) // sizes <@ ARRAY['S', 'M', 'L']
  .where(array('tags').length(), '>', 3)               // array_length(tags, 1) > 3
  .execute()

// Advanced array operations
await db
  .selectFrom('orders')
  .selectAll() 
  .where('status', '=', array('valid_statuses').any()) // status = ANY(valid_statuses)
  .execute()
```

### **🎨 JSON/JSONB Operations**
```typescript
import { json } from '@pgvibe/kysely'

// Elegant JSON operations
await db
  .selectFrom('users')
  .selectAll()
  .where(json('preferences').get('theme').equals('dark'))           // preferences->'theme' = '"dark"'
  .where(json('metadata').getText('language'), '=', 'en')          // metadata->>'language' = 'en'
  .where(json('settings').path(['ui', 'sidebar']).equals(true))    // settings#>'{ui,sidebar}' = 'true'
  .where(json('profile').contains({verified: true}))               // profile @> '{"verified":true}'
  .where(json('data').hasKey('email'))                             // data ? 'email'
  .where(json('permissions').hasAllKeys(['read', 'write']))        // permissions ?& array['read','write']
  .execute()

// Complex JSON path operations
await db
  .selectFrom('documents')
  .select([
    'id',
    json('metadata').path('$.author.name').asText().as('author_name'),
    json('stats').getText('view_count').as('views')
  ])
  .where(json('metadata').path(['content', 'type']).equals('article'))
  .execute()
```

### **🎨 Vector Operations (pgvector)**
```typescript
import { vector } from '@pgvibe/kysely'

// AI-native vector operations
const searchEmbedding = [0.1, 0.2, 0.3, /* ... 1536 dimensions */]

await db
  .selectFrom('documents')
  .select(['id', 'title', 'content'])
  .where(vector('embedding').similarTo(searchEmbedding, 0.8))      // embedding <-> $1 < 0.2
  .orderBy(vector('embedding').distance(searchEmbedding))          // ORDER BY embedding <-> $1
  .limit(10)
  .execute()

// Different distance functions
await db
  .selectFrom('embeddings')
  .select(['id', vector('embedding').l2Distance(searchEmbedding).as('distance')])
  .where(vector('embedding').cosineDistance(searchEmbedding), '<', 0.3)
  .where(vector('embedding').innerProduct(searchEmbedding), '>', 0.7)
  .execute()

// Vector aggregations and operations
await db
  .selectFrom('documents')
  .select([
    vector('embedding').dimensions().as('dims'),                    // array_length(embedding, 1)
    vector('embedding').norm().as('magnitude')                     // vector_norm(embedding)
  ])
  .execute()
```

### **🎨 Full-Text Search**
```typescript
import { text } from '@pgvibe/kysely'

// Powerful full-text search
await db
  .selectFrom('articles')
  .selectAll()
  .where(text('content').matches('typescript & (tutorial | guide)'))    // content @@ to_tsquery('...')
  .where(text('title').matchesPlain('machine learning basics'))         // title @@ plainto_tsquery('...')
  .orderBy(text('content').rank('typescript tutorial'))                 // ts_rank(content, to_tsquery('...'))
  .execute()

// Advanced text search with configuration
await db
  .selectFrom('documents')
  .select([
    'id',
    'title',
    text('content').rank('AI & machine').as('relevance'),
    text('content').headline('AI & machine', {MaxWords: 50}).as('snippet')
  ])
  .where(text('search_vector').matches('AI & machine'))
  .execute()
```

### **🎨 Combined Operations (The Magic ✨)**
```typescript
import { array, json, vector, text } from '@pgvibe/kysely'

// Real-world AI application query
const searchResults = await db
  .selectFrom('documents')
  .select([
    'id',
    'title', 
    'content',
    json('metadata').getText('author').as('author'),
    vector('embedding').distance(searchEmbedding).as('similarity'),
    text('content').rank(searchQuery).as('text_relevance')
  ])
  .where(array('tags').overlaps(['ai', 'machine-learning']))           // Array filter
  .where(json('metadata').get('published').equals(true))              // JSON filter  
  .where(vector('embedding').similarTo(searchEmbedding, 0.7))         // Vector similarity
  .where(text('content').matches(searchQuery))                        // Full-text search
  .orderBy('similarity')                                               // Best matches first
  .limit(20)
  .execute()

// E-commerce with complex filtering
const products = await db
  .selectFrom('products')
  .selectAll()
  .where(array('categories').includes('electronics'))
  .where(json('specs').path(['display', 'size']), '>=', 15)
  .where(json('availability').hasKey('in_stock'))
  .where(array('tags').contains(['featured', 'bestseller']))
  .where(text('description').matchesPlain(userQuery))
  .execute()
```

## 🧪 Testing Strategy (FIRST PRIORITY!)

### **Test-Driven Development Approach**
1. **Write tests FIRST** - Define expected behavior before implementation
2. **Test every operation** - Array, JSON, Vector, Text functions
3. **Test SQL generation** - Verify correct PostgreSQL syntax
4. **Test type safety** - Ensure TypeScript correctness
5. **Test real database** - Integration tests with actual PostgreSQL

### **Test Structure**
```
tests/
├── unit/                    # Fast unit tests
│   ├── array.test.ts       # Array operations
│   ├── json.test.ts        # JSON operations  
│   ├── vector.test.ts      # Vector operations
│   └── text.test.ts        # Text search operations
├── integration/            # Real database tests
│   ├── postgres.test.ts    # Full PostgreSQL integration
│   └── performance.test.ts # Performance benchmarks
├── sql-generation/         # SQL output validation
│   ├── array-sql.test.ts   # Verify generated SQL
│   ├── json-sql.test.ts    # Verify generated SQL
│   └── complex.test.ts     # Complex query combinations
└── typescript/             # TypeScript compilation tests
    ├── types.test-d.ts     # Type checking with tsd
    └── inference.test-d.ts # Type inference validation
```

### **Example Test Cases**
```typescript
// tests/unit/array.test.ts
describe('Array Operations', () => {
  test('includes() generates correct SQL', () => {
    const query = array('tags').includes('typescript')
    expect(query.compile()).toBe(`tags @> ARRAY['typescript']`)
  })

  test('overlaps() with multiple values', () => {
    const query = array('categories').overlaps(['tech', 'ai'])
    expect(query.compile()).toBe(`categories && ARRAY['tech', 'ai']`)
  })

  test('length() function', () => {
    const query = array('items').length()
    expect(query.compile()).toBe(`array_length(items, 1)`)
  })
})

// tests/integration/postgres.test.ts
describe('PostgreSQL Integration', () => {
  test('array operations work with real database', async () => {
    const results = await db
      .selectFrom('products')
      .selectAll()
      .where(array('tags').includes('featured'))
      .execute()
    
    expect(results).toBeDefined()
    expect(Array.isArray(results)).toBe(true)
  })
})

// tests/typescript/types.test-d.ts
import { expectType } from 'tsd'
import { array, json, vector } from '@pgvibe/kysely'

// Verify TypeScript types
expectType<Expression<boolean>>(array('tags').includes('test'))
expectType<Expression<number>>(array('items').length())
expectType<Expression<boolean>>(json('data').hasKey('email'))
```

## 🏗️ Implementation Phases

### **Phase 1: Core Array Operations** ✅ Started
- [x] Basic array helper structure
- [ ] `includes()` / `contains()` operations  
- [ ] `overlaps()` operation
- [ ] `containedBy()` operation
- [ ] `length()` function
- [ ] `any()` operation
- [ ] **Comprehensive tests for all operations**

### **Phase 2: JSON/JSONB Operations**
- [ ] Basic JSON path operations (`->`, `->>`)
- [ ] Deep path operations (`#>`, `#>>`)
- [ ] JSON containment (`@>`, `<@`)
- [ ] Key existence (`?`, `?&`, `?|`)
- [ ] **Comprehensive tests for all operations**

### **Phase 3: Vector Operations (pgvector)**
- [ ] Distance functions (`<->`, `<#>`, `<=>`)
- [ ] Similarity operations
- [ ] Vector aggregations
- [ ] Dimension validation
- [ ] **Comprehensive tests for all operations**

### **Phase 4: Full-Text Search**
- [ ] Basic text search (`@@`)
- [ ] Query functions (`to_tsquery`, `plainto_tsquery`)
- [ ] Ranking (`ts_rank`, `ts_rank_cd`)
- [ ] Highlighting (`ts_headline`)
- [ ] **Comprehensive tests for all operations**

### **Phase 5: Advanced Features**
- [ ] Combined operations
- [ ] Performance optimizations
- [ ] TypeScript magic (column type inference)
- [ ] Documentation and examples
- [ ] **End-to-end integration tests**

### **Phase 6: Polish & Release**
- [ ] Performance benchmarks
- [ ] Documentation website
- [ ] Migration guide
- [ ] npm package publishing
- [ ] **100% test coverage**

## 🎯 Success Criteria

### **Developer Experience Goals**
- ✅ **Intuitive API** - Feels natural to any developer
- ✅ **Perfect TypeScript** - Full type safety and autocompletion
- ✅ **PostgreSQL Native** - Leverages every PostgreSQL feature
- ✅ **Zero Learning Curve** - Works exactly like you'd expect
- ✅ **Performant** - Generates optimal SQL

### **Quality Gates**
- 🧪 **100% test coverage** - Every function tested
- 🏃‍♂️ **Fast tests** - Unit tests run in <1s
- 🗃️ **Real database tests** - Integration with PostgreSQL
- 📝 **Perfect TypeScript** - No type errors, perfect inference
- 📖 **Excellent docs** - Every function documented with examples

### **Performance Targets**
- ⚡ **Zero overhead** - Generates same SQL as hand-written
- 🚀 **Fast compilation** - TypeScript compiles quickly
- 💾 **Small bundle** - Minimal runtime footprint
- 🔧 **Tree-shakeable** - Only import what you use

## 🚀 Getting Started

### **Development Setup**
```bash
cd packages/kysely
bun install
bun run dev          # Watch mode development
bun run test         # Run all tests  
bun run test:watch   # Watch mode testing
```

### **Testing Commands**
```bash
bun run test:unit        # Fast unit tests
bun run test:integration # Database integration tests
bun run test:types       # TypeScript type checking
bun run test:sql         # SQL generation validation
bun run test:coverage    # Coverage report
```

### **First Implementation Task**
1. **Write tests for `array().includes()`** - Define expected behavior
2. **Implement the function** - Make tests pass
3. **Verify SQL generation** - Check output with real database
4. **Iterate and improve** - Refine based on testing

**The goal: Make developers smile when they use our API** 😊

Let's build the most beautiful PostgreSQL experience for TypeScript developers! 🔥