// PostgreSQL database implementation
// Direct PostgreSQL integration without dialect abstraction

import { PostgresDriver } from "./postgres-driver";
import { PostgresQueryCompiler } from "./postgres-query-compiler";
import { PostgresAdapter } from "./postgres-adapter";

/**
 * PostgreSQL database configuration
 */
export interface PostgreSQLConfig {
  connectionString?: string;
  host?: string;
  port?: number;
  database?: string;
  user?: string;
  password?: string;
  ssl?: boolean | object;
  max?: number; // connection pool size
  idleTimeoutMillis?: number;
  connectionTimeoutMillis?: number;
}

/**
 * Direct PostgreSQL implementation
 * No dialect abstraction - optimized for PostgreSQL only
 */
export class PostgreSQL {
  readonly name = "postgres";
  private driver: PostgresDriver | null = null;
  private queryCompiler: PostgresQueryCompiler | null = null;
  private adapter: PostgresAdapter | null = null;

  constructor(private readonly config: PostgreSQLConfig) {}

  /**
   * Get PostgreSQL driver for connection management
   * Returns the same driver instance to ensure connection pooling works correctly
   */
  getDriver(): PostgresDriver {
    if (!this.driver) {
      this.driver = new PostgresDriver(this.config);
    }
    return this.driver;
  }

  /**
   * Get PostgreSQL query compiler for SQL generation
   */
  getQueryCompiler(): PostgresQueryCompiler {
    if (!this.queryCompiler) {
      this.queryCompiler = new PostgresQueryCompiler();
    }
    return this.queryCompiler;
  }

  /**
   * Get PostgreSQL adapter for result transformation
   */
  getAdapter(): PostgresAdapter {
    if (!this.adapter) {
      this.adapter = new PostgresAdapter();
    }
    return this.adapter;
  }
}
