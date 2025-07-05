// Cleanup utilities for integration tests
// Provides safe cleanup operations for test isolation

import { pgvibe } from "../../../src/query-builder";
import { safeDbQuery } from "./test-helpers";

/**
 * Drop all tables with a specific prefix
 * Useful for cleaning up after test suites
 */
export async function dropTablesByPrefix(
  db: pgvibe<any>,
  prefix: string
): Promise<void> {
  try {
    // Get all tables with the specified prefix
    const tablesResult = await db.query(`
      SELECT tablename 
      FROM pg_tables 
      WHERE schemaname = 'public' 
      AND tablename LIKE '${prefix}%'
      ORDER BY tablename
    `);

    const tableNames = tablesResult.rows.map((row: any) => row.tablename);

    // Drop each table
    for (const tableName of tableNames) {
      await safeDbQuery(
        db,
        `DROP TABLE IF EXISTS ${tableName} CASCADE`,
        `Dropping table ${tableName}`
      );
    }

    console.log(
      `Cleaned up ${tableNames.length} tables with prefix '${prefix}'`
    );
  } catch (error) {
    console.warn("Error during table cleanup:", error);
  }
}

/**
 * Clean up all test tables
 * Useful for cleaning up after all integration tests
 */
export async function cleanupAllTestTables(db: pgvibe<any>): Promise<void> {
  await dropTablesByPrefix(db, "test_");
}

/**
 * Reset sequences for test tables
 * Ensures consistent IDs across test runs
 */
export async function resetTableSequences(
  db: pgvibe<any>,
  tableNames: string[]
): Promise<void> {
  for (const tableName of tableNames) {
    await safeDbQuery(
      db,
      `ALTER SEQUENCE IF EXISTS ${tableName}_id_seq RESTART WITH 1`,
      `Resetting sequence for ${tableName}`
    );
  }
}

/**
 * Truncate tables while preserving structure
 * Alternative to dropping tables for faster cleanup
 */
export async function truncateTestTables(
  db: pgvibe<any>,
  tableNames: string[]
): Promise<void> {
  if (tableNames.length === 0) return;

  const tableList = tableNames.join(", ");
  await safeDbQuery(
    db,
    `TRUNCATE ${tableList} RESTART IDENTITY CASCADE`,
    `Truncating tables: ${tableList}`
  );
}

/**
 * Get all tables matching a pattern
 * Useful for debugging or verification
 */
export async function getTablesByPattern(
  db: pgvibe<any>,
  pattern: string
): Promise<string[]> {
  try {
    const result = await db.query(`
      SELECT tablename 
      FROM pg_tables 
      WHERE schemaname = 'public' 
      AND tablename LIKE '${pattern}'
      ORDER BY tablename
    `);

    return result.rows.map((row: any) => row.tablename);
  } catch (error) {
    console.warn("Error getting tables by pattern:", error);
    return [];
  }
}

/**
 * Comprehensive cleanup for test isolation
 * Combines multiple cleanup strategies
 */
export interface CleanupOptions {
  dropTables?: boolean;
  truncateTables?: boolean;
  resetSequences?: boolean;
  tablePrefix?: string;
}

export async function performTestCleanup(
  db: pgvibe<any>,
  tableNames: string[],
  options: CleanupOptions = {}
): Promise<void> {
  const {
    dropTables = true,
    truncateTables = false,
    resetSequences = false,
    tablePrefix,
  } = options;

  if (tablePrefix) {
    // Clean up by prefix
    await dropTablesByPrefix(db, tablePrefix);
  } else if (dropTables) {
    // Drop specific tables
    for (const tableName of tableNames.reverse()) {
      await safeDbQuery(
        db,
        `DROP TABLE IF EXISTS ${tableName} CASCADE`,
        `Dropping table ${tableName}`
      );
    }
  } else if (truncateTables) {
    // Just truncate the data
    await truncateTestTables(db, tableNames);
  }

  if (resetSequences && !dropTables) {
    await resetTableSequences(db, tableNames);
  }
}
