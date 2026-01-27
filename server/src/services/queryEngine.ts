import pg from 'pg';
import mysql from 'mysql2/promise';
import initSqlJs from 'sql.js';
import fs from 'fs';
import type { Connection, QueryResult } from '../types/index.js';

export async function executeQuery(connection: Connection, query: string): Promise<QueryResult> {
  switch (connection.type) {
    case 'postgresql':
      return executePostgresQuery(connection, query);
    case 'mysql':
      return executeMySQLQuery(connection, query);
    case 'sqlite':
      return executeSQLiteQuery(connection, query);
    default:
      throw new Error(`Unsupported connection type: ${connection.type}`);
  }
}

async function executePostgresQuery(connection: Connection, query: string): Promise<QueryResult> {
  const client = new pg.Client({
    host: connection.host,
    port: connection.port,
    database: connection.database,
    user: connection.username,
    password: connection.password,
    ssl: connection.ssl ? { rejectUnauthorized: false } : false
  });

  try {
    await client.connect();
    const result = await client.query(query);
    
    return {
      columns: result.fields.map(f => f.name),
      rows: result.rows as Record<string, unknown>[],
      rowCount: result.rowCount || 0
    };
  } finally {
    await client.end();
  }
}

async function executeMySQLQuery(connection: Connection, query: string): Promise<QueryResult> {
  const conn = await mysql.createConnection({
    host: connection.host,
    port: connection.port,
    database: connection.database,
    user: connection.username,
    password: connection.password,
    ssl: connection.ssl ? {} : undefined
  });

  try {
    const [rows, fields] = await conn.execute(query);
    
    // Handle SELECT queries
    if (Array.isArray(rows) && fields) {
      return {
        columns: (fields as mysql.FieldPacket[]).map(f => f.name),
        rows: rows as Record<string, unknown>[],
        rowCount: rows.length
      };
    }
    
    // Handle non-SELECT queries
    return {
      columns: [],
      rows: [],
      rowCount: (rows as mysql.ResultSetHeader).affectedRows || 0
    };
  } finally {
    await conn.end();
  }
}

async function executeSQLiteQuery(connection: Connection, query: string): Promise<QueryResult> {
  // For SQLite, the database field contains the file path
  const SQL = await initSqlJs();
  
  let db;
  if (fs.existsSync(connection.database)) {
    const buffer = fs.readFileSync(connection.database);
    db = new SQL.Database(buffer);
  } else {
    throw new Error(`SQLite database file not found: ${connection.database}`);
  }
  
  try {
    const stmt = db.prepare(query);
    const columns = stmt.getColumnNames();
    const rows: Record<string, unknown>[] = [];
    
    while (stmt.step()) {
      const values = stmt.get();
      const row: Record<string, unknown> = {};
      columns.forEach((col, i) => {
        row[col] = values[i];
      });
      rows.push(row);
    }
    stmt.free();
    
    return {
      columns,
      rows,
      rowCount: rows.length
    };
  } finally {
    db.close();
  }
}

export async function testConnection(connection: Connection): Promise<{ success: boolean; error?: string }> {
  try {
    switch (connection.type) {
      case 'postgresql': {
        const client = new pg.Client({
          host: connection.host,
          port: connection.port,
          database: connection.database,
          user: connection.username,
          password: connection.password,
          ssl: connection.ssl ? { rejectUnauthorized: false } : false,
          connectionTimeoutMillis: 5000
        });
        await client.connect();
        await client.query('SELECT 1');
        await client.end();
        break;
      }
      case 'mysql': {
        const conn = await mysql.createConnection({
          host: connection.host,
          port: connection.port,
          database: connection.database,
          user: connection.username,
          password: connection.password,
          ssl: connection.ssl ? {} : undefined,
          connectTimeout: 5000
        });
        await conn.execute('SELECT 1');
        await conn.end();
        break;
      }
      case 'sqlite': {
        if (!fs.existsSync(connection.database)) {
          throw new Error(`SQLite database file not found: ${connection.database}`);
        }
        const SQL = await initSqlJs();
        const buffer = fs.readFileSync(connection.database);
        const db = new SQL.Database(buffer);
        db.exec('SELECT 1');
        db.close();
        break;
      }
    }
    return { success: true };
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

// Generate dummy data for testing without real connections
export function generateDummyData(type: string): QueryResult {
  switch (type) {
    case 'line':
    case 'area':
      return {
        columns: ['month', 'sales', 'revenue'],
        rows: [
          { month: 'Jan', sales: 100, revenue: 5000 },
          { month: 'Feb', sales: 120, revenue: 6000 },
          { month: 'Mar', sales: 90, revenue: 4500 },
          { month: 'Apr', sales: 150, revenue: 7500 },
          { month: 'May', sales: 180, revenue: 9000 },
          { month: 'Jun', sales: 160, revenue: 8000 }
        ],
        rowCount: 6
      };
    case 'bar':
      return {
        columns: ['category', 'value'],
        rows: [
          { category: 'Product A', value: 420 },
          { category: 'Product B', value: 380 },
          { category: 'Product C', value: 290 },
          { category: 'Product D', value: 510 },
          { category: 'Product E', value: 350 }
        ],
        rowCount: 5
      };
    case 'pie':
      return {
        columns: ['segment', 'percentage'],
        rows: [
          { segment: 'Desktop', percentage: 45 },
          { segment: 'Mobile', percentage: 35 },
          { segment: 'Tablet', percentage: 15 },
          { segment: 'Other', percentage: 5 }
        ],
        rowCount: 4
      };
    case 'table':
      return {
        columns: ['id', 'name', 'email', 'status'],
        rows: [
          { id: 1, name: 'John Doe', email: 'john@example.com', status: 'Active' },
          { id: 2, name: 'Jane Smith', email: 'jane@example.com', status: 'Pending' },
          { id: 3, name: 'Bob Johnson', email: 'bob@example.com', status: 'Active' },
          { id: 4, name: 'Alice Brown', email: 'alice@example.com', status: 'Inactive' },
          { id: 5, name: 'Charlie Wilson', email: 'charlie@example.com', status: 'Active' }
        ],
        rowCount: 5
      };
    case 'stat':
      return {
        columns: ['value'],
        rows: [{ value: 12847 }],
        rowCount: 1
      };
    default:
      return { columns: [], rows: [], rowCount: 0 };
  }
}
