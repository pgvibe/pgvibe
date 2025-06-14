// 🎯 SMOKING GUN: The 'extends Nullable<any>' problem

import type { Nullable } from "./src/core/types/utility-types";

// The core issue: what does 'T extends Nullable<any>' mean?
// Nullable<any> = any | null

// This is the problem!
type TestString = string extends any | null ? "OPTIONAL" : "REQUIRED"; // Result: "OPTIONAL" 😱
type TestNumber = number extends any | null ? "OPTIONAL" : "REQUIRED"; // Result: "OPTIONAL" 😱
type TestBoolean = boolean extends any | null ? "OPTIONAL" : "REQUIRED"; // Result: "OPTIONAL" 😱

// Because 'any' accepts all types, ALL types extend 'any | null'!
// This makes EVERY field optional in INSERT operations!

// The correct way would be to check if null is specifically in the union:
type CorrectStringCheck = null extends string ? "OPTIONAL" : "REQUIRED"; // Result: "REQUIRED" ✅
type CorrectNullableCheck = null extends string | null
  ? "OPTIONAL"
  : "REQUIRED"; // Result: "OPTIONAL" ✅

// Or use a more specific pattern to detect our Nullable wrapper:
type BetterNullableCheck<T> = T extends infer U | null
  ? null extends T
    ? "OPTIONAL"
    : "REQUIRED"
  : "REQUIRED";

type TestBetterString = BetterNullableCheck<string>; // Should be "REQUIRED"
type TestBetterNullable = BetterNullableCheck<string | null>; // Should be "OPTIONAL"

// Let's create a fixed version of the InsertType logic:
interface TestTable {
  name: string;
  email: string | null; // This is what Nullable<string> resolves to
}

// BROKEN version (current implementation):
type BrokenCondition<T> = T extends Nullable<any> ? "OPTIONAL" : "REQUIRED";
type BrokenName = BrokenCondition<TestTable["name"]>; // Result: "OPTIONAL" 😱 (wrong!)
type BrokenEmail = BrokenCondition<TestTable["email"]>; // Result: "OPTIONAL" ✅ (correct)

// FIXED version:
type FixedCondition<T> = null extends T ? "OPTIONAL" : "REQUIRED";
type FixedName = FixedCondition<TestTable["name"]>; // Result: "REQUIRED" ✅ (correct!)
type FixedEmail = FixedCondition<TestTable["email"]>; // Result: "OPTIONAL" ✅ (correct)

// Test the fixed InsertType logic:
type FixedInsertType<T extends Record<string, any>> = {
  [K in keyof T as null extends T[K] ? never : K]: T[K];
} & {
  [K in keyof T as null extends T[K] ? K : never]?: T[K];
};

type TestFixed = FixedInsertType<TestTable>;

// This should work correctly:
const fixedValid: TestFixed = { name: "John" };
const fixedInvalid: TestFixed = {}; // Should error!

export {};
