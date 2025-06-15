// Alias Type Utilities - Core types for handling table aliases and alias-prefixed columns
// This solves the autocomplete issue for alias-prefixed columns like "u.id", "p.title", etc.

/**
 * Extract the alias part from table expressions like "users as u" -> "u"
 * Supports case-insensitive AS keyword
 */
export type ExtractAlias<TE> = TE extends `${string} as ${infer Alias}`
  ? Alias extends string
    ? Trim<Alias> // Clean up any extra whitespace
    : never
  : TE extends `${string} AS ${infer Alias}`
  ? Alias extends string
    ? Trim<Alias>
    : never
  : TE extends `${string} As ${infer Alias}`
  ? Alias extends string
    ? Trim<Alias>
    : never
  : never; // No alias found

/**
 * Simple string trimmer for removing leading/trailing whitespace
 */
type Trim<S extends string> = S extends ` ${infer Rest}`
  ? Trim<Rest>
  : S extends `${infer Rest} `
  ? Trim<Rest>
  : S;

/**
 * Generate alias-prefixed column references for a specific alias and table
 * Example: "u", "users" -> "u.id" | "u.name" | "u.email" | ...
 */
export type AliasColumnReferences<
  DB,
  Alias extends string,
  TableName extends keyof DB
> = TableName extends keyof DB
  ? `${Alias}.${Extract<keyof DB[TableName], string>}`
  : never;

/**
 * Check if a table expression contains an alias
 */
export type HasAlias<TE> = ExtractAlias<TE> extends never ? false : true;

/**
 * Get all possible alias-prefixed columns for a table expression
 * If no alias, returns never
 * If alias exists, returns all alias.column combinations
 */
export type GetAliasColumns<DB, TE> = TE extends string
  ? ExtractAlias<TE> extends infer Alias
    ? Alias extends string
      ? TE extends `${infer TableName} as ${string}`
        ? TableName extends keyof DB
          ? AliasColumnReferences<DB, Alias, TableName>
          : never
        : TE extends `${infer TableName} AS ${string}`
        ? TableName extends keyof DB
          ? AliasColumnReferences<DB, Alias, TableName>
          : never
        : TE extends `${infer TableName} As ${string}`
        ? TableName extends keyof DB
          ? AliasColumnReferences<DB, Alias, TableName>
          : never
        : never
      : never
    : never
  : never;

// =============================================================================
// TESTING SECTION (will be moved to separate test file)
// =============================================================================

// Test the type utilities with example database
type TestDatabase = {
  users: { id: number; name: string; email: string };
  posts: { id: number; title: string; content: string };
};

// Test alias extraction
type Test1 = ExtractAlias<"users as u">; // Should be "u"
type Test2 = ExtractAlias<"posts AS p">; // Should be "p"
type Test3 = ExtractAlias<"users">; // Should be never

// Test alias column generation
type Test4 = GetAliasColumns<TestDatabase, "users as u">; // Should be "u.id" | "u.name" | "u.email"
type Test5 = GetAliasColumns<TestDatabase, "posts as p">; // Should be "p.id" | "p.title" | "p.content"
type Test6 = GetAliasColumns<TestDatabase, "users">; // Should be never

// Verify the types resolve correctly
const _test1: Test1 = "u";
const _test4: Test4 = "u.id"; // Should autocomplete with u.id, u.name, u.email
// const _test4b: Test4 = "u."; // Should show all u.* options in autocomplete
