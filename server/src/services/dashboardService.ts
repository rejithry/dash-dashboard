import { v4 as uuidv4 } from 'uuid';
import { getDatabase, saveDatabase } from '../db/schema.js';
import type { Dashboard, LayoutItem, CreateDashboardRequest, UpdateDashboardRequest } from '../types/index.js';

export function getAllDashboards(): Dashboard[] {
  const db = getDatabase();
  const stmt = db.prepare('SELECT * FROM dashboards ORDER BY updated_at DESC');
  const results: Dashboard[] = [];
  
  while (stmt.step()) {
    const row = stmt.getAsObject() as {
      id: string;
      name: string;
      description: string;
      layout: string;
      created_at: string;
      updated_at: string;
    };
    results.push({
      ...row,
      layout: JSON.parse(row.layout) as LayoutItem[]
    });
  }
  stmt.free();
  
  return results;
}

export function getDashboardById(id: string): Dashboard | null {
  const db = getDatabase();
  const stmt = db.prepare('SELECT * FROM dashboards WHERE id = ?');
  stmt.bind([id]);
  
  if (stmt.step()) {
    const row = stmt.getAsObject() as {
      id: string;
      name: string;
      description: string;
      layout: string;
      created_at: string;
      updated_at: string;
    };
    stmt.free();
    return {
      ...row,
      layout: JSON.parse(row.layout) as LayoutItem[]
    };
  }
  
  stmt.free();
  return null;
}

export function createDashboard(data: CreateDashboardRequest): Dashboard {
  const db = getDatabase();
  const id = uuidv4();
  const now = new Date().toISOString();
  
  db.run(
    'INSERT INTO dashboards (id, name, description, layout, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)',
    [id, data.name, data.description || '', '[]', now, now]
  );
  
  saveDatabase();
  
  return {
    id,
    name: data.name,
    description: data.description || '',
    layout: [],
    created_at: now,
    updated_at: now
  };
}

export function updateDashboard(id: string, data: UpdateDashboardRequest): Dashboard | null {
  const existing = getDashboardById(id);
  
  if (!existing) {
    return null;
  }
  
  const db = getDatabase();
  const now = new Date().toISOString();
  const name = data.name ?? existing.name;
  const description = data.description ?? existing.description;
  const layout = data.layout ?? existing.layout;
  
  db.run(
    'UPDATE dashboards SET name = ?, description = ?, layout = ?, updated_at = ? WHERE id = ?',
    [name, description, JSON.stringify(layout), now, id]
  );
  
  saveDatabase();
  
  return {
    ...existing,
    name,
    description,
    layout,
    updated_at: now
  };
}

export function deleteDashboard(id: string): boolean {
  const db = getDatabase();
  
  // First delete all widgets belonging to this dashboard
  db.run('DELETE FROM widgets WHERE dashboard_id = ?', [id]);
  
  // Then delete the dashboard
  db.run('DELETE FROM dashboards WHERE id = ?', [id]);
  
  saveDatabase();
  
  // Check if anything was deleted
  const changes = db.getRowsModified();
  return changes > 0;
}
