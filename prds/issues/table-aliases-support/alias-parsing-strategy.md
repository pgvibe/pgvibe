# Alias Parsing Strategy (Phase 1.2)

## Parsing Approach

### 1. Regex-Based Parser

```typescript
function parseTableExpression(expression: string): {
  table: string;
  alias?: string;
} {
  // Regex to match: "table as alias" (case insensitive, flexible whitespace)
  const aliasRegex =
    /^\s*([a-zA-Z_][a-zA-Z0-9_]*)\s+as\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*$/i;

  const match = expression.match(aliasRegex);
  if (match) {
    return {
      table: match[1],
      alias: match[2],
    };
  }

  // No alias - just table name
  return {
    table: expression.trim(),
  };
}
```

### 2. SQL Identifier Validation

```typescript
function isValidIdentifier(identifier: string): boolean {
  // SQL identifier rules: start with letter/underscore, contain letters/numbers/underscores
  return /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(identifier);
}
```

## Edge Cases Handled

### 1. Case Insensitivity

- `"users AS u"` ✅
- `"users as u"` ✅
- `"users As u"` ✅
- `"USERS AS U"` ✅

### 2. Whitespace Flexibility

- `"users as u"` ✅ (normal spacing)
- `"users    as    u"` ✅ (extra spaces)
- `" users as u "` ✅ (leading/trailing spaces)
- `"users\tas\tu"` ✅ (tabs)

### 3. Valid Identifiers

- `"users as u"` ✅ (simple)
- `"user_profiles as up"` ✅ (underscores)
- `"table1 as t1"` ✅ (numbers)
- `"_internal as i"` ✅ (leading underscore)

### 4. Invalid Cases (Should Fail)

- `"users as 1invalid"` ❌ (alias starts with number)
- `"users as user-profile"` ❌ (hyphens not allowed)
- `"users as"` ❌ (missing alias)
- `"as u"` ❌ (missing table)
- `"users u"` ❌ (missing 'as' keyword)

### 5. Reserved Keywords (PostgreSQL)

Handle reserved words that could conflict:

```typescript
const POSTGRES_RESERVED_WORDS = [
  "select",
  "from",
  "where",
  "and",
  "or",
  "not",
  "in",
  "as",
  "on",
  "join",
  "left",
  "right",
  "inner",
  "outer",
  "group",
  "order",
  "by",
  "having",
  "limit",
  "offset",
  "union",
  "intersect",
  "except",
  "case",
  "when",
  "then",
  "else",
  "end",
  "null",
  "true",
  "false",
  // ... more as needed
];

function validateAliasNotReserved(alias: string): boolean {
  return !POSTGRES_RESERVED_WORDS.includes(alias.toLowerCase());
}
```

## Implementation Strategy

### 1. Integration Point

- **Location**: `packages/client/src/core/builders/select-query-builder.ts`
- **Add Function**: `parseTableExpression()`
- **Usage**: In `createSelectQueryBuilder()` factory

### 2. Error Handling

```typescript
export class AliasParsingError extends Error {
  constructor(expression: string, reason: string) {
    super(`Invalid table alias syntax: "${expression}". ${reason}`);
    this.name = "AliasParsingError";
  }
}
```

### 3. Type Integration

Update type system to handle both formats:

```typescript
// Current
type TableExpression<DB> = keyof DB & string;

// New (Phase 2)
type TableExpression<DB> =
  | (keyof DB & string) // "users"
  | TableWithAlias<DB>; // "users as u"

type TableWithAlias<DB> = `${keyof DB & string} as ${string}`;
```

## Test Cases for TDD

### Basic Parsing Tests

```typescript
describe("parseTableExpression", () => {
  test("should parse simple alias", () => {
    expect(parseTableExpression("users as u")).toEqual({
      table: "users",
      alias: "u",
    });
  });

  test("should handle no alias", () => {
    expect(parseTableExpression("users")).toEqual({
      table: "users",
    });
  });

  test("should handle case insensitive AS", () => {
    expect(parseTableExpression("Users AS U")).toEqual({
      table: "Users",
      alias: "U",
    });
  });

  test("should handle flexible whitespace", () => {
    expect(parseTableExpression("  users   as   u  ")).toEqual({
      table: "users",
      alias: "u",
    });
  });
});
```

### Error Cases Tests

```typescript
describe("parseTableExpression errors", () => {
  test("should reject invalid alias starting with number", () => {
    expect(() => parseTableExpression("users as 1invalid")).toThrow(
      "Invalid table alias syntax"
    );
  });

  test("should reject missing alias", () => {
    expect(() => parseTableExpression("users as")).toThrow(
      "Invalid table alias syntax"
    );
  });

  test("should reject reserved word aliases", () => {
    expect(() => parseTableExpression("users as select")).toThrow(
      "Invalid table alias syntax"
    );
  });
});
```

## Performance Considerations

### 1. Regex Compilation

- Pre-compile regex patterns for better performance
- Cache parsing results if needed

### 2. Validation Caching

- Cache reserved word lookups
- Minimal overhead for non-alias table expressions

## Future Extensibility

### 1. Schema Qualification

Future support for: `"schema.table as alias"`

```typescript
type SchemaQualifiedTable = `${string}.${string} as ${string}`;
```

### 2. Complex Aliases

Future support for quoted identifiers: `"users as "User Data""`

This strategy provides a robust foundation for alias parsing while handling edge cases and maintaining extensibility.
