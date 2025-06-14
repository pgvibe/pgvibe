// 🔍 DEBUG: InsertType issue investigation
// Goal: Understand why required fields aren't being enforced in INSERT operations

import type {
  Generated,
  WithDefault,
  Nullable,
  InsertType,
  IsGenerated,
  HasDefault,
  IsNullable,
  RequiredInsertKeys,
  OptionalInsertKeys,
  ExtractBaseType,
} from "./src/core/types/utility-types";

// === STEP 1: Simple test case ===
interface SimpleTable {
  id: Generated<number>; // Should be excluded from INSERT
  name: string; // Should be REQUIRED in INSERT
  email: Nullable<string>; // Should be optional in INSERT
  active: WithDefault<boolean>; // Should be optional in INSERT
}

// === STEP 2: Test individual utility functions ===
type Debug_IsGenerated_ID = IsGenerated<SimpleTable["id"]>; // Expected: true
type Debug_IsGenerated_Name = IsGenerated<SimpleTable["name"]>; // Expected: false
type Debug_HasDefault_Active = HasDefault<SimpleTable["active"]>; // Expected: true
type Debug_HasDefault_Name = HasDefault<SimpleTable["name"]>; // Expected: false
type Debug_IsNullable_Email = IsNullable<SimpleTable["email"]>; // Expected: true
type Debug_IsNullable_Name = IsNullable<SimpleTable["name"]>; // Expected: false

// === STEP 3: Test key extraction ===
type Debug_RequiredKeys = RequiredInsertKeys<SimpleTable>; // Expected: "name"
type Debug_OptionalKeys = OptionalInsertKeys<SimpleTable>; // Expected: "id" | "email" | "active"

// === STEP 4: Test the actual InsertType ===
type Debug_InsertType = InsertType<SimpleTable>;

// === STEP 5: Let's debug the IsNullable function specifically ===
// This might be the issue - let's check how IsNullable works
type Debug_Nullable_String = Nullable<string>; // Should be string | null
type Debug_IsNullable_Test1 = IsNullable<string | null>; // Should be true
type Debug_IsNullable_Test2 = IsNullable<string>; // Should be false
type Debug_IsNullable_Test3 = IsNullable<Nullable<string>>; // Should be true

// Let's also test the condition logic directly
type Debug_EmailType = SimpleTable["email"]; // Should be string | null
type Debug_EmailExtendsNullable = SimpleTable["email"] extends Nullable<any>
  ? true
  : false;
type Debug_NameExtendsNullable = SimpleTable["name"] extends Nullable<any>
  ? true
  : false;

// === STEP 6: Let's manually recreate the InsertType logic step by step ===
// First, let's see what each condition evaluates to for each field:

// For 'id' field:
type Debug_ID_IsGenerated = IsGenerated<SimpleTable["id"]>; // Should be true -> exclude from required
type Debug_ID_HasDefault = HasDefault<SimpleTable["id"]>; // Should be false
type Debug_ID_IsNullable = SimpleTable["id"] extends Nullable<any>
  ? true
  : false; // Should be false

// For 'name' field:
type Debug_Name_IsGenerated = IsGenerated<SimpleTable["name"]>; // Should be false
type Debug_Name_HasDefault = HasDefault<SimpleTable["name"]>; // Should be false
type Debug_Name_IsNullable = SimpleTable["name"] extends Nullable<any>
  ? true
  : false; // Should be false -> REQUIRED

// For 'email' field:
type Debug_Email_IsGenerated = IsGenerated<SimpleTable["email"]>; // Should be false
type Debug_Email_HasDefault = HasDefault<SimpleTable["email"]>; // Should be false
type Debug_Email_IsNullable = SimpleTable["email"] extends Nullable<any>
  ? true
  : false; // Should be true -> optional

// For 'active' field:
type Debug_Active_IsGenerated = IsGenerated<SimpleTable["active"]>; // Should be false
type Debug_Active_HasDefault = HasDefault<SimpleTable["active"]>; // Should be true -> optional
type Debug_Active_IsNullable = SimpleTable["active"] extends Nullable<any>
  ? true
  : false; // Should be false

// === STEP 7: Test the key filtering logic manually ===
type Debug_NameKey_Required = IsGenerated<SimpleTable["name"]> extends true
  ? never
  : HasDefault<SimpleTable["name"]> extends true
  ? never
  : SimpleTable["name"] extends Nullable<any>
  ? never
  : "name"; // Should be 'name'

type Debug_IDKey_Required = IsGenerated<SimpleTable["id"]> extends true
  ? never
  : HasDefault<SimpleTable["id"]> extends true
  ? never
  : SimpleTable["id"] extends Nullable<any>
  ? never
  : "id"; // Should be never

// === STEP 8: Let's manually break down what InsertType should produce ===
// First part: Required fields
type Debug_RequiredPart = {
  [K in keyof SimpleTable as IsGenerated<SimpleTable[K]> extends true
    ? never
    : HasDefault<SimpleTable[K]> extends true
    ? never
    : SimpleTable[K] extends Nullable<any>
    ? never
    : K]: ExtractBaseType<SimpleTable[K]>; // Using ExtractBaseType like the real implementation
};

// Second part: Optional fields
type Debug_OptionalPart = {
  [K in keyof SimpleTable as IsGenerated<SimpleTable[K]> extends true
    ? K
    : HasDefault<SimpleTable[K]> extends true
    ? K
    : SimpleTable[K] extends Nullable<any>
    ? K
    : never]?: ExtractBaseType<SimpleTable[K]>; // Using ExtractBaseType like the real implementation
};

// Combined
type Debug_Combined = Debug_RequiredPart & Debug_OptionalPart;

// === STEP 9: Let's create explicit type tests ===
// Test that we can assign valid objects
const valid1: Debug_InsertType = { name: "John" };
const valid2: Debug_InsertType = { name: "John", email: "john@example.com" };
const valid3: Debug_InsertType = { name: "John", active: true };

// These should cause errors but probably won't
const invalid1: Debug_InsertType = {}; // Missing required 'name'
const invalid2: Debug_InsertType = { email: "john@example.com" }; // Missing required 'name'
const invalid3: Debug_InsertType = { name: "John", id: 1 }; // Including Generated field

export {};
