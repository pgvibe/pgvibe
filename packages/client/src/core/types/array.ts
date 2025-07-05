// Array Type System
// Provides type-safe PostgreSQL array operations following the established JSONB pattern

import type { Generated } from "./utility-types";

/**
 * PostgreSQL array type representation using branded types for compile-time safety
 *
 * This branded type ensures that only array columns can be used with array operations,
 * preventing runtime errors and providing excellent TypeScript intellisense.
 *
 * @template T - The array type (e.g., string[], number[], etc.)
 *
 * Example usage in database schema:
 * ```typescript
 * interface Database {
 *   users: {
 *     tags: ArrayType<string[]>;
 *     scores: ArrayType<number[]>;
 *   };
 * }
 * ```
 */
export interface ArrayType<T extends readonly any[]> {
  readonly __arrayBrand: unique symbol;
  readonly __arrayValue: T;
}

/**
 * Extract the element type from an ArrayType
 *
 * This utility type extracts the element type from an ArrayType, enabling
 * type-safe operations where we need to know what type of elements the array contains.
 *
 * @template T - The ArrayType to extract from
 * @returns The element type of the array
 *
 * Examples:
 * - ArrayElementType<ArrayType<string[]>> = string
 * - ArrayElementType<ArrayType<number[]>> = number
 * - ArrayElementType<ArrayType<readonly boolean[]>> = boolean
 */
export type ArrayElementType<T> = T extends ArrayType<infer U>
  ? U extends readonly (infer E)[]
    ? E
    : never
  : never;

/**
 * Helper type to identify array columns in a database schema
 *
 * This mapped type filters table columns to only those that are ArrayType or plain array types,
 * enabling the array() helper function to only accept valid array columns.
 * Now properly handles Generated<> types.
 *
 * @template DB - The database schema type
 * @template TB - The table name(s) being queried
 * @returns Union type of column names that are arrays
 *
 * Example:
 * ```typescript
 * interface Database {
 *   users: {
 *     id: number;           // Not included
 *     name: string;         // Not included
 *     tags: string[];       // Included (plain array)
 *     scores: ArrayType<number[]>; // Included (branded array)
 *     categories: Generated<string[]>; // Included (Generated array)
 *   };
 * }
 *
 * ArrayColumnOf<Database, "users"> = "tags" | "scores" | "categories"
 * ```
 */
export type ArrayColumnOf<DB, TB extends keyof DB> = {
  [K in keyof DB[TB]]: DB[TB][K] extends ArrayType<any>
    ? K & string
    : DB[TB][K] extends readonly any[]
    ? K & string
    : DB[TB][K] extends Generated<infer T>
    ? T extends readonly any[]
      ? K & string
      : never
    : never;
}[keyof DB[TB]];

/**
 * Utility type to validate array element type compatibility
 *
 * This ensures that values passed to array operations match the element type
 * of the array column, providing compile-time type safety.
 *
 * @template T - The ArrayType column type
 * @template V - The value type being validated
 * @returns The value type if compatible, never if incompatible
 */
export type ValidArrayElement<T, V> = T extends ArrayType<infer U>
  ? U extends readonly (infer E)[]
    ? V extends E
      ? V
      : never
    : never
  : never;

/**
 * Utility type for array values used in operations
 *
 * This ensures that array values passed to operations like contains() and overlaps()
 * contain elements that are compatible with the column's element type.
 *
 * @template T - The ArrayType column type
 * @template V - The array value type being validated
 * @returns The array value type if all elements are compatible, never if incompatible
 */
export type ValidArrayValue<T, V> = T extends ArrayType<infer U>
  ? U extends readonly (infer E)[]
    ? V extends readonly (infer VE)[]
      ? VE extends E
        ? V
        : never
      : never
    : never
  : never;

/**
 * Error message type for invalid array operations
 */
export type ArrayTypeError<T extends string> = {
  readonly __arrayTypeError: T;
  readonly __brand: never;
};

/**
 * Enhanced error messages for better developer experience
 */
export type InvalidArrayElementError =
  ArrayTypeError<"❌ Array element type is not valid. Expected: string, number, boolean, or Date.">;

export type InvalidArrayColumnError<T extends string> =
  ArrayTypeError<`❌ Column '${T}' is not an array column. Array operations can only be used on columns with array types.`>;

export type ArrayOperationMismatchError<
  T extends string,
  V
> = ArrayTypeError<`❌ Type mismatch in array operation. Column '${T}' expects array elements of type ${string}, but received ${string}.`>;

/**
 * Developer-friendly array column validator with helpful error messages
 */
export type ValidateArrayColumn<
  DB,
  TB extends keyof DB,
  K extends keyof DB[TB]
> = DB[TB][K] extends ArrayType<any> ? K : InvalidArrayColumnError<K & string>;

/**
 * Developer-friendly array element validator with helpful error messages
 */
export type ValidateArrayElements<T, V> = T extends ArrayType<infer U>
  ? V extends readonly U[]
    ? V
    : V extends U
    ? V
    : ArrayOperationMismatchError<string, V>
  : InvalidArrayElementError;

// Re-export for convenience
export type { ArrayType as PgArray };
export type { ArrayElementType as ElementType };
export type { ArrayColumnOf as ArrayColumns };
