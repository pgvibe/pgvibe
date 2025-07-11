// PGVibe Query Builder - Main Entry Point
// A PostgreSQL-native TypeScript query builder with perfect alias system

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
} from "./query-builder.js";

// For convenience, also export a pre-configured instance
// Users can either import { qb } or create their own QueryBuilder<MyDB>
export { qb } from "./query-builder.js";
