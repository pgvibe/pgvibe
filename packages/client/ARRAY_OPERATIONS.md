# PostgreSQL Array Operations

This document provides comprehensive guidance on using PostgreSQL array operations with the pgvibe client library.

## Overview

The pgvibe client now supports type-safe PostgreSQL array operations through a fluent API. All major PostgreSQL array operators are supported:

- **`@>` (contains)** - Array contains elements
- **`<@` (contained by)** - Array is contained by another array
- **`&&` (overlaps)** - Arrays have common elements
- **`ANY()`** - Value equals any array element
- **`ALL()`** - Value satisfies condition for all array elements

## Quick Start

```typescript
import { ZenQ } from "@pgvibe/client";

const db = new ZenQ(/* your config */);

// Find users with TypeScript skills
const typescriptUsers = await db
  .selectFrom("users")
  .selectAll()
  .where(({ array }) => array("skills").contains(["typescript"]))
  .execute();

// Find posts in multiple categories
const posts = await db
  .selectFrom("posts")
  .selectAll()
  .where(({ array }) => array("categories").overlaps(["tech", "programming"]))
  .execute();
```

## Array Operations Reference

### 1. Array Contains (`@>`)

Checks if the left array contains all elements from the right array.

```typescript
// Basic usage
.where(({ array }) => array('tags').contains(['typescript', 'nodejs']))

// Generated SQL: tags @> ARRAY[$1]
// Parameters: [['typescript', 'nodejs']]
```

### 2. Array Contained By (`<@`)

Checks if the left array is contained within the right array.

```typescript
// Check if user's skills are a subset of available skills
.where(({ array }) => array('skills').isContainedBy(['typescript', 'nodejs', 'react', 'sql']))

// Generated SQL: skills <@ ARRAY[$1]
// Parameters: [['typescript', 'nodejs', 'react', 'sql']]
```

### 3. Array Overlaps (`&&`)

Checks if arrays have any common elements.

```typescript
// Find users with overlapping interests
.where(({ array }) => array('interests').overlaps(['coding', 'music']))

// Generated SQL: interests && ARRAY[$1]
// Parameters: [['coding', 'music']]
```

### 4. Array ANY (`= ANY()`)

Checks if a value equals any element in the array.

```typescript
// Check if user has admin permission
.where(({ array }) => array('permissions').hasAny('admin'))

// Generated SQL: $1 = ANY(permissions)
// Parameters: ['admin']
```

### 5. Array ALL (`= ALL()`)

Checks if a value satisfies a condition for all array elements.

```typescript
// Check if all scores are above threshold
.where(({ array }) => array('scores').hasAll(80))

// Generated SQL: $1 = ALL(scores)
// Parameters: [80]
```

## Migration from Raw SQL

### Before (Raw SQL)

```typescript
// ❌ Raw SQL - not type-safe, prone to errors
const result = await db
  .selectFrom("users")
  .selectAll()
  .where(sql`tags @> ARRAY['typescript', 'nodejs']`)
  .execute();

// ❌ Complex conditions were difficult to compose
const complexResult = await db
  .selectFrom("users")
  .selectAll()
  .where(
    sql`(tags @> ARRAY['typescript'] AND 'admin' = ANY(permissions)) OR tags && ARRAY['python', 'java']`
  )
  .execute();
```

### After (Fluent API)

```typescript
// ✅ Type-safe, fluent, discoverable
const result = await db
  .selectFrom("users")
  .selectAll()
  .where(({ array }) => array("tags").contains(["typescript", "nodejs"]))
  .execute();

// ✅ Complex conditions are readable and composable
const complexResult = await db
  .selectFrom("users")
  .selectAll()
  .where(({ array, and, or }) =>
    or([
      and([
        array("tags").contains(["typescript"]),
        array("permissions").hasAny("admin"),
      ]),
      array("tags").overlaps(["python", "java"]),
    ])
  )
  .execute();
```

## Complex Usage Patterns

### Combining Array Operations with Regular WHERE

```typescript
const activeUsersWithSkills = await db
  .selectFrom("users")
  .select(["id", "name", "email", "skills"])
  .where("active", "=", true)
  .where(({ array }) => array("skills").contains(["typescript"]))
  .where("created_at", ">", "2023-01-01")
  .execute();
```

### Using Array Operations in JOINs

```typescript
const userPostsWithTags = await db
  .selectFrom("users")
  .innerJoin("posts", "users.id", "posts.user_id")
  .select(["users.name", "posts.title", "posts.tags"])
  .where(({ array }) =>
    array("posts.tags").overlaps(["typescript", "javascript"])
  )
  .execute();
```

### Nested Logical Operations

```typescript
const complexQuery = await db
  .selectFrom("products")
  .selectAll()
  .where(({ array, and, or, not }) =>
    and([
      or([
        array("categories").contains(["electronics"]),
        array("tags").overlaps(["featured", "bestseller"]),
      ]),
      not(array("flags").hasAny("discontinued")),
      array("availability").contains(["in-stock"]),
    ])
  )
  .execute();
```

## Type Safety Features

### Compile-Time Column Validation

```typescript
// ✅ This works - 'tags' is an array column
.where(({ array }) => array('tags').contains(['typescript']))

// ❌ This fails at compile time - 'name' is not an array column
.where(({ array }) => array('name').contains(['typescript']))
//                            ^^^^^^
// TypeScript Error: Column 'name' is not an array column
```

### Element Type Validation

```typescript
interface UserTable {
  tags: string[];        // Array of strings
  permissions: number[]; // Array of numbers
}

// ✅ Correct types
.where(({ array }) => array('tags').contains(['typescript', 'nodejs']))
.where(({ array }) => array('permissions').hasAny(1))

// ❌ Type mismatches caught at compile time
.where(({ array }) => array('tags').contains([123]))        // numbers in string array
.where(({ array }) => array('permissions').hasAny('admin')) // string in number array
```

## Performance Considerations

### Array Indexes

For optimal performance, create appropriate indexes on your array columns:

```sql
-- GIN index for containment operations (@>, <@, &&)
CREATE INDEX idx_users_tags_gin ON users USING GIN (tags);

-- For ANY/ALL operations, regular btree indexes work well
CREATE INDEX idx_users_permissions ON users USING GIN (permissions);
```

### Query Patterns

```typescript
// ✅ Efficient - uses GIN index
.where(({ array }) => array('tags').contains(['typescript']))

// ✅ Efficient - uses GIN index
.where(({ array }) => array('tags').overlaps(['typescript', 'nodejs']))

// ⚠️ Less efficient for large arrays - consider restructuring
.where(({ array }) => array('large_array').hasAny(specificValue))
```

## Common Patterns

### User Permission Checking

```typescript
// Check if user has any of the required permissions
const hasAccess = await db
  .selectFrom("users")
  .select(["id", "name"])
  .where("id", "=", userId)
  .where(({ array }) => array("permissions").overlaps(["admin", "moderator"]))
  .execute();
```

### Content Filtering by Tags

```typescript
// Find posts with specific tag combinations
const taggedPosts = await db
  .selectFrom("posts")
  .selectAll()
  .where(({ array, and }) =>
    and([
      array("tags").contains(["typescript"]), // Must have typescript
      array("tags").overlaps(["tutorial", "guide"]), // And tutorial OR guide
    ])
  )
  .orderBy("created_at", "desc")
  .execute();
```

### E-commerce Category Filtering

```typescript
// Product search with category filters
const products = await db
  .selectFrom("products")
  .select(["id", "name", "price", "categories"])
  .where(({ array, or }) =>
    or([
      array("categories").contains(["electronics", "computers"]),
      array("categories").overlaps(["mobile", "tablets"]),
    ])
  )
  .where("active", "=", true)
  .execute();
```

## Best Practices

### 1. Use Descriptive Array Column Names

```typescript
// ✅ Good
tags: string[]
categories: string[]
permissions: string[]

// ❌ Avoid
data: string[]
items: any[]
```

### 2. Prefer Specific Operations

```typescript
// ✅ Use specific operations for clarity
.where(({ array }) => array('tags').contains(['typescript'])) // Must have typescript
.where(({ array }) => array('tags').overlaps(['tech', 'programming'])) // Has any of these

// ❌ Don't use generic operations when specific ones are clearer
.where(({ array }) => array('tags').hasAny('typescript')) // Less clear intent
```

### 3. Combine with Regular WHERE Clauses

```typescript
// ✅ Combine array operations with regular filtering
const result = await db
  .selectFrom("users")
  .selectAll()
  .where("active", "=", true) // Regular WHERE
  .where(({ array }) => array("skills").contains(["typescript"])) // Array operation
  .where("created_at", ">", "2023-01-01") // Regular WHERE
  .execute();
```

### 4. Use Logical Operators for Complex Conditions

```typescript
// ✅ Readable complex conditions
.where(({ array, and, or }) => or([
  and([
    array('tags').contains(['typescript']),
    array('level').hasAny('senior')
  ]),
  array('tags').contains(['architect'])
]))
```

## Error Handling

The array operations provide helpful compile-time errors:

```typescript
// Column not found
.where(({ array }) => array('nonexistent').contains(['value']))
//                            ^^^^^^^^^^^^
// Error: Column 'nonexistent' does not exist

// Not an array column
.where(({ array }) => array('name').contains(['value']))
//                            ^^^^^^
// Error: Column 'name' is not an array column

// Type mismatch
.where(({ array }) => array('string_tags').contains([123]))
//                                                    ^^^^^
// Error: Expected string[], received number[]
```

## Compatibility

### Existing IN/NOT IN Operations

The new array operations work alongside existing IN/NOT IN operations:

```typescript
// ✅ Both work fine
.where('status', 'in', ['active', 'pending'])          // Regular IN operation
.where(({ array }) => array('tags').contains(['tech'])) // Array operation

// They serve different purposes:
// IN: column value is one of the provided values
// contains: array column contains all provided values
```

### Backward Compatibility

All existing functionality remains unchanged. The array operations are purely additive.

## Troubleshooting

### Common Issues

1. **"Column is not an array column" error**

   - Ensure your database column is actually an array type (e.g., `text[]`, `integer[]`)
   - Check your database schema type definitions

2. **Type mismatch errors**

   - Verify the element types match your array column type
   - Use consistent types: `string[]` with string elements, `number[]` with number elements

3. **Performance issues**

   - Add appropriate GIN indexes on array columns
   - Consider restructuring queries for very large arrays

4. **Empty array behavior**
   - `contains([])` returns all rows (PostgreSQL behavior)
   - `overlaps([])` returns no rows
   - `hasAny` with empty arrays may have unexpected results

For more assistance, consult the PostgreSQL array documentation or file an issue in the pgvibe repository.
