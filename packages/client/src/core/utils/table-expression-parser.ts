/**
 * Table expression parsing utilities for handling table aliases
 */

/**
 * Parsed table expression result
 */
export interface ParsedTableExpression {
  table: string;
  alias?: string;
}

/**
 * Error thrown when alias parsing fails
 */
export class AliasParsingError extends Error {
  constructor(expression: string, reason: string) {
    super(`Invalid table alias syntax: "${expression}". ${reason}`);
    this.name = "AliasParsingError";
  }
}

/**
 * PostgreSQL reserved words that cannot be used as aliases
 */
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
  "distinct",
  "exists",
  "between",
  "like",
  "ilike",
  "similar",
  "is",
  "all",
  "any",
  "some",
  "asc",
  "desc",
];

/**
 * Check if an identifier is a valid SQL identifier
 */
function isValidIdentifier(identifier: string): boolean {
  // SQL identifier rules: start with letter/underscore, contain letters/numbers/underscores
  return /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(identifier);
}

/**
 * Check if an alias conflicts with PostgreSQL reserved words
 */
function validateAliasNotReserved(alias: string): boolean {
  return !POSTGRES_RESERVED_WORDS.includes(alias.toLowerCase());
}

/**
 * Parse a table expression that may contain an alias
 *
 * Supports formats:
 * - "table" (no alias)
 * - "table as alias" (with alias)
 * - "table AS alias" (case insensitive)
 * - "  table   as   alias  " (flexible whitespace)
 *
 * @param expression - Table expression string
 * @returns Parsed table and optional alias
 * @throws AliasParsingError if syntax is invalid
 */
export function parseTableExpression(
  expression: string
): ParsedTableExpression {
  // Remove leading/trailing whitespace
  const trimmed = expression.trim();

  if (!trimmed) {
    throw new AliasParsingError(expression, "Table expression cannot be empty");
  }

  // Regex to match: "table as alias" (case insensitive, flexible whitespace)
  const aliasRegex =
    /^\s*([a-zA-Z_][a-zA-Z0-9_]*)\s+as\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*$/i;

  const match = trimmed.match(aliasRegex);
  if (match && match[1] && match[2]) {
    const table = match[1];
    const alias = match[2];

    // Validate table name
    if (!isValidIdentifier(table)) {
      throw new AliasParsingError(expression, `Invalid table name "${table}"`);
    }

    // Validate alias
    if (!isValidIdentifier(alias)) {
      throw new AliasParsingError(expression, `Invalid alias "${alias}"`);
    }

    // Check if alias is a reserved word
    if (!validateAliasNotReserved(alias)) {
      throw new AliasParsingError(
        expression,
        `Alias "${alias}" is a reserved SQL keyword`
      );
    }

    return {
      table,
      alias,
    };
  }

  // No alias - just table name
  if (!isValidIdentifier(trimmed)) {
    throw new AliasParsingError(expression, `Invalid table name "${trimmed}"`);
  }

  return {
    table: trimmed,
  };
}
