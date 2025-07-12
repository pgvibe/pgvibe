# @pgvibe/kysely

**PostgreSQL helpers and utilities for Kysely query builder**

Perfect PostgreSQL-native operations with beautiful TypeScript syntax. Leverage the full power of PostgreSQL's arrays, JSONB, and vectors (pgvector) with complete type safety.

## ✨ Features

- 🎯 **PostgreSQL-native** - Designed specifically for PostgreSQL's advanced features
- 🔒 **Type-safe** - Full TypeScript support with perfect autocompletion
- ⚡ **Zero overhead** - Generates optimal PostgreSQL SQL
- 🤖 **AI-ready** - First-class pgvector support for embeddings and similarity search
- 📚 **Comprehensive** - Arrays, JSONB, vectors, and more
- 🔥 **Beautiful API** - Intuitive syntax that makes complex queries simple
- 🧪 **Battle-tested** - 88 comprehensive tests with real PostgreSQL integration

## 🚀 Quick Start

```bash
npm install @pgvibe/kysely kysely
# or
bun add @pgvibe/kysely kysely
```

```typescript
import { Kysely, PostgresDialect } from 'kysely'
import { array, json, vector } from '@pgvibe/kysely'

const db = new Kysely<Database>({
  dialect: new PostgresDialect({
    // your config
  })
})

// Beautiful PostgreSQL queries
const results = await db
  .selectFrom('documents')
  .select([
    'id',
    'title', 
    array('tags').length().as('tag_count'),
    json('metadata').getText('author').as('author')
  ])
  .where(array('tags').includes('typescript'))           // tags @> ARRAY['typescript']
  .where(json('metadata').get('published').equals(true)) // metadata->'published' = true
  .where(vector('embedding').similarTo(searchVector))    // embedding <-> $1 < 0.5
  .orderBy('tag_count', 'desc')
  .execute()
```

## 📚 API Reference

### Array Operations

```typescript
import { array } from '@pgvibe/kysely'

// Array containment and overlap
.where(array('tags').includes('featured'))              // tags @> ARRAY['featured']
.where(array('tags').contains(['ai', 'ml']))            // tags @> ARRAY['ai', 'ml']  
.where(array('categories').overlaps(['tech', 'ai']))    // categories && ARRAY['tech', 'ai']
.where(array('sizes').containedBy(['S', 'M', 'L']))     // sizes <@ ARRAY['S', 'M', 'L']

// Array functions
.where(array('items').length(), '>', 5)                 // array_length(items, 1) > 5
.where('status', '=', array('valid_statuses').any())    // status = ANY(valid_statuses)
```

### JSON/JSONB Operations

```typescript
import { json } from '@pgvibe/kysely'

// JSON field access
.where(json('metadata').get('theme').equals('dark'))           // metadata->'theme' = '"dark"'
.where(json('settings').getText('language'), '=', 'en')       // settings->>'language' = 'en'

// JSON path operations  
.where(json('data').path(['user', 'preferences']).contains({notifications: true}))

// JSON containment and key existence
.where(json('profile').contains({verified: true}))            // profile @> '{"verified":true}'
.where(json('permissions').hasKey('admin'))                   // permissions ? 'admin'  
.where(json('metadata').hasAllKeys(['title', 'author']))      // metadata ?& array['title','author']
```

### Vector Operations (pgvector)

```typescript
import { vector } from '@pgvibe/kysely'

// Similarity search
.where(vector('embedding').similarTo(searchVector, 0.8))      // embedding <-> $1 < 0.2
.orderBy(vector('embedding').distance(searchVector))          // ORDER BY embedding <-> $1

// Different distance functions
.where(vector('embedding').l2Distance(searchVector), '<', 0.5)     // L2 distance
.where(vector('embedding').cosineDistance(searchVector), '<', 0.3) // Cosine distance  
.where(vector('embedding').innerProduct(searchVector), '>', 0.7)   // Inner product

// Vector utilities
.select([vector('embedding').dimensions().as('dims')])             // array_length(embedding, 1)
.select([vector('embedding').norm().as('magnitude')])              // vector_norm(embedding)
```


## 🎯 Real-World Examples

### E-commerce Product Search

```typescript
const products = await db
  .selectFrom('products')
  .select([
    'id', 
    'name', 
    'description', 
    'price',
    array('tags').length().as('tag_count'),
    json('metadata').getText('difficulty').as('difficulty')
  ])
  .where(array('categories').includes('electronics'))
  .where(json('specs').path(['display', 'size']).equals(15))
  .where(json('availability').hasKey('in_stock'))
  .where(array('tags').overlaps(['featured', 'bestseller']))
  .orderBy('tag_count', 'desc')
  .execute()
```

### AI Semantic Search

```typescript
const searchEmbedding = await generateEmbedding("machine learning tutorials")

const results = await db
  .selectFrom('documents')
  .select([
    'id',
    'title',
    'content',
    json('metadata').getText('author').as('author'),
    vector('embedding').distance(searchEmbedding).as('similarity'),
    array('tags').length().as('tag_count')
  ])
  .where(array('tags').overlaps(['ai', 'machine-learning']))
  .where(json('metadata').get('published').equals(true))
  .where(vector('embedding').similarTo(searchEmbedding, 0.8))
  .orderBy('similarity')
  .limit(20)
  .execute()
```

### User Permissions & Preferences

```typescript
const userData = await db
  .selectFrom('users')
  .select([
    'id',
    'email',
    json('preferences').getText('theme').as('theme'),
    json('preferences').path(['notifications', 'email']).as('email_notifications')
  ])
  .where(array('roles').includes('admin'))
  .where(json('preferences').hasKey('theme'))
  .where(json('profile').contains({verified: true, active: true}))
  .execute()
```

## ✅ Test Results

**Complete test coverage with real PostgreSQL validation:**
- **Unit Tests**: 66/66 passing ✅
- **Integration Tests**: 22/22 passing ✅  
- **Total**: 88/88 tests passing ✅

All operations tested against real PostgreSQL database including:
- PostgreSQL array operators (`@>`, `&&`, `<@`, `ANY`, `array_length`)
- JSONB operations (`->`, `->>`, `#>`, `#>>`, `@>`, `?`, `?&`)  
- pgvector distance functions (with graceful fallback)
- SQL injection prevention
- Performance with large datasets
- Edge cases and error handling

## 🔧 Requirements

- **Kysely** ^0.27.0 || ^0.28.0
- **PostgreSQL** 12+ (for full feature support)
- **pgvector** extension (optional, for vector operations)
- **TypeScript** 4.7+ (for best type inference)

## 🧪 Development & Testing

```bash
# Run unit tests
bun run test

# Start PostgreSQL for integration tests
bun run db:up

# Run integration tests
bun run test:integration

# Run all tests
bun run test:all

# Clean up database
bun run db:down
```

## 🤝 Contributing

We love contributions! This package is part of the pgvibe ecosystem for PostgreSQL development.

## 📄 License

MIT © pgvibe

---

**Made with ❤️ for the PostgreSQL and TypeScript community**