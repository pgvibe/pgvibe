// 🎯 FINAL DEBUG: Test the exact InsertType conditions

import type {
  Generated,
  WithDefault,
  Nullable,
  InsertType,
  IsGenerated,
  HasDefault,
  ExtractBaseType,
} from "./src/core/types/utility-types";

interface TestTable {
  id: Generated<number>;
  name: string;
  email: Nullable<string>;
  active: WithDefault<boolean>;
}

// === Test the exact conditions used in InsertType ===

// For the required part condition:
type Debug_Name_Condition = IsGenerated<TestTable["name"]> extends true
  ? never
  : HasDefault<TestTable["name"]> extends true
  ? never
  : TestTable["name"] extends Nullable<any>
  ? never
  : "name"; // Should be 'name'

type Debug_ID_Condition = IsGenerated<TestTable["id"]> extends true
  ? never
  : HasDefault<TestTable["id"]> extends true
  ? never
  : TestTable["id"] extends Nullable<any>
  ? never
  : "id"; // Should be never

// Let's test EXACTLY what the real InsertType produces
type RealInsertType = InsertType<TestTable>;

// Let's also manually recreate it step by step
type ExactRequiredPart = {
  [K in keyof TestTable as IsGenerated<TestTable[K]> extends true
    ? never
    : HasDefault<TestTable[K]> extends true
    ? never
    : TestTable[K] extends Nullable<any>
    ? never
    : K]: ExtractBaseType<TestTable[K]>;
};

type ExactOptionalPart = {
  [K in keyof TestTable as IsGenerated<TestTable[K]> extends true
    ? K
    : HasDefault<TestTable[K]> extends true
    ? K
    : TestTable[K] extends Nullable<any>
    ? K
    : never]?: ExtractBaseType<TestTable[K]>;
};

type ExactCombined = ExactRequiredPart & ExactOptionalPart;

// Test all three
const realTest: RealInsertType = { name: "John" };
const realTestInvalid: RealInsertType = {}; // This is NOT erroring!

const exactTest: ExactCombined = { name: "John" };
const exactTestInvalid: ExactCombined = {}; // Should error

// Let's check if there's something weird about the actual implementation
// Maybe the issue is that the mapped types resolve to something unexpected

// Let's force TypeScript to show us what these resolve to
type InspectReal = RealInsertType extends infer U ? U : never;
type InspectExact = ExactCombined extends infer U ? U : never;

// Test if there's a difference between using the type alias vs direct implementation
type DirectInsertType = {
  [K in keyof TestTable as IsGenerated<TestTable[K]> extends true
    ? never
    : HasDefault<TestTable[K]> extends true
    ? never
    : TestTable[K] extends Nullable<any>
    ? never
    : K]: ExtractBaseType<TestTable[K]>;
} & {
  [K in keyof TestTable as IsGenerated<TestTable[K]> extends true
    ? K
    : HasDefault<TestTable[K]> extends true
    ? K
    : TestTable[K] extends Nullable<any>
    ? K
    : never]?: ExtractBaseType<TestTable[K]>;
};

const directTest: DirectInsertType = { name: "John" };
const directTestInvalid: DirectInsertType = {}; // Should error

export {};
