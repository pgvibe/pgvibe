// Shared test utilities for pgvibe query builder tests

import type { TestDB } from "../fixtures/test-schema";
import { QueryBuilder } from "../../../src/query-builder";

/**
 * Create a query builder instance for testing
 */
export function createTestQueryBuilder() {
  return new QueryBuilder<TestDB>();
}

/**
 * Normalize SQL for comparison by removing extra whitespace
 */
export function normalizeSQL(sql: string): string {
  return sql.replace(/\s+/g, " ").trim();
}

/**
 * TypeScript type testing utility
 */
export function expectType<T>(): <U extends T>(value: U) => U {
  return <U extends T>(value: U) => value;
}

/**
 * Common test schema reference for easy importing
 */
export type { TestDB } from "../fixtures/test-schema";