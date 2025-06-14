// Common test utilities for integration tests
// Provides helper functions for test isolation and setup

import { expect } from "bun:test";
import { ZenQ } from "../../../src/query-builder";
import { createIntegrationTestDatabase } from "../../utils/test-config";

/**
 * Generate a unique test ID for table naming
 * Format: timestamp_randomString
 */
export function generateTestId(): string {
  const timestamp = Date.now();
  const randomString = Math.random().toString(36).substr(2, 9);
  return `${timestamp}_${randomString}`;
}

/**
 * Create a unique table name for testing
 * @param prefix - Table prefix (e.g., 'users', 'posts')
 * @param testId - Unique test identifier
 */
export function createTableName(prefix: string, testId: string): string {
  return `test_${prefix}_${testId}`;
}

/**
 * Wait for database to be ready
 * Enhanced version of the existing utility with better error handling
 */
export async function waitForDatabase(
  timeoutMs: number = 10000
): Promise<void> {
  const startTime = Date.now();
  const db = createIntegrationTestDatabase();

  while (Date.now() - startTime < timeoutMs) {
    try {
      // Try a simple query to check database connectivity
      await db.query("SELECT 1 as test");
      return; // Success!
    } catch (error) {
      // Wait a bit before retrying
      await new Promise((resolve) => setTimeout(resolve, 300));
    }
  }

  throw new Error(`Database not ready after ${timeoutMs}ms`);
}

/**
 * Create a configured database instance for testing
 */
export function createTestDatabase(): ZenQ<any> {
  return createIntegrationTestDatabase();
}

/**
 * Safely execute a database query with error handling
 * Useful for cleanup operations that should not fail tests
 */
export async function safeDbQuery(
  db: ZenQ<any>,
  query: string,
  description?: string
): Promise<void> {
  try {
    await db.query(query);
  } catch (error) {
    console.warn(
      `Warning: ${description || "Database query"} failed:`,
      error instanceof Error ? error.message : error
    );
  }
}

/**
 * Type-safe expectation helper for database results
 */
export function expectTypeMatch<T>(
  actual: any,
  expectedProperties: (keyof T)[]
): void {
  for (const prop of expectedProperties) {
    expect(actual).toHaveProperty(prop as string);
  }
}

/**
 * Sleep utility for tests that need timing control
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Generate test data with consistent patterns
 */
export interface TestUserData {
  name: string;
  email?: string | null;
  active?: boolean;
}

export interface TestPostData {
  title: string;
  content?: string | null;
  published?: boolean;
}

export function generateTestUsers(count: number = 3): TestUserData[] {
  return Array.from({ length: count }, (_, i) => ({
    name: `Test User ${i + 1}`,
    email: `user${i + 1}@test.com`,
    active: i % 2 === 0, // Alternating active/inactive
  }));
}

export function generateTestPosts(count: number = 2): TestPostData[] {
  return Array.from({ length: count }, (_, i) => ({
    title: `Test Post ${i + 1}`,
    content: `This is test post content ${i + 1}`,
    published: i % 2 === 0, // Alternating published/draft
  }));
}
