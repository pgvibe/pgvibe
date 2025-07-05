// Utility types for operation-aware type system
// Simplified approach: use Generated<T> for all database-provided values

/**
 * Marks a column as provided by the database
 * This includes:
 * - Auto-generated columns (SERIAL, UUID, computed columns)
 * - Columns with default values (DEFAULT expressions)
 * - Nullable columns (can be NULL)
 *
 * For INSERT operations: The column is optional (database provides value)
 * For SELECT operations: The column is always present
 * For UPDATE operations: The column can be updated normally
 */
export type Generated<T> = {
  readonly __brand: "Generated";
  readonly __type: T;
};

/**
 * Extract the base type from Generated<T>
 */
export type ExtractGenerated<T> = T extends Generated<any> ? T["__type"] : T;

/**
 * Check if a type is Generated
 */
export type IsGenerated<T> = T extends { readonly __brand: "Generated" }
  ? true
  : false;

/**
 * For INSERT operations: make Generated columns optional, require everything else
 */
export type InsertType<T> = {
  [K in keyof T as IsGenerated<T[K]> extends true ? never : K]: T[K];
} & {
  [K in keyof T as IsGenerated<T[K]> extends true
    ? K
    : never]?: ExtractGenerated<T[K]>;
};

/**
 * For UPDATE operations: make all columns optional except primary keys
 * (This is a simplified version - in practice you might want to mark primary keys)
 */
export type UpdateType<T> = {
  [K in keyof T]?: ExtractGenerated<T[K]>;
};

/**
 * For SELECT operations: all columns are present as defined
 */
export type SelectType<T> = {
  [K in keyof T]: ExtractGenerated<T[K]>;
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

// Legacy type aliases for backward compatibility
// These will be removed in a future version
export type WithDefault<T> = Generated<T>;
export type Nullable<T> = T | null;
