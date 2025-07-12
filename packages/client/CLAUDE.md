# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 🚨 CRITICAL: TypeScript-First Development

**TYPESCRIPT IS THE FUNDAMENTAL PILLAR** - Perfect autocomplete and compile-time error detection is THE #1 priority. Without this, the tool is useless.

**🎯 ABSOLUTE NON-NEGOTIABLE REQUIREMENTS:**
- **Perfect Autocomplete**: Every column selection must provide intelligent autocomplete showing only valid columns
- **Perfect Error Detection**: Invalid columns, tables, or alias violations MUST cause TypeScript compilation errors
- **Alias Exclusivity**: `selectFrom("users as u")` makes `"users.id"` invalid at compile time, only `"u.id"` and `"id"` allowed
- **Type Safety First**: TypeScript experience is MORE IMPORTANT than runtime functionality
- **Zero Compromises**: If TypeScript doesn't work perfectly, the implementation is wrong

## ✅ Current Status: PRODUCTION READY

**🎉 Major Milestone Completed**: The query builder is now production-ready with excellent foundation.

### What We've Achieved
- **Perfect TypeScript Integration** - Alias system works flawlessly
- **40 Comprehensive Tests** - Unit, TypeScript, and integration tests
- **Clean Package Structure** - Professional organization ready for publishing
- **Excellent Developer Experience** - Autocomplete and error detection work perfectly

### Current Implementation
The alias system rebuild was **successfully completed**. All core features work:

- ✅ **Basic Queries**: Single table selection with perfect autocomplete
- ✅ **Table Aliases**: Complete alias exclusivity system working 
- ✅ **JOIN Operations**: Multiple JOINs with proper type propagation
- ✅ **Column Aliases**: `"column as alias"` syntax with type inference
- ✅ **Type Safety**: Comprehensive compile-time validation

## Development Commands

### Essential Commands
- `bun test` - Run all 40 tests (should always pass)
- `bun test tests/unit/` - Run unit tests only
- `bun test tests/typescript/` - Run TypeScript validation tests  
- `bun run typecheck` - Check TypeScript compilation
- `bun run build` - Build the package for distribution

### Development Workflow
- `bun run dev` - Run development playground
- `bun test --watch` - Watch mode for test development

### Database Commands (When Needed)
- `bun run db:up` - Start PostgreSQL database with Docker
- `bun run db:down` - Stop PostgreSQL database
- `bun run db:reset` - Reset database (remove volumes and restart)

## Project Architecture

### PostgreSQL-Native Query Builder
This is `@pgvibe/client`, a PostgreSQL-native TypeScript query builder with advanced type safety. Unlike multi-database ORMs, pgvibe is built exclusively for PostgreSQL to leverage its full feature set without abstraction overhead.

### Core Features Working
- **Perfect Alias System**: `db.selectFrom("users as u")` with full type safety
- **Excellent TypeScript DX**: Amazing autocomplete and compile-time validation
- **Simple but Powerful**: Easy to understand, AI-friendly codebase
- **Production Ready**: Clean build, proper exports, comprehensive testing

### Implementation Status
```typescript
// ✅ All of this works perfectly with TypeScript
const result = await qb
  .selectFrom("users as u")
  .innerJoin("posts as p", "u.id", "p.user_id")
  .leftJoin("comments as c", "p.id", "c.post_id")
  .select([
    "u.name",                    // string
    "p.title as postTitle",      // string  
    "c.content as comment"       // string | null (from LEFT JOIN)
  ])
  .execute();
// Type: { name: string, postTitle: string, comment: string | null }[]
```

## Current Project Structure

### Clean Development Structure
```
src/                        # Source code (the real documentation)
├── types/                  # Modular type definitions
│   ├── database.ts        # Database schema types
│   ├── columns.ts         # Column reference types
│   ├── query.ts           # Query context types  
│   ├── result.ts          # Result type inference
│   └── index.ts           # Type re-exports
├── query-builder.ts       # Core implementation
└── index.ts               # Public API

tests/                     # Comprehensive test suite (40 tests)
├── unit/                  # Unit tests (8 tests)
│   ├── basic-queries.test.ts
│   ├── table-aliases.test.ts
│   ├── joins.test.ts
│   └── column-alias-types.test.ts
├── typescript/            # TypeScript validation (23 tests)
│   ├── positive.test.ts   # Autocomplete scenarios
│   ├── negative.test.ts   # Error detection
│   └── regression.test.ts # Prevent regressions
├── integration/           # End-to-end tests (9 tests)
│   └── multiple-joins.test.ts
└── fixtures/
    └── test-schema.ts     # Shared test database schema

examples/                  # Live usage examples
├── basic-usage.ts         # Simple queries and concepts
├── advanced-queries.ts    # Complex JOINs and patterns
└── type-safety.ts         # TypeScript showcase

playground/                # Development testing
├── index.ts              # Main playground  
└── *.ts                  # Various test files
```

## Development Guidelines

### Code Quality Standards
- **TypeScript-first development**: Types drive implementation
- **Test-driven approach**: All features have comprehensive tests
- **Clean, readable code**: Simple implementations over clever optimizations
- **Zero compromises**: If TypeScript doesn't work perfectly, fix the types

### When Working on New Features
1. **Write tests first** - Define expected behavior with TypeScript validation
2. **Run existing tests** - Ensure no regressions (`bun test`)
3. **Implement minimally** - Focus on making tests pass
4. **Verify TypeScript** - Run `bun run typecheck`
5. **Test in playground** - Use `playground/` for manual verification

### Testing Strategy
The test suite is comprehensive with 40 tests covering:

- **Unit Tests**: Core functionality (basic queries, aliases, JOINs)
- **TypeScript Tests**: Positive (autocomplete) and negative (error detection) validation
- **Integration Tests**: Complex real-world scenarios
- **Regression Prevention**: Comprehensive validation to prevent breaking changes

### TypeScript Validation
We have extensive TypeScript testing that ensures:
- ✅ **Perfect autocomplete** in IDEs for table names, column names, and qualified columns
- ✅ **Compile-time errors** for invalid table names, column names, and alias violations
- ✅ **Correct type inference** for result objects including nullable columns from LEFT JOINs
- ✅ **Alias exclusivity** enforcement where `"users as u"` makes `"users.id"` invalid

## Important Notes

### Current Status
- **Production Ready**: Package can be published and used
- **40 Tests Passing**: Comprehensive validation ensures reliability
- **Perfect TypeScript**: Autocomplete and error detection work flawlessly
- **Clean Architecture**: Well-organized, maintainable codebase

### What NOT to Do
- **Don't break existing tests** - All 40 tests must always pass
- **Don't compromise TypeScript experience** - Type safety is #1 priority  
- **Don't add features without tests** - Test-driven development is essential
- **Don't create documentation files** - Source code + examples are the docs

### What TO Do
- **Run tests frequently** - `bun test` should be your best friend
- **Use the playground** - Test ideas in `playground/` before implementing
- **Check TypeScript** - Run `bun run typecheck` regularly
- **Look at examples** - `examples/` directory shows how everything works
- **Follow existing patterns** - Study the current implementation before adding features

### PostgreSQL-Only Focus
- No multi-database support - PostgreSQL-native implementation
- Leverage PostgreSQL-specific features (JSONB, arrays, full-text search)
- Direct optimization without dialect abstraction overhead

### Development Runtime
Project uses Bun as the JavaScript runtime and package manager. All commands should use `bun` instead of `npm`/`yarn`.

## Quick Reference

### Key Files to Understand
- **`src/query-builder.ts`** - Main implementation
- **`src/types/`** - Type system organization
- **`tests/typescript/regression.test.ts`** - Comprehensive TypeScript validation
- **`examples/type-safety.ts`** - TypeScript experience showcase

### Essential Commands
- **Development**: `bun test` (run all tests)
- **Type checking**: `bun run typecheck`
- **Build**: `bun run build`
- **Playground**: `bun run dev`

### Success Criteria
- All 40 tests pass ✅
- TypeScript compilation succeeds ✅  
- Perfect autocomplete in IDE ✅
- Compile-time error detection ✅

The query builder is now a solid, production-ready foundation with excellent TypeScript integration!