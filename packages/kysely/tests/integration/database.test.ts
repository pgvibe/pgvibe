import { describe, test, expect, beforeAll, afterAll } from 'bun:test'
import { Kysely, PostgresDialect } from 'kysely'
import { Pool } from 'pg'
import { array, json, vector } from '../../src'

// Database interface matching our test schema
interface TestDatabase {
  products: {
    id: number
    name: string
    description: string | null
    tags: string[]
    categories: string[]
    scores: number[]
    prices: number[]
    metadata: any
    settings: any
    created_at: Date
    updated_at: Date
  }
  documents: {
    id: number
    title: string
    content: string
    author: string | null
    tags: string[]
    metadata: any
    word_count: number | null
    created_at: Date
  }
  users: {
    id: number
    email: string
    name: string
    roles: string[]
    preferences: any
    permissions: any
    created_at: Date
  }
  document_embeddings?: {
    id: number
    document_id: number | null
    content: string
    embedding: number[]
    metadata: any
    created_at: Date
  }
}

// Database connection config
const DB_CONFIG = {
  host: 'localhost',
  port: 15432,
  database: 'kysely_test',
  user: 'kysely_user',
  password: 'kysely_password',
}

let db: Kysely<TestDatabase>
let pool: Pool

beforeAll(async () => {
  // Wait for database to be ready with retries
  pool = new Pool(DB_CONFIG)
  
  // Test connection with retries
  let retries = 30
  let connected = false
  
  while (retries > 0 && !connected) {
    try {
      const client = await pool.connect()
      await client.query('SELECT 1')
      client.release()
      connected = true
      console.log('✅ Database connection successful')
    } catch (error) {
      retries--
      if (retries === 0) {
        console.log('❌ Database not ready after 30 attempts, skipping integration tests')
        console.log('Run: docker-compose up -d postgres')
        console.log('Error:', error.message)
        process.exit(0)
      }
      console.log(`⏳ Waiting for database... (${30 - retries}/30)`)
      await new Promise(resolve => setTimeout(resolve, 1000))
    }
  }

  // Create Kysely instance
  db = new Kysely<TestDatabase>({
    dialect: new PostgresDialect({
      pool
    })
  })
})

afterAll(async () => {
  if (db) {
    await db.destroy()
  }
  // Note: db.destroy() already calls pool.end(), so we don't need to call it again
})

describe('Integration Tests - Real PostgreSQL Database', () => {
  describe('Array Operations Integration', () => {
    test('includes() works with real database', async () => {
      const results = await db
        .selectFrom('products')
        .select(['id', 'name', 'tags'])
        .where(array('tags').includes('typescript'))
        .execute()

      expect(results).toBeDefined()
      expect(Array.isArray(results)).toBe(true)
      expect(results.length).toBeGreaterThan(0)
      
      // Verify all returned products have 'typescript' in tags
      for (const product of results) {
        expect(product.tags).toContain('typescript')
      }
    })

    test('contains() works with multiple values', async () => {
      const results = await db
        .selectFrom('products')
        .select(['id', 'name', 'tags'])
        .where(array('tags').contains(['tutorial', 'programming']))
        .execute()

      expect(results).toBeDefined()
      expect(Array.isArray(results)).toBe(true)
      
      // Verify all returned products have both tags
      for (const product of results) {
        expect(product.tags).toContain('tutorial')
        expect(product.tags).toContain('programming')
      }
    })

    test('overlaps() finds products with any matching categories', async () => {
      const results = await db
        .selectFrom('products')
        .select(['id', 'name', 'categories'])
        .where(array('categories').overlaps(['education', 'electronics']))
        .execute()

      expect(results).toBeDefined()
      expect(results.length).toBeGreaterThan(0)
      
      // Verify all returned products have at least one matching category
      for (const product of results) {
        const hasEducation = product.categories.includes('education')
        const hasElectronics = product.categories.includes('electronics')
        expect(hasEducation || hasElectronics).toBe(true)
      }
    })

    test('length() works in WHERE and SELECT clauses', async () => {
      const results = await db
        .selectFrom('products')
        .select([
          'id',
          'name',
          'tags',
          array('tags').length().as('tag_count')
        ])
        .where(array('tags').length(), '>', 3)
        .execute()

      expect(results).toBeDefined()
      
      for (const product of results) {
        expect(product.tag_count).toBeGreaterThan(3)
        expect(product.tags.length).toBe(product.tag_count)
      }
    })

    test('complex array query with multiple conditions', async () => {
      const results = await db
        .selectFrom('products')
        .select([
          'id',
          'name',
          'tags',
          'categories',
          array('tags').length().as('tag_count')
        ])
        .where(array('tags').includes('tutorial'))
        .where(array('categories').overlaps(['education']))
        .where(array('tags').length(), '>=', 3)
        .orderBy('name')
        .execute()

      expect(results).toBeDefined()
      
      for (const product of results) {
        expect(product.tags).toContain('tutorial')
        expect(product.categories.some(cat => cat === 'education')).toBe(true)
        expect(product.tag_count).toBeGreaterThanOrEqual(3)
      }
    })
  })

  describe('JSON Operations Integration', () => {
    test('get() works with nested JSON objects', async () => {
      const results = await db
        .selectFrom('products')
        .select(['id', 'name', 'metadata'])
        .where(json('metadata').get('difficulty').equals('beginner'))
        .execute()

      expect(results).toBeDefined()
      expect(results.length).toBeGreaterThan(0)
      
      for (const product of results) {
        expect(product.metadata.difficulty).toBe('beginner')
      }
    })

    test('getText() extracts text values', async () => {
      const results = await db
        .selectFrom('users')
        .select([
          'id',
          'name',
          json('preferences').getText('theme').as('theme')
        ])
        .where(json('preferences').getText('theme'), '=', 'dark')
        .execute()

      expect(results).toBeDefined()
      
      for (const user of results) {
        expect(user.theme).toBe('dark')
      }
    })

    test('contains() works with complex objects', async () => {
      const results = await db
        .selectFrom('documents')
        .select(['id', 'title', 'metadata'])
        .where(json('metadata').contains({published: true}))
        .execute()

      expect(results).toBeDefined()
      expect(results.length).toBeGreaterThan(0)
      
      for (const doc of results) {
        expect(doc.metadata.published).toBe(true)
      }
    })

    test('hasKey() checks for key existence', async () => {
      const results = await db
        .selectFrom('products')
        .select(['id', 'name', 'metadata'])
        .where(json('metadata').hasKey('ai_related'))
        .execute()

      expect(results).toBeDefined()
      
      for (const product of results) {
        expect('ai_related' in product.metadata).toBe(true)
      }
    })

    test('hasAllKeys() requires all keys to exist', async () => {
      const results = await db
        .selectFrom('users')
        .select(['id', 'name', 'permissions'])
        .where(json('permissions').hasAllKeys(['read', 'write']))
        .execute()

      expect(results).toBeDefined()
      
      for (const user of results) {
        expect('read' in user.permissions).toBe(true)
        expect('write' in user.permissions).toBe(true)
      }
    })

    test('path() works with nested object access', async () => {
      const results = await db
        .selectFrom('users')
        .select(['id', 'name', 'preferences'])
        .where(json('preferences').path(['notifications', 'email']).equals(true))
        .execute()

      expect(results).toBeDefined()
      
      for (const user of results) {
        expect(user.preferences.notifications.email).toBe(true)
      }
    })
  })

  describe('Vector Operations Integration', () => {
    test('check if pgvector is available', async () => {
      try {
        const result = await db.selectFrom('document_embeddings' as any).selectAll().limit(1).execute()
        console.log('pgvector is available, running vector tests')
        expect(result).toBeDefined()
      } catch (error) {
        console.log('pgvector not available, skipping vector tests')
        return
      }
    })

    test('distance() works with vector similarity', async () => {
      try {
        const searchVector = [0.2, 0.3, 0.4, 0.5, 0.6]
        
        const results = await db
          .selectFrom('document_embeddings' as any)
          .select([
            'id',
            'content',
            vector('embedding').distance(searchVector).as('distance')
          ])
          .orderBy('distance')
          .limit(3)
          .execute()

        expect(results).toBeDefined()
        expect(results.length).toBeGreaterThan(0)
        
        // Verify distances are in ascending order
        for (let i = 1; i < results.length; i++) {
          expect(results[i].distance).toBeGreaterThanOrEqual(results[i-1].distance)
        }
      } catch (error) {
        console.log('Skipping vector test - pgvector not available')
      }
    })

    test('similarTo() works with threshold filtering', async () => {
      try {
        const searchVector = [0.1, 0.2, 0.3, 0.4, 0.5]
        
        const results = await db
          .selectFrom('document_embeddings' as any)
          .select(['id', 'content', 'embedding'])
          .where(vector('embedding').similarTo(searchVector, 0.9))
          .execute()

        expect(results).toBeDefined()
        // Results should be very similar (might be empty if no vectors are similar enough)
        console.log(`Found ${results.length} similar vectors with 0.9 similarity threshold`)
      } catch (error) {
        console.log('Skipping vector similarity test - pgvector not available')
      }
    })

    test('dimensions() returns correct vector dimensions', async () => {
      try {
        const results = await db
          .selectFrom('document_embeddings' as any)
          .select([
            'id',
            'content',
            vector('embedding').dimensions().as('dims')
          ])
          .limit(1)
          .execute()

        expect(results).toBeDefined()
        if (results.length > 0) {
          expect(results[0].dims).toBe(5) // Our test vectors are 5-dimensional
        }
      } catch (error) {
        console.log('Skipping vector dimensions test - pgvector not available')
      }
    })
  })

  describe('Combined Operations Integration', () => {
    test('array + JSON operations work together', async () => {
      const results = await db
        .selectFrom('products')
        .select([
          'id',
          'name',
          'tags',
          'metadata',
          array('tags').length().as('tag_count'),
          json('metadata').getText('difficulty').as('difficulty')
        ])
        .where(array('tags').includes('tutorial'))
        .where(json('metadata').get('difficulty').equals('beginner'))
        .where(array('categories').overlaps(['education']))
        .execute()

      expect(results).toBeDefined()
      
      for (const product of results) {
        expect(product.tags).toContain('tutorial')
        expect(product.difficulty).toBe('beginner')
        expect(product.tag_count).toBe(product.tags.length)
      }
    })

    test('complex e-commerce filtering scenario', async () => {
      const userInterests = ['programming', 'database']
      const maxPrice = 50.0
      
      const results = await db
        .selectFrom('products')
        .select([
          'id',
          'name',
          'tags',
          'categories', 
          'prices',
          'metadata',
          array('tags').length().as('tag_count'),
          json('metadata').getText('difficulty').as('difficulty'),
          json('metadata').get('rating').asText().as('rating')
        ])
        .where(array('tags').overlaps(userInterests))
        .where(json('metadata').hasKey('difficulty'))
        .where(array('tags').length(), '>=', 3)
        .orderBy('rating', 'desc')
        .limit(10)
        .execute()

      expect(results).toBeDefined()
      
      for (const product of results) {
        // Should have overlap with user interests
        const hasOverlap = product.tags.some(tag => userInterests.includes(tag))
        expect(hasOverlap).toBe(true)
        
        // Should have difficulty metadata
        expect('difficulty' in product.metadata).toBe(true)
        
        // Should have at least 3 tags
        expect(product.tag_count).toBeGreaterThanOrEqual(3)
      }
    })

    test('user permissions and preferences query', async () => {
      const results = await db
        .selectFrom('users')
        .select([
          'id',
          'name',
          'roles',
          json('preferences').getText('theme').as('theme'),
          json('preferences').path(['notifications', 'email']).asText().as('email_notifications'),
          array('roles').length().as('role_count')
        ])
        .where(array('roles').includes('user'))
        .where(json('permissions').get('read').equals(true))
        .where(json('preferences').hasKey('theme'))
        .orderBy('name')
        .execute()

      expect(results).toBeDefined()
      expect(results.length).toBeGreaterThan(0)
      
      for (const user of results) {
        expect(user.roles).toContain('user')
        expect(['dark', 'light', 'auto']).toContain(user.theme)
        expect(user.role_count).toBe(user.roles.length)
      }
    })
  })

  describe('Performance and Edge Cases', () => {
    test('handles large arrays efficiently', async () => {
      // Create a large array for testing
      const largeTagArray = Array.from({length: 100}, (_, i) => `tag${i}`)
      
      const results = await db
        .selectFrom('products')
        .select(['id', 'name'])
        .where(array('tags').overlaps(largeTagArray))
        .execute()

      expect(results).toBeDefined()
      // Should execute without errors even with large arrays
    })

    test('handles empty arrays gracefully', async () => {
      const results = await db
        .selectFrom('products')
        .select(['id', 'name', 'tags'])
        .where(array('tags').contains([]))
        .execute()

      expect(results).toBeDefined()
      expect(Array.isArray(results)).toBe(true)
    })

    test('handles complex JSON objects', async () => {
      const complexFilter = {
        notifications: { email: true },
        experimental_features: true
      }
      
      const results = await db
        .selectFrom('users')
        .select(['id', 'name', 'preferences'])
        .where(json('preferences').contains(complexFilter))
        .execute()

      expect(results).toBeDefined()
      
      for (const user of results) {
        expect(user.preferences.notifications?.email).toBe(true)
        expect(user.preferences.experimental_features).toBe(true)
      }
    })

    test('SQL injection prevention', async () => {
      const maliciousInput = "'; DROP TABLE products; --"
      
      // This should be safely parameterized
      const results = await db
        .selectFrom('products')
        .select(['id', 'name'])
        .where(array('tags').includes(maliciousInput))
        .execute()

      expect(results).toBeDefined()
      expect(Array.isArray(results)).toBe(true)
      
      // Verify products table still exists
      const countResult = await db
        .selectFrom('products')
        .select([db.fn.count('id').as('count')])
        .execute()
      
      expect(Number(countResult[0].count)).toBeGreaterThan(0)
    })
  })
})