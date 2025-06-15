// Simple alias extraction for table expressions
// Only supports lowercase 'as' with spaces: "users as u"

/**
 * Extract alias from table expression like "users as u" -> "u"
 * Only supports lowercase 'as' with spaces for simplicity
 */
export type ExtractAlias<TE extends string> =
  TE extends `${string} as ${infer Alias}` ? Alias : never;

/**
 * Generate alias-prefixed columns like "u.id", "u.name", etc.
 */
export type AliasColumns<
  DB,
  TableName extends keyof DB,
  Alias extends string
> = `${Alias}.${Extract<keyof DB[TableName], string>}`;

/**
 * Get all alias-prefixed columns for a table expression
 * Returns never if no alias, otherwise returns all alias.column combinations
 */
export type GetAliasColumns<
  DB,
  TE extends string
> = TE extends `${infer TableName} as ${infer Alias}`
  ? TableName extends keyof DB
    ? AliasColumns<DB, TableName, Alias>
    : never
  : never;

// Test types to verify it works
type Test1 = ExtractAlias<"users as u">; // Should be "u"
type Test2 = ExtractAlias<"users">; // Should be never
type Test3 = GetAliasColumns<
  { users: { id: number; name: string } },
  "users as u"
>; // Should be "u.id" | "u.name"
