import { v4 as uuidv4 } from 'uuid';
import { getDatabase, saveDatabase } from '../db/schema.js';
import type { Connection, ConnectionType, CreateConnectionRequest, UpdateConnectionRequest } from '../types/index.js';

interface ConnectionRow {
  id: string;
  name: string;
  type: string;
  host: string;
  port: number;
  database_name: string;
  username: string;
  password: string;
  ssl: number;
  created_at: string;
  updated_at: string;
}

function rowToConnection(row: ConnectionRow): Connection {
  return {
    id: row.id,
    name: row.name,
    type: row.type as ConnectionType,
    host: row.host,
    port: row.port,
    database: row.database_name,
    username: row.username,
    password: row.password,
    ssl: row.ssl === 1,
    created_at: row.created_at,
    updated_at: row.updated_at
  };
}

export function getAllConnections(): Connection[] {
  const db = getDatabase();
  const stmt = db.prepare('SELECT * FROM connections ORDER BY name');
  
  const results: Connection[] = [];
  while (stmt.step()) {
    const row = stmt.getAsObject() as unknown as ConnectionRow;
    results.push(rowToConnection(row));
  }
  stmt.free();
  
  return results;
}

export function getConnectionById(id: string): Connection | null {
  const db = getDatabase();
  const stmt = db.prepare('SELECT * FROM connections WHERE id = ?');
  stmt.bind([id]);
  
  if (stmt.step()) {
    const row = stmt.getAsObject() as unknown as ConnectionRow;
    stmt.free();
    return rowToConnection(row);
  }
  
  stmt.free();
  return null;
}

export function createConnection(data: CreateConnectionRequest): Connection {
  const db = getDatabase();
  const id = uuidv4();
  const now = new Date().toISOString();
  
  db.run(
    `INSERT INTO connections (id, name, type, host, port, database_name, username, password, ssl, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      data.name,
      data.type,
      data.host,
      data.port,
      data.database,
      data.username,
      data.password,
      data.ssl ? 1 : 0,
      now,
      now
    ]
  );
  
  saveDatabase();
  
  return {
    id,
    name: data.name,
    type: data.type,
    host: data.host,
    port: data.port,
    database: data.database,
    username: data.username,
    password: data.password,
    ssl: data.ssl || false,
    created_at: now,
    updated_at: now
  };
}

export function updateConnection(id: string, data: UpdateConnectionRequest): Connection | null {
  const existing = getConnectionById(id);
  if (!existing) return null;
  
  const db = getDatabase();
  const now = new Date().toISOString();
  
  const name = data.name ?? existing.name;
  const host = data.host ?? existing.host;
  const port = data.port ?? existing.port;
  const database = data.database ?? existing.database;
  const username = data.username ?? existing.username;
  const password = data.password ?? existing.password;
  const ssl = data.ssl ?? existing.ssl;
  
  db.run(
    `UPDATE connections 
     SET name = ?, host = ?, port = ?, database_name = ?, username = ?, password = ?, ssl = ?, updated_at = ?
     WHERE id = ?`,
    [name, host, port, database, username, password, ssl ? 1 : 0, now, id]
  );
  
  saveDatabase();
  
  return {
    ...existing,
    name,
    host,
    port,
    database,
    username,
    password,
    ssl,
    updated_at: now
  };
}

export function deleteConnection(id: string): boolean {
  const db = getDatabase();
  db.run('DELETE FROM connections WHERE id = ?', [id]);
  saveDatabase();
  
  const changes = db.getRowsModified();
  return changes > 0;
}
