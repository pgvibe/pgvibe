// Utility types for operation-aware type system
// These types help create different type representations for different SQL operations

/**
 * Marks a column as auto-generated (like SERIAL, UUID, or computed columns)
 * - SELECT: The column is always present
 * - INSERT: The column is optional (database generates it)
 * - UPDATE: The column is typically not updatable
 */
export type Generated<T> = {
  readonly __brand: "Generated";
  readonly __type: T;
};

/**
 * Marks a column as having a database default value
 * - SELECT: The column is always present
 * - INSERT: The column is optional (database provides default)
 * - UPDATE: The column can be updated normally
 */
export type WithDefault<T> = {
  readonly __brand: "WithDefault";
  readonly __type: T;
};

/**
 * Marks a column as nullable (can be NULL in database)
 * - SELECT: The column type includes null
 * - INSERT: The column can be omitted or set to null
 * - UPDATE: The column can be updated to null
 */
export type Nullable<T> = T | null;

/**
 * Extract the base type from Generated<T>
 */
export type ExtractGenerated<T> = T extends Generated<any> ? T["__type"] : T;

/**
 * Extract the base type from WithDefault<T>
 */
export type ExtractWithDefault<T> = T extends WithDefault<any>
  ? T["__type"]
  : T;

/**
 * Extract the base type from Nullable<T>
 */
export type ExtractNullable<T> = T extends Nullable<infer U> ? U : T;

/**
 * Extract the clean base type from any utility type wrapper
 * For nullable types, preserve the null union
 */
export type ExtractBaseType<T> = IsNullable<T> extends true
  ? ExtractGenerated<ExtractWithDefault<T>>
  : ExtractGenerated<ExtractWithDefault<T>>;

/**
 * Check if a type is Generated
 */
export type IsGenerated<T> = T extends { readonly __brand: "Generated" }
  ? true
  : false;

/**
 * Check if a type has a default value
 */
export type HasDefault<T> = T extends { readonly __brand: "WithDefault" }
  ? true
  : false;

/**
 * Check if a type is nullable
 * Use a different approach: check if undefined is assignable to T
 * This works because nullable types in our system are T | null
 */
export type IsNullable<T> = undefined extends T
  ? false
  : null extends T
  ? true
  : false;

/**
 * Helper type to get keys that should be optional in INSERT
 */
export type OptionalInsertKeys<T> = {
  [K in keyof T]: IsGenerated<T[K]> extends true
    ? K
    : HasDefault<T[K]> extends true
    ? K
    : T[K] extends Nullable<any>
    ? K
    : never;
}[keyof T];

/**
 * Helper type to get keys that should be required in INSERT
 */
export type RequiredInsertKeys<T> = {
  [K in keyof T]: IsGenerated<T[K]> extends true
    ? never
    : HasDefault<T[K]> extends true
    ? never
    : T[K] extends Nullable<any>
    ? never
    : K;
}[keyof T];

/**
 * For INSERT operations: make Generated and WithDefault columns optional,
 * keep nullable columns as optional with null, require everything else
 *
 * Fixed: Use 'null extends T[K]' instead of 'T[K] extends Nullable<any>'
 * to correctly identify nullable fields without matching all types to 'any'
 */
export type InsertType<T> = {
  [K in keyof T as IsGenerated<T[K]> extends true
    ? never
    : HasDefault<T[K]> extends true
    ? never
    : null extends T[K]
    ? never
    : K]: ExtractBaseType<T[K]>;
} & {
  [K in keyof T as IsGenerated<T[K]> extends true
    ? K
    : HasDefault<T[K]> extends true
    ? K
    : null extends T[K]
    ? K
    : never]?: ExtractBaseType<T[K]>;
};

/**
 * For UPDATE operations: make all columns optional except primary keys
 * (This is a simplified version - in practice you might want to mark primary keys)
 */
export type UpdateType<T> = {
  [K in keyof T]?: ExtractBaseType<T[K]>;
};

/**
 * For SELECT operations: all columns are present as defined
 */
export type SelectType<T> = {
  [K in keyof T]: ExtractBaseType<T[K]>;
};

/**
 * Kysely-style ColumnType for maximum flexibility
 * Allows specifying different types for SELECT, INSERT, and UPDATE operations
 */
export type ColumnType<
  SelectType,
  InsertType = SelectType,
  UpdateType = InsertType
> = {
  readonly __select__: SelectType;
  readonly __insert__: InsertType;
  readonly __update__: UpdateType;
};

/**
 * Extract SELECT type from ColumnType
 */
export type ExtractSelectType<T> = T extends ColumnType<infer S, any, any>
  ? S
  : T;

/**
 * Extract INSERT type from ColumnType
 */
export type ExtractInsertType<T> = T extends ColumnType<any, infer I, any>
  ? I
  : T;

/**
 * Extract UPDATE type from ColumnType
 */
export type ExtractUpdateType<T> = T extends ColumnType<any, any, infer U>
  ? U
  : T;
