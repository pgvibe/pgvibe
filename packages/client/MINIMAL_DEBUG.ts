// 🚨 MINIMAL DEBUG: Isolate the InsertType issue

// Let's test a super simple case first
type SimpleRequired = {
  name: string;
};

type SimpleOptional = {
  email?: string;
};

type SimpleCombined = SimpleRequired & SimpleOptional;

// This should error - missing required 'name'
const testSimple: SimpleCombined = {}; // Should error but let's see

// Now let's test our actual utility types
import type {
  Generated,
  WithDefault,
  Nullable,
} from "./src/core/types/utility-types";

// Test the branded types directly
type TestGenerated = Generated<number>;
type TestWithDefault = WithDefault<boolean>;
type TestNullable = Nullable<string>;

// Test if the brand detection works
type IsGeneratedCheck = TestGenerated extends { readonly __brand: "Generated" }
  ? true
  : false;
type HasDefaultCheck = TestWithDefault extends {
  readonly __brand: "WithDefault";
}
  ? true
  : false;

// Simple table for testing
interface TestTable {
  id: Generated<number>;
  name: string;
  email: Nullable<string>;
}

// Manual implementation of what InsertType SHOULD do
type ManualInsertType = {
  // Required: name (not Generated, not WithDefault, not Nullable)
  name: string;
} & {
  // Optional: id (Generated), email (Nullable)
  id?: number;
  email?: string | null;
};

// Test manual implementation
const manualValid: ManualInsertType = { name: "John" };
const manualInvalid: ManualInsertType = {}; // Should error

// Test if the problem is in the mapped type logic
type TestMappedRequired = {
  [K in "name"]: string;
};

type TestMappedOptional = {
  [K in "id" | "email"]?: K extends "id" ? number : string | null;
};

type TestMappedCombined = TestMappedRequired & TestMappedOptional;

const mappedValid: TestMappedCombined = { name: "John" };
const mappedInvalid: TestMappedCombined = {}; // Should error

export {};
