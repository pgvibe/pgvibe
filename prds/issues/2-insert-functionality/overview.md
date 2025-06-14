# INSERT Query Builder Implementation

## Overview

Implement comprehensive INSERT functionality for the ZenQ query builder to complement the existing SELECT capabilities. This will enable both single-row and bulk data insertion with full type safety, following PostgreSQL's native behavior and maintaining architectural consistency with the existing SELECT query builder.

## Problem Statement

Currently, ZenQ only supports SELECT operations. Users need the ability to insert data into their PostgreSQL databases with the same level of type safety, fluent API design, and architectural consistency that exists in the SELECT builder.

## Requirements

### Functional Requirements

#### 1. API Design

- **Fluent API Pattern**: Follow the same `db.insertInto(table)` pattern as `db.selectFrom(table)`
- **Single-row Insert**: Support inserting one record at a time
- **Bulk Insert**: Support inserting multiple records in a single operation
- **Chainable Methods**: Maintain fluent interface consistency

#### 2. Return Value Behavior (PostgreSQL-aligned)

- **Default Behavior**: Return affected rows count when no `.returning()` is specified
- **Explicit Returns**: Support `.returning()` and `.returningAll()` methods for data retrieval
- **Type-safe Returns**: Ensure return types match the specified returning columns

#### 3. Type Safety & Validation

- **Strict Column Validation**: Require all non-nullable, non-default columns
- **Type Checking**: Prevent inserting incorrect data types (e.g., string into number column)
- **Auto-generated Column Exclusion**: Prevent manual insertion into SERIAL/auto-generated columns
- **Default Value Handling**: Allow omission of columns with database defaults

### Technical Requirements

#### 1. Architecture Consistency

- Follow existing patterns established by `SelectQueryBuilder`
- Implement `InsertQueryNode` in AST layer
- Create `InsertQueryBuilder` with same architectural approach
- Integrate with existing PostgreSQL query compiler
- Maintain same error handling patterns

#### 2. Core Components to Implement

**AST Layer (`packages/client/src/core/ast/`)**:

- `InsertQueryNode` - AST representation of INSERT queries
- Integration with existing `OperationNode` interface

**Builder Layer (`packages/client/src/core/builders/`)**:

- `InsertQueryBuilder` interface and implementation
- Type-safe `.values()` method for single and bulk inserts
- `.returning()` and `.returningAll()` methods
- Integration with existing expression builders

**Query Builder Integration**:

- Add `.insertInto()` method to main `ZenQ` class
- Ensure seamless integration with existing connection management
- Maintain same `.execute()` pattern

**Type System**:

- Create `InsertResult` types for return value typing
- Implement `RequiredInsertFields` type for strict validation
- Handle nullable vs required field differentiation

## Expected API Usage

### Single-row Insert

```typescript
// Basic insert (returns affected rows)
const result = await db
  .insertInto("users")
  .values({ name: "John Doe", email: "john@example.com" })
  .execute();
// Returns: { affectedRows: 1 }

// Insert with returning specific columns
const user = await db
  .insertInto("users")
  .values({ name: "John Doe", email: "john@example.com" })
  .returning(["id", "created_at"])
  .execute();
// Returns: [{ id: 123, created_at: Date }]

// Insert with returning all columns
const fullUser = await db
  .insertInto("users")
  .values({ name: "John Doe", email: "john@example.com" })
  .returningAll()
  .execute();
// Returns: [{ id: 123, name: 'John Doe', email: 'john@example.com', active: true, created_at: Date }]
```

### Bulk Insert

```typescript
// Bulk insert (returns affected rows)
const result = await db
  .insertInto("users")
  .values([
    { name: "John Doe", email: "john@example.com" },
    { name: "Jane Smith", email: "jane@example.com" },
    { name: "Bob Johnson" }, // email is nullable, so can be omitted
  ])
  .execute();
// Returns: { affectedRows: 3 }

// Bulk insert with returning
const users = await db
  .insertInto("users")
  .values([
    { name: "John Doe", email: "john@example.com" },
    { name: "Jane Smith", email: "jane@example.com" },
  ])
  .returning(["id", "name"])
  .execute();
// Returns: [{ id: 123, name: 'John Doe' }, { id: 124, name: 'Jane Smith' }]
```

### Type Safety Examples

```typescript
// ✅ Valid: All required fields provided
await db.insertInto("users").values({ name: "John" }).execute();

// ❌ TypeScript Error: Missing required 'name' field
await db.insertInto("users").values({ email: "john@example.com" }).execute();

// ❌ TypeScript Error: Wrong data type
await db.insertInto("users").values({ name: 123 }).execute();

// ❌ TypeScript Error: Cannot insert into auto-generated column
await db.insertInto("users").values({ id: 123, name: "John" }).execute();
```

## Implementation Plan

### Phase 1: Core Infrastructure

1. **AST Implementation**

   - Create `InsertQueryNode` with proper type definitions
   - Implement cloning and utility methods
   - Add to AST exports

2. **Query Compiler Integration**
   - Extend PostgreSQL compiler to handle INSERT queries
   - Support both single and bulk insert SQL generation
   - Handle RETURNING clause compilation

### Phase 2: Builder Implementation

1. **InsertQueryBuilder Interface**

   - Define complete interface with type parameters
   - Implement `.values()`, `.returning()`, `.returningAll()` methods
   - Create execution logic with driver integration

2. **Type System**
   - Implement strict field validation types
   - Create return type system for different scenarios
   - Handle nullable vs required field logic

### Phase 3: Integration & Testing

1. **ZenQ Class Integration**

   - Add `.insertInto()` method
   - Ensure proper typing and builder instantiation

2. **Comprehensive Testing**
   - Unit tests for SQL generation
   - Integration tests with real PostgreSQL
   - Type-level tests for compile-time validation
   - Performance tests for bulk inserts

## Success Criteria

### Functional Success

- [ ] Single-row inserts work correctly
- [ ] Bulk inserts work correctly
- [ ] Default return behavior (affected rows) works
- [ ] `.returning()` and `.returningAll()` work correctly
- [ ] Type safety prevents invalid column insertions
- [ ] Type safety prevents missing required fields
- [ ] Integration with existing connection management
- [ ] **Optional**: Basic `onConflict()` functionality works correctly
- [ ] **Optional**: Conflict resolution integrates with return value handling

### Non-functional Success

- [ ] Performance comparable to raw SQL for bulk operations
- [ ] TypeScript compilation time remains reasonable
- [ ] Memory usage scales appropriately with bulk insert size
- [ ] Error messages are clear and actionable

## Conflict Resolution (Optional Phase 1 Feature)

Given the strategic importance of designing consistent conflict resolution patterns across query types, we can optionally include basic `onConflict` functionality in this phase:

### Proposed Conflict Resolution API (Inspired by Kysely)

```typescript
// Basic conflict handling - callback pattern for fluent API
await db
  .insertInto("users")
  .values({ name: "John", email: "john@example.com" })
  .onConflict((oc) => oc.column("email").doNothing())
  .execute();

// Conflict with update
await db
  .insertInto("users")
  .values({ name: "John", email: "john@example.com" })
  .onConflict((oc) => oc.column("email").doUpdate({ name: "John Updated" }))
  .execute();

// Multiple conflict columns
await db
  .insertInto("users")
  .values({ name: "John", email: "john@example.com" })
  .onConflict((oc) => oc.columns(["email", "name"]).doNothing())
  .execute();

// Constraint-based conflicts
await db
  .insertInto("users")
  .values({ name: "John", email: "john@example.com" })
  .onConflict((oc) => oc.constraint("users_email_unique").doNothing())
  .execute();

// Expression-based conflicts (for expression indexes)
await db
  .insertInto("users")
  .values({ name: "John", email: "john@example.com" })
  .onConflict((oc) =>
    oc.expression(({ eb }) => eb.fn("lower", ["email"])).doNothing()
  )
  .execute();

// Conditional conflicts with WHERE clause
await db
  .insertInto("users")
  .values({ name: "John", email: "john@example.com" })
  .onConflict((oc) =>
    oc
      .column("email")
      .where("active", "=", true)
      .doUpdate({ last_updated: new Date() })
  )
  .execute();
```

### Strategic Design Benefits (Learned from Kysely)

- **Callback Pattern**: Uses callback with conflict builder for maximum flexibility and type safety
- **Multiple Conflict Targets**: Support for columns, constraints, and expressions
- **Conditional Logic**: WHERE clauses on both index conditions and update conditions
- **Future-Proof**: Same pattern can be used in future UPDATE builders and MERGE operations
- **Consistent API**: Maintains fluent interface across different query types
- **PostgreSQL-Native**: Follows PostgreSQL's actual `ON CONFLICT` syntax exactly
- **Type Safety**: Full TypeScript support with proper type checking for conflict targets and updates
- **Extensible**: Easy to add more conflict resolution strategies later

### Key Kysely Design Insights

1. **Separate Builder Classes**:

   - `OnConflictBuilder` - for specifying conflict targets and conditions
   - `OnConflictDoNothingBuilder` - terminal builder for DO NOTHING action
   - `OnConflictUpdateBuilder` - builder for DO UPDATE SET with WHERE support

2. **Flexible Conflict Target Support**:

   - `.column(name)` - single column conflicts
   - `.columns([...])` - multi-column conflicts
   - `.constraint(name)` - named constraint conflicts
   - `.expression(expr)` - expression index conflicts

3. **Comprehensive WHERE Support**:

   - Index WHERE clauses (for partial unique indexes)
   - Update WHERE clauses (conditional updates)

4. **AST Node Design**:
   - Single `OnConflictNode` with optional properties
   - Clean separation of concerns in the node structure
   - Proper cloning methods for immutability

### Implementation Considerations (Following Kysely's Architecture)

- **AST Layer**: Create `OnConflictNode` with comprehensive properties:

  ```typescript
  interface OnConflictNode extends OperationNode {
    readonly kind: "OnConflictNode";
    readonly columns?: ReadonlyArray<ColumnNode>;
    readonly constraint?: IdentifierNode;
    readonly indexExpression?: OperationNode;
    readonly indexWhere?: WhereNode; // WHERE clause for partial indexes
    readonly updates?: ReadonlyArray<ColumnUpdateNode>;
    readonly updateWhere?: WhereNode; // WHERE clause for conditional updates
    readonly doNothing?: boolean;
  }
  ```

- **Builder Layer**: Implement separate builder classes:

  - `OnConflictBuilder` - main conflict target specification
  - `OnConflictDoNothingBuilder` - terminal for DO NOTHING
  - `OnConflictUpdateBuilder` - for DO UPDATE with WHERE support

- **Type System Integration**:

  - Support for `excluded.*` references in update expressions
  - Proper type checking for conflict target columns/constraints
  - WHERE clause type safety for both index and update conditions

- **PostgreSQL Compiler**: Extended support for complete `ON CONFLICT` syntax
- **Future Compatibility**: Design to work with future UPDATE and MERGE builders

## Future Considerations (Out of Scope)

The following features are explicitly **not included** in this implementation and should be considered for future phases:

- **Advanced Conflict Resolution**: `ON CONSTRAINT` clauses, complex update expressions
- **Advanced INSERT Variants**: `INSERT INTO ... SELECT FROM` queries
- **Transaction Management**: Advanced transaction handling beyond current capabilities
- **Batch Processing**: Automatic chunking of very large bulk inserts

## Risk Assessment

### Technical Risks

- **TypeScript Complexity**: The strict type validation may increase compilation complexity
- **Performance**: Bulk inserts need careful implementation to avoid memory issues
- **API Consistency**: Must maintain exact consistency with existing SELECT patterns

### Mitigation Strategies

- Start with simple type implementations and iterate
- Implement streaming/chunking for very large bulk operations
- Extensive testing against existing architectural patterns
- Regular performance benchmarking during development

## Related Files

### Existing Architecture to Reference

- `packages/client/src/core/builders/select-query-builder.ts` - Main pattern to follow
- `packages/client/src/core/ast/select-query-node.ts` - AST pattern to replicate
- `packages/client/src/query-builder.ts` - Main class integration point
- `packages/client/src/core/postgres/postgres-dialect.ts` - Query compilation integration

### Files to Create/Modify

- `packages/client/src/core/ast/insert-query-node.ts` - New AST node
- `packages/client/src/core/builders/insert-query-builder.ts` - New builder
- `packages/client/src/core/types/insert-result.ts` - New type definitions
- `packages/client/src/query-builder.ts` - Add insertInto method
- `packages/client/tests/builders/insert.test.ts` - Comprehensive tests
