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

**📖 Read DESIGN.md First** - Before doing any work, read `DESIGN.md` which contains the complete development strategy, testing approach, and implementation phases for the rebuild.

**Current Branch**: `fresh-start-tdd-alias-system` - This is where the new implementation is being built.

## Current Refactor Project

### What We're Building
A PostgreSQL-native TypeScript query builder with perfect alias system support. The main challenge is making table aliases work flawlessly with TypeScript type safety.

### Why We're Rebuilding
The existing alias system was impossible to implement correctly with the current architecture. We're starting fresh with a test-driven approach specifically designed for AI implementation.

### Development Approach
- **Test-First**: Write failing tests, implement minimal code to pass
- **Small Steps**: Each test file focuses on ONE concept  
- **Fast Feedback**: Quick validation before building complex features
- **Phase-by-Phase**: 5 clear phases from basic tables to complex queries

### Key Documents
- **DESIGN.md** - Complete development strategy and implementation guide
- **CLAUDE.md** (this file) - Repository context and commands

## Development Commands (Current Refactor)

### Essential Commands
- `bun test [filename]` - Run specific test file (e.g., `bun test phase1-basic-table.test.ts`)
- `bun test` - Run all tests  
- `tsc --noEmit` - Check TypeScript types without building
- `bun run typecheck` - Same as above

### Legacy Commands (From Old Implementation)
- `bun run test:runtime` - Run runtime tests only
- `bun run test:types` - Run TypeScript type tests with TSD
- `bun run test:integration` - Run integration tests with PostgreSQL
- `bun run build` - Build the package (JS + types)
- `bun run dev` - Run development playground

### Database Commands (When Needed)
- `bun run db:up` - Start PostgreSQL database with Docker
- `bun run db:down` - Stop PostgreSQL database
- `bun run db:reset` - Reset database (remove volumes and restart)

## Target Architecture (What We're Building)

### PostgreSQL-Native Query Builder
This is `@pgvibe/client`, a PostgreSQL-native TypeScript query builder with advanced type safety. Unlike multi-database ORMs, pgvibe is built exclusively for PostgreSQL to leverage its full feature set without abstraction overhead.

### New Architecture Goals
- **Perfect Alias System**: `db.selectFrom("users as u")` with full type safety
- **Excellent TypeScript DX**: Amazing autocomplete and compile-time validation
- **Simple but Powerful**: Easy to understand, AI-friendly codebase
- **Test-Driven Foundation**: Every feature backed by clear, isolated tests

### Core Challenge: Table Aliases
The main technical challenge is making this work perfectly:
```typescript
// ✅ Should work - qualified column
db.selectFrom("users as u").select(["u.id", "u.name"])

// ✅ Should work - unqualified column  
db.selectFrom("users as u").select(["id", "name"])

// ❌ Should fail at TypeScript level - original table name forbidden
db.selectFrom("users as u").select(["users.id"])
```

### Implementation Phases (See DESIGN.md)
1. **Phase 1**: Basic single table queries
2. **Phase 2**: Table aliases (core challenge)
3. **Phase 3**: JOIN operations  
4. **Phase 4**: WHERE clauses with expression builder
5. **Phase 5**: ORDER BY and LIMIT

## Current Testing Strategy (Refactor)

### New Test-Driven Approach
- **Individual Test Files**: Each test file focuses on ONE concept (e.g., `phase1-basic-table.test.ts`)
- **Fast Feedback Loop**: Run single test files for quick validation
- **AI-Friendly**: Clear pass/fail criteria, easy to debug when things break
- **Progressive**: Build complexity gradually through 5 phases

### Test Organization Approach
- Create test files as you go - no predetermined naming
- Focus on one concept per test file
- Choose clear, descriptive names that make sense to you
- Organize by phase or feature as feels natural

### Run Individual Tests
```bash
# Test specific files (you choose the names)
bun test your-test-file.test.ts

# Test all files
bun test
```

### Legacy Test System (From Old Implementation)
The `tests/` directory contains 190+ existing tests from the previous implementation. These provide reference for expected behavior but are NOT part of the current refactor approach.

## Development Guidelines (Refactor)

### AI Implementation Strategy
1. **Read DESIGN.md first** - Understand the complete strategy
2. **Check Kysely for inspiration** - Study their proven solutions in `kysely/` folder before implementing complex features. Always try to improve upon their approach where possible while maintaining compatibility
3. **Start with Phase 1** - Don't jump ahead to complex features
4. **One test at a time** - Write test, make it pass, move on
5. **Simple implementations** - Focus on correctness over optimization
6. **Use TypeScript compiler** - Run `tsc --noEmit` frequently

### Test-First Development Cycle
1. **Write failing test** - Define exactly what you want  
2. **Run test** - See it fail (red)
3. **Write minimal code** - Just enough to pass
4. **Run test** - See it pass (green)  
5. **Refactor if needed** - Improve without breaking test
6. **Move to next test** - Repeat cycle

### Code Conventions (New Implementation)
- Start simple, refactor later
- TypeScript-first development
- Clear, readable code over clever optimizations
- Each phase builds on the previous foundation

### When You Get Stuck
- Go back to a simpler test
- Break complex problems into smaller parts
- Focus on making ONE thing work perfectly
- Don't worry about edge cases initially

## Project Structure (Current State)

### Legacy Implementation (Exists but Being Replaced)
```
src/
├── index.ts                    # Main entry point (legacy)
├── query-builder.ts           # Main pgvibe class (legacy)
├── raw-sql.ts                 # Raw SQL template literals (legacy)
└── core/                      # Legacy core implementation
    ├── ast/                   # AST nodes (legacy)
    ├── builders/              # Query builders (legacy)
    ├── postgres/              # PostgreSQL integration (legacy)
    ├── types/                 # Type system (legacy)
    └── shared-types.ts        # Common types (legacy)
```

### New Implementation (What We're Building)
```
src/
├── query-builder.ts           # NEW - Simple, AI-friendly implementation
├── types.ts                   # NEW - Clean type definitions
└── utils/                     # NEW - Helper functions (as needed)

tests/
├── *.test.ts                  # NEW - Test files you create as you go
└── ...                        # Organize by phase/feature as makes sense
```

### Important Files for Refactor
- **DESIGN.md** - Complete development strategy (READ THIS FIRST)
- **CLAUDE.md** - This file, repository context
- **tests/*.test.ts** - Individual test files you create for TDD approach

## Common Development Tasks (Refactor)

### Starting the Refactor (If Not Started)
1. **Read DESIGN.md completely** - Understand the strategy
2. **Create first test file** - Choose your own filename for basic table functionality
3. **Write failing test** - Define what you want to build
4. **Create minimal implementation** - Just enough to pass
5. **Run test and verify** - Should pass!

### Adding New Features (TDD Approach)
1. **Create test file** - Focus on ONE concept, choose a clear filename
2. **Write failing test** - Be very specific about expected behavior
3. **Run test** - Confirm it fails as expected
4. **Implement minimal code** - In `src/query-builder.ts` or new files
5. **Run test** - Should pass now
6. **Refactor if needed** - Improve code without breaking test

### Debugging Failed Tests
1. **Read the test carefully** - Understand what it expects
2. **Check the error message** - TypeScript or runtime error?
3. **Simplify the test** - Break it into smaller parts if needed
4. **Focus on one thing** - Make ONE test pass at a time

### Phase Progression
- **Don't skip phases** - Each builds on the previous
- **Complete Phase 1** before moving to Phase 2
- **All Phase X tests** must pass before moving to Phase X+1

## Important Notes (Refactor Context)

### Current Branch and Status
- **Branch**: `fresh-start-tdd-alias-system`
- **Status**: Major refactor in progress
- **Goal**: Rebuild query builder with perfect alias system
- **Approach**: Test-driven development with AI-friendly design

### What NOT to Do
- **Don't modify legacy code** in `src/core/` - it's being replaced
- **Don't run legacy tests** as reference for current work
- **Don't try to build everything at once** - follow the phases
- **Don't skip DESIGN.md** - it contains the complete strategy

### What TO Do
- **Read DESIGN.md first** - Contains complete development strategy
- **Follow TDD cycle** - Test first, minimal implementation, refactor
- **Start with Phase 1** - Build foundation before complex features
- **Run individual tests** - Fast feedback loop is critical
- **Ask for help** when stuck - better to ask than get lost

### PostgreSQL-Only Focus (Unchanged)
- No multi-database support - PostgreSQL-native implementation
- Leverage PostgreSQL-specific features (JSONB, arrays, full-text search)
- Direct optimization without dialect abstraction overhead

### Development Runtime
Project uses Bun as the JavaScript runtime and package manager. All commands should use `bun` instead of `npm`/`yarn`.

### Quick Reference
- **Strategy**: Read `DESIGN.md`
- **Commands**: `bun test [filename]` for individual tests
- **Approach**: Small tests → minimal code → refactor → next test
- **Organization**: Create test files as you go, focus on one concept per file
- **Goal**: Perfect alias system with excellent TypeScript DX