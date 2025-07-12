// Runtime performance benchmark tests
// These tests measure actual execution speed of query builder operations

import { describe, test, expect } from 'bun:test';
import { QueryBuilder } from '../../src/query-builder';

interface BenchDB {
  users: { id: number; name: string; email: string; active: boolean; created_at: Date };
  posts: { id: number; user_id: number; title: string; content: string; published: boolean };
  comments: { id: number; post_id: number; user_id: number; content: string; created_at: Date };
}

const qb = new QueryBuilder<BenchDB>();

// Utility function to measure execution time
function benchmark(name: string, fn: () => void, iterations = 10000): number {
  const start = performance.now();
  for (let i = 0; i < iterations; i++) {
    fn();
  }
  const end = performance.now();
  const totalTime = end - start;
  const avgTime = totalTime / iterations;
  console.log(`${name}: ${totalTime.toFixed(2)}ms total, ${avgTime.toFixed(4)}ms avg`);
  return avgTime;
}

describe('Runtime Performance Benchmarks', () => {
  test('Query builder instantiation performance', () => {
    const avgTime = benchmark('QueryBuilder instantiation', () => {
      new QueryBuilder<BenchDB>();
    });
    
    // Should be very fast (< 0.01ms)
    expect(avgTime).toBeLessThan(0.01);
  });

  test('Simple selectFrom performance', () => {
    const avgTime = benchmark('Simple selectFrom', () => {
      qb.selectFrom('users');
    });
    
    // Should be very fast (< 0.01ms)
    expect(avgTime).toBeLessThan(0.01);
  });

  test('Select with columns performance', () => {
    const avgTime = benchmark('Select with columns', () => {
      qb.selectFrom('users').select(['id', 'name', 'email']);
    });
    
    // Should be fast (< 0.02ms)
    expect(avgTime).toBeLessThan(0.02);
  });

  test('Complex query building performance', () => {
    const avgTime = benchmark('Complex query building', () => {
      qb.selectFrom('users as u')
        .innerJoin('posts as p', 'u.id', 'p.user_id')
        .leftJoin('comments as c', 'p.id', 'c.post_id')
        .select(['u.name', 'p.title', 'c.content']);
    });
    
    // Should be reasonably fast (< 0.05ms)
    expect(avgTime).toBeLessThan(0.05);
  });

  test('SQL generation performance (no cache)', () => {
    const query = qb.selectFrom('users as u')
      .innerJoin('posts as p', 'u.id', 'p.user_id')
      .select(['u.name', 'p.title']);
    
    // Force cache invalidation for each iteration
    const avgTime = benchmark('SQL generation', () => {
      (query as any)._isDirty = true;
      (query as any)._sqlCache = undefined;
      query.toSQL();
    });
    
    // Should be fast even without cache (< 0.01ms)
    expect(avgTime).toBeLessThan(0.01);
  });

  test('SQL generation performance (with cache)', () => {
    const query = qb.selectFrom('users as u')
      .innerJoin('posts as p', 'u.id', 'p.user_id')
      .select(['u.name', 'p.title']);
    
    // Generate SQL once to populate cache
    query.toSQL();
    
    const avgTime = benchmark('SQL generation (cached)', () => {
      query.toSQL();
    });
    
    // Cached version should be extremely fast (< 0.001ms)
    expect(avgTime).toBeLessThan(0.001);
  });

  test('Large selection array performance', () => {
    const avgTime = benchmark('Large selection array', () => {
      qb.selectFrom('users').select([
        'id', 'name', 'email', 'active', 'created_at',
        'id as user_id', 'name as user_name', 'email as user_email',
        'active as is_active', 'created_at as registration_date'
      ]);
    });
    
    // Should handle large arrays efficiently (< 0.03ms)
    expect(avgTime).toBeLessThan(0.03);
  });

  test('Memory usage stability', () => {
    // Test that repeated operations don't cause memory leaks
    const initialMemory = process.memoryUsage().heapUsed;
    
    for (let i = 0; i < 1000; i++) {
      const query = qb.selectFrom('users as u')
        .innerJoin('posts as p', 'u.id', 'p.user_id')
        .select(['u.name', 'p.title'])
        .toSQL();
    }
    
    // Force garbage collection if available
    if (global.gc) {
      global.gc();
    }
    
    const finalMemory = process.memoryUsage().heapUsed;
    const memoryIncrease = finalMemory - initialMemory;
    
    // Memory increase should be minimal (< 1MB)
    expect(memoryIncrease).toBeLessThan(1024 * 1024);
  });
});