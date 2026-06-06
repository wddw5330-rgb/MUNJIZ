/**
 * =========================================================================
 * MUNJIZ (منجز) Enterprise SaaS Platform - Secure Isolated Database Service
 * Developed by ICON CODE Engineering Systems Bureau
 * File: /src/database/database.service.ts
 * =========================================================================
 */

import pg from "pg";
import { requireTenantId } from "../core/tenant-context";
import { DatabaseExecutionError, TenantIsolationError } from "../core/errors";

class DatabaseService {
  private pool: pg.Pool | null = null;

  /**
   * Check if database connection parameters are fully configured in the host environment.
   */
  public isConfigured(): boolean {
    return !!process.env.DATABASE_URL;
  }

  /**
   * Lazy initialization of the database pool to prevent container crashes on cold boot.
   */
  private getPool(): pg.Pool {
    if (!this.pool) {
      const dbUrl = process.env.DATABASE_URL;
      
      // Zero-Trust check: Prevent connection setup if URL credentials are absent.
      if (!dbUrl && process.env.NODE_ENV === "production") {
        throw new DatabaseExecutionError(
          "Critical Systems Failure: Database connection credentials are missing from host environment.",
          "MISSING_DATABASE_CREDENTIALS"
        );
      }

      this.pool = new pg.Pool({
        connectionString: dbUrl || "postgresql://postgres:postgres@localhost:5432/munjiz_dev",
        max: parseInt(process.env.DB_POOL_MAX || "20", 10),
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 5000,
        maxUses: 7500, // Recreate connections periodically to prevent memory bloating
      });

      this.pool.on("error", (err) => {
        console.error("CRITICAL: Unexpected idle client connection failure:", err);
      });
    }
    return this.pool;
  }

  /**
   * Executes a database operational block safely inside a tenant-isolated transaction.
   * Leverages "SET LOCAL" RLS context binding and manages automatic commit/rollback hooks.
   *
   * @param callback - Execution unit block using the transaction client
   * @returns Promise<T>
   */
  public async runInTenantTransaction<T>(
    callback: (client: pg.PoolClient) => Promise<T>
  ): Promise<T> {
    // 1. Zero-Trust Verification: Enforce context presence before leasing sockets
    const tenantId = requireTenantId();

    const pool = this.getPool();
    const client = await pool.connect();

    try {
      // 2. Open isolation blocks & set PostgreSQL transaction scope parameters
      await client.query("BEGIN;");

      // Parameterized connection tuning for Row-Level Security
      // Using SET LOCAL ensures state is automatically cleaned after the transaction boundaries.
      await client.query(`SELECT set_config('app.current_tenant_id', $1, true);`, [tenantId]);

      // Execute custom transactional unit blocks
      const result = await callback(client);

      // Commit changes if execution was flawless
      await client.query("COMMIT;");
      return result;

    } catch (err: any) {
      // Automatic systemic rollback on database failures
      try {
        await client.query("ROLLBACK;");
      } catch (rollbackErr) {
        console.error("Double Fault: Database rollback handshakes collapsed:", rollbackErr);
      }
      
      // Proper structured logs logging details securely (avoid dumping credentials/schema leaks to users)
      console.error(`Database Exception under Tenant Isolation [Tenant: ${tenantId}]:`, err.message);
      
      if (err instanceof TenantIsolationError) {
        throw err;
      }
      
      throw new DatabaseExecutionError(
        `Database Operation aborted: ${err.message}`,
        err.code || "DB_TRANSACTION_FAILED"
      );

    } finally {
      // Always safely release database descriptors back to the connection pool
      client.release();
    }
  }

  /**
   * High-level query execution wrapper. Enforces RLS, initiates transaction block,
   * runs query with parameters, and terminates session settings safely.
   *
   * @param sqlQuery - The parameterized SQL statement
   * @param params - Optional parameter array mapping to $1, $2 references
   * @returns Promise<T[]>
   */
  public async query<T = any>(sqlQuery: string, params: any[] = []): Promise<T[]> {
    return this.runInTenantTransaction<T[]>(async (client) => {
      const response = await client.query(sqlQuery, params);
      return response.rows;
    });
  }

  /**
   * Executes a database operational block bypassing the tenant check context (administrative transaction).
   *
   * @param callback - Execution unit block using the transaction client
   * @returns Promise<T>
   */
  public async runAdminTransaction<T>(
    callback: (client: pg.PoolClient) => Promise<T>
  ): Promise<T> {
    const pool = this.getPool();
    const client = await pool.connect();

    try {
      await client.query("BEGIN;");
      const result = await callback(client);
      await client.query("COMMIT;");
      return result;
    } catch (err: any) {
      try {
        await client.query("ROLLBACK;");
      } catch (rollbackErr) {
        console.error("Double Fault in Admin Transaction rollback:", rollbackErr);
      }
      throw new DatabaseExecutionError(
        `Admin Database Operation aborted: ${err.message}`,
        err.code || "DB_ADMIN_FAILED"
      );
    } finally {
      client.release();
    }
  }

  /**
   * High-level administrative query execution wrapper bypassing tenant RLS setup.
   *
   * @param sqlQuery - The parameterized SQL statement
   * @param params - Optional parameter array mapping to $1, $2 references
   * @returns Promise<T[]>
   */
  public async queryAdmin<T = any>(sqlQuery: string, params: any[] = []): Promise<T[]> {
    return this.runAdminTransaction<T[]>(async (client) => {
      const response = await client.query(sqlQuery, params);
      return response.rows;
    });
  }

  /**
   * Close pool descriptors safely (graceful shutdown hook)
   */
  public async shutdown(): Promise<void> {
    if (this.pool) {
      await this.pool.end();
      this.pool = null;
    }
  }
}

// Export singleton database control instance
export const db = new DatabaseService();
export default db;
