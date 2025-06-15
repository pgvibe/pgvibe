# Table Aliases Support Implementation Plan

## Overview

Implement comprehensive table alias support in ZenQ query builder, enabling `selectFrom("users as u")` syntax with flexible column referencing (`"u.id"` and `"id"`) across all query operations.

---

## Phase 1: Discovery & Foundation ✅ COMPLETE

### 1.1 Problem Deep Dive ✅

- **Goal**: Understand current architecture and identify optimal integration points
- **Deliverables**:
  - ✅ Map current table expression flow from `selectFrom()` to SQL generation
  - ✅ Identify all locations where column references are processed
  - ✅ Document existing AST structure and SQL compilation logic
  - ✅ Analyze type system architecture for column references
- **Success Criteria**: Clear understanding of how table expressions and column references currently work
- **📄 Documentation**: `prds/issues/table-aliases-support/architecture-analysis.md`

### 1.2 Alias Parsing Strategy ✅

- **Goal**: Design robust alias parsing approach
- **Deliverables**:
  - ✅ Research SQL alias patterns and edge cases
  - ✅ Design regex/parser for `"table as alias"` syntax
  - ✅ Prototype parsing logic with comprehensive test cases
  - ✅ Validate approach handles edge cases (spaces, keywords, special chars)
- **Success Criteria**: Solid parsing strategy that handles real-world scenarios
- **📄 Documentation**: `prds/issues/table-aliases-support/alias-parsing-strategy.md`

### 1.3 Test Foundation (TDD Setup) ✅

- **Goal**: Establish comprehensive test suite that defines expected behavior
- **Approach**: Write tests FIRST, ensure they fail as expected
- **Deliverables**:
  - ✅ Create test file `tests/builders/table-aliases.test.ts`
  - ✅ Write failing tests for basic alias syntax: `selectFrom("users as u")`
  - ✅ Write failing tests for flexible column references: `select(["u.id", "id"])`
  - ✅ Write failing tests for SQL generation expectations
  - ✅ Verify all tests fail with clear error messages (18 tests failing as expected)
- **Success Criteria**: Comprehensive failing test suite that defines the complete feature
- **📄 Test Results**: 18 failing tests, 469 passing tests (no regression)

**🎯 Phase 1 Exit Criteria**: ✅ Architecture understood, parsing strategy validated, failing tests written

### 🔍 Key Discovery: Implementation Simpler Than Expected

- **SQL Compilation**: Already works! `TableReferenceNode.alias` → `"table AS alias"`
- **Column Parsing**: Already works! `"table.column"` → `{table: "table", column: "column"}`
- **AST Structure**: Already exists! `TableReferenceNode` has `alias` property
- **Focus**: Only need alias parsing and type system integration

---

## Phase 2: Core Alias Parsing

### 2.1 Table Expression Parsing

- **Goal**: Make `selectFrom("users as u")` work without TypeScript errors
- **Approach**: TDD - make the most basic tests pass
- **Success Criteria**:
  - `selectFrom("users as u")` accepted by TypeScript
  - Table name and alias correctly extracted
  - Basic SQL generation works: `SELECT * FROM users AS u`
  - Core parsing tests pass
  - Run tests frequently during development

### 2.2 Type System Integration

- **Goal**: TypeScript recognizes aliased tables as valid
- **Success Criteria**:
  - No TypeScript errors for basic alias usage
  - `TableExpression` type handles alias syntax
  - `ExtractTableAlias` type works with aliases
  - Type-related tests pass

**🎯 Phase 2 Exit Criteria**: Basic alias parsing works, TypeScript accepts syntax, fundamental tests pass

---

## Phase 3: Column Reference Flexibility

### 3.1 Alias-Prefixed Columns

- **Goal**: Support `select(["u.id", "u.name"])` syntax
- **Approach**: TDD - write tests for alias-prefixed columns, make them pass
- **Success Criteria**:
  - `select(["u.id"])` works and generates correct SQL
  - Column parsing handles `table.column` format
  - Type system suggests alias-prefixed columns
  - Alias-prefixed column tests pass

### 3.2 Flexible Column References

- **Goal**: Support both `"u.id"` AND `"id"` in same query
- **Success Criteria**:
  - `select(["u.id", "name"])` works (mixed syntax)
  - Type system accepts both formats
  - SQL generation handles mixed column references correctly
  - Flexible reference tests pass

**🎯 Phase 3 Exit Criteria**: Column references work with aliases, both prefixed and non-prefixed supported

---

## Phase 4: Query Method Integration

### 4.1 WHERE Clause Support

- **Goal**: Aliases work in WHERE conditions
- **Approach**: TDD - write WHERE tests first, implement until they pass
- **Success Criteria**:
  - `where("u.active", "=", true)` works
  - `where("active", "=", true)` still works with aliases
  - Complex WHERE conditions with aliases work
  - WHERE alias tests pass

### 4.2 ORDER BY and Additional Methods

- **Goal**: Aliases work across all query builder methods
- **Success Criteria**:
  - `orderBy("u.created_at")` works
  - `limit()`, `offset()` continue to work with aliased queries
  - All query method tests pass
  - No regression in existing functionality

**🎯 Phase 4 Exit Criteria**: Aliases supported across all core query methods

---

## Phase 5: JOIN Operations

### 5.1 JOIN with Aliases

- **Goal**: Support aliases in JOIN operations
- **Approach**: TDD - comprehensive JOIN tests with aliases
- **Success Criteria**:
  - `innerJoin("posts as p", "u.id", "p.user_id")` works
  - All JOIN types support aliases (LEFT, RIGHT, FULL)
  - Multi-table JOINs with multiple aliases work
  - JOIN alias tests pass

### 5.2 Complex Multi-Table Scenarios

- **Goal**: Handle real-world complex queries
- **Success Criteria**:
  - Multiple JOINs with different aliases work
  - Column disambiguation in complex queries
  - Performance remains acceptable
  - Complex scenario tests pass

**🎯 Phase 5 Exit Criteria**: Full JOIN support with aliases, complex queries work

---

## Phase 6: Polish & Production Readiness

### 6.1 Error Handling & Edge Cases

- **Goal**: Robust error handling and edge case support
- **Success Criteria**:
  - Clear error messages for invalid alias syntax
  - Reserved keyword handling
  - Special character handling
  - Comprehensive edge case test coverage

### 6.2 Performance & Integration

- **Goal**: Production-ready performance and integration
- **Success Criteria**:
  - No performance regression in existing queries
  - All existing tests still pass (backward compatibility)
  - Type compilation performance acceptable
  - Integration tests pass

### 6.3 Documentation & Developer Experience

- **Goal**: Excellent developer experience
- **Success Criteria**:
  - IntelliSense works for alias-prefixed columns
  - Clear TypeScript error messages
  - Documentation updated with alias examples
  - Developer experience validated

**🎯 Phase 6 Exit Criteria**: Production ready, fully tested, great developer experience

---

## Key Principles

1. **TDD First**: Write failing tests before any implementation
2. **Run Tests Often**: Execute test suite after every meaningful change
3. **Outcome-Focused**: Each phase defines success, not implementation steps
4. **Incremental**: Each phase builds on previous learnings
5. **Flexible**: Adapt approach based on discoveries during implementation
6. **Backward Compatible**: Existing functionality must continue working

## Testing Strategy

### Test-Driven Development Flow

1. **Red**: Write a failing test that defines expected behavior
2. **Green**: Write minimal code to make the test pass
3. **Refactor**: Improve code while keeping tests green
4. **Repeat**: Continue with next test case

### Test Categories

- **Unit Tests**: Individual component behavior (parsing, AST creation, etc.)
- **Integration Tests**: Full query building and SQL generation
- **Type Tests**: TypeScript type behavior and error messages
- **Regression Tests**: Ensure existing functionality unchanged

## Notes for Implementation

- **Start each phase by reviewing the goal and success criteria**
- **Write tests FIRST - make them fail, then implement**
- **Run `bun run test` frequently during development**
- **If stuck, step back to the current phase's goal**
- **Update this plan based on learnings - it's a living document**
- **Each phase should be completable independently**
- **Focus on making tests pass rather than perfect code initially**

## Implementation Commands

```bash
# Run tests during development
bun run test

# Run specific test file
bun run test tests/builders/table-aliases.test.ts

# Run type tests
bun run test:types

# Run all tests
bun run test && bun run test:types
```
