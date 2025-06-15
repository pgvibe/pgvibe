// Main index for TSD type tests - Updated for reorganized structure
// This file exports all our organized type tests

// Core database operations
export * from "./core/select.test-d";
export * from "./core/where.test-d";
export * from "./core/insert.test-d";
export * from "./core/joins.test-d";
export * from "./core/table-aliases.test-d";

// Expression system
export * from "./expression/expression-builder.test-d";
export * from "./expression/array-operations.test-d";

// Validation and error handling
export * from "./validation/error-messages.test-d";

// Data types
export * from "./data-types/dates.test-d";

// Advanced features and edge cases
export * from "./advanced/edge-cases.test-d";
export * from "./advanced/type-display.test-d";
export * from "./advanced/regression.test-d";

// Shared utilities (imported by other files, exported for completeness)
export * from "./utils/schemas.test-d";
export * from "./utils/test-helpers.test-d";
