// Column type definitions for pgvibe query builder

/**
 * Extracts all column names from available tables
 */
export type ColumnName<DB, TB extends keyof DB> = {
  [T in TB]: keyof DB[T] & string;
}[TB];

/**
 * Extracts all qualified column names (table.column format)
 */
export type QualifiedColumnName<DB, TB extends keyof DB> = {
  [T in TB]: T extends string ? `${T}.${keyof DB[T] & string}` : never;
}[TB];

/**
 * Extracts the effective table name/alias from a table expression
 */
export type ExtractTableAlias<DB, TE> =
  TE extends `${infer Table} as ${infer Alias}`
    ? Table extends keyof DB
      ? Alias
      : never
    : TE extends keyof DB
    ? TE
    : never;

