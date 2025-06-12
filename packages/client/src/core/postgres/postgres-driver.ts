// PostgreSQL driver implementation
// Direct PostgreSQL connection management and query execution

import { Pool, type PoolClient, type QueryResult as PgQueryResult } from "pg";
import type { PostgreSQLConfig } from "./postgres-dialect";

/**
 * PostgreSQL compiled query interface
 */
export interface PostgreSQLCompiledQuery<R = unknown> {
  readonly sql: string;
  readonly parameters: ReadonlyArray<unknown>;
  readonly query: any; // AST node reference
}

/**
 * PostgreSQL query result interface
 */
export interface PostgreSQLQueryResult<T = any> {
  readonly rows: T[];
  readonly rowCount: number;
  readonly fields?: Array<{
    name: string;
    dataType: string;
    nullable: boolean;
  }>;
}

/**
 * PostgreSQL database connection interface
 */
export interface PostgreSQLConnection {
  executeQuery<T = any>(
    compiledQuery: PostgreSQLCompiledQuery
  ): Promise<PostgreSQLQueryResult<T>>;
  isValid(): boolean;
  getUnderlyingConnection(): PoolClient;
  release(): void;
}

/**
 * Direct PostgreSQL driver implementation
 * No interface inheritance - optimized for PostgreSQL only
 */
export class PostgresDriver {
  private pool: Pool | null = null;

  constructor(private readonly config: PostgreSQLConfig) {}

  /**
   * Initialize the PostgreSQL driver and connection pool
   */
  async init(): Promise<void> {
    if (this.pool) {
      return; // Already initialized
    }

    // Handle both connection string and individual config options
    let poolConfig: any;

    if (this.config.connectionString) {
      poolConfig = {
        connectionString: this.config.connectionString,
        ssl: this.config.ssl || false,
        max: this.config.max || 10,
        idleTimeoutMillis: this.config.idleTimeoutMillis || 30000,
        connectionTimeoutMillis: this.config.connectionTimeoutMillis || 30000,
      };
    } else {
      poolConfig = {
        host: this.config.host || "localhost",
        port: this.config.port || 5432,
        database: this.config.database || "postgres",
        user: this.config.user || "postgres",
        password: this.config.password || "password",
        ssl: this.config.ssl || false,
        max: this.config.max || 10,
        idleTimeoutMillis: this.config.idleTimeoutMillis || 30000,
        connectionTimeoutMillis: this.config.connectionTimeoutMillis || 30000,
      };
    }

    this.pool = new Pool(poolConfig);

    // Test the connection
    const testConnection = await this.pool.connect();
    testConnection.release();
  }

  /**
   * Acquire a database connection from the pool
   */
  async acquireConnection(): Promise<PostgreSQLConnection> {
    if (!this.pool) {
      throw new Error("Driver not initialized. Call init() first.");
    }

    const client = await this.pool.connect();
    return new PostgresConnection(client);
  }

  /**
   * Release a connection back to the pool
   */
  async releaseConnection(connection: PostgreSQLConnection): Promise<void> {
    connection.release();
  }

  /**
   * Begin a transaction on the given connection
   */
  async beginTransaction(connection: PostgreSQLConnection): Promise<void> {
    const compiledQuery: PostgreSQLCompiledQuery = {
      sql: "BEGIN",
      parameters: [],
      query: {} as any, // We don't have an AST node for this
    };

    await connection.executeQuery(compiledQuery);
  }

  /**
   * Commit a transaction on the given connection
   */
  async commitTransaction(connection: PostgreSQLConnection): Promise<void> {
    const compiledQuery: PostgreSQLCompiledQuery = {
      sql: "COMMIT",
      parameters: [],
      query: {} as any,
    };

    await connection.executeQuery(compiledQuery);
  }

  /**
   * Rollback a transaction on the given connection
   */
  async rollbackTransaction(connection: PostgreSQLConnection): Promise<void> {
    const compiledQuery: PostgreSQLCompiledQuery = {
      sql: "ROLLBACK",
      parameters: [],
      query: {} as any,
    };

    await connection.executeQuery(compiledQuery);
  }

  /**
   * Destroy the driver and clean up resources
   */
  async destroy(): Promise<void> {
    if (this.pool) {
      await this.pool.end();
      this.pool = null;
    }
  }
}

/**
 * PostgreSQL connection wrapper
 */
class PostgresConnection implements PostgreSQLConnection {
  constructor(private readonly client: PoolClient) {}

  /**
   * Execute a compiled query and return results
   */
  async executeQuery<T = any>(
    compiledQuery: PostgreSQLCompiledQuery
  ): Promise<PostgreSQLQueryResult<T>> {
    try {
      const result: PgQueryResult = await this.client.query(
        compiledQuery.sql,
        compiledQuery.parameters as any[]
      );

      return {
        rows: result.rows,
        rowCount: result.rowCount || 0,
        fields: result.fields?.map((field) => ({
          name: field.name,
          dataType: this.mapOidToType(field.dataTypeID),
          nullable: true, // PostgreSQL doesn't provide this info
        })),
      };
    } catch (error) {
      throw error; // Let the adapter handle error transformation
    }
  }

  /**
   * Check if the connection is still valid
   */
  isValid(): boolean {
    // For now, just check if the client exists
    // In a real implementation, you might want to ping the database
    return !!this.client;
  }

  /**
   * Get the underlying PostgreSQL client
   */
  getUnderlyingConnection(): PoolClient {
    return this.client;
  }

  /**
   * Release the connection back to the pool
   */
  release(): void {
    this.client.release();
  }

  /**
   * Map PostgreSQL OID to type name
   */
  private mapOidToType(oid: number): string {
    const typeMap: Record<number, string> = {
      16: "boolean",
      20: "bigint",
      21: "smallint",
      23: "integer",
      25: "text",
      700: "real",
      701: "double precision",
      1043: "varchar",
      1082: "date",
      1114: "timestamp",
      1184: "timestamptz",
      114: "json",
      3802: "jsonb",
    };

    return typeMap[oid] || `unknown(${oid})`;
  }
}
