# Alias Support Implementation

## Overview

Add comprehensive alias support to the client package query builder, enabling users to define and use table and column aliases throughout query building with full type safety.

## Background

Currently, the client package has partial foundation for aliases in the AST layer but lacks user-facing API. Users need to be able to use aliases for tables and columns similar to SQL and other query builders like Kysely.

## Requirements

### Table Aliases

**FROM Clause Aliases:**

```typescript
// Users should be able to define table aliases inline
db.selectFrom("users as u")
  .select(["u.name", "u.email"])
  .where("u.active", "=", true);
```

**JOIN Clause Aliases:**

```typescript
// Table aliases should work in all join types
db.selectFrom("users as u")
  .innerJoin("posts as p", "u.id", "p.user_id")
  .leftJoin("comments as c", "p.id", "c.post_id")
  .select(["u.name", "p.title", "c.content"]);
```

### Column Aliases

**SELECT Clause Aliases:**

```typescript
// Users should be able to alias columns in SELECT
db.selectFrom("users as u").select([
  "u.name as user_name",
  "u.email as user_email",
]);
```

### Type Safety Requirements

1. **Alias-Only References**: After aliasing, only the alias should be available in type checking

   ```typescript
   db.selectFrom("users as u")
     .select(["u.name"]) // ✅ Valid
     .select(["users.name"]); // ❌ Type error - original table name not available
   ```

2. **Context Propagation**: Aliases should be available in all query builder methods

   ```typescript
   db.selectFrom("users as u")
     .select(["u.name"])
     .where("u.active", "=", true) // ✅ Alias available in WHERE
     .orderBy("u.created_at"); // ✅ Alias available in ORDER BY
   ```

3. **Join Alias Tracking**: Multiple table aliases should be tracked correctly
   ```typescript
   db.selectFrom("users as u")
     .innerJoin("posts as p", "u.id", "p.user_id")
     .select(["u.name", "p.title"]); // ✅ Both aliases available
   ```

### Syntax Requirements

- **Keyword**: Only lowercase `as` keyword supported
- **Parsing**: Support `'table as alias'` format with optional spaces
- **Validation**: Alias names should follow SQL identifier rules

## Research: Kysely's Approach

Based on research into Kysely's implementation, their approach involves:

### 1. Type-Level String Parsing

- Parse `"table as alias"` strings at the TypeScript type level
- Extract table name and alias using template literal types
- Update the type context to track available aliases

### 2. AliasedExpression Pattern

- Use `AliasedExpression<T, A>` interface for expressions with aliases
- Expressions can be converted to aliased versions using `.as(alias)` method
- Type system tracks both the expression type and alias name

### 3. AST and Compilation

- AST nodes already support alias fields
- Query compiler handles proper SQL generation with aliases
- Runtime parsing of alias expressions when building queries

### 4. Context Tracking

- Generic type parameters track available tables/aliases in scope
- Type refinement through method chaining maintains context
- Union types for tracking multiple joined tables

## Current State Analysis

### Already Implemented ✅

1. **AST Support**: `TableReferenceNode` and `SelectionNode` have alias fields
2. **Query Compiler**: `PostgresQueryCompiler` handles table alias SQL generation
3. **Test Infrastructure**: Table alias tests exist showing basic functionality

### Missing Implementation ❌

1. **String Parsing**: No parsing of `"table as alias"` format
2. **Type System**: No type-level alias extraction and tracking
3. **User API**: No public methods for alias definition
4. **Column Aliases**: No support for column aliasing in SELECT
5. **Join Aliases**: No alias parsing in JOIN methods
6. **Context Propagation**: No alias availability in WHERE, ORDER BY, etc.

## Implementation Strategy

### Phase 1: Type System Foundation

1. **Create alias parsing types**:

   ```typescript
   type ParseTableExpression<T> = T extends `${infer Table} as ${infer Alias}`
     ? { table: Table; alias: Alias }
     : { table: T; alias: never };
   ```

2. **Update ExtractTableAlias type**:

   ```typescript
   type ExtractTableAlias<DB, TE> = ParseTableExpression<TE> extends {
     alias: infer A;
   }
     ? A extends never
       ? TE
       : A
     : TE;
   ```

3. **Modify SelectQueryBuilder generics** to track aliases instead of table names

### Phase 2: Runtime Parsing

1. **Create parseTableExpression utility**:

   ```typescript
   function parseTableExpression(expr: string): {
     table: string;
     alias?: string;
   };
   ```

2. **Update query builders** to use parsed aliases when creating AST nodes

3. **Modify column reference parsing** to work with aliases

### Phase 3: Query Builder Updates

1. **Update selectFrom method** to parse and handle table aliases
2. **Update join methods** to parse table aliases in join targets
3. **Add column alias support** to select method
4. **Ensure alias propagation** to WHERE, ORDER BY, etc.

### Phase 4: Testing and Documentation

1. **Comprehensive test suite** covering all alias scenarios
2. **Type testing** to ensure proper compile-time behavior
3. **Documentation** with examples and migration guide

## Technical Challenges

### 1. Type Complexity

- TypeScript's template literal type parsing has limitations
- Complex type inference may hit recursion limits
- Need careful balance between type safety and usability

### 2. Breaking Changes

- Changes to core type system may affect existing code
- Need migration strategy for users relying on current behavior

### 3. Edge Cases

- Handle spaces around `as` keyword consistently
- Validate alias names at runtime
- Proper error messages for invalid aliases

## Success Criteria

1. **Functional Requirements**:

   - ✅ Table aliases work in FROM clause
   - ✅ Table aliases work in all JOIN types
   - ✅ Column aliases work in SELECT clause
   - ✅ Aliases available in WHERE, ORDER BY, etc.

2. **Type Safety**:

   - ✅ Only aliases available after aliasing (not original table names)
   - ✅ Proper auto-completion for aliased columns
   - ✅ Compile-time errors for invalid alias references

3. **Developer Experience**:
   - ✅ Clear error messages for invalid aliases
   - ✅ Consistent API across all query builder methods
   - ✅ Good performance (no runtime overhead for type checking)

## Dependencies

- No external dependencies required
- Builds on existing AST and query compiler infrastructure
- Compatible with current PostgreSQL dialect

## Timeline Estimate

- **Phase 1** (Type System): 2-3 days
- **Phase 2** (Runtime Parsing): 1-2 days
- **Phase 3** (Query Builder Integration): 2-3 days
- **Phase 4** (Testing & Docs): 2-3 days

**Total: 7-11 days**

## Risks

1. **Type System Complexity**: May hit TypeScript limitations with complex alias parsing
2. **Performance Impact**: Type checking overhead for complex alias scenarios
3. **Breaking Changes**: Potential compatibility issues with existing code

## Future Enhancements

1. **Subquery Aliases**: Support for aliased subqueries in FROM clause
2. **Expression Aliases**: More complex expression aliasing beyond simple columns
3. **Alias Validation**: Runtime validation of SQL identifier rules
4. **Smart Suggestions**: IDE hints for available aliases in different contexts
