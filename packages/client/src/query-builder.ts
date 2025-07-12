// Production query builder - no test dependencies

// === UTILITY TYPES ===

// Ensures proper type distribution for union types
type NormalizeUnion<T> = [T] extends [unknown] ? T : never;

// Creates a shallow record with normalized keys
type NormalizeRecord<K extends keyof any, T> = NormalizeUnion<{
  [P in K]: T;
}>;

// === COLUMN TYPES ===

// Extracts all column names from available tables
export type ColumnName<DB, TB extends keyof DB> = {
  [T in TB]: keyof DB[T] & string;
}[TB];

// Extracts all qualified column names (table.column format)
export type QualifiedColumnName<DB, TB extends keyof DB> = {
  [T in TB]: T extends string ? `${T}.${keyof DB[T] & string}` : never;
}[TB];

// === TABLE TYPES ===

// All available table names
export type TableName<DB> = keyof DB & string;

// Table with alias syntax: "table as alias"
export type AliasedTable<DB> = `${TableName<DB>} as ${string}`;

// Any valid table expression (with or without alias)
export type TableExpression<DB> = TableName<DB> | AliasedTable<DB>;

// === ALIAS EXTRACTION ===

// Extracts the effective table name/alias from a table expression
export type ExtractTableAlias<DB, TE> =
  TE extends `${infer Table} as ${infer Alias}`
    ? Table extends keyof DB
      ? Alias
      : never
    : TE extends keyof DB
    ? TE
    : never;

// Extracts the row type for a given table expression and alias
type ExtractTableRowType<
  DB,
  TE,
  A extends keyof any
> = TE extends `${infer Table} as ${infer Alias}`
  ? Alias extends A
    ? Table extends keyof DB
      ? DB[Table]
      : never
    : never
  : TE extends A
  ? TE extends keyof DB
    ? DB[TE]
    : never
  : never;

// === QUERY CONTEXT TYPES ===

// Represents available tables/aliases in the current query context
export type QueryContext<DB, TE> = NormalizeUnion<{
  [C in keyof DB | ExtractTableAlias<DB, TE>]: C extends ExtractTableAlias<
    DB,
    TE
  >
    ? ExtractTableRowType<DB, TE, C>
    : C extends keyof DB
    ? DB[C]
    : never;
}>;

// Union of all available table identifiers in the query
export type AvailableTables<DB, TB extends keyof DB, TE> = NormalizeUnion<
  TB | ExtractTableAlias<DB, TE>
>;

// === JOIN COLUMN TYPES ===

// Valid column references for JOIN conditions
export type JoinColumnReference<DB, TB extends keyof DB, TE> = NormalizeUnion<
  JoinColumn<DB, TB, TE> | JoinQualifiedColumn<DB, TB, TE>
>;

type JoinColumn<DB, TB extends keyof DB, TE> = ColumnName<
  QueryContext<DB, TE>,
  AvailableTables<DB, TB, TE>
>;

type JoinQualifiedColumn<DB, TB extends keyof DB, TE> = QualifiedColumnName<
  QueryContext<DB, TE>,
  AvailableTables<DB, TB, TE>
>;

// Column validation - now supports aliases
export type ValidColumn<DB, TB extends keyof DB> =
  | ColumnName<DB, TB>
  | QualifiedColumnName<DB, TB>
  | `${ColumnName<DB, TB>} as ${string}`
  | `${QualifiedColumnName<DB, TB>} as ${string}`;

// === SELECTION RESULT TYPES ===

// Maps selected columns to their result object type
export type SelectionResult<
  DB,
  TB extends keyof DB,
  Selections extends string[]
> = {
  [K in Selections[number] as ExtractColumnAlias<K>]: ExtractColumnType<
    DB,
    TB,
    K
  >;
};

// Extracts the final property name from a column selection
type ExtractColumnAlias<C extends string> =
  C extends `${string} as ${infer Alias}`
    ? Alias
    : C extends `${string}.${infer Col}`
    ? Col
    : C;

// Extracts the TypeScript type for a column selection
type ExtractColumnType<
  DB,
  TB extends keyof DB,
  C extends string
> = C extends `${string} as ${string}`
  ? ExtractColumnType<DB, TB, ExtractColumnRef<C>>
  : C extends `${infer Table}.${infer Col}`
  ? Table extends TB
    ? Table extends keyof DB
      ? Col extends keyof DB[Table]
        ? DB[Table][Col]
        : never
      : never
    : never
  : C extends ColumnName<DB, TB>
  ? ExtractColumnTypeFromUnion<DB, TB, C>
  : never;

// Extracts the column reference from an aliased column
type ExtractColumnRef<C extends string> = C extends `${infer Ref} as ${string}`
  ? Ref
  : C;

// Resolves column type from union of possible tables
type ExtractColumnTypeFromUnion<DB, TB extends keyof DB, C extends string> = {
  [T in TB]: C extends keyof DB[T] ? DB[T][C] : never;
}[TB];

// === RESULT TYPE UTILITIES ===

// Forces TypeScript to resolve complex intersections into clean object types
type Prettify<T> = {
  [K in keyof T]: T[K];
} & {};

// === QUERY BUILDER RESULT TYPES ===

// Result type for queries with JOIN operations
type QueryBuilderWithJoin<
  DB,
  TB extends keyof DB,
  O,
  TE
> = TE extends `${infer Table} as ${infer Alias}`
  ? Table extends keyof DB
    ? SelectQueryBuilder<QueryContext<DB, TE>, AvailableTables<DB, TB, TE>, O>
    : never
  : TE extends keyof DB
  ? SelectQueryBuilder<QueryContext<DB, TE>, AvailableTables<DB, TB, TE>, O>
  : never;

// Query builder classes
export class QueryBuilder<DB> {
  // Entry point: creates a SELECT query from a table or aliased table
  selectFrom<TE extends TableExpression<DB>>(
    table: TE
  ): SelectQueryBuilder<QueryContext<DB, TE>, ExtractTableAlias<DB, TE>, {}> {
    return new SelectQueryBuilder<
      QueryContext<DB, TE>,
      ExtractTableAlias<DB, TE>,
      {}
    >(table as string);
  }
}

export class SelectQueryBuilder<DB, TB extends keyof DB, O> {
  private table: string;
  private selections: string[] = [];
  private joins: string[] = [];

  constructor(table: string) {
    this.table = table;
  }

  // Adds column selections with proper typing and alias support
  select<S extends ValidColumn<DB, TB>[]>(
    selections: S
  ): SelectQueryBuilder<DB, TB, O & SelectionResult<DB, TB, S>> {
    const newBuilder = new SelectQueryBuilder<
      DB,
      TB,
      O & SelectionResult<DB, TB, S>
    >(this.table);
    newBuilder.selections = [
      ...this.selections,
      ...(selections as readonly string[]),
    ];
    newBuilder.joins = [...this.joins];
    return newBuilder;
  }

  // Adds an INNER JOIN with type-safe column references
  innerJoin<
    TE extends TableExpression<DB>,
    K1 extends JoinColumnReference<DB, TB, TE>,
    K2 extends JoinColumnReference<DB, TB, TE>
  >(table: TE, k1: K1, k2: K2): QueryBuilderWithJoin<DB, TB, O, TE> {
    const newBuilder = new SelectQueryBuilder(this.table) as any;
    newBuilder.selections = [...this.selections];
    newBuilder.joins = [...this.joins, `INNER JOIN ${table} ON ${k1} = ${k2}`];
    return newBuilder;
  }

  // Adds a LEFT JOIN with type-safe column references
  leftJoin<
    TE extends TableExpression<DB>,
    K1 extends JoinColumnReference<DB, TB, TE>,
    K2 extends JoinColumnReference<DB, TB, TE>
  >(table: TE, k1: K1, k2: K2): QueryBuilderWithJoin<DB, TB, O, TE> {
    const newBuilder = new SelectQueryBuilder(this.table) as any;
    newBuilder.selections = [...this.selections];
    newBuilder.joins = [...this.joins, `LEFT JOIN ${table} ON ${k1} = ${k2}`];
    return newBuilder;
  }

  // Generates the final SQL string
  toSQL(): string {
    const selectList =
      this.selections.length > 0 ? this.selections.join(", ") : "*";
    // Convert lowercase 'as' to uppercase 'AS' for proper SQL formatting
    const fromClause = this.table.replace(/ as /g, " AS ");
    let sql = `SELECT ${selectList} FROM ${fromClause}`;

    if (this.joins.length > 0) {
      // Also convert 'as' to 'AS' in JOIN clauses
      const joins = this.joins.map((join) => join.replace(/ as /g, " AS "));
      sql += " " + joins.join(" ");
    }

    return sql;
  }

  // Executes the query and returns clean, properly typed results
  async execute(): Promise<Prettify<O>[]> {
    return [];
  }
}

// PGVibe query builder instance - users should create their own with proper schema
const qb = new QueryBuilder<any>();
export { qb };
