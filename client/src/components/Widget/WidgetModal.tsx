import { useState, useEffect } from 'react';
import CodeMirror from '@uiw/react-codemirror';
import { sql } from '@codemirror/lang-sql';
import { HiOutlineChartBar, HiOutlineChartPie, HiOutlineTable, HiOutlineTrendingUp } from 'react-icons/hi';
import Modal from '../Layout/Modal';
import { connectionApi, widgetApi } from '../../services/api';
import type { Widget, WidgetType, Connection, QueryResult, ChartOptions } from '../../types';
import { useTheme } from '../../context/ThemeContext';
import ChartRenderer from '../Charts/ChartRenderer';

interface WidgetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: {
    title: string;
    type: WidgetType;
    connection_id: string | null;
    query: string;
    chart_options: ChartOptions;
  }) => void;
  widget: Widget | null;
}

const widgetTypes: { type: WidgetType; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { type: 'line', label: 'Line Chart', icon: HiOutlineTrendingUp },
  { type: 'bar', label: 'Bar Chart', icon: HiOutlineChartBar },
  { type: 'pie', label: 'Pie Chart', icon: HiOutlineChartPie },
  { type: 'area', label: 'Area Chart', icon: HiOutlineTrendingUp },
  { type: 'table', label: 'Table', icon: HiOutlineTable },
  { type: 'stat', label: 'Stat Card', icon: HiOutlineChartBar },
];

export default function WidgetModal({ isOpen, onClose, onSave, widget }: WidgetModalProps) {
  const { theme } = useTheme();
  const [title, setTitle] = useState('');
  const [type, setType] = useState<WidgetType>('line');
  const [connectionId, setConnectionId] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [chartOptions, setChartOptions] = useState<ChartOptions>({});
  const [connections, setConnections] = useState<Connection[]>([]);
  const [previewData, setPreviewData] = useState<QueryResult | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadConnections();
      if (widget) {
        setTitle(widget.title);
        setType(widget.type);
        setConnectionId(widget.connection_id);
        setQuery(widget.query);
        setChartOptions(widget.chart_options);
      } else {
        setTitle('');
        setType('line');
        setConnectionId(null);
        setQuery('');
        setChartOptions({});
      }
      setPreviewData(null);
      setPreviewError(null);
    }
  }, [isOpen, widget]);

  async function loadConnections() {
    try {
      const data = await connectionApi.getAll();
      setConnections(data);
    } catch (err) {
      console.error('Failed to load connections:', err);
    }
  }

  async function handlePreview() {
    try {
      setPreviewLoading(true);
      setPreviewError(null);
      const result = await widgetApi.preview({
        connection_id: connectionId || undefined,
        query: query || undefined,
        type,
      });
      setPreviewData(result);
    } catch (err) {
      setPreviewError(err instanceof Error ? err.message : 'Preview failed');
    } finally {
      setPreviewLoading(false);
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onSave({
      title,
      type,
      connection_id: connectionId,
      query,
      chart_options: chartOptions,
    });
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={widget ? 'Edit Widget' : 'Add Widget'}
      size="xl"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-2 gap-6">
          {/* Left Column - Configuration */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Title
              </label>
              <input
                type="text"
                value={title}
                onChange={e => setTitle(e.target.value)}
                className="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="Widget title"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Chart Type
              </label>
              <div className="grid grid-cols-3 gap-2">
                {widgetTypes.map(wt => {
                  const Icon = wt.icon;
                  return (
                    <button
                      key={wt.type}
                      type="button"
                      onClick={() => setType(wt.type)}
                      className={`flex flex-col items-center gap-1 p-3 rounded-xl border transition-all ${
                        type === wt.type
                          ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400'
                          : 'border-slate-200 dark:border-slate-600 hover:border-slate-300 dark:hover:border-slate-500'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                      <span className="text-xs">{wt.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Data Source
              </label>
              <select
                value={connectionId || ''}
                onChange={e => setConnectionId(e.target.value || null)}
                className="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="">Use dummy data</option>
                {connections.map(conn => (
                  <option key={conn.id} value={conn.id}>
                    {conn.name} ({conn.type})
                  </option>
                ))}
              </select>
            </div>

            {connectionId && (
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  SQL Query
                </label>
                <div className="rounded-xl border border-slate-200 dark:border-slate-600 overflow-hidden">
                  <CodeMirror
                    value={query}
                    height="120px"
                    extensions={[sql()]}
                    theme={theme === 'dark' ? 'dark' : 'light'}
                    onChange={value => setQuery(value)}
                    placeholder="SELECT * FROM table LIMIT 100"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Chart Options
              </label>
              <div className="space-y-3">
                <input
                  type="text"
                  value={chartOptions.title || ''}
                  onChange={e => setChartOptions(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="Chart title (optional)"
                />
                <select
                  value={chartOptions.legend?.position || 'bottom'}
                  onChange={e => setChartOptions(prev => ({ 
                    ...prev, 
                    legend: { position: e.target.value as 'top' | 'bottom' | 'left' | 'right' | 'none' } 
                  }))}
                  className="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  <option value="top">Legend: Top</option>
                  <option value="bottom">Legend: Bottom</option>
                  <option value="left">Legend: Left</option>
                  <option value="right">Legend: Right</option>
                  <option value="none">Legend: Hidden</option>
                </select>
              </div>
            </div>

            <button
              type="button"
              onClick={handlePreview}
              disabled={previewLoading}
              className="w-full px-4 py-2 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 rounded-xl font-medium transition-colors"
            >
              {previewLoading ? 'Loading...' : 'Preview'}
            </button>
          </div>

          {/* Right Column - Preview */}
          <div className="glass-card rounded-xl border border-slate-200 dark:border-slate-700 p-4">
            <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">
              Preview
            </h4>
            <div className="h-64">
              {previewLoading ? (
                <div className="h-full flex items-center justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary-500 border-t-transparent" />
                </div>
              ) : previewError ? (
                <div className="h-full flex items-center justify-center text-center">
                  <p className="text-red-500 text-sm">{previewError}</p>
                </div>
              ) : previewData ? (
                <ChartRenderer
                  type={type}
                  data={previewData}
                  options={chartOptions}
                />
              ) : (
                <div className="h-full flex items-center justify-center text-center">
                  <p className="text-slate-400 text-sm">
                    Click Preview to see your chart
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-700">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-xl font-medium transition-colors"
          >
            {widget ? 'Save Changes' : 'Add Widget'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
