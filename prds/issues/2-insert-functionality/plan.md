# INSERT Query Builder Implementation Plan

## Overview

Build comprehensive INSERT functionality for ZenQ that provides both single-row and bulk data insertion with full type safety, PostgreSQL-aligned behavior, and optional conflict resolution. The implementation should maintain architectural consistency with the existing SELECT query builder while providing an excellent developer experience.

## Using This Plan

This plan includes `<notes></notes>` sections throughout where you can document your progress, discoveries, and decisions as you implement. These notes serve multiple purposes:

- **Learning Documentation**: Record insights about the codebase, PostgreSQL behavior, or implementation challenges
- **Decision Tracking**: Document why you chose specific approaches over alternatives
- **Progress Updates**: Track what's been completed and what's still needed
- **Problem Solving**: Note blockers, workarounds, and solutions you discovered
- **Future Reference**: Capture context that will be valuable for future features or maintenance
- **Scope Changes**: Document any deviations from the original plan and why they were necessary

**How to use notes**: Simply edit this file and add your observations between the `<notes></notes>` tags. Be concise but specific - future you (or other developers) will thank you for the context.

---

## Phase 1: Discovery & Architecture Understanding

### 1.1 Current System Analysis

- **Goal**: Deeply understand the existing query builder architecture and patterns
- **Deliverables**:
  - Document how SelectQueryBuilder is structured (AST, Builder, Compiler layers)
  - Map the data flow from builder methods to SQL generation
  - Identify reusable patterns and components
  - Understand type safety implementation in existing code
- **Success Criteria**: Clear mental model of architecture and confident understanding of extension points

<notes>
## 🔍 Architecture Analysis Complete ✅

**Three-Layer Architecture Pattern:**

1. **AST Layer** (`/core/ast/`) - Immutable query nodes representing SQL structure

   - `SelectQueryNode` with optional clauses (`from`, `where`, `joins`, etc.)
   - All nodes implement `OperationNode` interface with `kind` discriminator
   - Immutable updates via `cloneWith` utility pattern
   - Static factory methods for creating and cloning nodes

2. **Builder Layer** (`/core/builders/`) - Fluent API implementation

   - `SelectQueryBuilderImpl` implements immutable builder pattern
   - Each method returns new instance with updated AST node
   - Complex type safety with column validation and return type inference
   - Expression builder pattern for complex WHERE clauses

3. **Compiler Layer** (`/core/postgres/`) - SQL generation with parameters
   - `PostgresQueryCompiler` visits AST nodes recursively
   - Generates parameterized SQL with `$1, $2, ...` placeholders
   - Type-safe parameter binding and identifier quoting

**Key Reusable Patterns:**

- **Immutable AST Updates**: All node modifications create new instances
- **Type-Safe Column References**: Complex union types prevent invalid columns
- **Expression Builder Pattern**: Callback-based complex expression building
- **Parameter Management**: Automatic parameter extraction and binding
- **Smart Error Messages**: TypeScript-level validation with helpful error messages

**Integration Points:**

- Main `ZenQ` class provides entry point via `selectFrom()`
- PostgreSQL dialect manages connection and configuration
- All tests pass showing robust foundation for extension
  </notes>

### 1.2 INSERT Requirements Research

- **Goal**: Validate and refine INSERT functionality requirements
- **Deliverables**:
  - Research PostgreSQL INSERT syntax variations and edge cases
  - Study Kysely's implementation in detail (beyond initial overview)
  - Prototype 2-3 different API design approaches (time-boxed to 3-4 hours)
  - Document trade-offs between callback vs method-chaining for onConflict
- **Success Criteria**: Clear understanding of PostgreSQL capabilities and confident API design choice

<notes>
## 🔬 PostgreSQL INSERT Research Complete ✅

**PostgreSQL INSERT Syntax Patterns:**

1. **Basic INSERT**: `INSERT INTO table (col1, col2) VALUES (val1, val2)`
2. **Bulk INSERT**: `INSERT INTO table (col1, col2) VALUES (val1, val2), (val3, val4)`
3. **RETURNING clause**: `INSERT INTO table (...) VALUES (...) RETURNING *` or `RETURNING col1, col2`
4. **Default behavior**: Without RETURNING, PostgreSQL returns command tag like "INSERT 0 1"

**Key API Design Decisions:**

- **Follow Kysely's proven patterns** for onConflict (callback-based, type-safe)
- **Immutable builder pattern** consistent with SelectQueryBuilder
- **Progressive type safety** - required fields enforced at compile time
- **PostgreSQL-native behavior** - return affected rows by default, explicit returning

**Validation from Existing Codebase:**

- Array operations already implemented with solid patterns (`ArrayExpressionBuilder`)
- Type-safe parameter binding working well (`PostgresQueryCompiler`)
- Column validation system is robust and extensible
- Test infrastructure is comprehensive and ready for extension
  </notes>

### 1.3 Conflict Resolution Strategy

- **Goal**: Define onConflict approach that balances immediate needs with future extensibility
- **Deliverables**:
  - Decide whether to include onConflict in Phase 1 or defer
  - If included: Design AST node structure and builder hierarchy
  - Document how conflict resolution will work with future UPDATE/MERGE builders
- **Success Criteria**: Clear decision on scope with solid technical justification

<notes>
## ⚖️ Conflict Resolution Strategy Decision ✅

**DECISION: Include basic onConflict in Phase 2 (Core Foundation)**

**Reasoning:**

1. **Architectural Consistency**: Kysely's proven callback pattern (`onConflict((oc) => oc.column("email").doNothing())`) aligns perfectly with existing expression builder patterns
2. **AST Reusability**: Creating `OnConflictNode` now will provide foundation for future UPDATE/MERGE builders
3. **User Expectations**: INSERT without conflict handling is often incomplete for real-world usage
4. **Implementation Scope**: Basic column conflicts + doNothing/doUpdate is manageable scope

**Phase 2 Scope (Basic Conflict Resolution):**

- Column-based conflict targets (`onConflict((oc) => oc.column("email"))`)
- Basic actions (`.doNothing()`, `.doUpdate(updateObj)`)
- Integration with returning clauses

**Future Phases (Advanced Features):**

- Constraint-based conflicts (`oc.constraint("unique_email")`)
- Expression-based conflicts (`oc.expression(sql\`(col1, col2)\``)
- Conditional updates with WHERE clauses
- `excluded.*` references in update expressions

**AST Design Strategy:**

- Single `OnConflictNode` with optional properties for future extensibility
- Callback-based `OnConflictBuilder` hierarchy for type safety
- Clean integration with `InsertQueryNode` structure
  </notes>

**🎯 Phase 1 Exit Criteria**: Architecture understood, API design finalized, implementation approach selected with clear rationale

---

## Phase 2: Core INSERT Foundation

### 2.1 AST Layer Implementation

- **Goal**: Build the foundational AST nodes for INSERT operations
- **Approach**: [To be defined after Phase 1 - may follow SelectQueryNode patterns]
- **Success Criteria**:
  - `InsertQueryNode` properly represents all INSERT variants
  - Clean cloning and utility methods implemented
  - Integration with existing OperationNode interface
  - AST can represent both single and bulk inserts

<notes>
## 🏗️ AST Layer Implementation Complete ✅

**InsertQueryNode Design:**

- Follows exact same immutable patterns as SelectQueryNode
- Optional clauses: `into`, `values`, `returning`, `onConflict`
- Clean static factory methods for creating and cloning nodes
- Complete node hierarchy: IntoNode, ValuesNode, ValueRowNode, ColumnValueNode, etc.

**Key Design Decisions:**

- **Values Structure**: Supports both single and bulk inserts via ValueRowNode[]
- **OnConflict Integration**: Full AST support for column/constraint targets and actions
- **Type Safety**: All nodes implement OperationNode with proper kind discriminators
- **Reusability**: Clean separation allows future extension for UPDATE/MERGE
  </notes>

### 2.2 Query Compilation

- **Goal**: Generate correct PostgreSQL INSERT SQL from AST
- **Success Criteria**:
  - PostgreSQL compiler handles INSERT nodes correctly
  - Single-row INSERT SQL generation works
  - Bulk INSERT SQL generation works
  - RETURNING clause compilation works
  - Parameter binding works correctly

<notes>
## 🔧 Query Compilation Complete ✅

**PostgreSQL Compiler Integration:**

- Added all INSERT node types to visitNode() switch statement
- Implemented complete visitor pattern for all INSERT AST nodes
- Handles proper SQL generation: INSERT INTO table (cols) VALUES (vals)
- ON CONFLICT clause generation with column targets and actions
- RETURNING clause generation for both specific columns and \*

**SQL Generation Features:**

- Proper identifier quoting for column names and table names
- Parameterized value binding for safe SQL injection prevention
- Bulk insert support via multiple VALUES rows
- Clean integration with existing parameter management system
  </notes>

### 2.3 Basic Builder Implementation

- **Goal**: Create working InsertQueryBuilder with core methods
- **Success Criteria**:
  - `.values()` method handles single objects and arrays
  - `.returning()` and `.returningAll()` methods work
  - Builder maintains immutability like SelectQueryBuilder
  - Integration with main ZenQ class `.insertInto()` method
  - Basic type safety for column validation

<notes>
## ⚡ Basic Builder Implementation Complete ✅

**INSERT Query Builder Features:**

- Complete fluent API matching planned design: `.insertInto().values().returning().execute()`
- Type-safe column validation with `InsertObject<DB, TB>` requiring only necessary fields
- Both single-row and bulk insert support via arrays
- PostgreSQL-native return types: `{ affectedRows: number }` by default
- Explicit `.returning()` and `.returningAll()` with proper type inference
- Basic onConflict support with callback pattern: `onConflict((oc) => oc.column(...).doNothing())`

**Key Implementation Highlights:**

- **Immutable Builder Pattern**: Each method returns new instance, consistent with SelectQueryBuilder
- **Progressive Type Safety**: Return type evolves from `never` → `InsertResult` → `InsertReturning*`
- **Integration Complete**: Added `insertInto()` method to main ZenQ class with all exports
- **Callback-based OnConflict**: Follows Kysely's proven pattern for type safety

**Patterns Consistent with SelectQueryBuilder:**

- Same constructor pattern with table name + PostgreSQL instance
- Identical `compile()`, `execute()`, and `toOperationNode()` methods
- Same error handling and connection management in execution
  </notes>

**🎯 Phase 2 Exit Criteria**: Core INSERT functionality works for happy path scenarios with proper SQL generation

---

## Phase 3: Type Safety & Validation

### 3.1 Operation-Aware Type System Design

- **Goal**: Implement a sophisticated type system that handles different database operations correctly
- **Challenge**: Table schemas need different type representations for SELECT vs INSERT vs UPDATE operations
- **Approach**: Design utility types that encode database semantics (auto-generated, nullable, defaults)
- **Success Criteria**:
  - Single source of truth for table structure
  - Auto-generated fields (SERIAL, UUID) are optional for INSERT
  - Fields with defaults are optional for INSERT
  - Nullable fields are properly handled
  - Required fields are enforced at compile-time
  - Type safety maintained across all operations

<notes>
## 🎯 Type System Architecture Research ✅

**Problem Identified**: Current `InsertObject` type requires all table fields, but database operations need different field requirements:

- **SELECT**: All fields present (what exists in DB)
- **INSERT**: Auto-generated and default fields should be optional
- **UPDATE**: Most fields should be optional (partial updates)

**Kysely's Solution (Reference)**:

Kysely solves this with the `ColumnType<SelectType, InsertType, UpdateType>` approach:

```typescript
interface UserTable {
  id: Generated<number>; // Generated<T> = ColumnType<T, never, T>
  name: string; // Required field
  email: string | null; // Nullable field
  active: ColumnType<boolean, boolean | undefined, boolean>; // Custom per-operation
  created_at: Generated<Date>;
}
```

**Our Proposed Solution - Hybrid Approach**:

```typescript
// Base table with rich metadata
interface UserTable {
  id: Generated<number>; // Auto-generated (SERIAL)
  name: string; // Required
  email: string | null; // Nullable
  active: WithDefault<boolean>; // Has default value
  created_at: Generated<Date>; // Auto-generated timestamp
}

// Smart InsertObject type reads annotations
type InsertUser = InsertObject<UserTable>;
// Results in: { name: string; email?: string | null; active?: boolean }
```

**Benefits**:

- Single source of truth for table structure
- Clear semantics about database constraints
- Minimal boilerplate for developers
- Type safety for all operations
- Easy to understand and maintain

**Implementation Strategy**:

1. Create utility types: `Generated<T>`, `WithDefault<T>`, `Nullable<T>`
2. Update `InsertObject` type to read these annotations
3. Provide migration path for existing table definitions
4. Add comprehensive tests for type behavior

**Next Steps**: Implement utility types and update InsertObject logic

**Current Status (2024-12-19)**:

- ✅ Basic INSERT functionality complete (Phases 1-2)
- ✅ 50 comprehensive tests passing (builder, AST, integration)
- ✅ Raw SQL support added (`query()` method for DDL/complex queries)
- ⏳ Type system needs enhancement for operation-aware types
- ⏳ Integration tests currently use `as any` workaround
- 🎯 **Next Priority**: Implement utility types to eliminate type assertions

**Immediate Tasks for Tomorrow**:

1. Implement `Generated<T>`, `WithDefault<T>` utility types
2. Update `InsertObject` type to read these annotations
3. Update test table definitions to use new utility types
4. Remove all `as any` assertions from integration tests
5. Add type-level tests to validate new type behavior
   </notes>

### 3.2 Utility Types Implementation

- **Goal**: Create semantic utility types that encode database constraints
- **Deliverables**:
  - `Generated<T>` type for auto-generated fields (SERIAL, UUID, timestamps)
  - `WithDefault<T>` type for fields with database defaults
  - `Nullable<T>` type for nullable fields (alternative to `T | null`)
  - Updated `InsertObject<DB, TB>` type that reads these annotations
  - Migration guide for existing table definitions
- **Success Criteria**:
  - Auto-generated fields are optional in INSERT operations
  - Fields with defaults are optional in INSERT operations
  - Required fields are enforced at compile-time
  - Nullable fields work correctly
  - Backward compatibility maintained

### 3.3 Enhanced Column Validation

- **Goal**: Implement comprehensive type checking for INSERT operations
- **Success Criteria**:
  - Required fields must be provided (compile-time errors)
  - Type mismatches prevented (string vs number validation)
  - Auto-generated columns excluded from input types
  - Nullable fields properly handled
  - Default value columns work correctly
  - Clear TypeScript error messages guide correct usage

### 3.4 Return Type System

- **Goal**: Ensure return types match PostgreSQL behavior and returning clauses
- **Success Criteria**:
  - Default execution returns `{ affectedRows: number }`
  - `.returning()` returns typed result arrays
  - `.returningAll()` returns complete row types
  - Bulk insert return types work correctly
  - Type inference works with different returning scenarios

### 3.5 Error Handling & Developer Experience

- **Goal**: Provide clear, actionable error messages
- **Success Criteria**:
  - TypeScript errors are clear and helpful
  - Runtime errors provide good context
  - Error messages guide users toward correct usage
  - Performance comparable to existing SELECT builder

**🎯 Phase 3 Exit Criteria**: INSERT builder provides excellent type safety with operation-aware type system

---

## Phase 4: Conflict Resolution (If Included)

### 4.1 OnConflict Foundation

- **Goal**: Implement basic conflict resolution following Kysely's proven patterns
- **Success Criteria**:
  - OnConflictBuilder with callback-based API works
  - Column and constraint conflict targets supported
  - `.doNothing()` and `.doUpdate()` actions work
  - Integration with INSERT builder maintains type safety

### 4.2 Advanced Conflict Features

- **Goal**: Complete conflict resolution functionality
- **Success Criteria**:
  - Expression-based conflict targets work
  - WHERE clauses on index conditions work
  - WHERE clauses on update conditions work
  - `excluded.*` references work in update expressions
  - Full PostgreSQL ON CONFLICT syntax supported

**🎯 Phase 4 Exit Criteria**: Conflict resolution is feature-complete and matches PostgreSQL capabilities

---

## Phase 5: Integration & Production Readiness

### 5.1 Comprehensive Testing

- **Goal**: Ensure robustness across all scenarios
- **Success Criteria**:
  - Unit tests for SQL generation cover all cases
  - Integration tests with real PostgreSQL pass
  - Type-level tests validate compile-time behavior
  - Performance tests show acceptable bulk insert performance
  - Edge case handling verified

### 5.2 Documentation & Examples

- **Goal**: Enable easy adoption and usage
- **Success Criteria**:
  - API documentation complete and accurate
  - Usage examples cover common scenarios
  - Migration guide from existing patterns (if applicable)
  - TypeScript integration examples
  - Performance considerations documented

### 5.3 Architectural Validation

- **Goal**: Confirm the implementation meets long-term architectural goals
- **Success Criteria**:
  - Consistent with existing SELECT builder patterns
  - Extensible for future query types (UPDATE, MERGE)
  - No breaking changes to existing functionality
  - Code quality meets project standards

**🎯 Phase 5 Exit Criteria**: INSERT functionality is production-ready and ready for integration

---

## Key Principles

1. **Architecture First**: Understand existing patterns before implementing new ones
2. **Progressive Enhancement**: Start with core functionality, add complexity gradually
3. **Type Safety Focus**: Prioritize compile-time safety and great developer experience
4. **PostgreSQL Alignment**: Follow PostgreSQL's actual behavior and capabilities
5. **Future Compatibility**: Design decisions should support future query builders
6. **Learning-Oriented**: Adapt the plan based on discoveries during implementation

## Decision Points

- **Phase 1**: Include onConflict in initial implementation or defer?
- **Phase 2**: Follow exact SelectQueryBuilder patterns or adapt where beneficial?
- **Phase 3**: How strict should type validation be vs. flexibility?
- **Phase 4**: Implement full Kysely-style conflict resolution or subset?

## Notes for Implementation

- **Start each phase by reviewing the goal and success criteria**
- **Feel free to deviate from assumptions if you discover better approaches during research**
- **Update this plan as you learn - it's a living document**
- **If stuck, step back and reassess the current phase's goal**
- **Consider creating small proof-of-concepts before full implementation**
- **Regular check-ins: Does this still align with the project's architectural vision?**

## Risk Mitigation

- **TypeScript Complexity**: Start simple, add sophistication incrementally
- **Performance Concerns**: Benchmark early and often, especially for bulk operations
- **API Consistency**: Regular comparison with SELECT builder patterns
- **Future Compatibility**: Document design decisions and their implications
