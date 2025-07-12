import { sql, type Expression } from 'kysely'

/**
 * PostgreSQL array helper functions
 * 
 * Provides type-safe array operations using PostgreSQL's native array operators:
 * - @> (contains)
 * - && (overlaps) 
 * - <@ (contained by)
 * - = ANY (equals any)
 * - array_length, array_dims, etc.
 */

/**
 * PostgreSQL array operations builder
 */
export interface ArrayOperations<T> {
  /**
   * Array contains operation (@>)
   * Checks if array contains all elements of another array
   * 
   * @example
   * ```ts
   * .where(array('tags').contains('typescript'))
   * .where(array('tags').contains(['typescript', 'postgres']))
   * ```
   * 
   * Generates: `tags @> ARRAY['typescript']` or `tags @> ARRAY['typescript', 'postgres']`
   */
  contains(value: T | T[]): Expression<boolean>

  /**
   * Array contains element operation (@>)  
   * Alias for contains() with single element
   * 
   * @example
   * ```ts
   * .where(array('tags').includes('typescript'))
   * ```
   */
  includes(value: T): Expression<boolean>

  /**
   * Array overlaps operation (&&)
   * Checks if arrays have any elements in common
   * 
   * @example
   * ```ts
   * .where(array('tags').overlaps(['typescript', 'javascript']))
   * ```
   * 
   * Generates: `tags && ARRAY['typescript', 'javascript']`
   */
  overlaps(values: T[]): Expression<boolean>

  /**
   * Array contained by operation (<@)
   * Checks if array is contained by another array
   * 
   * @example
   * ```ts
   * .where(array('tags').containedBy(['typescript', 'javascript', 'python']))
   * ```
   * 
   * Generates: `tags <@ ARRAY['typescript', 'javascript', 'python']`
   */
  containedBy(values: T[]): Expression<boolean>

  /**
   * Array length function
   * 
   * @example
   * ```ts
   * .where(array('tags').length(), '>', 3)
   * ```
   * 
   * Generates: `array_length(tags, 1) > 3`
   */
  length(): Expression<number>

  /**
   * Array element equals any (= ANY)
   * 
   * @example
   * ```ts
   * .where('status', '=', array('allowed_statuses').any())
   * ```
   * 
   * Generates: `status = ANY(allowed_statuses)`
   */
  any(): Expression<T>
}

/**
 * Create PostgreSQL array operations for a column
 * 
 * @param column Column name or expression
 * @returns Array operations builder
 * 
 * @example
 * ```ts
 * import { array } from '@pgvibe/kysely'
 * 
 * const results = await db
 *   .selectFrom('products')
 *   .selectAll()
 *   .where(array('tags').includes('featured'))
 *   .where(array('categories').overlaps(['electronics', 'gadgets']))
 *   .execute()
 * ```
 */
export function array<T = string>(column: string): ArrayOperations<T> {
  const columnRef = sql.ref(column)

  return {
    contains: (value: T | T[]) => {
      const arrayValue = Array.isArray(value) ? value : [value]
      if (arrayValue.length === 0) {
        // Empty array - use typed array literal
        return sql<boolean>`${columnRef} @> ARRAY[]::text[]`
      }
      return sql<boolean>`${columnRef} @> ARRAY[${sql.join(arrayValue)}]`
    },

    includes: (value: T) => {
      return sql<boolean>`${columnRef} @> ARRAY[${value}]`
    },

    overlaps: (values: T[]) => {
      return sql<boolean>`${columnRef} && ARRAY[${sql.join(values)}]`
    },

    containedBy: (values: T[]) => {
      return sql<boolean>`${columnRef} <@ ARRAY[${sql.join(values)}]`
    },

    length: () => {
      return sql<number>`array_length(${columnRef}, 1)`
    },

    any: () => {
      return sql<T>`ANY(${columnRef})`
    }
  }
}