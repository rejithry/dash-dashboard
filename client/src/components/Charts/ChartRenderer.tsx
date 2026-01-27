import { Chart } from 'react-google-charts';
import type { WidgetType, QueryResult, ChartOptions } from '../../types';
import { useTheme } from '../../context/ThemeContext';

interface ChartRendererProps {
  type: WidgetType;
  data: QueryResult;
  options: ChartOptions;
}

// Regex patterns to detect date/timestamp strings
const datePatterns = [
  /^\d{4}-\d{2}-\d{2}$/, // YYYY-MM-DD
  /^\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}:\d{2}/, // YYYY-MM-DD HH:MM:SS or YYYY-MM-DDTHH:MM:SS
  /^\d{4}\/\d{2}\/\d{2}/, // YYYY/MM/DD
  /^\d{2}\/\d{2}\/\d{4}/, // MM/DD/YYYY
];

// Check if a value looks like a date/timestamp string
function isDateString(value: unknown): boolean {
  if (typeof value !== 'string') return false;
  return datePatterns.some(pattern => pattern.test(value));
}

// Parse a date string to a Date object
function parseDate(value: string): Date {
  // Handle MySQL datetime format: "2026-01-27 00:17:27"
  const date = new Date(value.replace(' ', 'T'));
  return date;
}

// Determine column type based on first row values
function getColumnType(value: unknown): 'date' | 'datetime' | 'number' | 'string' {
  if (typeof value === 'number') return 'number';
  if (isDateString(value)) return 'datetime';
  return 'string';
}

// Transform data for charts - with proper column types for Google Charts
function transformChartData(data: QueryResult): (
  | { type: string; label: string }
  | string 
  | number 
  | Date 
  | null
)[][] {
  if (data.rows.length === 0) {
    return [data.columns];
  }

  // Analyze first row to determine column types
  const firstRow = data.rows[0];
  const columnTypes: ('date' | 'datetime' | 'number' | 'string')[] = data.columns.map(col => 
    getColumnType(firstRow[col])
  );

  // Create header row with column type specifications
  const headerRow = data.columns.map((col, i) => ({
    type: columnTypes[i],
    label: col
  }));

  // Transform data rows
  const dataRows = data.rows.map(row => 
    data.columns.map((col, i) => {
      const value = row[col];
      const colType = columnTypes[i];
      
      if (colType === 'datetime' || colType === 'date') {
        if (typeof value === 'string') {
          return parseDate(value);
        }
      }
      
      return value as string | number | null;
    })
  );

  return [headerRow, ...dataRows];
}

// Simple transform without type detection (for pie charts, etc.)
function transformSimpleData(data: QueryResult): (string | number | null)[][] {
  return [
    data.columns,
    ...data.rows.map(row => data.columns.map(col => row[col] as string | number | null))
  ];
}

export default function ChartRenderer({ type, data, options }: ChartRendererProps) {
  const { theme } = useTheme();
  
  const baseOptions = {
    backgroundColor: 'transparent',
    chartArea: { width: '85%', height: '75%' },
    legend: { 
      position: options.legend?.position || 'bottom',
      textStyle: { 
        color: theme === 'dark' ? '#94a3b8' : '#64748b',
        fontSize: 12 
      }
    },
    titleTextStyle: {
      color: theme === 'dark' ? '#f1f5f9' : '#1e293b',
      fontSize: 14,
      bold: true
    },
    hAxis: {
      title: options.hAxis?.title,
      textStyle: { color: theme === 'dark' ? '#94a3b8' : '#64748b' },
      titleTextStyle: { color: theme === 'dark' ? '#94a3b8' : '#64748b' },
      gridlines: { color: theme === 'dark' ? '#334155' : '#e2e8f0' },
      format: 'MMM d, HH:mm',
    },
    vAxis: {
      title: options.vAxis?.title,
      textStyle: { color: theme === 'dark' ? '#94a3b8' : '#64748b' },
      titleTextStyle: { color: theme === 'dark' ? '#94a3b8' : '#64748b' },
      gridlines: { color: theme === 'dark' ? '#334155' : '#e2e8f0' }
    },
    colors: options.colors || ['#22c55e', '#d946ef', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6'],
    fontName: 'DM Sans',
    ...options
  };

  if (data.rows.length === 0) {
    return (
      <div className="h-full flex items-center justify-center text-slate-400 text-sm">
        No data available
      </div>
    );
  }

  switch (type) {
    case 'line':
      return <LineChart data={data} options={baseOptions} />;
    case 'bar':
      return <BarChart data={data} options={baseOptions} />;
    case 'pie':
      return <PieChart data={data} options={baseOptions} />;
    case 'area':
      return <AreaChart data={data} options={baseOptions} />;
    case 'table':
      return <TableView data={data} />;
    case 'stat':
      return <StatCard data={data} options={options} />;
    default:
      return <div>Unknown chart type</div>;
  }
}

function LineChart({ data, options }: { data: QueryResult; options: Record<string, unknown> }) {
  const chartData = transformChartData(data);

  return (
    <Chart
      chartType="LineChart"
      width="100%"
      height="100%"
      data={chartData}
      options={{
        ...options,
        curveType: 'function',
        pointSize: 5,
      }}
    />
  );
}

function BarChart({ data, options }: { data: QueryResult; options: Record<string, unknown> }) {
  // Bar charts typically use string categories, so use simple transform
  const chartData = transformSimpleData(data);

  return (
    <Chart
      chartType="BarChart"
      width="100%"
      height="100%"
      data={chartData}
      options={options}
    />
  );
}

function PieChart({ data, options }: { data: QueryResult; options: Record<string, unknown> }) {
  // Pie charts use string labels
  const chartData = transformSimpleData(data);

  return (
    <Chart
      chartType="PieChart"
      width="100%"
      height="100%"
      data={chartData}
      options={{
        ...options,
        pieHole: 0.4,
        pieSliceText: 'percentage',
      }}
    />
  );
}

function AreaChart({ data, options }: { data: QueryResult; options: Record<string, unknown> }) {
  const chartData = transformChartData(data);

  return (
    <Chart
      chartType="AreaChart"
      width="100%"
      height="100%"
      data={chartData}
      options={{
        ...options,
        areaOpacity: 0.3,
      }}
    />
  );
}

function TableView({ data }: { data: QueryResult }) {
  const { theme } = useTheme();
  
  return (
    <div className="h-full overflow-auto">
      <table className="w-full text-sm">
        <thead className="sticky top-0 bg-slate-50 dark:bg-slate-800">
          <tr>
            {data.columns.map(col => (
              <th
                key={col}
                className="px-3 py-2 text-left font-medium text-slate-700 dark:text-slate-300 border-b border-slate-200 dark:border-slate-700"
              >
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.rows.map((row, i) => (
            <tr
              key={i}
              className={`${
                i % 2 === 0 
                  ? 'bg-white dark:bg-slate-900/50' 
                  : theme === 'dark' ? 'bg-slate-800/50' : 'bg-slate-50'
              } hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors`}
            >
              {data.columns.map(col => (
                <td
                  key={col}
                  className="px-3 py-2 text-slate-600 dark:text-slate-400 border-b border-slate-100 dark:border-slate-800"
                >
                  {String(row[col] ?? '')}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function StatCard({ data, options }: { data: QueryResult; options: ChartOptions }) {
  const value = data.rows[0]?.[data.columns[0]];
  const formattedValue = typeof value === 'number' 
    ? value.toLocaleString() 
    : String(value ?? '—');

  return (
    <div className="h-full flex flex-col items-center justify-center">
      <p className="text-4xl font-bold text-slate-800 dark:text-white">
        {formattedValue}
      </p>
      {options.title && (
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
          {options.title}
        </p>
      )}
    </div>
  );
}
