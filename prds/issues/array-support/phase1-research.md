# Phase 1.1: Pattern Research & Validation

## JSONB Fluent API Pattern Analysis

Based on deep analysis of the existing codebase, here are the key patterns that will serve as the foundation for array operations:

### 1. Type System Architecture

**Branded Types for Type Safety:**

```typescript
// JSONB uses branded types for compile-time safety
export interface JsonbType<T = any> {
  readonly __jsonbBrand: unique symbol;
  readonly __jsonbValue: T;
}

// Array implementation will follow the same pattern
export interface ArrayType<T extends readonly any[]> {
  readonly __arrayBrand: unique symbol;
  readonly __arrayValue: T;
}
```

**Column Detection Helper Types:**

```typescript
// JSONB pattern for identifying columns
type JsonbColumnOf<DB, TB extends keyof DB> = {
  [K in keyof DB[TB]]: DB[TB][K] extends JsonbType<any> ? K & string : never;
}[keyof DB[TB]];

// Array version will use similar approach
type ArrayColumnOf<DB, TB extends keyof DB> = {
  [K in keyof DB[TB]]: DB[TB][K] extends ArrayType<any> ? K & string : never;
}[keyof DB[TB]];
```

### 2. Fluent API Interface Pattern

**Main Builder Interface:**

- Single entry point with core operations
- Returns `Expression<SqlBool>` for direct use in where clauses
- Supports chaining for complex operations

**Implementation Classes:**

- Separate implementation classes from interfaces
- Constructor takes column reference
- Methods create appropriate AST nodes through factory functions

**Integration Pattern:**

```typescript
// JSONB integration in ExpressionHelpers
export interface ExpressionHelpers<DB, TB extends keyof DB> {
  jsonb: <K extends JsonbColumnOf<DB, TB>>(
    column: K
  ) => JsonbExpressionBuilder<DB, TB, K>;
}

// Array integration will follow same pattern
export interface ExpressionHelpers<DB, TB extends keyof DB> {
  array: <K extends ArrayColumnOf<DB, TB>>(
    column: K
  ) => ArrayExpressionBuilder<DB, TB, K>;
}
```

### 3. AST Node Architecture

**Existing ArrayValueNode:**

```typescript
export interface ArrayValueNode extends ExpressionNode {
  readonly kind: "ArrayValueNode";
  readonly values: unknown[];
  readonly isParameter?: boolean;
}
```

**Pattern for New Nodes:**

- Each operation type gets its own node type
- All nodes extend `ExpressionNode`
- Immutable readonly properties
- Use ExpressionNodeFactory for creation

### 4. Query Compilation Pattern

**PostgreSQL Compiler Integration:**

- Switch statement in `visitNode()` method
- Dedicated visit methods for each node type
- Parameter handling for security
- SQL generation with proper operator precedence

## ArrayValueNode and IN/NOT IN Analysis

### Current Implementation

**ArrayValueNode Usage:**

```typescript
// Used for IN/NOT IN operations in createBinaryExpression
if (Array.isArray(value)) {
  valueNode = ExpressionNodeFactory.createArrayValue(value, true);
}
```

**SQL Compilation:**

```typescript
private visitArrayValue(node: ArrayValueNode): void {
  if (node.isParameter) {
    this.addParameter(node.values);
    this.append("?");
  } else {
    // Direct array literal handling
  }
}
```

**Integration Points:**

- Works seamlessly with existing binary operation nodes
- Parameters are handled securely
- Type safety enforced at TypeScript level

### Key Findings

1. **ArrayValueNode is robust** - Already handles parameterization and security
2. **Binary operation pattern works well** - Can reuse for some array operations
3. **Type safety is comprehensive** - WhereOperator enum includes "in"/"not in"
4. **Compilation is efficient** - No performance concerns

## PostgreSQL Array Operator Semantics

### Core Array Operators

**Containment Operators:**

```sql
-- @> (contains): left array contains right array elements
ARRAY[1,4,3] @> ARRAY[3,1] → true
-- Elements don't need to be in same order
-- Duplicates are handled: ARRAY[1] @> ARRAY[1,1] → true

-- <@ (contained by): left array elements are all in right array
ARRAY[2,2,7] <@ ARRAY[1,7,4,2,6] → true
```

**Overlap Operator:**

```sql
-- && (overlaps): arrays have any elements in common
ARRAY[1,4,3] && ARRAY[2,1] → true
```

**Scalar Operations:**

```sql
-- ANY(): scalar equals any array element
'admin' = ANY(ARRAY['user', 'admin', 'guest']) → true

-- ALL(): scalar equals all array elements
5 = ALL(ARRAY[5, 5, 5]) → true
```

### Edge Cases and Considerations

1. **Null Handling**: Array operators handle NULL elements consistently
2. **Type Coercion**: PostgreSQL handles compatible types (e.g., text vs varchar)
3. **Empty Arrays**: Operations with empty arrays have well-defined behavior
4. **Multidimensional Arrays**: Operators work with multidimensional arrays
5. **Performance**: GIN indexes support array operators for performance

### Operator Precedence and SQL Generation

```sql
-- Parentheses handling for complex expressions
users.tags @> ARRAY['postgresql'] AND users.permissions && ARRAY['read']

-- Parameter binding for security
users.tags @> $1  -- where $1 = ['postgresql', 'nodejs']
```

## Integration Points and Challenges

### Integration Opportunities

1. **Reuse ArrayValueNode** - Existing node handles array values perfectly
2. **Follow JSONB Pattern** - Proven fluent API architecture
3. **Expression System** - Seamless integration with existing expression builder
4. **Type System** - Leverage existing branded type approach

### Technical Challenges

1. **Element Type Extraction** - Need TypeScript magic to extract T from ArrayType<T[]>
2. **Multiple Node Types** - Need different nodes for different operations unlike JSONB's single pattern
3. **Operator Complexity** - ANY/ALL have different syntax than binary operators
4. **Compilation Complexity** - Some operations need special SQL generation

### Risk Mitigation

1. **Incremental Implementation** - Start with @>, <@, && operators (similar to JSONB)
2. **Test Early** - Build comprehensive test suite during development
3. **Type Safety First** - Ensure compile-time errors for invalid operations
4. **Performance Validation** - Benchmark against existing operations

## Validation Summary

✅ **Pattern Validation Complete:**

- JSONB fluent API pattern is robust and proven
- Existing type system provides solid foundation
- AST and compilation patterns are well-established
- ArrayValueNode integration points are clear

✅ **Confidence Level: HIGH**

- Clear path forward identified
- Technical challenges are manageable
- Existing patterns provide strong foundation
- Risk mitigation strategies are in place

**Ready to proceed to Phase 1.2: API Design Validation**
