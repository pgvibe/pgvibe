// Centralized test configuration for PostgreSQL database
// Matches credentials from docker-compose.yml

import { ZenQ } from "../../src/query-builder";
import type { Database } from "./test-types";

/**
 * PostgreSQL connection configuration for tests
 * Uses the same credentials as defined in docker-compose.yml
 */
export const TEST_DATABASE_CONFIG = {
  connectionString:
    "postgresql://zenq_user:zenq_password@localhost:54322/zenq_test",
};

/**
 * Create a ZenQ instance for testing with the correct database configuration
 */
export function createTestDatabase(): ZenQ<Database> {
  return new ZenQ<Database>(TEST_DATABASE_CONFIG);
}

/**
 * Wait for database to be ready
 * Useful in beforeAll hooks
 */
export async function waitForDatabase(timeoutMs: number = 5000): Promise<void> {
  const startTime = Date.now();
  const db = createTestDatabase();

  while (Date.now() - startTime < timeoutMs) {
    try {
      await db.selectFrom("users").limit(1).execute();
      return; // Success!
    } catch (error) {
      // Wait a bit before retrying
      await new Promise((resolve) => setTimeout(resolve, 200));
    }
  }

  throw new Error(`Database not ready after ${timeoutMs}ms`);
}
