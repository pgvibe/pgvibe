// 🚨 ROOT CAUSE DEBUG: IsNullable function

import type { Nullable, IsNullable } from "./src/core/types/utility-types";

// Test IsNullable function
type Test1 = IsNullable<string>; // Should be false
type Test2 = IsNullable<string | null>; // Should be true
type Test3 = IsNullable<Nullable<string>>; // Should be true (Nullable<string> = string | null)

// Check what Nullable<string> actually resolves to
type NullableString = Nullable<string>; // Should be string | null

// Test the logic manually
type Manual1 = undefined extends string
  ? false
  : null extends string
  ? true
  : false; // Should be false
type Manual2 = undefined extends string | null
  ? false
  : null extends string | null
  ? true
  : false; // Should be true

// Now test the conditions in the InsertType logic
interface TestTable {
  name: string;
  email: Nullable<string>;
}

// This is the condition used in InsertType for determining if a field is optional
type NameIsNullable = TestTable["name"] extends Nullable<any> ? true : false; // Should be false
type EmailIsNullable = TestTable["email"] extends Nullable<any> ? true : false; // Should be true

// Let's also test the Nullable<any> pattern
type TestNullableAny1 = string extends Nullable<any> ? true : false; // Should be false
type TestNullableAny2 = string | null extends Nullable<any> ? true : false; // Should be true

// The issue might be here - let's see what Nullable<any> resolves to
type NullableAny = Nullable<any>; // Should be any | null

// Test if our types extend this
type TestExtends1 = string extends any | null ? true : false; // Might be true (problematic!)
type TestExtends2 = string | null extends any | null ? true : false; // Should be true

export {};
