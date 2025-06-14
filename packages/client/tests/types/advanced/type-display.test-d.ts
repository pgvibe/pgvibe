// Type tests for Prettify utility type
// Ensures the Prettify type correctly expands object types for better TypeScript display

import { expectType, expectAssignable } from "../utils/test-helpers.test-d.ts";

// Local Prettify type for testing (simplified version)
type Prettify<T> = {
  [K in keyof T]: T[K];
} & {};

// Test basic interface prettification
interface TestInterface {
  id: number;
  name: string;
  email: string | null;
}

export function testBasicPrettify() {
  // Prettify should expand the interface to an object type
  type PrettifiedInterface = Prettify<TestInterface>;

  // Should be assignable to the original interface
  expectAssignable<TestInterface>({} as PrettifiedInterface);
  expectAssignable<PrettifiedInterface>({} as TestInterface);

  // Should have the same structure
  expectType<{
    id: number;
    name: string;
    email: string | null;
  }>({} as PrettifiedInterface);
}

// Test nested object prettification
interface NestedInterface {
  user: {
    id: number;
    profile: {
      name: string;
      settings: {
        theme: "light" | "dark";
      };
    };
  };
  metadata: Record<string, any>;
}

export function testNestedPrettify() {
  type PrettifiedNested = Prettify<NestedInterface>;

  // Should preserve nested structure
  expectType<{
    user: {
      id: number;
      profile: {
        name: string;
        settings: {
          theme: "light" | "dark";
        };
      };
    };
    metadata: Record<string, any>;
  }>({} as PrettifiedNested);
}

// Test array types
interface ArrayInterface {
  tags: string[];
  scores: number[];
  items: Array<{ id: number; value: string }>;
}

export function testArrayPrettify() {
  type PrettifiedArray = Prettify<ArrayInterface>;

  expectType<{
    tags: string[];
    scores: number[];
    items: Array<{ id: number; value: string }>;
  }>({} as PrettifiedArray);
}

// Test union types
interface UnionInterface {
  status: "active" | "inactive" | "pending";
  value: string | number | null;
}

export function testUnionPrettify() {
  type PrettifiedUnion = Prettify<UnionInterface>;

  expectType<{
    status: "active" | "inactive" | "pending";
    value: string | number | null;
  }>({} as PrettifiedUnion);
}

// Test optional properties
interface OptionalInterface {
  required: string;
  optional?: number;
  nullable: string | null;
  optionalNullable?: string | null;
}

export function testOptionalPrettify() {
  type PrettifiedOptional = Prettify<OptionalInterface>;

  expectType<{
    required: string;
    optional?: number;
    nullable: string | null;
    optionalNullable?: string | null;
  }>({} as PrettifiedOptional);
}

// Test that Prettify preserves readonly modifiers
interface ReadonlyInterface {
  readonly id: number;
  readonly tags: readonly string[];
  mutable: string;
}

export function testReadonlyPrettify() {
  type PrettifiedReadonly = Prettify<ReadonlyInterface>;

  expectType<{
    readonly id: number;
    readonly tags: readonly string[];
    mutable: string;
  }>({} as PrettifiedReadonly);
}

// Test generic types
interface GenericInterface<T> {
  data: T;
  meta: {
    count: number;
    type: string;
  };
}

export function testGenericPrettify() {
  type PrettifiedGeneric = Prettify<GenericInterface<string>>;

  expectType<{
    data: string;
    meta: {
      count: number;
      type: string;
    };
  }>({} as PrettifiedGeneric);
}

// Test intersection types
type IntersectionType = { a: string } & { b: number } & { c: boolean };

export function testIntersectionPrettify() {
  type PrettifiedIntersection = Prettify<IntersectionType>;

  expectType<{
    a: string;
    b: number;
    c: boolean;
  }>({} as PrettifiedIntersection);
}

// Test that Prettify works with complex database-like types
interface DatabaseLikeInterface {
  id: number;
  created_at: Date;
  updated_at: Date;
  user_data: {
    name: string;
    email: string | null;
    preferences: {
      theme: "light" | "dark";
      notifications: boolean;
    };
  };
  tags: string[];
  metadata: Record<string, unknown>;
}

export function testDatabaseLikePrettify() {
  type PrettifiedDatabase = Prettify<DatabaseLikeInterface>;

  expectType<{
    id: number;
    created_at: Date;
    updated_at: Date;
    user_data: {
      name: string;
      email: string | null;
      preferences: {
        theme: "light" | "dark";
        notifications: boolean;
      };
    };
    tags: string[];
    metadata: Record<string, unknown>;
  }>({} as PrettifiedDatabase);
}

// Test that Prettify doesn't break function types
interface FunctionInterface {
  callback: (x: number) => string;
  asyncCallback: (data: any) => Promise<void>;
}

export function testFunctionPrettify() {
  type PrettifiedFunction = Prettify<FunctionInterface>;

  expectType<{
    callback: (x: number) => string;
    asyncCallback: (data: any) => Promise<void>;
  }>({} as PrettifiedFunction);
}
