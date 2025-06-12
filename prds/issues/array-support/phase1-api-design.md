# Phase 1.2: API Design Validation

## Array Expression Builder Interface Design

Based on the JSONB pattern analysis, here's the complete API design for array operations:

### Core Type System

```typescript
/**
 * PostgreSQL array type representation (branded type for compile-time safety)
 */
export interface ArrayType<T extends readonly any[]> {
  readonly __arrayBrand: unique symbol;
  readonly __arrayValue: T;
}

/**
 * Extract element type from array type
 * Example: ArrayElementType<ArrayType<string[]>> = string
 */
export type ArrayElementType<T> = T extends ArrayType<infer U>
  ? U extends readonly (infer E)[]
    ? E
    : never
  : never;

/**
 * Helper type to identify array columns in database schema
 */
export type ArrayColumnOf<DB, TB extends keyof DB> = {
  [K in keyof DB[TB]]: DB[TB][K] extends ArrayType<any> ? K & string : never;
}[keyof DB[TB]];
```

### Main Array Expression Builder Interface

```typescript
/**
 * Main array expression builder interface
 * Provides type-safe access to PostgreSQL array operations through fluent API
 */
export interface ArrayExpressionBuilder<
  DB,
  TB extends keyof DB,
  K extends ArrayColumnOf<DB, TB>
> {
  /**
   * Check if array contains all specified values
   * SQL: column @> ARRAY[value1, value2, ...]
   *
   * @param values - Array of values to check for containment
   * @returns Expression that evaluates to boolean
   */
  contains(values: ArrayElementType<DB[TB][K]>[]): Expression<SqlBool>;

  /**
   * Check if array is contained by specified values
   * SQL: column <@ ARRAY[value1, value2, ...]
   *
   * @param values - Array of values that should contain the column
   * @returns Expression that evaluates to boolean
   */
  isContainedBy(values: ArrayElementType<DB[TB][K]>[]): Expression<SqlBool>;

  /**
   * Check if arrays have overlapping elements
   * SQL: column && ARRAY[value1, value2, ...]
   *
   * @param values - Array of values to check for overlap
   * @returns Expression that evaluates to boolean
   */
  overlaps(values: ArrayElementType<DB[TB][K]>[]): Expression<SqlBool>;

  /**
   * Check if scalar value equals any array element
   * SQL: value = ANY(column)
   *
   * @param value - Scalar value to check against array elements
   * @returns Expression that evaluates to boolean
   */
  hasAny(value: ArrayElementType<DB[TB][K]>): Expression<SqlBool>;

  /**
   * Check if scalar value equals all array elements
   * SQL: value = ALL(column)
   *
   * @param value - Scalar value to check against all array elements
   * @returns Expression that evaluates to boolean
   */
  hasAll(value: ArrayElementType<DB[TB][K]>): Expression<SqlBool>;
}
```

### Integration with Expression Helpers

```typescript
/**
 * Updated ExpressionHelpers interface with array support
 */
export interface ExpressionHelpers<DB, TB extends keyof DB> {
  // ... existing properties (eb, and, or, not, jsonb)

  /**
   * Create PostgreSQL array operations with fluent API
   *
   * Examples:
   * - array("tags").contains(["postgresql", "nodejs"])     → tags @> ARRAY['postgresql', 'nodejs']
   * - array("permissions").hasAny("admin")                 → 'admin' = ANY(permissions)
   * - array("categories").overlaps(["tech", "programming"]) → categories && ARRAY['tech', 'programming']
   */
  array: <K extends ArrayColumnOf<DB, TB>>(
    column: K
  ) => ArrayExpressionBuilder<DB, TB, K>;
}
```

## Usage Examples with Expected SQL Output

### Example 1: Basic Containment Operations

```typescript
// Database schema
interface Database {
  users: {
    id: number;
    name: string;
    tags: ArrayType<string[]>;
    permissions: ArrayType<string[]>;
    scores: ArrayType<number[]>;
  };
}

// Usage: Find users with specific tags
db.selectFrom("users")
  .where(({ array }) => array("tags").contains(["postgresql", "nodejs"]))
  .selectAll()
  .execute();

// Expected SQL:
// SELECT * FROM users WHERE tags @> ARRAY['postgresql', 'nodejs']
// Parameters: ['postgresql', 'nodejs']
```

### Example 2: Overlap and Containment

```typescript
// Find users whose permissions overlap with required permissions
db.selectFrom("users")
  .where(({ array }) => array("permissions").overlaps(["read", "write"]))
  .selectAll()
  .execute();

// Expected SQL:
// SELECT * FROM users WHERE permissions && ARRAY['read', 'write']
// Parameters: ['read', 'write']

// Find users whose tags are contained by a larger set
db.selectFrom("users")
  .where(({ array }) =>
    array("tags").isContainedBy(["frontend", "backend", "database", "mobile"])
  )
  .selectAll()
  .execute();

// Expected SQL:
// SELECT * FROM users WHERE tags <@ ARRAY['frontend', 'backend', 'database', 'mobile']
// Parameters: ['frontend', 'backend', 'database', 'mobile']
```

### Example 3: Scalar Operations

```typescript
// Find users with admin permission
db.selectFrom("users")
  .where(({ array }) => array("permissions").hasAny("admin"))
  .selectAll()
  .execute();

// Expected SQL:
// SELECT * FROM users WHERE 'admin' = ANY(permissions)
// Parameters: ['admin']

// Find users where all scores are perfect (100)
db.selectFrom("users")
  .where(({ array }) => array("scores").hasAll(100))
  .selectAll()
  .execute();

// Expected SQL:
// SELECT * FROM users WHERE 100 = ALL(scores)
// Parameters: [100]
```

### Example 4: Complex Logical Operations

```typescript
// Combine array operations with logical operators
db.selectFrom("users")
  .where(({ array, and, or }) =>
    and([
      array("tags").contains(["postgresql"]),
      or([
        array("permissions").hasAny("admin"),
        array("permissions").hasAny("write"),
      ]),
    ])
  )
  .selectAll()
  .execute();

// Expected SQL:
// SELECT * FROM users
// WHERE (tags @> ARRAY['postgresql'])
//   AND (('admin' = ANY(permissions)) OR ('write' = ANY(permissions)))
// Parameters: ['postgresql', 'admin', 'write']
```

### Example 5: Type Safety Validation

```typescript
// ✅ Valid: string array with string values
db.selectFrom("users").where(({ array }) =>
  array("tags").contains(["valid", "strings"])
);

// ✅ Valid: number array with number values
db.selectFrom("users").where(({ array }) => array("scores").hasAny(100));

// ❌ Compile-time Error: type mismatch
db.selectFrom("users").where(({ array }) => array("tags").contains([123, 456])); // Error: number[] not assignable to string[]

// ❌ Compile-time Error: wrong column type
db.selectFrom("users").where(({ array }) => array("name").contains(["test"])); // Error: 'name' is not an array column
```

## AST Node Design

### Array Operation Nodes

```typescript
/**
 * Array containment operation node (@>, <@)
 */
export interface ArrayContainmentNode extends ExpressionNode {
  readonly kind: "ArrayContainmentNode";
  readonly column: ReferenceNode;
  readonly operator: "@>" | "<@";
  readonly values: ArrayValueNode;
}

/**
 * Array overlap operation node (&&)
 */
export interface ArrayOverlapNode extends ExpressionNode {
  readonly kind: "ArrayOverlapNode";
  readonly column: ReferenceNode;
  readonly values: ArrayValueNode;
}

/**
 * Array ANY/ALL operation node
 */
export interface ArrayScalarNode extends ExpressionNode {
  readonly kind: "ArrayScalarNode";
  readonly value: ValueNode;
  readonly operator: "ANY" | "ALL";
  readonly column: ReferenceNode;
}
```

### Node Factory Extensions

```typescript
/**
 * Extended ExpressionNodeFactory with array operations
 */
export class ExpressionNodeFactory {
  // ... existing methods

  static createArrayContainment(
    column: ReferenceNode,
    operator: "@>" | "<@",
    values: unknown[]
  ): ArrayContainmentNode {
    return freeze({
      kind: "ArrayContainmentNode" as const,
      column,
      operator,
      values: this.createArrayValue(values, true),
    });
  }

  static createArrayOverlap(
    column: ReferenceNode,
    values: unknown[]
  ): ArrayOverlapNode {
    return freeze({
      kind: "ArrayOverlapNode" as const,
      column,
      values: this.createArrayValue(values, true),
    });
  }

  static createArrayScalar(
    value: unknown,
    operator: "ANY" | "ALL",
    column: ReferenceNode
  ): ArrayScalarNode {
    return freeze({
      kind: "ArrayScalarNode" as const,
      value: this.createValue(value, true),
      operator,
      column,
    });
  }
}
```

## Implementation Strategy

### Phase 2.1: Type System Foundation

```typescript
// File: packages/client/src/core/types/array.ts
export interface ArrayType<T extends readonly any[]> {
  readonly __arrayBrand: unique symbol;
  readonly __arrayValue: T;
}

export type ArrayElementType<T> = /* implementation */;
export type ArrayColumnOf<DB, TB extends keyof DB> = /* implementation */;
```

### Phase 2.2: AST Nodes

```typescript
// File: packages/client/src/core/ast/array-nodes.ts
export interface ArrayContainmentNode extends ExpressionNode {
  /* implementation */
}
export interface ArrayOverlapNode extends ExpressionNode {
  /* implementation */
}
export interface ArrayScalarNode extends ExpressionNode {
  /* implementation */
}
```

### Phase 2.3: Expression Builder

```typescript
// File: packages/client/src/core/builders/array-expression-builder.ts
export class ArrayExpressionBuilderImpl<DB, TB, K>
  implements ArrayExpressionBuilder<DB, TB, K> {
  /* implementation */
}
```

## Validation Against JSONB Pattern

### ✅ Consistency Validation

1. **Type System**: Follows same branded type pattern as JsonbType
2. **Interface Structure**: Similar to JsonbExpressionBuilder with clear operation methods
3. **Integration**: Same pattern for ExpressionHelpers integration
4. **AST Nodes**: Follow same immutable, factory-created pattern
5. **Implementation**: Separate interface from implementation class

### ✅ API Usability Validation

1. **Intuitive Naming**:

   - `contains()` maps to `@>` (clear semantic meaning)
   - `isContainedBy()` maps to `<@` (clear semantic meaning)
   - `overlaps()` maps to `&&` (clear semantic meaning)
   - `hasAny()` maps to `ANY()` (clear semantic meaning)
   - `hasAll()` maps to `ALL()` (clear semantic meaning)

2. **Type Safety**: All operations are type-safe at compile time
3. **Discoverability**: Methods are available through IntelliSense
4. **Consistency**: Follows established patterns from JSONB API

### ✅ Technical Validation

1. **Performance**: Reuses existing ArrayValueNode (no new overhead)
2. **Security**: All values are parameterized
3. **Flexibility**: Supports all major PostgreSQL array operations
4. **Extensibility**: Can easily add more operations in future

## API Design Summary

✅ **Design Validation Complete:**

- API is intuitive and follows proven JSONB patterns
- Type safety is comprehensive and enforced at compile time
- All major PostgreSQL array operations are supported
- SQL generation is clear and efficient
- Integration pattern is consistent with existing code

✅ **Confidence Level: HIGH**

- API design feels natural and discoverable
- Type system provides excellent developer experience
- Clear path from design to implementation
- Strong foundation for future enhancements

**Ready to proceed to Phase 2: Core Implementation**
