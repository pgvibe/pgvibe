// PGVibe Query Builder - Main Entry Point
// A PostgreSQL-native TypeScript query builder with perfect alias system

import { QueryBuilder } from "./query-builder";

export {
  QueryBuilder,
  SelectQueryBuilder,
  // Types
  type ColumnName,
  type QualifiedColumnName,
  type TableExpression,
  type ValidColumn,
  type QueryContext,
  type AvailableTables,
  type JoinColumnReference,
  type ExtractTableAlias,
} from "./query-builder";

// Main pgvibe function - the primary API
export function pgvibe<DB>(): QueryBuilder<DB> {
  return new QueryBuilder<DB>();
}

// Legacy export for backwards compatibility
export { qb } from "./query-builder";
