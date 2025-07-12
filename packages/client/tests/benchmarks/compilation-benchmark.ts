// TypeScript compilation benchmark
// This file stress-tests the type system to measure compilation performance

import { QueryBuilder } from '../../src/query-builder';

// Large database schema for stress testing
interface StressTestDB {
  users: { 
    id: number; name: string; email: string; active: boolean; created_at: Date;
    profile_image: string; last_login: Date; role: string; department: string;
    salary: number; manager_id: number; phone: string; address: string;
  };
  posts: { 
    id: number; user_id: number; title: string; content: string; published: boolean;
    created_at: Date; updated_at: Date; view_count: number; like_count: number;
    category_id: number; tags: string; slug: string; excerpt: string;
  };
  comments: { 
    id: number; post_id: number; user_id: number; content: string; created_at: Date;
    updated_at: Date; is_approved: boolean; parent_id: number; like_count: number;
    ip_address: string; user_agent: string; is_spam: boolean;
  };
  categories: {
    id: number; name: string; slug: string; description: string; parent_id: number;
    sort_order: number; is_active: boolean; created_at: Date; updated_at: Date;
  };
  tags: {
    id: number; name: string; slug: string; color: string; created_at: Date;
    usage_count: number; is_featured: boolean;
  };
}

const qb = new QueryBuilder<StressTestDB>();

// === COMPILATION STRESS TESTS ===

// Test 1: Deep nesting with multiple joins
const deepQuery = qb
  .selectFrom('users as u')
  .innerJoin('posts as p', 'u.id', 'p.user_id')
  .leftJoin('comments as c', 'p.id', 'c.post_id')
  .innerJoin('categories as cat', 'p.category_id', 'cat.id')
  .select([
    'u.id as user_id',
    'u.name as author_name', 
    'u.email as author_email',
    'p.id as post_id',
    'p.title as post_title',
    'p.content as post_content',
    'c.content as comment_content',
    'cat.name as category_name'
  ]);

// Test 2: Large selection with aliases
const largeSelection = qb.selectFrom('users').select([
  'id', 'name', 'email', 'active', 'created_at', 'profile_image', 'last_login',
  'role', 'department', 'salary', 'manager_id', 'phone', 'address',
  'id as user_id', 'name as user_name', 'email as user_email',
  'active as is_active', 'created_at as registration_date',
  'profile_image as avatar', 'last_login as last_seen',
  'role as user_role', 'department as user_department'
]);

// Test 3: Multiple complex queries to test type instantiation caching
const query1 = qb.selectFrom('posts as p1').innerJoin('users as u1', 'p1.user_id', 'u1.id').select(['p1.title', 'u1.name']);
const query2 = qb.selectFrom('posts as p2').innerJoin('users as u2', 'p2.user_id', 'u2.id').select(['p2.content', 'u2.email']);
const query3 = qb.selectFrom('posts as p3').innerJoin('users as u3', 'p3.user_id', 'u3.id').select(['p3.published', 'u3.active']);
const query4 = qb.selectFrom('posts as p4').innerJoin('users as u4', 'p4.user_id', 'u4.id').select(['p4.view_count', 'u4.role']);

// Test 4: Chain of operations with different table combinations
const chainedQuery = qb
  .selectFrom('users as authors')
  .innerJoin('posts as articles', 'authors.id', 'articles.user_id')
  .leftJoin('comments as feedback', 'articles.id', 'feedback.post_id')
  .innerJoin('categories as topics', 'articles.category_id', 'topics.id')
  .select([
    'authors.name as writer_name',
    'articles.title as article_title',
    'feedback.content as reader_feedback',
    'topics.name as topic_name'
  ]);

// Test 5: Template literal stress test
type StressTemplateTest = 
  | 'users.id' | 'users.name' | 'users.email' | 'users.active'
  | 'posts.id' | 'posts.title' | 'posts.content' | 'posts.published'
  | 'comments.id' | 'comments.content' | 'comments.is_approved'
  | 'categories.id' | 'categories.name' | 'categories.description'
  | 'tags.id' | 'tags.name' | 'tags.color';

// Test type inference with complex patterns
const inferenceTest = qb
  .selectFrom('users as u')
  .innerJoin('posts as p', 'u.id', 'p.user_id')
  .select(['u.name', 'p.title', 'u.email', 'p.content'])
  .execute();

// Test array of complex queries for parallel type checking
const batchQueries = [
  qb.selectFrom('users').select(['id', 'name']),
  qb.selectFrom('posts').select(['id', 'title']),
  qb.selectFrom('comments').select(['id', 'content']),
  qb.selectFrom('categories').select(['id', 'name']),
  qb.selectFrom('tags').select(['id', 'name'])
] as const;

// Export for compilation timing measurement
export {
  deepQuery,
  largeSelection,
  query1, query2, query3, query4,
  chainedQuery,
  inferenceTest,
  batchQueries
};