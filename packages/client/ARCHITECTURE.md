# ZenQ Architecture

A comprehensive architecture document for ZenQ - a PostgreSQL-native TypeScript query builder with type safety and real database execution.

## Table of Contents

- [Executive Summary](#executive-summary)
- [Core Architecture](#core-architecture)
- [ZenQ PostgreSQL-Native Approach](#zenq-postgresql-native-approach)
- [Technical Implementation](#technical-implementation)
- [Query Building System](#query-building-system)
- [PostgreSQL Integration](#postgresql-integration)
- [Foundation MVP Status](#foundation-mvp-status)
- [Performance Considerations](#performance-considerations)
- [Developer Experience](#developer-experience)
- [Future Features](#future-features)

## Executive Summary

### Vision Statement

ZenQ is a **PostgreSQL-native** TypeScript query builder that provides compile-time type safety, immutable query building, and direct PostgreSQL integration. By focusing exclusively on PostgreSQL, ZenQ leverages the full power of PostgreSQL's advanced features without the limitations of multi-database abstraction layers.

### Core Philosophy

**"PostgreSQL-first, type-safe, zero-abstraction"**

- **PostgreSQL as Primary Target**: Direct PostgreSQL integration without generic abstractions
- **Kysely-Inspired Developer Experience**: Familiar fluent API with enhanced type safety for PostgreSQL
- **Maximum Performance**: Direct PostgreSQL optimization without dialect overhead
- **Advanced PostgreSQL Features**: JSONB, arrays, window functions, CTEs, full-text search
- **Developer Experience First**: Clean IntelliSense, compile-time validation, intuitive API

### Key Differentiators

1. **PostgreSQL-Only Focus**: Maximum feature utilization without compromise
2. **Zero Dialect Abstraction**: Direct PostgreSQL implementation for best performance
3. **Advanced Type Safety**: Comprehensive compile-time validation with clean types
4. **Real Database Integration**: Full PostgreSQL execution with connection pooling
5. **Modern Architecture**: Immutable operations with AST-based query compilation
6. **Foundation for Growth**: Solid base for advanced PostgreSQL features

## Core Architecture

ZenQ follows a streamlined, PostgreSQL-native architecture:

```
┌─────────────────────────────────────┐
│     User Code (Type-safe API)       │  ← Clean PostgreSQL TypeScript interfaces
├─────────────────────────────────────┤
│     Query Builders                  │  ← SelectQueryBuilder optimized for PostgreSQL
├─────────────────────────────────────┤
│     AST/Operation Nodes             │  ← Immutable tree representation
├─────────────────────────────────────┤
│     PostgreSQL Query Compiler       │  ← Direct PostgreSQL SQL generation
├─────────────────────────────────────┤
│     PostgreSQL Driver               │  ← PostgreSQL connection management
├─────────────────────────────────────┤
│     PostgreSQL Database             │  ← Native PostgreSQL integration
└─────────────────────────────────────┘
```

### Key Components

- **Query Builders**: PostgreSQL-optimized fluent API with comprehensive type safety
- **Operation Nodes**: Immutable AST nodes representing PostgreSQL SQL components
- **PostgreSQL Compiler**: Direct PostgreSQL SQL generation with parameter handling
- **PostgreSQL Driver**: Native connection management with pooling support
- **Type System**: Clean PostgreSQL-specific types with advanced operator support

## ZenQ PostgreSQL-Native Approach

### 1. Direct PostgreSQL Integration

No abstraction layers - direct PostgreSQL implementation:

```typescript
// Direct PostgreSQL connection
const db = new ZenQ<Database>({
  connectionString: "postgresql://user:password@localhost:5432/mydb",
});

// PostgreSQL-specific operators supported
await db
  .selectFrom("users")
  .where("name", "ILIKE", "%john%") // PostgreSQL case-insensitive LIKE
  .where("data", "~", "^[A-Z].*") // PostgreSQL regex operators
  .where("tags", "&&", ["admin", "user"]) // PostgreSQL array operators (future)
  .execute();
```

### 2. PostgreSQL-Optimized Type System

Enhanced type system with PostgreSQL-specific operators:

```typescript
// PostgreSQL-specific comparison operators
export type ComparisonOperator =
  | "="
  | "!="
  | "<>"
  | "<"
  | "<="
  | ">"
  | ">="
  | "IN"
  | "NOT IN"
  | "LIKE"
  | "NOT LIKE"
  | "ILIKE"
  | "NOT ILIKE" // PostgreSQL case-insensitive LIKE
  | "IS"
  | "IS NOT"
  | "SIMILAR TO"
  | "NOT SIMILAR TO" // PostgreSQL regex matching
  | "~"
  | "!~"
  | "~*"
  | "!~*"; // PostgreSQL regex operators
```

### 3. Simplified Architecture Benefits

**Performance Benefits:**

- No dialect abstraction overhead
- Direct PostgreSQL optimization
- Minimal query compilation latency
- Efficient connection pooling

**Developer Benefits:**

- No complex dialect configuration
- Full PostgreSQL feature access
- Cleaner, more focused API
- Better IntelliSense and autocomplete

## Technical Implementation

### Operation Node AST (Inherited from Kysely)

Every SQL component becomes an immutable operation node forming an Abstract Syntax Tree:

```typescript
// Core query nodes
SelectQueryNode, InsertQueryNode, UpdateQueryNode, DeleteQueryNode;

// Clause nodes
WhereNode, JoinNode, GroupByNode, OrderByNode, LimitNode;

// Expression nodes
BinaryOperationNode, FunctionNode, CaseNode, RawNode;

// Structural nodes
ReferenceNode, IdentifierNode, AliasNode, ValueNode;
```

### Immutable Builder Pattern

Each method returns a new builder instance, ensuring immutability:

```typescript
class SelectQueryBuilderImpl<DB, TB extends keyof DB, O> {
  #props: SelectQueryBuilderProps;

  select<SE extends SelectExpression<DB, TB>>(
    selection: SelectArg<DB, TB, SE>
  ): SelectQueryBuilder<DB, TB, O & Selection<DB, TB, SE>> {
    return new SelectQueryBuilderImpl({
      ...this.#props,
      queryNode: SelectQueryNode.cloneWithSelection(
        this.#props.queryNode,
        parseSelectArg(selection)
      ),
    });
  }
}
```

### ZenQ Query Compilation

Enhanced compilation with simple type safety:

```typescript
interface ZenQQueryCompiler extends QueryCompiler {
  compileQuery<R = unknown>(node: RootOperationNode): CompiledQuery<R>;

  // ZenQ additions - compile-time type safety only
  getTableSchema(tableName: string): TableSchema;
  generateTypeScript(schema: DatabaseSchema): TypeScriptDefinitions;
}
```

### Database Introspection Engine

Core system for automated code generation:

```typescript
interface DatabaseIntrospector {
  introspectDatabase(): Promise<DatabaseSchema>;
  introspectTable(tableName: string): Promise<TableSchema>;
  detectColumnTypes(tableName: string): Promise<ColumnDefinition[]>;
  extractColumnComments(tableName: string): Promise<ColumnComments>;
}

interface TypeScriptGenerator {
  generateInterfaces(schema: DatabaseSchema): Promise<TypeScriptDefinitions>;
  generateJSDocComments(comments: ColumnComments): JSDocDefinitions;
}

interface ValidationGenerator {
  generateZodSchemas(schema: DatabaseSchema): Promise<ZodSchemas>; // Optional
  generateYupSchemas(schema: DatabaseSchema): Promise<YupSchemas>; // Future
  generateJoiSchemas(schema: DatabaseSchema): Promise<JoiSchemas>; // Future
}
```

## Query Building System

### Query Builder

ZenQ's query builder is optimized for PostgreSQL with comprehensive type safety:

```typescript
// ✅ Column name safety - prevents typos
await db
  .selectFrom("users")
  .where("name", "=", "John") // ✅ Valid column
  .where("fake_column", "=", "test") // ❌ TypeScript error: column doesn't exist
  .execute();

// ✅ Type safety for basic types
await db
  .insertInto("users")
  .values({
    name: "John", // ✅ string expected
    email: "john@example.com", // ✅ string | null expected
    active: true, // ✅ boolean expected
    created_at: new Date(), // ❌ TypeScript error: readonly column
  })
  .execute(); // PostgreSQL handles NOT NULL, unique constraints, email format, etc.
```

### Application Validation

```typescript
// Only if you generated with --zod flag
import { validateUserInput } from "./database.zod";

// API endpoint validation
app.post("/users", (req, res) => {
  try {
    const userData = validateUserInput(req.body); // Zod validation

    const user = await db
      .insertInto("users")
      .values(userData) // Already validated
      .returningAll()
      .executeTakeFirstOrThrow();

    res.json(user);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});
```

## PostgreSQL Integration

ZenQ leverages PostgreSQL's advanced features without compromise:

```typescript
// Direct PostgreSQL connection
const db = new ZenQ<Database>({
  connectionString: "postgresql://user:password@localhost:5432/mydb",
});

// PostgreSQL-specific operators supported
await db
  .selectFrom("users")
  .where("name", "ILIKE", "%john%") // PostgreSQL case-insensitive LIKE
  .where("data", "~", "^[A-Z].*") // PostgreSQL regex operators
  .where("tags", "&&", ["admin", "user"]) // PostgreSQL array operators (future)
  .execute();
```

## Foundation MVP Status

### ✅ **FOUNDATION MVP COMPLETE!**

**Status**: 🎉 All phases and **189 tests passing** with comprehensive PostgreSQL-only implementation!

### ✅ Completed Core Features

- [x] **PostgreSQL-native TypeScript query builder** - Direct implementation without dialect abstraction
- [x] **Type safety and real database execution** - Full compile-time validation with PostgreSQL execution
- [x] **Advanced SELECT queries** - Column selection, WHERE clauses, JOINs, ORDER BY, LIMIT/OFFSET
- [x] **PostgreSQL-optimized type system** - Enhanced with PostgreSQL-specific operators (ILIKE, regex)
- [x] **Immutable query building** - AST-based approach with type evolution
- [x] **Real database integration** - PostgreSQL connection pooling and transaction support
- [x] **Advanced JOIN support** - INNER, LEFT, RIGHT, FULL JOINs with qualified column references
- [x] **Raw SQL integration** - Template literals with parameter binding and type safety
- [x] **Ambiguous column detection** - Compile-time prevention of ambiguous column references

### ✅ Completed Technical Features

- [x] **189 Tests Passing** - Comprehensive test coverage across all functionality
- [x] **PostgreSQL-specific operators** - ILIKE, SIMILAR TO, regex operators (~, !~, ~_, !~_)
- [x] **Clean type system** - Optimized PostgreSQL-only types without dialect abstraction
- [x] **Connection management** - PostgreSQL connection pooling with proper cleanup
- [x] **Error handling** - Comprehensive PostgreSQL error mapping and user-friendly messages
- [x] **Developer experience** - Clean IntelliSense, helpful error messages, intuitive API

## Performance Considerations

### Compile-Time Optimizations

1. **Generated Types**: Simple, optimized types instead of complex runtime inference
2. **Query Compilation Caching**: Pre-compiled queries for repeated patterns
3. **Bundle Size**: Tree-shakeable exports, only used dialects included

### Runtime Performance

1. **Immutable Operations**: Structural sharing for efficient memory usage
2. **Connection Pooling**: Efficient database connection management
3. **Lazy Evaluation**: SQL generation only when needed
4. **Streaming Support**: Handle large result sets without memory issues

### Memory Management

1. **AST Node Reuse**: Shared immutable nodes across queries
2. **Plugin Efficiency**: Minimal overhead for transformation plugins
3. **Schema Caching**: Generated schemas cached in memory

## Developer Experience

### Zero-Config Setup

```typescript
// Minimal setup required
const db = new ZenQ<Database>({
  connectionString: "postgresql://user:password@localhost:5432/mydb",
});

// Generate types once
// npx zenq generate
```

### Enhanced IDE Support

- **Perfect Autocomplete**: Generated types provide exact column/table names
- **Compile-Time Type Errors**: Catch column name typos and basic type mismatches in IDE
- **Simple Type Safety**: Clean TypeScript interfaces, no complex branded types
- **Inline Documentation**: JSDoc comments generated from database column comments
- **Refactoring Support**: Column renames update everywhere

```typescript
// IDE shows errors immediately during development
const result = await db
  .selectFrom("users")
  .where("fake_column", "=", "test") // ❌ Error: Column 'fake_column' doesn't exist
  .where("name", "=", 123) // ❌ Error: Type 'number' is not assignable to 'string'
  .execute();

// Hovering over properties shows database column comments
const userData = {
  name: "John", // IDE tooltip: "User's full display name"
  email: "john@example.com", // IDE tooltip: "User's email address - must be unique across system"
};
```

### Debugging & Testing

```typescript
// Query inspection
const query = db.selectFrom("users").where("active", "=", true);
const { sql, parameters } = query.compile();
console.log(sql, parameters);

// Type-safe testing
test("finds active users", async () => {
  const users = await db
    .selectFrom("users")
    .where("active", "=", true)
    .selectAll()
    .execute();

  expect(users[0]).toMatchObject({
    id: expect.any(Number),
    name: expect.any(String),
    email: expect.any(String),
    active: expect.any(Boolean),
    // All properties type-checked against Database interface
  });
});
```

### Error Handling

- **Compile-Time Type Errors**: IDE catches type mismatches immediately during development
- **Clear Error Messages**: Specific guidance for type mismatches and validation failures
- **Runtime Validation Errors**: Detailed Zod validation feedback with exact failure reasons
- **Development Warnings**: Hints for query optimization and best practices

```typescript
// Compile-time error in IDE
const badData = {
  fake_column: "test", // ❌ TypeScript: Column 'fake_column' doesn't exist
};

// Runtime validation with detailed errors
try {
  UserInsertSchema.parse({ name: "", email: "bad-email" });
} catch (error) {
  // ZodError with detailed validation failures:
  // - name: String must contain at least 1 character(s)
  // - email: Invalid email format
}
```

## Future Features

The Foundation MVP provides a solid PostgreSQL-native foundation. Advanced PostgreSQL features are planned for future releases.

### 🔮 **Advanced PostgreSQL Features**

See [`FUTURE_FEATURES.md`](./FUTURE_FEATURES.md) for detailed roadmap including:

**Data Type Support:**

- JSONB operations with type safety
- Array operations with proper typing
- Range types (daterange, numrange, etc.)
- Custom types and enums
- PostGIS spatial data types

**Advanced Query Features:**

- Window functions with type inference
- CTEs (Common Table Expressions)
- Full-text search integration
- Recursive queries
- Materialized views

**Performance & Operations:**

- Query optimization and caching
- Connection pooling enhancements
- Bulk operations and batch inserts
- Streaming results for large datasets
- Advanced transaction management

### 📈 **Performance Targets**

- **Query compilation**: < 1ms for typical queries
- **Memory usage**: Optimized for PostgreSQL-only architecture
- **Bundle size**: Tree-shakeable, minimal overhead
- **Type checking**: Fast TypeScript compilation with clean types

---

This architecture represents a focused PostgreSQL-native approach that maximizes performance and developer experience by eliminating multi-database abstraction overhead while providing comprehensive type safety and modern query building capabilities.
