// Column validation error types for developer experience
// These provide clear error messages when invalid columns are accessed

/**
 * Error when a column doesn't exist in any of the available tables
 */
export type ColumnNotFoundError<
  TColumn extends string,
  TAvailableTables extends string
> = {
  readonly error: "COLUMN_NOT_FOUND";
  readonly message: `Column '${TColumn}' does not exist in any of the available tables: ${TAvailableTables}`;
  readonly column: TColumn;
  readonly availableTables: TAvailableTables;
};

/**
 * Error when trying to access a table column that hasn't been joined
 */
export type TableNotJoinedError<
  TTable extends string,
  TColumn extends string
> = {
  readonly error: "TABLE_NOT_JOINED";
  readonly message: `Cannot access '${TTable}.${TColumn}' because table '${TTable}' has not been joined. Use .innerJoin(), .leftJoin(), or .rightJoin() first.`;
  readonly table: TTable;
  readonly column: TColumn;
};

/**
 * Error for invalid qualified column format
 */
export type QualifiedColumnError<TInput extends string> = {
  readonly error: "INVALID_QUALIFIED_COLUMN";
  readonly message: `Invalid qualified column format: '${TInput}'. Expected format: 'table.column'`;
  readonly input: TInput;
};

/**
 * Error when a column exists in multiple tables and needs qualification
 */
export type AmbiguousColumnError<
  TColumn extends string,
  TConflictingTables extends string
> = {
  readonly error: "AMBIGUOUS_COLUMN";
  readonly message: `Column '${TColumn}' is ambiguous. It exists in multiple tables: ${TConflictingTables}. Use qualified names like: ${TConflictingTables extends `${infer First}, ${infer Rest}`
    ? `'${First}.${TColumn}' or '${Rest}.${TColumn}'`
    : `'${TConflictingTables}.${TColumn}'`}`;
  readonly column: TColumn;
  readonly conflictingTables: TConflictingTables;
};

/**
 * Error when selecting qualified columns would create duplicate properties
 */
export type DuplicatePropertyError<TColumn extends string> = {
  readonly error: "DUPLICATE_PROPERTY";
  readonly message: `Selecting multiple '${TColumn}' columns would create duplicate properties in result. Consider using different column names or aliases`;
  readonly column: TColumn;
};

/**
 * Union of all possible column validation errors
 */
export type ColumnValidationError =
  | ColumnNotFoundError<string, string>
  | TableNotJoinedError<string, string>
  | QualifiedColumnError<string>
  | AmbiguousColumnError<string, string>;

/**
 * Type that represents either a valid column or a validation error
 */
export type ValidatedColumn<T> = T extends ColumnValidationError ? T : T;
