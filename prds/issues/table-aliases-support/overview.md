# Table Aliases Support

## Issue Summary

Add comprehensive support for table aliases in the ZenQ query builder, enabling `selectFrom('users as u')` syntax with full alias usage across all query operations.

## Current State

### Runtime Behavior

- `db.selectFrom("users as u")` executes but generates invalid SQL: `SELECT * FROM "users as u"`
- The entire string `"users as u"` is treated as a literal table name
- Column references like `'u.id'` are passed through without validation
- Generated SQL would fail in actual PostgreSQL execution

### TypeScript Behavior

- `selectFrom("users as u")` produces TypeScript error: `Argument of type '"users as u"' is not assignable to parameter of type '"users"'`
- Column references like `'u.id'` produce TypeScript error: `Type '"u.id"' is not assignable to type 'ColumnReference<Database, "users">'`
- No type support for alias-prefixed columns

## Desired Behavior

### Core Functionality

Enable the following syntax patterns:

```typescript
// Basic alias usage
const query = db
  .selectFrom("users as u")
  .select(["u.id", "u.name"]) // Alias-prefixed columns
  .where("u.active", "=", true)
  .orderBy("u.created_at", "desc");

// Flexible column references (both should work)
const query = db
  .selectFrom("users as u")
  .select(["u.id", "name"]) // Mix of alias-prefixed and non-prefixed
  .where("id", "=", 123) // Non-prefixed column
  .where("u.email", "like", "%@example.com"); // Alias-prefixed column

// Aliases in JOIN operations
const query = db
  .selectFrom("users as u")
  .innerJoin("posts as p", "u.id", "p.user_id")
  .select(["u.name", "p.title"]);

// Aliases in all query operations
const query = db
  .selectFrom("orders as o")
  .select(["o.id", "o.total"])
  .where("o.status", "=", "completed")
  .orderBy("o.created_at")
  .limit(10);
```

### Type Safety Requirements

- **Flexible Typing**: Accept both alias-prefixed (`'u.id'`) and non-prefixed (`'id'`) column references
- **Alias Validation**: Ensure alias names are valid SQL identifiers
- **Column Validation**: Maintain existing column existence validation for both prefixed and non-prefixed references
- **IntelliSense Support**: Provide autocomplete for both `'u.id'` and `'id'` patterns

### SQL Generation

Generate proper PostgreSQL alias syntax:

- `selectFrom('users as u')` → `SELECT * FROM users AS u`
- `select(['u.id', 'u.name'])` → `SELECT u.id, u.name FROM users AS u`
- `where('u.active', '=', true)` → `WHERE u.active = $1`

## Technical Implementation Scope

### 1. Table Expression Parsing

- **File**: `packages/client/src/core/shared-types.ts`
- **Changes**: Update `TableExpression` type to handle alias syntax
- **New Logic**: Parse `"table as alias"` format and extract table name and alias

### 2. AST Node Updates

- **File**: `packages/client/src/core/ast/select-query-node.ts`
- **Changes**: Update `TableReferenceNode` to properly handle alias property
- **Current**: `SelectQueryNode.createWithFrom(table, alias)` exists but not used by query builder

### 3. Query Builder Core

- **File**: `packages/client/src/query-builder.ts`
- **Changes**: Update `selectFrom` method to parse alias syntax
- **New Logic**: Extract table name and alias from `"table as alias"` input

### 4. SelectQueryBuilder Updates

- **File**: `packages/client/src/core/builders/select-query-builder.ts`
- **Methods to Update**:
  - `select()` - Support alias-prefixed columns
  - `where()` - Support alias-prefixed columns in conditions
  - `orderBy()` - Support alias-prefixed columns in ordering
  - `innerJoin()`, `leftJoin()`, `rightJoin()`, `fullJoin()` - Support aliases in join conditions
- **Type Updates**: Extend `ColumnReference` types to accept alias prefixes

### 5. SQL Compilation

- **File**: `packages/client/src/core/postgres/postgres-query-compiler.ts`
- **Changes**: Ensure proper `AS` keyword usage in FROM clause compilation
- **Current**: Alias compilation already exists but needs proper integration

### 6. Type System Enhancements

- **Files**: Multiple type definition files
- **New Types**: Create alias-aware column reference types
- **Updates**: Extend existing types to handle flexible column referencing

## Acceptance Criteria

### Core Functionality

- [ ] `selectFrom('table as alias')` syntax works without TypeScript errors
- [ ] Alias-prefixed columns (`'u.id'`) work in all query methods
- [ ] Non-prefixed columns (`'id'`) continue to work with aliases
- [ ] Generated SQL uses proper PostgreSQL `AS` syntax
- [ ] All existing functionality remains unaffected

### Query Builder Methods

- [ ] `select(['u.id', 'u.name'])` works with aliases
- [ ] `where('u.column', '=', value)` works with aliases
- [ ] `orderBy('u.column')` works with aliases
- [ ] `innerJoin('table as t', 'u.id', 't.user_id')` works with aliases
- [ ] All join methods support aliases

### Type Safety

- [ ] TypeScript autocomplete suggests both `'u.id'` and `'id'` patterns
- [ ] Invalid column names still produce TypeScript errors
- [ ] Invalid alias syntax produces helpful error messages
- [ ] Existing type safety for non-aliased queries is preserved

### SQL Generation

- [ ] `SELECT * FROM users AS u` for basic alias usage
- [ ] `SELECT u.id, u.name FROM users AS u` for column selection
- [ ] `WHERE u.active = $1` for alias-prefixed conditions
- [ ] `ORDER BY u.created_at DESC` for alias-prefixed ordering
- [ ] `INNER JOIN posts AS p ON u.id = p.user_id` for alias joins

### Backward Compatibility

- [ ] All existing queries without aliases continue to work
- [ ] No breaking changes to existing API
- [ ] Performance impact is minimal
- [ ] Existing tests pass without modification

## Implementation Priority

1. **High Priority**: Basic `selectFrom('table as alias')` support
2. **High Priority**: Alias support in `select()` and `where()` methods
3. **Medium Priority**: Alias support in `orderBy()` and join methods
4. **Medium Priority**: Comprehensive TypeScript type improvements
5. **Low Priority**: Advanced alias features and edge cases

## Testing Requirements

### Unit Tests

- Table alias parsing logic
- AST node creation with aliases
- SQL compilation with aliases
- TypeScript type validation

### Integration Tests

- Complete query building with aliases
- All query builder methods with alias support
- SQL generation accuracy
- Type safety validation

### Example Test Cases

```typescript
// Basic alias functionality
test("should support basic table aliases", () => {
  const query = db.selectFrom("users as u").select(["u.id", "u.name"]);
  expect(query.toSQL().sql).toBe("SELECT u.id, u.name FROM users AS u");
});

// Flexible column references
test("should support both prefixed and non-prefixed columns", () => {
  const query = db.selectFrom("users as u").select(["u.id", "name"]);
  expect(query.toSQL().sql).toBe("SELECT u.id, name FROM users AS u");
});

// Alias in WHERE clauses
test("should support aliases in WHERE clauses", () => {
  const query = db.selectFrom("users as u").where("u.active", "=", true);
  expect(query.toSQL().sql).toBe(
    "SELECT * FROM users AS u WHERE u.active = $1"
  );
});
```

## Edge Cases to Consider

1. **Reserved Keywords**: Aliases that conflict with SQL reserved words
2. **Special Characters**: Aliases with spaces or special characters
3. **Case Sensitivity**: Alias name case handling
4. **Multiple Aliases**: Joining multiple tables with aliases
5. **Nested Queries**: Alias scope in subqueries (future consideration)

## Context for Gazella Track (ATS)

This feature enables more readable and maintainable queries for the Track ATS system:

```typescript
// Candidate search with alias for clarity
const candidates = await db
  .selectFrom("candidates as c")
  .innerJoin("applications as a", "c.id", "a.candidate_id")
  .innerJoin("cases as cs", "a.case_id", "cs.id")
  .select(["c.name", "c.email", "cs.title"])
  .where("c.status", "=", "active")
  .where("cs.company_id", "=", companyId)
  .orderBy("c.created_at", "desc")
  .execute();
```

This improves code readability and reduces ambiguity in complex queries involving multiple tables.
