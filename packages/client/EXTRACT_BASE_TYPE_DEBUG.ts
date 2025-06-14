// 🔍 DEBUG: ExtractBaseType issue investigation
import type {
  Generated,
  WithDefault,
  Nullable,
  ExtractBaseType,
  IsNullable,
} from "./src/core/types/utility-types";

// Test table
interface TestTable {
  id: Generated<number>;
  name: string;
  email: Nullable<string>;
  active: WithDefault<boolean>;
}

// Test ExtractBaseType on each field
type Debug_ExtractBase_ID = ExtractBaseType<TestTable["id"]>; // Should be number
type Debug_ExtractBase_Name = ExtractBaseType<TestTable["name"]>; // Should be string
type Debug_ExtractBase_Email = ExtractBaseType<TestTable["email"]>; // Should be string | null
type Debug_ExtractBase_Active = ExtractBaseType<TestTable["active"]>; // Should be boolean

// Let's examine the ExtractBaseType logic step by step for 'name'
type Debug_IsNullable_Name = IsNullable<TestTable["name"]>; // Should be false
type Debug_ExtractBase_Name_Step1 = IsNullable<TestTable["name"]> extends true
  ? "path1"
  : "path2"; // Should be "path2"

// Now let's test if the issue is in using ExtractBaseType vs raw types
type TestInsertType_WithExtract = {
  [K in keyof TestTable as K extends "name" ? K : never]: ExtractBaseType<
    TestTable[K]
  >;
} & {
  [K in keyof TestTable as K extends "id" | "email" | "active"
    ? K
    : never]?: ExtractBaseType<TestTable[K]>;
};

type TestInsertType_WithoutExtract = {
  [K in keyof TestTable as K extends "name" ? K : never]: TestTable[K];
} & {
  [K in keyof TestTable as K extends "id" | "email" | "active"
    ? K
    : never]?: TestTable[K];
};

// Test both versions
const testWithExtract: TestInsertType_WithExtract = { name: "John" };
const testWithExtractInvalid: TestInsertType_WithExtract = {}; // Should error

const testWithoutExtract: TestInsertType_WithoutExtract = { name: "John" };
const testWithoutExtractInvalid: TestInsertType_WithoutExtract = {}; // Should error

// Let's also check if there's an issue with the intersection logic
type DebugRequiredPart = {
  [K in keyof TestTable as K extends "name" ? K : never]: string;
};

type DebugOptionalPart = {
  [K in keyof TestTable as K extends "id" | "email" | "active"
    ? K
    : never]?: K extends "id"
    ? number
    : K extends "email"
    ? string | null
    : boolean;
};

type DebugCombined = DebugRequiredPart & DebugOptionalPart;

const debugValid: DebugCombined = { name: "John" };
const debugInvalid: DebugCombined = {}; // Should error

export {};
