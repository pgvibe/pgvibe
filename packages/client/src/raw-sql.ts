/**
 * Raw SQL Template Literal Implementation
 * Provides a `sql` template tag for complex expressions
 */

import type { RawBuilder } from "./core/shared-types";

/**
 * Template literal tag for raw SQL expressions
 *
 * Usage:
 * ```typescript
 * const condition = sql`user_id = ${userId} AND status = ${status}`;
 * const query = db.selectFrom("users").where(condition);
 * ```
 */
export function sql(
  strings: TemplateStringsArray,
  ...values: unknown[]
): RawBuilder {
  let sqlString = "";
  const parameters: unknown[] = [];

  for (let i = 0; i < strings.length; i++) {
    sqlString += strings[i];

    if (i < values.length) {
      // Add parameter placeholder
      sqlString += `$${parameters.length + 1}`;
      parameters.push(values[i]);
    }
  }

  return {
    sql: sqlString,
    parameters: Object.freeze(parameters),
  };
}

/**
 * Create a raw SQL expression without parameters
 *
 * Usage:
 * ```typescript
 * const rawExpr = raw("CURRENT_TIMESTAMP");
 * ```
 */
export function raw(sqlString: string): RawBuilder {
  return {
    sql: sqlString,
    parameters: Object.freeze([]),
  };
}
