import { TestDB } from '../tests/test-schema.js'

// Kysely's proven approach - exact implementation
type DrainOuterGeneric<T> = [T] extends [unknown] ? T : never

type ShallowRecord<K extends keyof any, T> = DrainOuterGeneric<{
  [P in K]: T
}>

export type AnyColumn<DB, TB extends keyof DB> = {
  [T in TB]: keyof DB[T] & string
}[TB]

export type AnyColumnWithTable<DB, TB extends keyof DB> = {
  [T in TB]: T extends string ? `${T}.${keyof DB[T] & string}` : never
}[TB]

// Table autocomplete types - following Kysely exactly
export type AnyTable<DB> = keyof DB & string
export type AnyAliasedTable<DB> = `${AnyTable<DB>} as ${string}`
export type TableExpression<DB> = AnyTable<DB> | AnyAliasedTable<DB>

// Kysely's exact alias extraction
export type ExtractAliasFromTableExpression<DB, TE> = TE extends `${infer Table} as ${infer Alias}`
  ? Table extends keyof DB
    ? Alias
    : never
  : TE extends keyof DB
  ? TE
  : never

// Kysely's exact row type extraction  
type ExtractRowTypeFromTableExpression<DB, TE, A extends keyof any> = 
  TE extends `${infer Table} as ${infer Alias}`
    ? Alias extends A
      ? Table extends keyof DB
        ? DB[Table]
        : never
      : never
    : TE extends A
    ? TE extends keyof DB
      ? DB[TE]
      : never
    : never

// Kysely's exact From type - this is the key to everything!
export type From<DB, TE> = DrainOuterGeneric<{
  [C in
    | keyof DB
    | ExtractAliasFromTableExpression<DB, TE>]: C extends ExtractAliasFromTableExpression<DB, TE>
    ? ExtractRowTypeFromTableExpression<DB, TE, C>
    : C extends keyof DB
      ? DB[C]
      : never
}>

// Kysely's exact FromTables type
export type FromTables<DB, TB extends keyof DB, TE> = DrainOuterGeneric<
  TB | ExtractAliasFromTableExpression<DB, TE>
>

// Kysely's exact JOIN reference types
export type JoinReferenceExpression<DB, TB extends keyof DB, TE> = DrainOuterGeneric<
  | AnyJoinColumn<DB, TB, TE>
  | AnyJoinColumnWithTable<DB, TB, TE>
>

type AnyJoinColumn<DB, TB extends keyof DB, TE> = AnyColumn<
  From<DB, TE>,
  FromTables<DB, TB, TE>
>

type AnyJoinColumnWithTable<DB, TB extends keyof DB, TE> = AnyColumnWithTable<
  From<DB, TE>,
  FromTables<DB, TB, TE>
>

// Column validation - simplified
export type ValidColumn<DB, TB extends keyof DB> = 
  | AnyColumn<DB, TB>
  | AnyColumnWithTable<DB, TB>

// Selection result type
export type SelectionResult<DB, TB extends keyof DB, Selections extends string[]> = {
  [K in Selections[number] as ExtractColumnAlias<K>]: ExtractColumnType<DB, TB, K>
}

type ExtractColumnAlias<C extends string> = C extends `${string} as ${infer Alias}`
  ? Alias
  : C extends `${string}.${infer Col}`
  ? Col
  : C

type ExtractColumnType<DB, TB extends keyof DB, C extends string> = 
  C extends `${string} as ${string}`
    ? ExtractColumnType<DB, TB, ExtractColumnRef<C>>
    : C extends `${infer Table}.${infer Col}`
    ? Table extends TB
      ? Table extends keyof DB
        ? Col extends keyof DB[Table]
          ? DB[Table][Col]
          : never
        : never
      : never
    : C extends AnyColumn<DB, TB>
    ? ExtractColumnTypeFromUnion<DB, TB, C>
    : never

type ExtractColumnRef<C extends string> = C extends `${infer Ref} as ${string}`
  ? Ref
  : C

type ExtractColumnTypeFromUnion<DB, TB extends keyof DB, C extends string> = {
  [T in TB]: C extends keyof DB[T] ? DB[T][C] : never
}[TB]

// Kysely's exact JOIN result types
type SelectQueryBuilderWithInnerJoin<DB, TB extends keyof DB, O, TE> = 
  TE extends `${infer Table} as ${infer Alias}`
    ? Table extends keyof DB
      ? SelectQueryBuilder<From<DB, TE>, FromTables<DB, TB, TE>, O>
      : never
    : TE extends keyof DB
    ? SelectQueryBuilder<From<DB, TE>, FromTables<DB, TB, TE>, O>
    : never

// Query builder classes
export class QueryBuilder<DB> {
  // Fixed: Use Kysely's From type from the start
  selectFrom<TE extends TableExpression<DB>>(
    table: TE
  ): SelectQueryBuilder<From<DB, TE>, ExtractAliasFromTableExpression<DB, TE>, {}> {
    return new SelectQueryBuilder<From<DB, TE>, ExtractAliasFromTableExpression<DB, TE>, {}>(table as string)
  }
}

export class SelectQueryBuilder<DB, TB extends keyof DB, O> {
  private table: string
  private selections: string[] = []
  private joins: string[] = []

  constructor(table: string) {
    this.table = table
  }

  select<S extends ValidColumn<DB, TB>[]>(
    selections: S
  ): SelectQueryBuilder<DB, TB, O & SelectionResult<DB, TB, S>> {
    const newBuilder = new SelectQueryBuilder<DB, TB, O & SelectionResult<DB, TB, S>>(this.table)
    newBuilder.selections = [...this.selections, ...selections as readonly string[]]
    newBuilder.joins = [...this.joins]
    return newBuilder
  }

  // Fixed: Use Kysely's exact approach for JOIN column autocomplete
  innerJoin<
    TE extends TableExpression<DB>,
    K1 extends JoinReferenceExpression<DB, TB, TE>,
    K2 extends JoinReferenceExpression<DB, TB, TE>
  >(
    table: TE,
    k1: K1,
    k2: K2
  ): SelectQueryBuilderWithInnerJoin<DB, TB, O, TE> {
    const newBuilder = new SelectQueryBuilder(this.table) as any
    newBuilder.selections = [...this.selections]
    newBuilder.joins = [...this.joins, `INNER JOIN ${table} ON ${k1} = ${k2}`]
    return newBuilder
  }

  leftJoin<
    TE extends TableExpression<DB>,
    K1 extends JoinReferenceExpression<DB, TB, TE>,
    K2 extends JoinReferenceExpression<DB, TB, TE>
  >(
    table: TE,
    k1: K1,
    k2: K2
  ): SelectQueryBuilderWithInnerJoin<DB, TB, O, TE> {
    const newBuilder = new SelectQueryBuilder(this.table) as any
    newBuilder.selections = [...this.selections]
    newBuilder.joins = [...this.joins, `LEFT JOIN ${table} ON ${k1} = ${k2}`]
    return newBuilder
  }

  toSQL(): string {
    const selectList = this.selections.length > 0 ? this.selections.join(', ') : '*'
    // Convert lowercase 'as' to uppercase 'AS' for proper SQL formatting
    const fromClause = this.table.replace(/ as /g, ' AS ')
    let sql = `SELECT ${selectList} FROM ${fromClause}`
    
    if (this.joins.length > 0) {
      // Also convert 'as' to 'AS' in JOIN clauses
      const joins = this.joins.map(join => join.replace(/ as /g, ' AS '))
      sql += ' ' + joins.join(' ')
    }
    
    return sql
  }

  async execute(): Promise<(O & Record<string, any>)[]> {
    return []
  }
}

// Export configured query builder
const qb = new QueryBuilder<TestDB>()
export { qb }