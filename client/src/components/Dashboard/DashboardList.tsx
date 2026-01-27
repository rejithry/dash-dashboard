import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { HiPlus, HiOutlineViewGrid, HiOutlineTrash, HiOutlinePencil } from 'react-icons/hi';
import { dashboardApi } from '../../services/api';
import type { Dashboard } from '../../types';
import Modal from '../Layout/Modal';

export default function DashboardList() {
  const [dashboards, setDashboards] = useState<Dashboard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDashboard, setEditingDashboard] = useState<Dashboard | null>(null);
  const [formData, setFormData] = useState({ name: '', description: '' });

  useEffect(() => {
    loadDashboards();
  }, []);

  async function loadDashboards() {
    try {
      setLoading(true);
      const data = await dashboardApi.getAll();
      setDashboards(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load dashboards');
    } finally {
      setLoading(false);
    }
  }

  function openCreateModal() {
    setEditingDashboard(null);
    setFormData({ name: '', description: '' });
    setIsModalOpen(true);
  }

  function openEditModal(dashboard: Dashboard) {
    setEditingDashboard(dashboard);
    setFormData({ name: dashboard.name, description: dashboard.description });
    setIsModalOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      if (editingDashboard) {
        await dashboardApi.update(editingDashboard.id, formData);
      } else {
        await dashboardApi.create(formData);
      }
      setIsModalOpen(false);
      loadDashboards();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save dashboard');
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Are you sure you want to delete this dashboard?')) return;
    try {
      await dashboardApi.delete(id);
      loadDashboards();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete dashboard');
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Dashboards</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            Create and manage your analytics dashboards
          </p>
        </div>
        <button
          onClick={openCreateModal}
          className="flex items-center gap-2 px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-xl font-medium transition-colors shadow-glow"
        >
          <HiPlus className="w-5 h-5" />
          New Dashboard
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-red-600 dark:text-red-400">
          {error}
        </div>
      )}

      {/* Dashboard Grid */}
      {dashboards.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
            <HiOutlineViewGrid className="w-8 h-8 text-slate-400" />
          </div>
          <h3 className="text-lg font-medium text-slate-800 dark:text-white mb-2">
            No dashboards yet
          </h3>
          <p className="text-slate-500 dark:text-slate-400 mb-6">
            Create your first dashboard to get started
          </p>
          <button
            onClick={openCreateModal}
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-xl font-medium transition-colors"
          >
            <HiPlus className="w-5 h-5" />
            Create Dashboard
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {dashboards.map((dashboard, index) => (
            <div
              key={dashboard.id}
              className={`group glass-card rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden hover:shadow-lg hover:border-primary-300 dark:hover:border-primary-700 transition-all animate-fade-in stagger-${Math.min(index + 1, 5)}`}
              style={{ opacity: 0 }}
            >
              <Link to={`/dashboard/${dashboard.id}`} className="block p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-500/20 to-accent-500/20 flex items-center justify-center">
                    <HiOutlineViewGrid className="w-6 h-6 text-primary-600 dark:text-primary-400" />
                  </div>
                </div>
                <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-2 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                  {dashboard.name}
                </h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-2">
                  {dashboard.description || 'No description'}
                </p>
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-4">
                  Updated {new Date(dashboard.updated_at).toLocaleDateString()}
                </p>
              </Link>
              <div className="px-6 py-3 border-t border-slate-100 dark:border-slate-700 flex justify-end gap-2">
                <button
                  onClick={(e) => { e.preventDefault(); openEditModal(dashboard); }}
                  className="p-2 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                >
                  <HiOutlinePencil className="w-4 h-4" />
                </button>
                <button
                  onClick={(e) => { e.preventDefault(); handleDelete(dashboard.id); }}
                  className="p-2 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                >
                  <HiOutlineTrash className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingDashboard ? 'Edit Dashboard' : 'Create Dashboard'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Name
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
              className="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="My Dashboard"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
              className="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="Dashboard description..."
              rows={3}
            />
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-xl font-medium transition-colors"
            >
              {editingDashboard ? 'Save Changes' : 'Create'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
