import { useState, useEffect } from 'react';
import { HiPlus, HiOutlineDatabase, HiOutlineTrash, HiOutlinePencil, HiOutlineCheckCircle, HiOutlineExclamationCircle } from 'react-icons/hi';
import { connectionApi } from '../../services/api';
import type { Connection, ConnectionType } from '../../types';
import Modal from '../Layout/Modal';

const connectionDefaults: Record<ConnectionType, { port: number; host: string }> = {
  postgresql: { port: 5432, host: 'localhost' },
  mysql: { port: 3306, host: 'localhost' },
  sqlite: { port: 0, host: '' },
};

export default function ConnectionList() {
  const [connections, setConnections] = useState<Connection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingConnection, setEditingConnection] = useState<Connection | null>(null);
  const [testResults, setTestResults] = useState<Record<string, { success: boolean; error?: string }>>({});
  const [testingId, setTestingId] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    type: 'postgresql' as ConnectionType,
    host: 'localhost',
    port: 5432,
    database: '',
    username: '',
    password: '',
    ssl: false,
  });

  useEffect(() => {
    loadConnections();
  }, []);

  async function loadConnections() {
    try {
      setLoading(true);
      const data = await connectionApi.getAll();
      setConnections(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load connections');
    } finally {
      setLoading(false);
    }
  }

  function openCreateModal() {
    setEditingConnection(null);
    setFormData({
      name: '',
      type: 'postgresql',
      host: 'localhost',
      port: 5432,
      database: '',
      username: '',
      password: '',
      ssl: false,
    });
    setIsModalOpen(true);
  }

  function openEditModal(connection: Connection) {
    setEditingConnection(connection);
    setFormData({
      name: connection.name,
      type: connection.type,
      host: connection.host,
      port: connection.port,
      database: connection.database,
      username: connection.username,
      password: '',
      ssl: connection.ssl,
    });
    setIsModalOpen(true);
  }

  function handleTypeChange(type: ConnectionType) {
    const defaults = connectionDefaults[type];
    setFormData(prev => ({
      ...prev,
      type,
      host: type === 'sqlite' ? '' : defaults.host,
      port: defaults.port,
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      if (editingConnection) {
        const updateData = { ...formData };
        if (!updateData.password) {
          delete (updateData as Record<string, unknown>).password;
        }
        await connectionApi.update(editingConnection.id, updateData);
      } else {
        await connectionApi.create(formData);
      }
      setIsModalOpen(false);
      loadConnections();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save connection');
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Are you sure you want to delete this connection?')) return;
    try {
      await connectionApi.delete(id);
      loadConnections();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete connection');
    }
  }

  async function handleTest(id: string) {
    try {
      setTestingId(id);
      const result = await connectionApi.test(id);
      setTestResults(prev => ({ ...prev, [id]: result }));
    } catch (err) {
      setTestResults(prev => ({ 
        ...prev, 
        [id]: { success: false, error: err instanceof Error ? err.message : 'Test failed' } 
      }));
    } finally {
      setTestingId(null);
    }
  }

  async function handleTestNew() {
    try {
      setTestingId('new');
      const result = await connectionApi.testNew(formData);
      setTestResults(prev => ({ ...prev, new: result }));
    } catch (err) {
      setTestResults(prev => ({ 
        ...prev, 
        new: { success: false, error: err instanceof Error ? err.message : 'Test failed' } 
      }));
    } finally {
      setTestingId(null);
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
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Database Connections</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            Manage your database connections for widget queries
          </p>
        </div>
        <button
          onClick={openCreateModal}
          className="flex items-center gap-2 px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-xl font-medium transition-colors shadow-glow"
        >
          <HiPlus className="w-5 h-5" />
          New Connection
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-red-600 dark:text-red-400">
          {error}
        </div>
      )}

      {/* Connections List */}
      {connections.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
            <HiOutlineDatabase className="w-8 h-8 text-slate-400" />
          </div>
          <h3 className="text-lg font-medium text-slate-800 dark:text-white mb-2">
            No connections yet
          </h3>
          <p className="text-slate-500 dark:text-slate-400 mb-6">
            Add a database connection to query real data
          </p>
          <button
            onClick={openCreateModal}
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-xl font-medium transition-colors"
          >
            <HiPlus className="w-5 h-5" />
            Add Connection
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {connections.map((connection, index) => (
            <div
              key={connection.id}
              className={`glass-card rounded-2xl border border-slate-200 dark:border-slate-700 p-6 animate-fade-in stagger-${Math.min(index + 1, 5)}`}
              style={{ opacity: 0 }}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-500/20 to-accent-500/20 flex items-center justify-center">
                    <HiOutlineDatabase className="w-6 h-6 text-primary-600 dark:text-primary-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-slate-800 dark:text-white">
                      {connection.name}
                    </h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                      {connection.type.toUpperCase()} • {connection.type === 'sqlite' 
                        ? connection.database 
                        : `${connection.host}:${connection.port}/${connection.database}`}
                    </p>
                    <p className="text-xs text-slate-400 dark:text-slate-500 mt-2">
                      User: {connection.username || '—'} • SSL: {connection.ssl ? 'Yes' : 'No'}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  {testResults[connection.id] && (
                    <span className={`flex items-center gap-1 text-sm ${
                      testResults[connection.id].success 
                        ? 'text-green-600 dark:text-green-400' 
                        : 'text-red-600 dark:text-red-400'
                    }`}>
                      {testResults[connection.id].success ? (
                        <><HiOutlineCheckCircle className="w-4 h-4" /> Connected</>
                      ) : (
                        <><HiOutlineExclamationCircle className="w-4 h-4" /> Failed</>
                      )}
                    </span>
                  )}
                  <button
                    onClick={() => handleTest(connection.id)}
                    disabled={testingId === connection.id}
                    className="px-3 py-1.5 text-sm border border-slate-200 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors disabled:opacity-50"
                  >
                    {testingId === connection.id ? 'Testing...' : 'Test'}
                  </button>
                  <button
                    onClick={() => openEditModal(connection)}
                    className="p-2 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                  >
                    <HiOutlinePencil className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(connection.id)}
                    className="p-2 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                  >
                    <HiOutlineTrash className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingConnection ? 'Edit Connection' : 'New Connection'}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Connection Name
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="My Database"
                required
              />
            </div>

            <div className="col-span-2">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Database Type
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(['postgresql', 'mysql', 'sqlite'] as ConnectionType[]).map(type => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => handleTypeChange(type)}
                    className={`px-4 py-2 rounded-xl border transition-all ${
                      formData.type === type
                        ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400'
                        : 'border-slate-200 dark:border-slate-600 hover:border-slate-300 dark:hover:border-slate-500'
                    }`}
                  >
                    {type.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>

            {formData.type === 'sqlite' ? (
              <div className="col-span-2">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Database Path
                </label>
                <input
                  type="text"
                  value={formData.database}
                  onChange={e => setFormData(prev => ({ ...prev, database: e.target.value }))}
                  className="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="/path/to/database.db"
                  required
                />
              </div>
            ) : (
              <>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Host
                  </label>
                  <input
                    type="text"
                    value={formData.host}
                    onChange={e => setFormData(prev => ({ ...prev, host: e.target.value }))}
                    className="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="localhost"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Port
                  </label>
                  <input
                    type="number"
                    value={formData.port}
                    onChange={e => setFormData(prev => ({ ...prev, port: parseInt(e.target.value) || 0 }))}
                    className="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    required
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Database Name
                  </label>
                  <input
                    type="text"
                    value={formData.database}
                    onChange={e => setFormData(prev => ({ ...prev, database: e.target.value }))}
                    className="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="mydb"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Username
                  </label>
                  <input
                    type="text"
                    value={formData.username}
                    onChange={e => setFormData(prev => ({ ...prev, username: e.target.value }))}
                    className="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="user"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Password
                  </label>
                  <input
                    type="password"
                    value={formData.password}
                    onChange={e => setFormData(prev => ({ ...prev, password: e.target.value }))}
                    className="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder={editingConnection ? '(unchanged)' : ''}
                  />
                </div>

                <div className="col-span-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.ssl}
                      onChange={e => setFormData(prev => ({ ...prev, ssl: e.target.checked }))}
                      className="w-4 h-4 rounded border-slate-300 text-primary-500 focus:ring-primary-500"
                    />
                    <span className="text-sm text-slate-700 dark:text-slate-300">
                      Use SSL connection
                    </span>
                  </label>
                </div>
              </>
            )}
          </div>

          {testResults.new && (
            <div className={`p-3 rounded-xl ${
              testResults.new.success 
                ? 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400' 
                : 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400'
            }`}>
              {testResults.new.success ? 'Connection successful!' : `Connection failed: ${testResults.new.error}`}
            </div>
          )}

          <div className="flex justify-between pt-4 border-t border-slate-200 dark:border-slate-700">
            <button
              type="button"
              onClick={handleTestNew}
              disabled={testingId === 'new'}
              className="px-4 py-2 border border-slate-200 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-xl transition-colors disabled:opacity-50"
            >
              {testingId === 'new' ? 'Testing...' : 'Test Connection'}
            </button>
            <div className="flex gap-3">
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
                {editingConnection ? 'Save Changes' : 'Create'}
              </button>
            </div>
          </div>
        </form>
      </Modal>
    </div>
  );
}
