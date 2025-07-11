# pgvibe Query Builder Design Document

This document defines the development strategy for rebuilding the pgvibe query builder with a focus on **easy AI implementation**.

**📋 Also See**: `CLAUDE.md` for repository context, commands, and current project status.

## Development Philosophy

### 1. Fast Feedback Loop
- **Small, isolated tests** in individual files
- **Quick validation** of concepts before main implementation
- **Incremental progress** with clear success criteria
- **Easy debugging** when things go wrong

### 2. Test-First Development
- Write failing tests first
- Implement minimal code to make tests pass
- Refactor and improve incrementally
- Each test file focuses on ONE concept

### 3. Clear Success Criteria
- Every test clearly shows expected behavior
- Pass/fail is unambiguous 
- Tests document the exact API we want
- Human verifies tests, AI implements to make them pass

### 4. PostgreSQL-Native Foundation
- Built exclusively for PostgreSQL
- Alias system as core challenge to solve
- Type safety through TypeScript
- Excellent autocomplete experience

## Quick Test Schema

Simple schema for all tests:

```typescript
interface TestDB {
  users: {
    id: number;
    name: string;
    email: string | null;
    active: boolean;
  };
  posts: {
    id: number;
    user_id: number;
    title: string;
    published: boolean;
  };
}
```

## Development Phases

### Phase 1: Foundation (Single Table)

**Goal**: Get basic `db.selectFrom("users").select(["id", "name"])` working

**Key Concepts to Test**:
- Basic table selection functionality
- Column selection with type safety
- SQL generation correctness
- TypeScript error handling for invalid inputs

**Success Criteria**:
- [ ] Can create query builder from table name
- [ ] Can select specific columns
- [ ] Generates correct SQL: `SELECT id, name FROM users`
- [ ] TypeScript errors for invalid columns/tables

### Phase 2: Table Aliases (Core Challenge)

**Goal**: Make `db.selectFrom("users as u")` work perfectly with alias exclusivity

**Key Concepts to Test**:
- Table alias parsing from strings like `"users as u"`
- Alias exclusivity (original table name becomes invalid)
- Both qualified (`u.id`) and unqualified (`id`) column access
- Proper SQL generation with aliases

**Success Criteria**:
- [ ] `"users as u"` creates aliased query builder
- [ ] `select(["id"])` works (unqualified)
- [ ] `select(["u.id"])` works (qualified) 
- [ ] `select(["users.id"])` fails at TypeScript level
- [ ] Generates `SELECT id FROM users AS u` correctly

### Phase 3: JOIN Operations

**Goal**: Make `innerJoin("posts as p", "u.id", "p.user_id")` work with aliases

**Key Concepts to Test**:
- Basic INNER JOIN functionality
- JOIN operations with table aliases
- Column selection across joined tables
- Multiple JOIN chaining
- Proper SQL generation for JOINs

**Success Criteria**:
- [ ] `innerJoin("posts as p", "u.id", "p.user_id")` works
- [ ] Can select from both tables: `select(["u.name", "p.title"])`
- [ ] Generates correct SQL with proper JOIN syntax
- [ ] Multiple JOINs can be chained

### Phase 4: WHERE Clauses

**Goal**: Make `.where()` work with all operators and alias support

**Key Concepts to Test**:
- Basic WHERE operations with simple operators
- All PostgreSQL operators (`=`, `>`, `like`, `in`, `is`, `not in`, etc.)
- WHERE with qualified columns (aliases)
- WHERE chaining (multiple WHERE = AND)
- Expression builder for complex logic (`eb.or()`, `eb.and()`, `eb.not()`)

**Success Criteria**:
- [ ] Basic WHERE: `where("active", "=", true)`
- [ ] All operators work: `=`, `>`, `like`, `in`, `is`, `not in`
- [ ] Qualified WHERE: `where("u.active", "=", true)` 
- [ ] WHERE chaining: multiple WHERE calls = AND
- [ ] Expression builder: `eb.or()`, `eb.and()`, `eb.not()`

### Phase 5: ORDER BY and LIMIT

**Goal**: Add sorting and pagination support

**Key Concepts to Test**:
- Basic ORDER BY functionality
- LIMIT and OFFSET operations
- ORDER BY with qualified columns (aliases)
- Proper SQL generation for sorting and pagination

**Success Criteria**:
- [ ] `orderBy("name", "ASC")` works
- [ ] `limit(10)` and `offset(5)` work
- [ ] ORDER BY with aliases: `orderBy("u.name", "DESC")`
- [ ] Generates correct SQL: `ORDER BY`, `LIMIT`, `OFFSET`

## Testing Strategy

### Individual Test Files

Each test file focuses on ONE concept and can be run independently. You'll determine the specific file names and organization as you build.

**Principles**:
- One concept per test file
- Clear, descriptive test names
- Fast feedback - run individual files
- Build complexity gradually

### Test File Structure

```typescript
// Example test structure (you choose the filename)
import { test, expect } from "bun:test";
import { QueryBuilder } from "../src/query-builder";

test("should reject original table name when using alias", () => {
  const qb = new QueryBuilder<TestDB>();
  
  // This should work
  const goodQuery = qb.selectFrom("users as u").select(["u.id"]);
  expect(goodQuery.toSQL()).toBe("SELECT u.id FROM users AS u");
  
  // This should fail at TypeScript level
  // @ts-expect-error - users.id should not be allowed with alias
  const badQuery = qb.selectFrom("users as u").select(["users.id"]);
});
```

### Quick Iteration Cycle

1. **Write failing test** - Define exactly what you want
2. **Run test** - See it fail (red)
3. **Write minimal code** - Just enough to pass
4. **Run test** - See it pass (green)
5. **Refactor** - Improve without breaking test
6. **Move to next test** - Repeat cycle

## AI Implementation Guide

### Start Small, Build Up

**Don't try to build everything at once!** Start with the simplest possible implementation:

1. **Create one test file** (e.g., `phase1-basic-table.test.ts`)
2. **Make it pass** with minimal code
3. **Create next test file** 
4. **Extend implementation** to make it pass
5. **Repeat** until all phases work

### Use TypeScript Compiler as Your Friend

- Run `tsc --noEmit` frequently to catch type errors
- Use TypeScript playground to test type logic
- Start with `any` types and refine gradually

### SQL Generation Strategy

Keep SQL generation simple:
- String templates are fine to start
- Focus on correctness over optimization
- Add proper parameter binding later

### When You Get Stuck

- Go back to simpler test
- Break complex test into smaller parts  
- Focus on making ONE thing work perfectly
- Don't worry about edge cases initially

## Success Metrics

### Phase Completion Criteria

**Phase 1 Complete** when:
- ✅ All Phase 1 tests pass
- ✅ `db.selectFrom("users").select(["id"])` works
- ✅ TypeScript catches invalid tables/columns
- ✅ Generates correct SQL

**Phase 2 Complete** when:
- ✅ All Phase 2 tests pass  
- ✅ `db.selectFrom("users as u")` works
- ✅ Alias exclusivity enforced by TypeScript
- ✅ Both qualified and unqualified columns work

**And so on for each phase...**

### Overall Success

**Project Complete** when:
- ✅ All 5 phases pass their tests
- ✅ Complex queries work: JOINs + WHERE + ORDER BY
- ✅ TypeScript autocomplete is excellent
- ✅ SQL generation is correct
- ✅ No runtime type errors possible

## Quick Start for AI

### Step 1: Create First Test
```typescript
// Create your first test file (you choose the name)
import { test, expect } from "bun:test";

test("should create query builder from table name", () => {
  // TODO: Implement QueryBuilder class
  const qb = new QueryBuilder<TestDB>();
  const query = qb.selectFrom("users");
  
  expect(query).toBeDefined();
  expect(query.toSQL()).toBe("SELECT * FROM users");
});
```

### Step 2: Make Test Pass
```typescript
// src/query-builder.ts
export class QueryBuilder<DB> {
  selectFrom(table: keyof DB) {
    return {
      toSQL: () => `SELECT * FROM ${String(table)}`
    };
  }
}
```

### Step 3: Run Test & Verify
```bash
bun test your-test-file.test.ts
# Should pass! ✅
```

### Step 4: Add Next Test
Continue this cycle for each small feature...

---

**Remember**: Small steps, fast feedback, clear success criteria. Build one tiny piece at a time!