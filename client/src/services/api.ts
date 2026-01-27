import type { 
  Dashboard, 
  Widget, 
  Connection, 
  ApiResponse, 
  QueryResult,
  LayoutItem,
  WidgetType,
  ChartOptions,
  WidgetConfig,
  ConnectionType
} from '../types';

const API_BASE = '/api';

async function request<T>(
  endpoint: string, 
  options?: RequestInit
): Promise<T> {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });
  
  const data: ApiResponse<T> = await response.json();
  
  if (!data.success) {
    throw new Error(data.error || 'An error occurred');
  }
  
  return data.data as T;
}

// Dashboard API
export const dashboardApi = {
  getAll: () => request<Dashboard[]>('/dashboards'),
  
  getById: (id: string) => request<Dashboard & { widgets: Widget[] }>(`/dashboards/${id}`),
  
  create: (data: { name: string; description?: string }) => 
    request<Dashboard>('/dashboards', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  
  update: (id: string, data: { name?: string; description?: string; layout?: LayoutItem[] }) =>
    request<Dashboard>(`/dashboards/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  
  delete: (id: string) =>
    request<{ deleted: boolean }>(`/dashboards/${id}`, {
      method: 'DELETE',
    }),
};

// Widget API
export const widgetApi = {
  create: (data: {
    dashboard_id: string;
    title: string;
    type: WidgetType;
    config?: WidgetConfig;
    connection_id?: string | null;
    query?: string;
    chart_options?: ChartOptions;
  }) => 
    request<Widget>('/widgets', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  
  getById: (id: string) => request<Widget>(`/widgets/${id}`),
  
  update: (id: string, data: Partial<{
    title: string;
    type: WidgetType;
    config: WidgetConfig;
    connection_id: string | null;
    query: string;
    chart_options: ChartOptions;
  }>) =>
    request<Widget>(`/widgets/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  
  delete: (id: string) =>
    request<{ deleted: boolean }>(`/widgets/${id}`, {
      method: 'DELETE',
    }),
  
  execute: (id: string) =>
    request<QueryResult>(`/widgets/${id}/execute`, {
      method: 'POST',
    }),
  
  preview: (data: { connection_id?: string; query?: string; type?: WidgetType }) =>
    request<QueryResult>('/widgets/preview', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
};

// Connection API
export const connectionApi = {
  getAll: () => request<Connection[]>('/connections'),
  
  getById: (id: string) => request<Connection>(`/connections/${id}`),
  
  create: (data: {
    name: string;
    type: ConnectionType;
    host: string;
    port: number;
    database: string;
    username: string;
    password: string;
    ssl?: boolean;
  }) =>
    request<Connection>('/connections', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  
  update: (id: string, data: Partial<{
    name: string;
    host: string;
    port: number;
    database: string;
    username: string;
    password: string;
    ssl: boolean;
  }>) =>
    request<Connection>(`/connections/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  
  delete: (id: string) =>
    request<{ deleted: boolean }>(`/connections/${id}`, {
      method: 'DELETE',
    }),
  
  test: (id: string) =>
    request<{ success: boolean; error?: string }>(`/connections/${id}/test`, {
      method: 'POST',
    }),
  
  testNew: (data: {
    name: string;
    type: ConnectionType;
    host: string;
    port: number;
    database: string;
    username: string;
    password: string;
    ssl?: boolean;
  }) =>
    request<{ success: boolean; error?: string }>('/connections/test', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
};
