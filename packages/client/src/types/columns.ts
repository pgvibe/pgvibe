// Column type definitions for pgvibe query builder

/**
 * Extracts all column names from available tables
 * Optimized: Direct union extraction without mapped type overhead
 */
export type ColumnName<DB, TB extends keyof DB> = TB extends keyof DB ? keyof DB[TB] & string : never;

/**
 * Extracts all qualified column names (table.column format)
 * Optimized: Direct conditional type without mapped type overhead
 */
export type QualifiedColumnName<DB, TB extends keyof DB> = TB extends string 
  ? TB extends keyof DB 
    ? `${TB}.${keyof DB[TB] & string}` 
    : never 
  : never;

/**
 * Optimized: Caches alias extraction with conditional distributive logic
 * Focus on semantic validation - PostgreSQL handles syntax validation
 */
export type ExtractTableAlias<DB, TE> =
  TE extends `${infer Table} as ${infer Alias}`
    ? Table extends keyof DB ? Alias : never
    : TE extends keyof DB ? TE : never;

/**
 * Performance optimization: Pre-computed table validation
 */
export type IsValidTable<DB, T> = T extends keyof DB ? T : never;

