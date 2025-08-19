import React, { useEffect, useMemo, useState } from 'react';
import { adminAPI } from '../../services/api';
import { Search, RefreshCcw, Eye, Trash2, CheckCircle2, Clock, Archive } from 'lucide-react';

// Backend enum: ['new', 'read', 'replied', 'closed']
const STATUS_OPTIONS = [
  { value: '', label: 'All' },
  { value: 'new', label: 'New' },
  { value: 'read', label: 'Read' },
  { value: 'replied', label: 'Replied' },
  { value: 'closed', label: 'Closed' },
];

const StatusPill = ({ status }) => {
  const map = {
    new: { cls: 'bg-blue-100 text-blue-700', Icon: Clock, text: 'New' },
    read: { cls: 'bg-yellow-100 text-yellow-800', Icon: RefreshCcw, text: 'Read' },
    replied: { cls: 'bg-green-100 text-green-700', Icon: CheckCircle2, text: 'Replied' },
    closed: { cls: 'bg-gray-100 text-gray-700', Icon: Archive, text: 'Closed' },
  };
  const item = map[status] || { cls: 'bg-gray-100 text-gray-700', Icon: Clock, text: status || 'New' };
  const Icon = item.Icon;
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${item.cls}`}>
      <Icon className="w-3.5 h-3.5 mr-1" />
      {item.text}
    </span>
  );
};

export function MessageManagement() {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [toast, setToast] = useState(null); // { type: 'success'|'error'|'info', text: string }

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [total, setTotal] = useState(0);

  const [q, setQ] = useState('');
  const [status, setStatus] = useState('');

  const [viewItem, setViewItem] = useState(null);

  const totalPages = useMemo(() => (total && limit ? Math.max(1, Math.ceil(total / limit)) : 1), [total, limit]);

  const fetchMessages = async () => {
    try {
      setLoading(true);
      setError('');
      const params = { page, limit };
      if (q) params.q = q;
      if (status) params.status = status;
      const res = await adminAPI.getMessages(params);
      // Backend returns { success, page, limit, total, pages, items }
      if (res && Array.isArray(res.items)) {
        setMessages(res.items);
        setTotal(typeof res.total === 'number' ? res.total : res.items.length);
      } else if (Array.isArray(res)) {
        setMessages(res);
        setTotal(res.length);
      } else if (res && Array.isArray(res.data)) {
        setMessages(res.data);
        setTotal(res.total || res.data.length || 0);
      } else {
        setMessages([]);
        setTotal(0);
      }
    } catch (err) {
      console.error('Failed to load messages:', err);
      setError(err?.message || 'Failed to load messages');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMessages();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, limit, status]);

  const onSearch = (e) => {
    e.preventDefault();
    setPage(1);
    fetchMessages();
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this message? This action cannot be undone.')) return;
    try {
      await adminAPI.deleteMessage(id);
      setMessages((prev) => prev.filter((m) => m._id !== id));
      setTotal((t) => Math.max(0, t - 1));
      setToast({ type: 'success', text: 'Message deleted' });
      window.dispatchEvent(new Event('admin:refresh-badges'));
    } catch (err) {
      setToast({ type: 'error', text: err?.message || 'Failed to delete message' });
    }
  };

  const handleStatusChange = async (id, newStatus) => {
    try {
      await adminAPI.updateMessage(id, { status: newStatus });
      setMessages((prev) => prev.map((m) => (m._id === id ? { ...m, status: newStatus } : m)));
      if (viewItem && viewItem._id === id) setViewItem({ ...viewItem, status: newStatus });
      setToast({ type: 'success', text: 'Status updated' });
      window.dispatchEvent(new Event('admin:refresh-badges'));
    } catch (err) {
      setToast({ type: 'error', text: err?.message || 'Failed to update status' });
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-2 rounded shadow text-sm ${
          toast.type === 'success' ? 'bg-green-600 text-white' : toast.type === 'error' ? 'bg-red-600 text-white' : 'bg-gray-800 text-white'
        }`} onAnimationEnd={() => {}}>
          <div className="flex items-center gap-2">
            <span>{toast.text}</span>
            <button className="ml-2 text-white/80 hover:text-white" onClick={() => setToast(null)}>✕</button>
          </div>
        </div>
      )}
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Messages</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">Manage contact form submissions</p>
        </div>
        <button
          onClick={fetchMessages}
          disabled={loading}
          className="inline-flex items-center px-3 py-2 text-sm rounded-lg bg-primary-600 text-white hover:bg-primary-700 disabled:opacity-60"
        >
          <RefreshCcw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} /> Refresh
        </button>
      </div>

      {/* Filters */}
      <form onSubmit={onSearch} className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="relative">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="w-4 h-4 text-gray-400" />
          </span>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search name, email, phone, message..."
            className="w-full pl-9 pr-3 py-2 border rounded-lg bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700 text-gray-900 dark:text-gray-100"
          />
        </div>
        <div>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700 text-gray-900 dark:text-gray-100"
          >
            {STATUS_OPTIONS.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
        </div>
        <div className="flex gap-2">
          <button type="submit" className="px-3 py-2 rounded-lg bg-gray-900 text-white dark:bg-primary-600">Search</button>
          <button
            type="button"
            onClick={() => { setQ(''); setStatus(''); setPage(1); fetchMessages(); }}
            className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700"
          >Clear</button>
        </div>
      </form>

      {/* Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-900/30">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Phone</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {loading && (
                <tr>
                  <td colSpan="6" className="px-4 py-6 text-center text-gray-500">Loading...</td>
                </tr>
              )}
              {!loading && messages.length === 0 && (
                <tr>
                  <td colSpan="6" className="px-4 py-10 text-center text-gray-500">No messages found</td>
                </tr>
              )}
              {!loading && messages.map((m) => (
                <tr key={m._id} className="hover:bg-gray-50 dark:hover:bg-gray-900/30">
                  <td className="px-4 py-3">
                    <div className="font-medium text-gray-900 dark:text-gray-100">{m.name || '-'}</div>
                    <div className="text-xs text-gray-500 line-clamp-1 max-w-xs">{m.message}</div>
                  </td>
                  <td className="px-4 py-3 text-gray-700 dark:text-gray-300">{m.email || '-'}</td>
                  <td className="px-4 py-3 text-gray-700 dark:text-gray-300">{m.phone || '-'}</td>
                  <td className="px-4 py-3"><StatusPill status={m.status} /></td>
                  <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">{new Date(m.createdAt || m.updatedAt || Date.now()).toLocaleString()}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => setViewItem(m)}
                        className="inline-flex items-center px-2 py-1 rounded-md border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-900"
                        title="View"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <select
                        value={m.status}
                        onChange={(e) => handleStatusChange(m._id, e.target.value)}
                        className="px-2 py-1 text-sm border rounded-md bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-700"
                        title="Update status"
                      >
                        {STATUS_OPTIONS.filter(s => s.value !== '').map(s => (
                          <option key={s.value} value={s.value}>{s.label}</option>
                        ))}
                      </select>
                      <button
                        onClick={() => handleDelete(m._id)}
                        className="inline-flex items-center px-2 py-1 rounded-md border border-red-300 text-red-600 hover:bg-red-50"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between px-4 py-3 bg-gray-50 dark:bg-gray-900/30 border-t border-gray-200 dark:border-gray-700">
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Page {page} of {totalPages} • {total} result(s)
          </div>
          <div className="flex items-center gap-2">
            <select
              value={limit}
              onChange={(e) => { setLimit(Number(e.target.value)); setPage(1); }}
              className="px-2 py-1 text-sm border rounded-md bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-700"
            >
              {[10, 20, 50].map(n => <option key={n} value={n}>{n} / page</option>)}
            </select>
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="px-3 py-1.5 text-sm rounded-md border border-gray-300 dark:border-gray-700 disabled:opacity-50"
            >Prev</button>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="px-3 py-1.5 text-sm rounded-md border border-gray-300 dark:border-gray-700 disabled:opacity-50"
            >Next</button>
          </div>
        </div>
      </div>

      {/* View Modal */}
      {viewItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-2xl bg-white dark:bg-gray-900 rounded-lg shadow-lg overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
              <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Message Details</h4>
              <button onClick={() => setViewItem(null)} className="text-gray-500 hover:text-gray-700">✕</button>
            </div>
            <div className="p-4 space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <div className="text-xs text-gray-500">Name</div>
                  <div className="font-medium text-gray-900 dark:text-gray-100">{viewItem.name || '-'}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-500">Email</div>
                  <div className="font-medium text-gray-900 dark:text-gray-100">{viewItem.email || '-'}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-500">Phone</div>
                  <div className="font-medium text-gray-900 dark:text-gray-100">{viewItem.phone || '-'}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-500">Status</div>
                  <div className="mt-1"><StatusPill status={viewItem.status} /></div>
                </div>
              </div>
              <div>
                <div className="text-xs text-gray-500">Message</div>
                <div className="mt-1 whitespace-pre-wrap text-gray-800 dark:text-gray-200">{viewItem.message || '-'}</div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <div className="text-xs text-gray-500">Received</div>
                  <div className="text-sm text-gray-700 dark:text-gray-300">{new Date(viewItem.createdAt || Date.now()).toLocaleString()}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-500">Source</div>
                  <div className="text-sm text-gray-700 dark:text-gray-300">{viewItem.source || '-'}</div>
                </div>
              </div>
              
            </div>
            <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <label className="text-sm text-gray-600 dark:text-gray-300">Update status:</label>
                <select
                  value={viewItem.status}
                  onChange={(e) => handleStatusChange(viewItem._id, e.target.value)}
                  className="px-2 py-1 text-sm border rounded-md bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-700"
                >
                  {STATUS_OPTIONS.filter(s => s.value !== '').map(s => (
                    <option key={s.value} value={s.value}>{s.label}</option>
                  ))}
                </select>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setViewItem(null)}
                  className="px-3 py-1.5 text-sm rounded-md border border-gray-300 dark:border-gray-700"
                >Close</button>
                <button
                  onClick={() => { const id = viewItem._id; setViewItem(null); handleDelete(id); }}
                  className="px-3 py-1.5 text-sm rounded-md border border-red-300 text-red-600 hover:bg-red-50"
                >Delete</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default MessageManagement;
