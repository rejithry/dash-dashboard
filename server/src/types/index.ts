export interface Dashboard {
  id: string;
  name: string;
  description: string;
  layout: LayoutItem[];
  created_at: string;
  updated_at: string;
}

export interface LayoutItem {
  i: string; // widget id
  x: number;
  y: number;
  w: number;
  h: number;
  minW?: number;
  minH?: number;
}

export interface Widget {
  id: string;
  dashboard_id: string;
  title: string;
  type: WidgetType;
  config: WidgetConfig;
  connection_id: string | null;
  query: string;
  chart_options: ChartOptions;
  created_at: string;
  updated_at: string;
}

export type WidgetType = 'line' | 'bar' | 'pie' | 'area' | 'table' | 'stat';

export interface WidgetConfig {
  // Common config
  refreshInterval?: number;
  // Type-specific config stored here
  [key: string]: unknown;
}

export interface ChartOptions {
  title?: string;
  colors?: string[];
  legend?: {
    position: 'top' | 'bottom' | 'left' | 'right' | 'none';
  };
  hAxis?: {
    title?: string;
  };
  vAxis?: {
    title?: string;
  };
  // Google Charts specific options
  [key: string]: unknown;
}

export interface Connection {
  id: string;
  name: string;
  type: ConnectionType;
  host: string;
  port: number;
  database: string;
  username: string;
  password: string;
  ssl: boolean;
  created_at: string;
  updated_at: string;
}

export type ConnectionType = 'postgresql' | 'mysql' | 'sqlite';

export interface QueryResult {
  columns: string[];
  rows: Record<string, unknown>[];
  rowCount: number;
}

// API Request/Response types
export interface CreateDashboardRequest {
  name: string;
  description?: string;
}

export interface UpdateDashboardRequest {
  name?: string;
  description?: string;
  layout?: LayoutItem[];
}

export interface CreateWidgetRequest {
  dashboard_id: string;
  title: string;
  type: WidgetType;
  config?: WidgetConfig;
  connection_id?: string | null;
  query?: string;
  chart_options?: ChartOptions;
}

export interface UpdateWidgetRequest {
  title?: string;
  type?: WidgetType;
  config?: WidgetConfig;
  connection_id?: string | null;
  query?: string;
  chart_options?: ChartOptions;
}

export interface CreateConnectionRequest {
  name: string;
  type: ConnectionType;
  host: string;
  port: number;
  database: string;
  username: string;
  password: string;
  ssl?: boolean;
}

export interface UpdateConnectionRequest {
  name?: string;
  host?: string;
  port?: number;
  database?: string;
  username?: string;
  password?: string;
  ssl?: boolean;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}
