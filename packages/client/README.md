# ZenQ

A PostgreSQL-native TypeScript query builder with advanced type safety and comprehensive PostgreSQL feature support.

## Features

🚀 **PostgreSQL-Native Architecture**

- Direct PostgreSQL integration with no dialect abstraction
- Full PostgreSQL feature set support (JSONB, arrays, CTEs, window functions)
- Optimized for PostgreSQL-specific performance patterns

🔒 **Advanced Type Safety**

- Compile-time query validation with TypeScript
- Proper type inference for SELECT operations
- Ambiguous column detection and prevention
- PostgreSQL-aware type system with `<DB, TB, O>` pattern

🏗️ **Immutable Builder Pattern**

- Type-safe query building with method chaining
- Immutable AST representation for query operations
- Extensible plugin system architecture

🧪 **Comprehensive Testing**

- 197+ passing tests covering all PostgreSQL features
- Integration tests with real PostgreSQL instances
- Type-level testing with `tsd` for compile-time validation
- Performance benchmarks and optimization testing

## Installation

```bash
npm install zenq
# or
bun install zenq
# or
yarn add zenq
```

## Quick Start

```typescript
import { createDatabase } from "zenq";

// Define your database schema
interface Database {
  users: {
    id: number;
    name: string;
    email: string | null;
    active: boolean;
    metadata: Record<string, any>; // JSONB
    tags: string[]; // PostgreSQL arrays
    created_at: Date;
  };
  posts: {
    id: number;
    user_id: number;
    title: string;
    content: string | null;
    published: boolean;
    tags: string[];
    metadata: Record<string, any>;
    created_at: Date;
  };
  comments: {
    id: number;
    post_id: number;
    user_id: number;
    content: string;
    author_name: string;
    reactions: Record<string, any>;
    created_at: Date;
  };
}

// Create database connection
const db = createDatabase<Database>({
  connectionString: "postgresql://user:password@localhost:5432/mydb",
});
```

## Usage Examples

### Basic Queries

```typescript
// Simple SELECT with type inference
const activeUsers = await db
  .selectFrom("users")
  .select(["id", "name", "email"])
  .where("active", "=", true)
  .execute();
// Type: { id: number; name: string; email: string | null }[]

// PostgreSQL JSONB operations
const usersWithPreferences = await db
  .selectFrom("users")
  .select(["name", "metadata"])
  .where("metadata", "->", "preferences")
  .execute();
```

### Joins with Type Safety

```typescript
// JOIN queries with proper type inference
const userPosts = await db
  .selectFrom("users")
  .innerJoin("posts", "users.id", "posts.user_id")
  .select(["users.name", "posts.title", "posts.published"])
  .where("users.active", "=", true)
  .orderBy("posts.created_at", "DESC")
  .execute();
// Type: { name: string; title: string; published: boolean }[]

// Three-way joins
const fullData = await db
  .selectFrom("users")
  .innerJoin("posts", "users.id", "posts.user_id")
  .leftJoin("comments", "posts.id", "comments.post_id")
  .select(["users.name", "posts.title", "comments.content"])
  .execute();
// Type: { name: string; title: string; content: string | null }[]
```

### Raw SQL for Advanced PostgreSQL Features

```typescript
import { sql } from "zenq";

// JSONB operations using raw SQL
const usersWithDarkTheme = await db
  .selectFrom("users")
  .select(["name", "metadata"])
  .where(sql`metadata->>'preferences'->>'theme' = ${"dark"}`)
  .execute();

// Array operations using raw SQL
const taggedPosts = await db
  .selectFrom("posts")
  .select(["title", "tags"])
  .where(sql`tags @> ${["typescript", "database"]}`)
  .execute();

// Full-text search using raw SQL
const searchPosts = await db
  .selectFrom("posts")
  .select(["title", "content"])
  .where(sql`search_vector @@ plainto_tsquery(${"typescript"})`)
  .execute();
```

### Advanced Query Building

```typescript
// Complex WHERE conditions
const complexQuery = await db
  .selectFrom("users")
  .innerJoin("posts", "users.id", "posts.user_id")
  .select(["users.name", "posts.title"])
  .where("users.active", "=", true)
  .where("posts.published", "=", true)
  .where("posts.tags", "&&", ["featured"])
  .orderBy("posts.created_at", "desc")
  .limit(10)
  .execute();

// Qualified column selection (removes table prefixes from result)
const qualifiedSelection = await db
  .selectFrom("users")
  .innerJoin("posts", "users.id", "posts.user_id")
  .select([
    "name", // Unambiguous - from users table
    "posts.title", // Qualified - becomes "title" in result
    "users.email", // Qualified - becomes "email" in result
  ])
  .execute();
// Type: { name: string; title: string; email: string | null }[]
```

## Architecture

### PostgreSQL-Native Design

ZenQ is built specifically for PostgreSQL, allowing us to:

- **Leverage Full PostgreSQL Power**: Direct access to JSONB, arrays, CTEs, window functions, and more
- **Optimize for PostgreSQL**: No generic SQL abstraction overhead
- **Better Developer Experience**: PostgreSQL-specific type safety and IntelliSense
- **Simplified Codebase**: No complex dialect abstraction layers

### Type System

The type system uses a three-parameter approach:

- `DB`: Database schema interface
- `TB`: Table(s) being queried (union type for joins)
- `O`: Output/result type with proper column selection

```typescript
interface SelectQueryBuilder<DB, TB extends keyof DB, O> {
  select<K extends ColumnReference<DB, TB>>(
    columns: K[]
  ): SelectQueryBuilder<DB, TB, SelectResult<DB, TB, K>>;

  where<C extends ColumnReference<DB, TB>>(
    column: C,
    operator: ComparisonOperator,
    value: ColumnType<DB, TB, C>
  ): SelectQueryBuilder<DB, TB, O>;

  // ... more methods
}
```

## Development

Built with [Bun](https://bun.sh) and PostgreSQL.

### Setup

```bash
# Install dependencies
bun install

# Start PostgreSQL database
bun run db:up

# Run tests (includes type testing)
bun test

# Build the package
bun run build

# Development playground
bun run dev
```

### Testing

ZenQ includes comprehensive testing across runtime behavior and compile-time type safety:

```bash
# All tests (runtime + type tests)
bun test

# Runtime tests only (196 tests)
bun run test:runtime

# Type tests only (TypeScript Declaration Testing)
bun run test:types

# Integration tests with PostgreSQL
bun run test:integration

# Performance benchmarks
bun run test:performance

# Watch mode for development
bun run test:watch
```

#### Type Testing with TSD

ZenQ uses [TSD (TypeScript Definition Testing)](https://github.com/SamVerschueren/tsd) to validate compile-time type safety. This ensures that:

- **Type constraints are enforced**: Invalid type combinations are caught at compile time
- **IntelliSense works correctly**: Proper autocomplete and type hints
- **Error messages are helpful**: Clear feedback when types don't match

**Type Test Examples:**

```typescript
import { expectType, expectError } from "tsd";
import { createDatabase } from "zenq";

const db = createDatabase<Database>({
  connectionString: "postgresql://localhost:5432/test",
});

// ✅ Valid type combinations should work
expectType<{ id: number; name: string }[]>(
  await db.selectFrom("users").select(["id", "name"]).execute()
);

// ❌ Invalid type combinations should be caught
expectError(
  db.selectFrom("users").select(["id"]).where("id", "=", "not_a_number")
);

// ❌ Wrong operators for null should be caught
expectError(
  db.selectFrom("users").select(["name"]).where("email", "=", null) // Should use "is"
);

// ❌ Type mismatches in arrays should be caught
expectError(
  db.selectFrom("users").select(["id"]).where("id", "in", [1, "2", 3]) // Mixed types
);
```

**Running Type Tests:**

```bash
# Run all type tests
bun run test:types

# Watch mode for type test development
bun run test:types:watch

# Build types to catch compilation errors
bun run build:types
```

**Type Test Configuration:**

The type testing setup uses `tsd` directly with this configuration in `tsd.json`:

```json
{
  "directory": "tests/types",
  "compilerOptions": {
    "module": "commonjs",
    "target": "es2022",
    "lib": ["es2022"],
    "moduleResolution": "node",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "exactOptionalPropertyTypes": true
  }
}
```

This ensures that ZenQ's type system correctly validates queries at compile time, providing excellent developer experience with immediate feedback on type errors.

### Database Schema

The test database includes comprehensive PostgreSQL features:

```sql
-- Users with JSONB and arrays
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE,
    active BOOLEAN DEFAULT true,
    metadata JSONB DEFAULT '{}',
    tags TEXT[] DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Posts with full-text search
CREATE TABLE posts (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    title VARCHAR(255) NOT NULL,
    content TEXT,
    published BOOLEAN DEFAULT false,
    tags TEXT[] DEFAULT '{}',
    metadata JSONB DEFAULT '{}',
    search_vector TSVECTOR,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- PostgreSQL-specific indexes
CREATE INDEX idx_users_metadata_gin ON users USING GIN (metadata);
CREATE INDEX idx_posts_tags_gin ON posts USING GIN (tags);
CREATE INDEX idx_posts_search ON posts USING GIN (search_vector);
```

## API Reference

### Core Query Builder

- `createDatabase<DB>(config)` - Create database connection
- `db.selectFrom(table)` - Start SELECT query
- `.select(columns)` - Select specific columns with type inference
- `.where(column, operator, value)` - Add WHERE conditions
- `.innerJoin()` / `.leftJoin()` / `.rightJoin()` - JOIN operations
- `.orderBy(column, direction)` - Add ORDER BY clause
- `.limit(count)` - Add LIMIT clause
- `.offset(count)` - Add OFFSET clause
- `.execute()` - Execute query and return typed results

### Currently Supported Operators

- **Comparison**: `=`, `!=`, `<>`, `>`, `>=`, `<`, `<=`
- **Text**: `like`, `not like`, `ilike`, `not ilike`
- **Lists**: `in`, `not in`
- **Null checks**: `is`, `is not`
- **Existence**: `exists`, `not exists`

### PostgreSQL-Specific Features (via Raw SQL)

For advanced PostgreSQL features, use the `sql` template literal:

```typescript
import { sql } from "zenq";

// JSONB operations
.where(sql`metadata->>'key' = ${"value"}`)
.where(sql`metadata @> ${{ key: "value" }}`)

// Array operations
.where(sql`tags @> ${["tag1", "tag2"]}`)
.where(sql`tags && ${["tag1", "tag2"]}`)

// Full-text search
.where(sql`search_vector @@ plainto_tsquery(${"search term"})`)
```

## Roadmap

- **Native JSONB Operators**: Built-in support for `->`, `->>`, `@>`, `?`, `?&`, `?|`
- **Native Array Operators**: Built-in support for `@>`, `<@`, `&&`, `ANY()`, `ALL()`
- **Window Functions**: Complete PostgreSQL window function support
- **CTEs**: Common Table Expressions (recursive and non-recursive)
- **Full-Text Search**: Native `@@` and `@@@` operators with `tsvector`/`tsquery`
- **Schema Introspection**: Automatic type generation from PostgreSQL schemas
- **Advanced Types**: ENUMs, domains, custom types
- **Connection Pooling**: Built-in connection pool management
- **Migration System**: PostgreSQL-native migration tools

## Contributing

We welcome contributions! Please see our contributing guidelines and make sure all tests pass:

```bash
bun test        # All tests must pass
bun run typecheck  # Type checking must pass
```

## License

MIT
