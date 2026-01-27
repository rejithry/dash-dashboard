import { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import GridLayout from 'react-grid-layout';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';
import { HiPlus, HiArrowLeft, HiOutlinePencil } from 'react-icons/hi';
import { dashboardApi, widgetApi } from '../../services/api';
import type { Dashboard, Widget, LayoutItem, WidgetType } from '../../types';
import WidgetCard from '../Widget/WidgetCard';
import WidgetModal from '../Widget/WidgetModal';
import Modal from '../Layout/Modal';

export default function DashboardView() {
  const { id } = useParams<{ id: string }>();
  const [dashboard, setDashboard] = useState<Dashboard | null>(null);
  const [widgets, setWidgets] = useState<Widget[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isWidgetModalOpen, setIsWidgetModalOpen] = useState(false);
  const [editingWidget, setEditingWidget] = useState<Widget | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editFormData, setEditFormData] = useState({ name: '', description: '' });

  const loadDashboard = useCallback(async () => {
    if (!id) return;
    try {
      setLoading(true);
      const data = await dashboardApi.getById(id);
      setDashboard(data);
      setWidgets(data.widgets || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  async function handleLayoutChange(newLayout: GridLayout.Layout[]) {
    if (!dashboard) return;
    
    const layoutItems: LayoutItem[] = newLayout.map(item => ({
      i: item.i,
      x: item.x,
      y: item.y,
      w: item.w,
      h: item.h,
      minW: item.minW,
      minH: item.minH,
    }));

    try {
      await dashboardApi.update(dashboard.id, { layout: layoutItems });
      setDashboard(prev => prev ? { ...prev, layout: layoutItems } : null);
    } catch (err) {
      console.error('Failed to save layout:', err);
    }
  }

  function openAddWidget() {
    setEditingWidget(null);
    setIsWidgetModalOpen(true);
  }

  function openEditWidget(widget: Widget) {
    setEditingWidget(widget);
    setIsWidgetModalOpen(true);
  }

  async function handleWidgetSave(data: {
    title: string;
    type: WidgetType;
    connection_id: string | null;
    query: string;
    chart_options: Record<string, unknown>;
  }) {
    if (!dashboard) return;

    try {
      if (editingWidget) {
        await widgetApi.update(editingWidget.id, data);
      } else {
        const newWidget = await widgetApi.create({
          dashboard_id: dashboard.id,
          ...data,
        });
        
        // Add layout for new widget
        const newLayoutItem: LayoutItem = {
          i: newWidget.id,
          x: (dashboard.layout.length * 4) % 12,
          y: Infinity,
          w: 4,
          h: 3,
          minW: 2,
          minH: 2,
        };
        await dashboardApi.update(dashboard.id, {
          layout: [...dashboard.layout, newLayoutItem],
        });
      }
      
      setIsWidgetModalOpen(false);
      loadDashboard();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save widget');
    }
  }

  async function handleWidgetDelete(widgetId: string) {
    if (!dashboard) return;
    if (!confirm('Are you sure you want to delete this widget?')) return;

    try {
      await widgetApi.delete(widgetId);
      const newLayout = dashboard.layout.filter(item => item.i !== widgetId);
      await dashboardApi.update(dashboard.id, { layout: newLayout });
      loadDashboard();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete widget');
    }
  }

  function openEditDashboard() {
    if (!dashboard) return;
    setEditFormData({ name: dashboard.name, description: dashboard.description });
    setIsEditModalOpen(true);
  }

  async function handleEditDashboard(e: React.FormEvent) {
    e.preventDefault();
    if (!dashboard) return;

    try {
      await dashboardApi.update(dashboard.id, editFormData);
      setDashboard(prev => prev ? { ...prev, ...editFormData } : null);
      setIsEditModalOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update dashboard');
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-500 border-t-transparent" />
      </div>
    );
  }

  if (!dashboard) {
    return (
      <div className="text-center py-16">
        <h2 className="text-xl font-semibold text-slate-800 dark:text-white mb-4">
          Dashboard not found
        </h2>
        <Link to="/" className="text-primary-500 hover:text-primary-600">
          Go back to dashboards
        </Link>
      </div>
    );
  }

  // Ensure all widgets have a layout item
  const layoutMap = new Map(dashboard.layout.map(item => [item.i, item]));
  const fullLayout: LayoutItem[] = widgets.map((widget, index) => {
    const existing = layoutMap.get(widget.id);
    if (existing) return existing;
    return {
      i: widget.id,
      x: (index * 4) % 12,
      y: Infinity,
      w: 4,
      h: 3,
      minW: 2,
      minH: 2,
    };
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            to="/"
            className="p-2 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <HiArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-slate-800 dark:text-white">
                {dashboard.name}
              </h1>
              <button
                onClick={openEditDashboard}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <HiOutlinePencil className="w-4 h-4" />
              </button>
            </div>
            {dashboard.description && (
              <p className="text-slate-500 dark:text-slate-400 mt-1">
                {dashboard.description}
              </p>
            )}
          </div>
        </div>
        <button
          onClick={openAddWidget}
          className="flex items-center gap-2 px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-xl font-medium transition-colors shadow-glow"
        >
          <HiPlus className="w-5 h-5" />
          Add Widget
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-red-600 dark:text-red-400">
          {error}
        </div>
      )}

      {/* Grid Layout */}
      {widgets.length === 0 ? (
        <div className="text-center py-16 glass-card rounded-2xl border border-slate-200 dark:border-slate-700">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
            <HiPlus className="w-8 h-8 text-slate-400" />
          </div>
          <h3 className="text-lg font-medium text-slate-800 dark:text-white mb-2">
            No widgets yet
          </h3>
          <p className="text-slate-500 dark:text-slate-400 mb-6">
            Add widgets to visualize your data
          </p>
          <button
            onClick={openAddWidget}
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-xl font-medium transition-colors"
          >
            <HiPlus className="w-5 h-5" />
            Add Widget
          </button>
        </div>
      ) : (
        <GridLayout
          className="layout"
          layout={fullLayout.map(item => ({
            ...item,
            minW: item.minW || 2,
            minH: item.minH || 2,
          }))}
          cols={12}
          rowHeight={100}
          width={1200}
          onLayoutChange={handleLayoutChange}
          draggableHandle=".widget-drag-handle"
          isResizable
          isDraggable
        >
          {widgets.map(widget => (
            <div key={widget.id}>
              <WidgetCard
                widget={widget}
                onEdit={() => openEditWidget(widget)}
                onDelete={() => handleWidgetDelete(widget.id)}
              />
            </div>
          ))}
        </GridLayout>
      )}

      {/* Widget Modal */}
      <WidgetModal
        isOpen={isWidgetModalOpen}
        onClose={() => setIsWidgetModalOpen(false)}
        onSave={handleWidgetSave}
        widget={editingWidget}
      />

      {/* Edit Dashboard Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Edit Dashboard"
      >
        <form onSubmit={handleEditDashboard} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Name
            </label>
            <input
              type="text"
              value={editFormData.name}
              onChange={e => setEditFormData(prev => ({ ...prev, name: e.target.value }))}
              className="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Description
            </label>
            <textarea
              value={editFormData.description}
              onChange={e => setEditFormData(prev => ({ ...prev, description: e.target.value }))}
              className="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              rows={3}
            />
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={() => setIsEditModalOpen(false)}
              className="px-4 py-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-xl font-medium transition-colors"
            >
              Save Changes
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
