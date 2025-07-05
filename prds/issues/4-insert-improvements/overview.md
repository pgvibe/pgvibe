# INSERT Query Improvements

## Problem Statement

The current INSERT query implementation in pgvibe has several issues that prevent optimal developer experience:

1. **Auto-generated and default columns are required in INSERT operations** when they should be optional
2. **Table aliases are not supported in RETURNING clauses** despite being supported in other query parts
3. **TypeScript schema definitions lack proper utility types** for generated/default columns

## Current Issues

### Issue 1: Required Auto-Generated Columns

**Problem**: TypeScript errors occur when trying to insert data without specifying auto-generated or default columns.

**Current Behavior**:

```typescript
const r = await db
  .insertInto("users")
  .values({
    active: true,
    name: "John Doe",
    created_at: new Date(),
    updated_at: new Date(),
  })
  .execute();
// ❌ TypeScript Error: Property 'id' is missing
```

**Expected Behavior**:

- Auto-generated columns (`id: SERIAL`) should be optional in INSERT operations
- Columns with default values (`active: BOOLEAN DEFAULT true`) should be optional in INSERT operations
- The INSERT should work without TypeScript errors

### Issue 2: Missing Alias Support in RETURNING Clause

**Problem**: Alias-qualified column references don't work in RETURNING clauses.

**Current Behavior**:

```typescript
const r = await db
  .insertInto("users as u")
  .values({
    id: 1,
    active: true,
    name: "John Doe",
    created_at: new Date(),
    updated_at: new Date(),
  })
  .returning(["u.id"]) // ❌ TypeScript Error: 'u.id' is not valid
  .execute();
```

**Expected Behavior**:

- Both `'id'` and `'u.id'` should be accepted in RETURNING clauses
- Behavior should match other parts of the codebase (WHERE, SELECT)
- Result should have clean column names (e.g., `{ id: 1 }` not `{ 'u.id': 1 }`)

### Issue 3: Incomplete Schema Type Definitions

**Problem**: The playground and example schemas don't demonstrate proper use of utility types.

**Current Schema**:

```typescript
export interface UserTable {
  id: number; // Should be Generated<number>
  name: string;
  email: string | null;
  active: boolean; // Should be WithDefault<boolean>
  created_at: Date; // Should be WithDefault<Date>
  updated_at: Date; // Should be WithDefault<Date>
}
```

**Expected Schema**:

```typescript
export interface UserTable {
  id: Generated<number>; // Auto-generated, optional in INSERT
  name: string; // Required
  email: string | null; // Nullable, optional in INSERT
  active: WithDefault<boolean>; // Has default, optional in INSERT
  created_at: WithDefault<Date>; // Has default, optional in INSERT
  updated_at: WithDefault<Date>; // Has default, optional in INSERT
  // Missing array columns from actual database:
  tags: WithDefault<string[]>;
  permissions: WithDefault<string[]>;
  scores: WithDefault<number[]>;
}
```

## Root Cause Analysis

### Type System Analysis

The current `InsertType<T>` utility type correctly identifies columns that should be optional:

- `Generated<T>` columns → optional in INSERT
- `WithDefault<T>` columns → optional in INSERT
- `Nullable<T>` columns → optional in INSERT

However, the **playground schema definitions don't use these utility types**, so the type system can't determine which columns should be optional.

### Alias Support Analysis

The `returning()` method in `InsertQueryBuilder` currently uses:

```typescript
returning<K extends readonly ColumnReference<DB, TB>[]>(columns: K)
```

But `ColumnReference<DB, TB>` doesn't account for alias-qualified references when the table has an alias. This differs from `SELECT` and `WHERE` clauses which properly support aliases.

### Database Schema vs TypeScript Schema Mismatch

The actual PostgreSQL database (from `init.sql`) has:

- `id SERIAL PRIMARY KEY` (auto-generated)
- `active BOOLEAN DEFAULT true` (has default)
- `created_at TIMESTAMP DEFAULT NOW()` (has default)
- Array columns: `tags TEXT[] DEFAULT '{}'`, `permissions TEXT[] DEFAULT '{}'`, `scores INTEGER[] DEFAULT '{}'`

But the TypeScript schema doesn't reflect these characteristics.

## Solution Requirements

### 1. Update Type System for INSERT with Aliases

**Requirement**: Extend `InsertQueryBuilder` to support alias-qualified column references in RETURNING clauses.

**Implementation Strategy**:

- Update `InsertReturningResult<DB, TB, K>` type to handle alias-qualified references
- Support both `'id'` and `'u.id'` syntax when table has alias
- Ensure result object has clean column names (remove alias prefix)

### 2. Fix Schema Type Definitions

**Requirement**: Update playground and example schemas to use proper utility types.

**Implementation Strategy**:

- Add `Generated<T>` for auto-generated columns
- Add `WithDefault<T>` for columns with database defaults
- Add missing array columns with proper types
- Update all example schemas consistently

### 3. Comprehensive Testing

**Requirement**: Add test coverage for INSERT with aliases and optional columns.

**Test Cases**:

- INSERT without specifying generated columns
- INSERT without specifying default columns
- INSERT with table aliases and RETURNING alias-qualified columns
- INSERT with array columns using default values
- Bulk INSERT operations with aliases

## Implementation Details

### 1. Schema Updates

Update `packages/client/playground/types.ts`:

```typescript
import { Generated, WithDefault } from "../src/query-builder";

export interface UserTable {
  id: Generated<number>;
  name: string;
  email: string | null;
  active: WithDefault<boolean>;
  created_at: WithDefault<Date>;
  updated_at: WithDefault<Date>;
  tags: WithDefault<string[]>;
  permissions: WithDefault<string[]>;
  scores: WithDefault<number[]>;
}
```

### 2. Type System Enhancement

Extend `InsertQueryBuilder` to support alias-qualified RETURNING:

```typescript
// Support both 'id' and 'u.id' when table has alias
returning<K extends readonly GetColumnReferences<DB, TE>[]>(
  columns: K
): InsertQueryBuilder<DB, TB, InsertReturningResult<DB, TE, K>>;
```

### 3. AST Node Updates

Update `InsertQueryNode` to handle alias information:

```typescript
export interface IntoNode extends OperationNode {
  readonly kind: "IntoNode";
  readonly table: string;
  readonly alias?: string; // Add alias support
}
```

## Expected Results

After implementation:

1. **Type-Safe INSERT Operations**:

```typescript
// ✅ Works without TypeScript errors
const r = await db
  .insertInto("users")
  .values({
    name: "John Doe",
    // id, active, created_at, updated_at are optional
  })
  .execute();
```

2. **Alias Support in RETURNING**:

```typescript
// ✅ Both syntaxes work
const r = await db
  .insertInto("users as u")
  .values({ name: "John Doe" })
  .returning(["u.id", "name"]) // Alias-qualified
  .execute();
// Result: [{ id: 1, name: "John Doe" }]
```

3. **Array Column Support**:

```typescript
// ✅ Array columns with defaults work
const r = await db
  .insertInto("users")
  .values({
    name: "John Doe",
    tags: ["typescript", "nodejs"], // Optional override
    // permissions, scores use defaults
  })
  .execute();
```

## Acceptance Criteria

- [ ] INSERT operations don't require auto-generated columns
- [ ] INSERT operations don't require columns with default values
- [ ] RETURNING clause supports both `'id'` and `'u.id'` syntax when table has alias
- [ ] Result objects have clean column names (no alias prefixes)
- [ ] Array columns work with default values
- [ ] All existing tests continue to pass
- [ ] New test coverage for alias + RETURNING scenarios
- [ ] Updated documentation and examples

## Priority

**High Priority** - This affects core INSERT functionality and developer experience.

## Dependencies

- Requires updates to core type system
- Requires updates to AST nodes and query compilation
- Requires schema updates in playground/examples
- Requires comprehensive test coverage

## Files to Modify

1. `packages/client/src/core/builders/insert-query-builder.ts`
2. `packages/client/src/core/ast/insert-query-node.ts`
3. `packages/client/src/core/postgres/postgres-query-compiler.ts`
4. `packages/client/playground/types.ts`
5. `packages/client/tests/integration/core/insert.test.ts`
6. `packages/client/tests/builders/insert-query-builder.test.ts`
