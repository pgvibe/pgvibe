// Array Type System
// Provides type-safe PostgreSQL array operations following the established JSONB pattern

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
 * This mapped type filters table columns to only those that are ArrayType,
 * enabling the array() helper function to only accept valid array columns.
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
 *     tags: ArrayType<string[]>;      // Included
 *     permissions: ArrayType<string[]>; // Included
 *   };
 * }
 *
 * ArrayColumnOf<Database, "users"> = "tags" | "permissions"
 * ```
 */
export type ArrayColumnOf<DB, TB extends keyof DB> = {
  [K in keyof DB[TB]]: DB[TB][K] extends ArrayType<any> ? K & string : never;
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

// Re-export for convenience
export type { ArrayType as PgArray };
export type { ArrayElementType as ElementType };
export type { ArrayColumnOf as ArrayColumns };
