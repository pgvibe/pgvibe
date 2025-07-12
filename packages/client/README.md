# PGVibe Query Builder

A PostgreSQL-native TypeScript query builder with perfect autocomplete and type safety.

## ✨ Features

- **Perfect TypeScript Integration** - Excellent autocomplete and compile-time error detection
- **PostgreSQL-Native** - Designed specifically for PostgreSQL, no multi-database compromises  
- **Table Alias System** - Advanced alias support with proper type safety
- **Immutable Builder Pattern** - Chainable, predictable query building
- **Zero Runtime Dependencies** - Lightweight and fast

## 🚀 Quick Start

```typescript
import { pgvibe } from "@pgvibe/client";

// Define individual table schemas for reusability
export interface Users {
  id: number;
  name: string;
  email: string;
  active: boolean;
}

export interface Posts {
  id: number;
  user_id: number;
  title: string;
  content: string;
  published: boolean;
}

// Compose them into your database schema
interface MyDatabase {
  users: Users;
  posts: Posts;
}

// Create a query builder with your schema
const db = pgvibe<MyDatabase>();

// Basic query
const users = await db
  .selectFrom("users")
  .select(["id", "name", "email"])
  .execute();

// With table aliases and JOINs
const userPosts = await db
  .selectFrom("users as u")
  .innerJoin("posts as p", "u.id", "p.user_id")
  .select([
    "u.name as author",
    "p.title as postTitle", 
    "p.published"
  ])
  .execute();
```

## 🎯 Type Safety

The query builder provides excellent TypeScript experience:

```typescript
// ✅ Perfect autocomplete
db.selectFrom("users")  // Shows: "users", "posts"
  .select(["id", "name"]) // Shows only valid columns

// ✅ Compile-time validation
db.selectFrom("users as u")
  .select(["u.name"])     // ✅ Valid
  .select(["users.name"]) // ❌ TypeScript error - alias exclusivity

// ✅ Result type inference
const result = await db.selectFrom("users").select(["id", "name"]).execute();
// result: { id: number, name: string }[]
```

## 🎪 Core Concepts

### Table Aliases

When you use a table alias, the original table name becomes unavailable:

```typescript
// After aliasing "users as u", only "u.*" and unqualified columns work
db.selectFrom("users as u")
  .select(["u.id", "u.name", "email"]) // ✅ Valid
  .select(["users.id"])                // ❌ TypeScript error
```

### JOIN Operations

```typescript
const query = qb
  .selectFrom("users as u")
  .innerJoin("posts as p", "u.id", "p.user_id")
  .leftJoin("comments as c", "p.id", "c.post_id")
  .select([
    "u.name",           // string
    "p.title",          // string  
    "c.content"         // string | null (from LEFT JOIN)
  ]);
```

### Column Aliases

```typescript
const result = await qb
  .selectFrom("users")
  .select([
    "id as userId",
    "name as userName",
    "email"
  ])
  .execute();

// result: { userId: number, userName: string, email: string }[]
```

## 🧪 Testing

The package includes comprehensive tests ensuring reliability:

- **40 tests** across unit, integration, and TypeScript validation
- **Organized test structure**: `tests/unit/`, `tests/typescript/`, `tests/integration/`
- **Regression prevention**: Complete validation suites to prevent breaking changes

```bash
# Run all tests
bun test

# Run specific test category  
bun test tests/unit/
bun test tests/typescript/

# Type checking
bun run typecheck
```

## 📁 Examples

Check the `examples/` directory for comprehensive usage examples:

- **`basic-usage.ts`** - Simple queries and basic concepts
- **`advanced-queries.ts`** - Complex JOINs and real-world patterns
- **`type-safety.ts`** - TypeScript autocomplete and validation showcase

## 🔧 Development

Built with [Bun](https://bun.sh) for fast development.

### Setup

```bash
# Install dependencies
bun install

# Run tests
bun test

# Build the package
bun run build

# Development playground
bun run dev
```

### Project Structure

```
src/                  # Source code
├── types/           # Modular type definitions
├── query-builder.ts # Core implementation
└── index.ts         # Public API

tests/               # Comprehensive test suite
├── unit/           # Unit tests
├── typescript/     # TypeScript validation  
├── integration/    # End-to-end tests
└── fixtures/       # Test schema

examples/           # Usage examples
```

## 📖 API Reference

### QueryBuilder

```typescript
new QueryBuilder<DB>()
```

Create a new query builder instance for your database schema.

### selectFrom()

```typescript
selectFrom<TE extends TableExpression<DB>>(table: TE)
```

Start a SELECT query from a table. Supports both plain table names and aliases.

### select()

```typescript
select<S extends ValidColumn<DB, TB>[]>(selections: S)
```

Specify which columns to select with full type inference and autocomplete.

### innerJoin() / leftJoin()

```typescript
innerJoin<TE extends TableExpression<DB>>(
  table: TE,
  leftColumn: JoinColumnReference<DB, TB, TE>,
  rightColumn: JoinColumnReference<DB, TB, TE>
)
```

Add JOIN operations with type-safe column references.

### execute()

```typescript
async execute(): Promise<Prettify<O>[]>
```

Execute the query and return typed results.

### toSQL()

```typescript
toSQL(): string
```

Generate the SQL string without executing.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Write tests for new functionality
4. Ensure all tests pass: `bun test`
5. Submit a pull request

## 📄 License

MIT