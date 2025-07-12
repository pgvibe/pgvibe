# CLAUDE.md

Development instructions for Claude Code when working with the pgvibe query builder.

## Vision

**A TypeScript-first query builder for PostgreSQL that provides an exceptional developer experience through perfect type safety.**

The goal is to create a query builder where:
- TypeScript developers feel at home with perfect autocomplete and compile-time validation
- PostgreSQL's full feature set is accessible without abstraction overhead
- Type safety eliminates runtime query errors before they happen
- The developer experience is so good that SQL becomes a joy to write in TypeScript

## 🚨 CRITICAL: World-Class TypeScript Experience

**THIS IS A TYPESCRIPT QUERY BUILDER FOR POSTGRESQL** - The entire value proposition depends on perfect TypeScript integration.

**🎯 ABSOLUTE NON-NEGOTIABLE REQUIREMENTS:**
- **Perfect Autocomplete**: Developers must see only valid tables/columns in IDE autocomplete
- **Compile-Time Error Detection**: Invalid tables, columns, or alias violations MUST cause TypeScript compilation errors
- **Alias Exclusivity**: `selectFrom("users as u")` makes `"users.id"` invalid at compile time, only `"u.id"` and `"id"` allowed
- **Intelligent Type Inference**: Result types must perfectly reflect the query (including nullable columns from LEFT JOINs)
- **Zero Runtime Surprises**: If TypeScript says it's valid, it must work at runtime
- **Developer Experience First**: TypeScript experience is MORE IMPORTANT than runtime performance or implementation complexity

**IF THE TYPESCRIPT EXPERIENCE IS NOT WORLD-CLASS, THE TOOL IS USELESS**

## Development Approach

### Test-Driven Development (TDD) - TypeScript Edition
- **Always write TypeScript tests first** - Define expected compilation behavior before implementing
- **Test both success AND failure cases** - Write tests that SHOULD compile and tests that SHOULD NOT compile
- **TypeScript tests are the source of truth** - If tests pass, TypeScript experience is correct
- **Test frequently** - Run `bun run test:tsd` after every small change to catch TypeScript regressions
- **Use `tests/typescript/` extensively** - This is where TypeScript behavior is validated

### TypeScript Testing Approach (tsd)
We use `tsd` for comprehensive TypeScript definition testing with **separate valid/invalid files**:

**Create `valid.test-d.ts` files** for positive test cases:
```typescript
// tests/typescript/selectFrom/valid.test-d.ts
import {expectType} from 'tsd';
import {QueryBuilder} from '../../../src/query-builder';

const qb = new QueryBuilder<TestDB>();

// ✅ Valid cases should compile with correct types
expectType<SelectQueryBuilder<TestDB, 'users', {}>>(qb.selectFrom('users'));
qb.selectFrom('posts'); // Compilation test
qb.selectFrom('users as u'); // Alias test
```

**Create `invalid.test-d.ts` files** for negative test cases:
```typescript
// tests/typescript/selectFrom/invalid.test-d.ts
import {expectError} from 'tsd';
import {QueryBuilder} from '../../../src/query-builder';

const qb = new QueryBuilder<TestDB>();

// ❌ Invalid cases should cause TypeScript errors
expectError(qb.selectFrom('invalid_table'));
expectError(qb.selectFrom(123));
expectError(qb.selectFrom(null));
```

**Run tests**: `bun run test:tsd` - Single command tests both files automatically
**Benefits**: Clear separation, easy to find examples, precise type checking, industry standard

### Long-Term Thinking
- **Step back before implementing** - Consider the best long-term solution, not just the quick fix
- **Design for extensibility** - How will this work with future PostgreSQL features?
- **Think about the developer experience** - Will this be intuitive for users?
- **Consider type complexity** - Simpler types are better than clever but complex ones
- **No backward compatibility concerns** - We're in early development, break anything for better design

### Core Principles
- **PostgreSQL-native only** - Leverage PostgreSQL-specific features without abstraction overhead
- **Types drive implementation** - Perfect TypeScript experience guides all decisions
- **Simple over clever** - Readable, maintainable code over optimizations
- **Breaking changes welcome** - Better to break now than maintain suboptimal APIs

## TypeScript Validation Requirements

Every single feature must demonstrate PERFECT TypeScript behavior:

### Autocomplete Must Be Perfect
- Only valid table names appear in `selectFrom()` autocomplete
- Only valid column names appear in `select()` autocomplete  
- Qualified columns (`"table.column"`) only show valid combinations
- Alias exclusivity: after `"users as u"`, only `"u.column"` and `"column"` appear, never `"users.column"`
- JOIN columns show combined autocomplete from all joined tables

### Compile-Time Errors Must Be Comprehensive
- Invalid table names cause TypeScript compilation errors
- Invalid column names cause TypeScript compilation errors
- Using `"users.column"` after `"users as u"` causes TypeScript compilation errors
- Referencing columns from non-joined tables causes TypeScript compilation errors
- Type mismatches in WHERE clauses cause TypeScript compilation errors

### Type Inference Must Be Intelligent
- Result types perfectly match selected columns
- LEFT JOIN columns are correctly typed as nullable (`string | null`)
- INNER JOIN columns maintain non-nullable types
- Column aliases affect result type property names
- Complex nested queries maintain proper type flow

### Developer Experience Must Be Seamless
- Error messages are clear and actionable
- Types compile quickly (no infinite loops or extreme complexity)
- IDE performance remains fast with large schemas
- Code completion works in all contexts (WHERE, ORDER BY, etc.)

## Development Rules

### Before Every Implementation
1. **Write TypeScript tests first** - Define both positive (should compile) and negative (should error) test cases
2. **Think long-term** - Is this the best solution for the future?
3. **Consider alternatives** - What other approaches exist?
4. **Design for simplicity** - Can this be simpler?

### During Implementation
- **Run TypeScript tests constantly** - `bun test tests/typescript/` after every change
- **Write comprehensive test coverage** - Test every edge case for both compilation success and failure
- **Ensure tests actually validate TypeScript behavior** - Not just runtime behavior
- **Rely only on automated tests** - Never trust manual verification for correctness

### Must Never Do
- **Never break TypeScript experience** - This invalidates the entire tool
- **Never ship without automated TypeScript tests** - Manual verification is not sufficient
- **Never add features without comprehensive TypeScript tests** - TDD is mandatory
- **Never accept "good enough" TypeScript** - It must be perfect or it's worthless
- **Never compromise TypeScript for performance** - Developer experience comes first
- **Never rely on manual testing for TypeScript correctness** - Only automated tests count
- **Never compromise for backward compatibility** - We're in early development

### TypeScript Testing is ABSOLUTELY CRITICAL
- **ALWAYS write tests that SHOULD compile** - Verify valid TypeScript code works
- **ALWAYS write tests that SHOULD NOT compile** - Verify invalid TypeScript code fails
- **Automated tests are the ONLY way to ensure TypeScript correctness** - Never trust manual verification
- **Every feature needs both positive and negative TypeScript tests** - No exceptions
- **Test edge cases exhaustively** - Complex JOINs, nested queries, alias combinations
- **If TypeScript tests don't pass, the feature is broken** - Period

### The Testing Process (Automated Only)
1. Write TypeScript test that demonstrates the desired behavior (should compile)
2. Write TypeScript test that demonstrates what should be prevented (should NOT compile)  
3. Implement the feature to make both tests pass
4. Run `bun test tests/typescript/` to verify
5. Only then is the feature considered working

**Note**: Playground is available for developers to experiment, but never rely on manual testing for feature validation.