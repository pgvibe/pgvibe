// Common test helpers and utilities for type tests
// This file consolidates shared testing utilities used across type tests

// Re-export TSD functions
export { expectType, expectError, expectAssignable } from "tsd";

// Re-export database creation utilities
export {
  createTestDatabase,
  createIntegrationTestDatabase,
} from "../../utils/test-config";

// Re-export all schema types
export * from "./schemas.test-d.ts";

// Common test database instances (can be used across tests)
import {
  createTestDatabase,
  createIntegrationTestDatabase,
} from "../../utils/test-config";

export const db = createTestDatabase();
export const integrationDb = createIntegrationTestDatabase();
