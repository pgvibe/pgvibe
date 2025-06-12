// PostgreSQL adapter implementation
// Direct PostgreSQL result transformation and error mapping

import type { PostgreSQLQueryResult } from "./postgres-driver";

/**
 * PostgreSQL field information interface
 */
export interface PostgreSQLFieldInfo {
  readonly name: string;
  readonly dataType: string;
  readonly nullable: boolean;
}

/**
 * PostgreSQL database error interface
 */
export interface PostgreSQLDatabaseError extends Error {
  readonly code?: string;
  readonly severity?: string;
  readonly detail?: string;
  readonly hint?: string;
  readonly position?: string;
  readonly where?: string;
  readonly schema?: string;
  readonly table?: string;
  readonly column?: string;
  readonly constraint?: string;
}

/**
 * PostgreSQL type mappings for TypeScript types
 */
export interface PostgreSQLTypeMappings {
  readonly string: readonly string[];
  readonly number: readonly string[];
  readonly boolean: readonly string[];
  readonly date: readonly string[];
  readonly json: readonly string[];
}

/**
 * Direct PostgreSQL adapter for result transformation
 * No interface inheritance - optimized for PostgreSQL only
 */
export class PostgresAdapter {
  /**
   * Transform raw PostgreSQL query results to standardized format
   */
  transformQueryResult<T>(rawResult: any): PostgreSQLQueryResult<T> {
    if (!rawResult) {
      return {
        rows: [],
        rowCount: 0,
        fields: [],
      };
    }

    // Handle pg library result format
    const rows = rawResult.rows || [];
    const rowCount = rawResult.rowCount || rows.length;
    const fields = this.transformFields(rawResult.fields || []);

    return {
      rows,
      rowCount,
      fields,
    };
  }

  /**
   * Transform PostgreSQL field information
   */
  private transformFields(pgFields: any[]): PostgreSQLFieldInfo[] {
    return pgFields.map((field) => ({
      name: field.name || "",
      dataType: this.mapPostgresType(field.dataTypeID),
      nullable: true, // PostgreSQL doesn't provide this in query results
    }));
  }

  /**
   * Map PostgreSQL OID types to readable type names
   */
  private mapPostgresType(oid: number): string {
    const typeMap: Record<number, string> = {
      16: "boolean", // BOOLEAN
      17: "bytea", // BYTEA
      18: "char", // CHAR
      19: "name", // NAME
      20: "bigint", // INT8
      21: "smallint", // INT2
      23: "integer", // INT4
      24: "regproc", // REGPROC
      25: "text", // TEXT
      26: "oid", // OID
      114: "json", // JSON
      142: "xml", // XML
      700: "real", // FLOAT4
      701: "double precision", // FLOAT8
      1043: "varchar", // VARCHAR
      1082: "date", // DATE
      1083: "time", // TIME
      1114: "timestamp", // TIMESTAMP
      1184: "timestamptz", // TIMESTAMPTZ
      3802: "jsonb", // JSONB
    };

    return typeMap[oid] || `unknown(${oid})`;
  }

  /**
   * Transform PostgreSQL errors to standardized format
   */
  transformError(error: any): PostgreSQLDatabaseError {
    if (!error || typeof error !== "object") {
      return new PostgreSQLDatabaseErrorImpl("Unknown database error");
    }

    const dbError = new PostgreSQLDatabaseErrorImpl(
      error.message || "Database error"
    );

    // Map PostgreSQL error properties
    Object.defineProperties(dbError, {
      code: { value: error.code, enumerable: true },
      severity: { value: error.severity, enumerable: true },
      detail: { value: error.detail, enumerable: true },
      hint: { value: error.hint, enumerable: true },
      position: { value: error.position, enumerable: true },
      where: { value: error.where, enumerable: true },
      schema: { value: error.schema, enumerable: true },
      table: { value: error.table, enumerable: true },
      column: { value: error.column, enumerable: true },
      constraint: { value: error.constraint, enumerable: true },
    });

    return dbError;
  }

  /**
   * Get PostgreSQL type mappings for TypeScript types
   */
  getTypeMappings(): PostgreSQLTypeMappings {
    return {
      string: ["text", "varchar", "char", "name", "xml"],
      number: [
        "integer",
        "bigint",
        "smallint",
        "real",
        "double precision",
        "numeric",
        "decimal",
      ],
      boolean: ["boolean"],
      date: ["date", "time", "timestamp", "timestamptz", "interval"],
      json: ["json", "jsonb"],
    };
  }
}

/**
 * Custom DatabaseError class for PostgreSQL
 */
class PostgreSQLDatabaseErrorImpl
  extends Error
  implements PostgreSQLDatabaseError
{
  constructor(message: string) {
    super(message);
    this.name = "PostgreSQLDatabaseError";
  }
}
