# Test-Driven Development Plan for SQL Schema Migration Tool

## Overview

This document outlines comprehensive test suites designed for human verification and AI implementation. The tests cover the most critical missing features needed to make this a complete declarative PostgreSQL schema management tool.

## Test Suites Created

### 1. Foreign Key Constraints (`src/test/constraints/foreign-keys.test.ts`)
**Priority: CRITICAL**

Tests cover:
- Basic foreign key creation and enforcement
- Composite foreign keys (multi-column)
- Referential actions (CASCADE, RESTRICT, SET NULL, SET DEFAULT)
- Self-referential relationships 
- Circular dependencies and proper resolution
- Adding/removing foreign keys from existing tables
- Cross-table dependency ordering
- Error handling for invalid references

**Why Critical**: Foreign keys are fundamental for data integrity and the most requested missing feature.

### 2. Check Constraints (`src/test/constraints/check-constraints.test.ts`)
**Priority: HIGH**

Tests cover:
- Simple value validation (positive numbers, ranges)
- Complex multi-column checks
- Function-based constraints (LENGTH, LOWER, regex)
- Date/time calculations and validations
- Conditional logic constraints
- Column-level vs table-level constraints
- Adding/removing/modifying check constraints

**Why Important**: Check constraints ensure data quality and business rule enforcement at the database level.

### 3. Unique Constraints (`src/test/constraints/unique-constraints.test.ts`)
**Priority: HIGH**

Tests cover:
- Single and composite unique constraints
- NULL value handling (PostgreSQL allows multiple NULLs)
- Column-level vs table-level syntax
- Deferrable unique constraints
- Distinction from unique indexes
- Adding/removing unique constraints
- Inheritance behavior

**Why Important**: Unique constraints are different from unique indexes and provide declarative uniqueness enforcement.

### 4. Dependency Resolution (`src/test/dependency-resolution.test.ts`)
**Priority: HIGH**

Tests cover:
- Table creation ordering with foreign key dependencies
- Multi-level dependency chains
- Circular dependency breaking
- Table deletion in reverse dependency order
- Constraint ordering (create tables before FKs)
- Many-to-many relationship handling
- Self-referential hierarchies
- Error handling for unresolvable dependencies

**Why Critical**: Proper dependency resolution is essential for reliable schema operations.

### 5. Destructive Operation Safety (`src/test/destructive-operations.test.ts`)
**Priority: MEDIUM**

Tests cover:
- Data loss prevention for table drops
- Column removal warnings
- Constraint removal safety
- Type conversion data loss detection
- Index removal performance impact
- Safety configuration options
- Dry-run mode capabilities
- Rollback and recovery mechanisms

**Why Important**: Production safety features prevent accidental data loss.

## Implementation Order Recommendation

1. **Start with Foreign Keys** - Most critical missing feature
2. **Add Check Constraints** - Extends validation capabilities  
3. **Implement Unique Constraints** - Completes constraint trio
4. **Enhance Dependency Resolution** - Ensures reliable operations
5. **Add Safety Features** - Production-ready safeguards

## Required Code Changes

### Type Definitions (`src/types/schema.ts`)
```typescript
interface Table {
  // ... existing fields
  foreignKeys?: ForeignKeyConstraint[];
  checkConstraints?: CheckConstraint[];
  uniqueConstraints?: UniqueConstraint[];
}

interface ForeignKeyConstraint {
  name?: string;
  columns: string[];
  referencedTable: string;
  referencedColumns: string[];
  onDelete?: 'CASCADE' | 'RESTRICT' | 'SET NULL' | 'SET DEFAULT';
  onUpdate?: 'CASCADE' | 'RESTRICT' | 'SET NULL' | 'SET DEFAULT';
  deferrable?: boolean;
  initiallyDeferred?: boolean;
}

interface CheckConstraint {
  name?: string;
  expression: string;
}

interface UniqueConstraint {
  name?: string;
  columns: string[];
  deferrable?: boolean;
  initiallyDeferred?: boolean;
}
```

### Parser Extensions (`src/core/schema/parser.ts`)
- Parse FOREIGN KEY clauses
- Parse CHECK constraint expressions
- Parse UNIQUE constraint definitions
- Handle constraint naming

### Differ Logic (`src/core/schema/differ.ts`)
- Compare constraint arrays
- Generate ADD/DROP CONSTRAINT statements
- Handle constraint modifications
- Implement dependency resolution algorithm

### Database Inspector (`src/core/schema/inspector.ts`)
- Query information_schema for constraints
- Extract constraint definitions
- Build constraint relationships

## Testing Strategy

1. **Human Review**: Each test file should be reviewed by a human to verify correctness
2. **Incremental Implementation**: Implement one constraint type at a time
3. **Test-Driven**: Write failing tests first, then implement features
4. **Edge Case Coverage**: Tests include complex scenarios and error conditions

## Running Tests

```bash
# Run all constraint tests
bun test src/test/constraints/

# Run individual test suites
bun test src/test/constraints/foreign-keys.test.ts
bun test src/test/constraints/check-constraints.test.ts
bun test src/test/constraints/unique-constraints.test.ts

# Run dependency and safety tests
bun test src/test/dependency-resolution.test.ts
bun test src/test/destructive-operations.test.ts
```

## Success Criteria

- All tests pass
- No data loss in destructive operations
- Proper dependency ordering
- Production-ready error handling
- Comprehensive constraint support matching PostgreSQL capabilities

This test plan provides a clear roadmap for evolving the tool into a complete PostgreSQL schema management solution while maintaining the declarative philosophy.