import { useState, useEffect } from 'react';
import { HiOutlineDotsVertical, HiOutlinePencil, HiOutlineTrash, HiOutlineRefresh } from 'react-icons/hi';
import { widgetApi } from '../../services/api';
import type { Widget, QueryResult } from '../../types';
import ChartRenderer from '../Charts/ChartRenderer';

interface WidgetCardProps {
  widget: Widget;
  onEdit: () => void;
  onDelete: () => void;
}

export default function WidgetCard({ widget, onEdit, onDelete }: WidgetCardProps) {
  const [data, setData] = useState<QueryResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  async function loadData() {
    try {
      setLoading(true);
      setError(null);
      const result = await widgetApi.execute(widget.id);
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, [widget.id, widget.query, widget.connection_id]);

  return (
    <div className="h-full glass-card rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-slate-700">
        <div className="flex items-center gap-2 widget-drag-handle cursor-move flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-slate-800 dark:text-white truncate">
            {widget.title}
          </h3>
        </div>
        
        <div className="relative flex items-center gap-1">
          <button
            onClick={loadData}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
            title="Refresh"
          >
            <HiOutlineRefresh className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
          >
            <HiOutlineDotsVertical className="w-4 h-4" />
          </button>
          
          {menuOpen && (
            <>
              <div 
                className="fixed inset-0 z-10" 
                onClick={() => setMenuOpen(false)} 
              />
              <div className="absolute right-0 top-8 z-20 w-40 bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 py-1">
                <button
                  onClick={() => { onEdit(); setMenuOpen(false); }}
                  className="w-full flex items-center gap-2 px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700"
                >
                  <HiOutlinePencil className="w-4 h-4" />
                  Edit Widget
                </button>
                <button
                  onClick={() => { onDelete(); setMenuOpen(false); }}
                  className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                >
                  <HiOutlineTrash className="w-4 h-4" />
                  Delete
                </button>
              </div>
            </>
          )}
        </div>
      </div>
      
      {/* Content */}
      <div className="flex-1 p-4 overflow-hidden">
        {loading ? (
          <div className="h-full flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary-500 border-t-transparent" />
          </div>
        ) : error ? (
          <div className="h-full flex items-center justify-center text-center">
            <div>
              <p className="text-red-500 text-sm mb-2">{error}</p>
              <button
                onClick={loadData}
                className="text-primary-500 hover:text-primary-600 text-sm"
              >
                Retry
              </button>
            </div>
          </div>
        ) : data ? (
          <ChartRenderer
            type={widget.type}
            data={data}
            options={widget.chart_options}
          />
        ) : null}
      </div>
    </div>
  );
}
