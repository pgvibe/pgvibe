# WHERE Clause TDD Progress

## 🎯 Overview

This document tracks the Test-Driven Development (TDD) progress for implementing comprehensive WHERE clause functionality in PGVibe. We've created extensive test coverage for advanced features that currently fail, defining the target behavior for implementation.

## 📋 Current Status: RED Phase (71 Failing Tests)

**Date**: January 2025  
**Phase**: 🔴 **RED** - Tests written, many failing (as expected in TDD)  
**Next Phase**: 🟢 **GREEN** - Implement features to make tests pass

## 🧪 Test Coverage Added

We've created **4 comprehensive test files** with **1,496 total lines** of test coverage:

### 1. Expression Builder Tests (`where-expression-builder.test-d.ts`)

- **272 lines** of comprehensive expression builder testing
- **Location**: `packages/client/tests/types/core/where-expression-builder.test-d.ts`

#### ✅ Working Features

- Basic `eb()` function usage: `eb("active", "=", true)`
- All operators: `=`, `!=`, `>`, `<`, `>=`, `<=`, `like`, `in`, `is`, `is not`
- Different column types: string, number, boolean, Date, arrays
- Regular WHERE clauses without aliases

#### 🔴 Failing Features (Need Implementation)

- **Alias support**: `eb("u.active", "=", true)` ❌
- **Join queries with aliases**: `eb("p.published", "=", true)` ❌
- **Complex multi-table scenarios**: `eb("u.id", "in", [1,2,3])` ❌

### 2. Logical Operations Tests (`where-logical-operations.test-d.ts`)

- **377 lines** of AND/OR/NOT operation testing
- **Location**: `packages/client/tests/types/core/where-logical-operations.test-d.ts`

#### ✅ Working Features

- Basic logical operations: `and([...])`, `or([...])`, `not(...)`
- Nested logical combinations
- Mixed logical + regular WHERE clauses
- Chaining multiple logical operations

#### 🔴 Failing Features (Need Implementation)

- **Logical operations with aliases**: `and([eb("u.active", "=", true), ...])` ❌
- **Complex join scenarios**: Multi-table logical operations ❌
- **Implicit AND from array returns**: `where(({eb}) => [...])` ❌

### 3. Array Operations Tests (`where-array-operations.test-d.ts`)

- **384 lines** of PostgreSQL array operation testing
- **Location**: `packages/client/tests/types/core/where-array-operations.test-d.ts`

#### ✅ Working Features

- Basic array operations: `array("tags").contains([...])`
- All PostgreSQL array operators:
  - `contains()` - `@>`
  - `overlaps()` - `&&`
  - `isContainedBy()` - `<@`
  - `hasAny()` - `= ANY`
  - `hasAll()` - `= ALL`
- Different array types: `string[]`, `number[]`
- Complex combinations with logical operators

#### 🔴 Failing Features (Need Implementation)

- **Array operations with aliases**: `array("u.tags").contains([...])` ❌
- **Join queries with array operations**: Multi-table array scenarios ❌

### 4. JSONB Operations Tests (`where-jsonb-operations.test-d.ts`)

- **463 lines** of JSONB operation testing
- **Location**: `packages/client/tests/types/core/where-jsonb-operations.test-d.ts`

#### ✅ Working Features

- Basic JSONB operations: `jsonb("settings").field("theme").equals("dark")`
- Nested field access: `jsonb("settings").field("notifications").field("email")`
- Path operations: `jsonb("settings").path(["notifications", "push"])`
- Containment: `jsonb("metadata").contains({...})`
- Existence checks: `jsonb("settings").field("theme").exists()`
- Complex logical combinations with JSONB

#### 🔴 Failing Features (Need Implementation)

- **JSONB text extraction**: `jsonb("settings").path(["theme"]).asText()` ❌
- **JSONB operations with aliases**: `jsonb("ju.settings").field(...)` ❌
- **Type consistency**: JSONB result types need refinement ❌

## 📊 Detailed Failure Analysis

### Core Issue: Alias Support in Expression Builder

The primary failing pattern across all test files is **alias support in expression builder**:

```typescript
// ❌ Currently failing
.where(({ eb }) => eb("u.active", "=", true))
.where(({ eb }) => eb("p.published", "=", true))
.where(({ array }) => array("u.tags").contains([...]))
.where(({ jsonb }) => jsonb("ju.settings").field(...))

// ✅ Currently working
.where(({ eb }) => eb("active", "=", true))
.where(({ array }) => array("tags").contains([...]))
.where(({ jsonb }) => jsonb("settings").field(...))
```

### Error Pattern Examples

```
✖ Argument of type "u.active" is not assignable to parameter of type
keyof UserTable | "users.name" | "users.email" | "users.id" | "users.active" | ...

✖ Argument of type "p.published" is not assignable to parameter of type
"id" | "name" | "email" | "active" | "created_at" | "tags" | ...
```

## 🛠️ Implementation Roadmap

### Priority 1: Alias Support in Expression Builder (High Impact)

**Estimated Impact**: ~50 failing tests

**What needs to be implemented**:

- Type system should recognize `"u.column"` syntax in `eb()` functions
- Support for qualified column names in all expression builder contexts
- Join context awareness for multi-table scenarios

**Files to modify**:

- `packages/client/src/core/builders/expression-builder.ts`
- `packages/client/src/core/types/expression.ts`
- Column reference type definitions

### Priority 2: JSONB Text Operations (Medium Impact)

**Estimated Impact**: ~10 failing tests

**What needs to be implemented**:

- `.asText()` method on JSONB path operations
- Text extraction operators (`->>`, `#>>`)
- `notEquals()` method for text operations

**Files to modify**:

- `packages/client/src/core/builders/expression-builder.ts`
- JSONB expression builder classes

### Priority 3: Type Consistency Improvements (Medium Impact)

**Estimated Impact**: ~8 failing tests

**What needs to be implemented**:

- Better type inference for JSONB result types
- Consistent handling of `JsonbType<T>` in results
- Array operation type refinements

### Priority 4: Error Handling Validation (Low Impact)

**Estimated Impact**: ~3 failing tests

**What needs to be implemented**:

- Better error messages for invalid operations
- Validation for empty logical arrays
- Type checking for incompatible operations

## 🧪 Test Execution

### Running the Tests

```bash
cd packages/client
bun run test:types
```

### Current Results

```
71 errors
✖ Argument of type "u.active" is not assignable...
✖ Argument of type "p.published" is not assignable...
✖ Property asText does not exist on type JsonbFieldExpression...
```

### Target: All Green ✅

When implementation is complete, all 71 failing tests should pass, indicating full WHERE clause feature support.

## 📁 File Structure

```
packages/client/tests/types/core/
├── where.test-d.ts                     # Original WHERE tests
├── where-expression-builder.test-d.ts  # NEW: Expression builder (eb) tests
├── where-logical-operations.test-d.ts  # NEW: AND/OR/NOT tests
├── where-array-operations.test-d.ts    # NEW: Array operation tests
├── where-jsonb-operations.test-d.ts    # NEW: JSONB operation tests
└── table-aliases.test-d.ts            # Existing alias tests
```

## 🔄 TDD Workflow

### Phase 1: ✅ RED (Complete)

- [x] Write comprehensive failing tests
- [x] Define target behavior through test cases
- [x] Document expected failures (71 tests)
- [x] Organize tests by feature area

### Phase 2: 🔄 GREEN (Next)

- [ ] Implement alias support in expression builder
- [ ] Add missing JSONB text operations
- [ ] Fix type consistency issues
- [ ] Validate all tests pass

### Phase 3: 🔄 REFACTOR (Future)

- [ ] Optimize performance
- [ ] Improve error messages
- [ ] Clean up implementation
- [ ] Add documentation

## 💡 Key Insights

1. **Separation of Concerns**: Breaking tests into separate files made debugging much easier
2. **TDD Effectiveness**: 71 failing tests provide clear implementation roadmap
3. **Type System Complexity**: Alias support requires sophisticated type inference
4. **Feature Completeness**: Tests cover edge cases and error scenarios comprehensively

## 📝 Notes for Future Development

- **Alias Resolution**: The type system needs to understand the relationship between `"users as u"` and `"u.column"`
- **Context Awareness**: Expression builders need access to join context for column resolution
- **Backward Compatibility**: Ensure existing non-alias queries continue working
- **Performance**: Consider type compilation impact of complex alias resolution

---

**Next Session TODO**:

1. Start with Priority 1: Implement alias support in expression builder
2. Focus on making the `eb("u.column", "=", value)` pattern work
3. Target reducing the 71 failing tests systematically

**Status**: Ready for GREEN phase implementation 🚀
