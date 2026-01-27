import { v4 as uuidv4 } from 'uuid';
import { getDatabase, saveDatabase } from '../db/schema.js';
import type { Widget, CreateWidgetRequest, UpdateWidgetRequest, WidgetConfig, ChartOptions, WidgetType } from '../types/index.js';

interface WidgetRow {
  id: string;
  dashboard_id: string;
  title: string;
  type: string;
  config: string;
  connection_id: string | null;
  query: string;
  chart_options: string;
  created_at: string;
  updated_at: string;
}

function rowToWidget(row: WidgetRow): Widget {
  return {
    id: row.id,
    dashboard_id: row.dashboard_id,
    title: row.title,
    type: row.type as WidgetType,
    config: JSON.parse(row.config) as WidgetConfig,
    connection_id: row.connection_id,
    query: row.query,
    chart_options: JSON.parse(row.chart_options) as ChartOptions,
    created_at: row.created_at,
    updated_at: row.updated_at
  };
}

export function getWidgetsByDashboard(dashboardId: string): Widget[] {
  const db = getDatabase();
  const stmt = db.prepare('SELECT * FROM widgets WHERE dashboard_id = ?');
  stmt.bind([dashboardId]);
  
  const results: Widget[] = [];
  while (stmt.step()) {
    const row = stmt.getAsObject() as WidgetRow;
    results.push(rowToWidget(row));
  }
  stmt.free();
  
  return results;
}

export function getWidgetById(id: string): Widget | null {
  const db = getDatabase();
  const stmt = db.prepare('SELECT * FROM widgets WHERE id = ?');
  stmt.bind([id]);
  
  if (stmt.step()) {
    const row = stmt.getAsObject() as WidgetRow;
    stmt.free();
    return rowToWidget(row);
  }
  
  stmt.free();
  return null;
}

export function createWidget(data: CreateWidgetRequest): Widget {
  const db = getDatabase();
  const id = uuidv4();
  const now = new Date().toISOString();
  
  const config = data.config || {};
  const chartOptions = data.chart_options || {};
  
  db.run(
    `INSERT INTO widgets (id, dashboard_id, title, type, config, connection_id, query, chart_options, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      data.dashboard_id,
      data.title,
      data.type,
      JSON.stringify(config),
      data.connection_id || null,
      data.query || '',
      JSON.stringify(chartOptions),
      now,
      now
    ]
  );
  
  saveDatabase();
  
  return {
    id,
    dashboard_id: data.dashboard_id,
    title: data.title,
    type: data.type,
    config,
    connection_id: data.connection_id || null,
    query: data.query || '',
    chart_options: chartOptions,
    created_at: now,
    updated_at: now
  };
}

export function updateWidget(id: string, data: UpdateWidgetRequest): Widget | null {
  const existing = getWidgetById(id);
  if (!existing) return null;
  
  const db = getDatabase();
  const now = new Date().toISOString();
  
  const title = data.title ?? existing.title;
  const type = data.type ?? existing.type;
  const config = data.config ?? existing.config;
  const connectionId = data.connection_id !== undefined ? data.connection_id : existing.connection_id;
  const query = data.query ?? existing.query;
  const chartOptions = data.chart_options ?? existing.chart_options;
  
  db.run(
    `UPDATE widgets 
     SET title = ?, type = ?, config = ?, connection_id = ?, query = ?, chart_options = ?, updated_at = ?
     WHERE id = ?`,
    [
      title,
      type,
      JSON.stringify(config),
      connectionId,
      query,
      JSON.stringify(chartOptions),
      now,
      id
    ]
  );
  
  saveDatabase();
  
  return {
    ...existing,
    title,
    type,
    config,
    connection_id: connectionId,
    query,
    chart_options: chartOptions,
    updated_at: now
  };
}

export function deleteWidget(id: string): boolean {
  const db = getDatabase();
  db.run('DELETE FROM widgets WHERE id = ?', [id]);
  saveDatabase();
  
  const changes = db.getRowsModified();
  return changes > 0;
}
