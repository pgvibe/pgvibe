// ✅ Test our InsertType fix

import { createIntegrationTestDatabase } from "./tests/utils/test-config";
import type { IntegrationTestDatabase } from "./tests/utils/test-types";

const integrationDb = createIntegrationTestDatabase();

// These should work - valid inserts
const valid1 = integrationDb.insertInto("test_users").values({
  name: "John Doe", // Required field
});

const valid2 = integrationDb.insertInto("test_posts").values({
  user_id: 1, // Required field
  title: "My Post", // Required field
});

// These should ERROR - missing required fields
const invalid1 = integrationDb.insertInto("test_users").values({
  email: "john@example.com", // Missing required 'name'
});

const invalid2 = integrationDb.insertInto("test_posts").values({
  title: "My Post", // Missing required 'user_id'
});

export {};
