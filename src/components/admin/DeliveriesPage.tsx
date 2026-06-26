import { useState, useEffect } from 'react';
import { Plus, Truck, X, Search, Package, CheckCircle, Clock, AlertCircle, XCircle, Trash2 } from 'lucide-react';
import {
  getDeliveries,
  createDelivery,
  updateDeliveryStatus,
  assignDeliveryToDriver,
  deleteDelivery,
  getEmployees,
  getOrders,
} from '../../data/adminStore';

type DeliveryStatus = 'pending' | 'in_transit' | 'delivered' | 'cancelled';

interface Delivery {
  id: string;
  orderId: string;
  order?: { id: string; deliveryAddress: string; customer?: { name: string } };
  driverId?: string | null;
  driver?: { id: string; name: string } | null;
  status: DeliveryStatus;
  trackingCode: string;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
}

interface Driver {
  id: string;
  name: string;
  role: string;
  status: string;
}

interface OrderOption {
  id: string;
  deliveryAddress: string;
  customer?: { name: string };
}

const STATUS_CONFIG: Record<DeliveryStatus, { label: string; color: string; bg: string; icon: React.ReactNode }> = {
  pending:    { label: 'Pending',    color: 'text-yellow-500', bg: 'bg-yellow-500/10', icon: <Clock size={13} /> },
  in_transit: { label: 'In Transit', color: 'text-blue-400',   bg: 'bg-blue-500/10',   icon: <Truck size={13} /> },
  delivered:  { label: 'Delivered',  color: 'text-green-500',  bg: 'bg-green-500/10',  icon: <CheckCircle size={13} /> },
  cancelled:  { label: 'Cancelled',  color: 'text-red-400',    bg: 'bg-red-500/10',    icon: <XCircle size={13} /> },
};

const NEXT_STATUS: Record<DeliveryStatus, DeliveryStatus | null> = {
  pending:    'in_transit',
  in_transit: 'delivered',
  delivered:  null,
  cancelled:  null,
};

const emptyForm = { orderId: '', driverId: '', notes: '' };

export default function DeliveriesPage() {
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<DeliveryStatus | 'all'>('all');
  const [orders, setOrders] = useState<OrderOption[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    fetchAll();
  }, []);

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchAll = async () => {
    setIsLoading(true);
    try {
      const [dels, emps, ords] = await Promise.all([getDeliveries(), getEmployees(), getOrders()]);
      setDeliveries(dels);
      setDrivers(emps.filter((e: Driver) => e.role === 'driver' && e.status === 'active'));
      // Show only orders that don't yet have a delivery
      const deliveredOrderIds = new Set(dels.map((d: Delivery) => d.orderId));
      setOrders((ords as OrderOption[]).filter((o: OrderOption) => !deliveredOrderIds.has(o.id)));
    } catch {
      showToast('Failed to load data', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const openAdd = () => {
    setForm(emptyForm);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setForm(emptyForm);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.orderId) {
      showToast('Please select an order', 'error');
      return;
    }
    setSaving(true);
    try {
      await createDelivery({
        orderId: form.orderId,
        driverId: form.driverId || undefined,
        notes: form.notes || undefined,
      });
      showToast('Delivery created successfully', 'success');
      closeModal();
      fetchAll();
    } catch (err: any) {
      showToast(err?.message || 'Failed to create delivery', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleStatusAdvance = async (delivery: Delivery) => {
    const next = NEXT_STATUS[delivery.status];
    if (!next) return;
    try {
      await updateDeliveryStatus(delivery.id, next);
      showToast(`Delivery marked as ${STATUS_CONFIG[next].label}`, 'success');
      fetchAll();
    } catch {
      showToast('Failed to update status', 'error');
    }
  };

  const handleCancel = async (delivery: Delivery) => {
    if (!window.confirm('Cancel this delivery?')) return;
    try {
      await updateDeliveryStatus(delivery.id, 'cancelled');
      showToast('Delivery cancelled', 'success');
      fetchAll();
    } catch {
      showToast('Failed to cancel delivery', 'error');
    }
  };

  const handleAssignDriver = async (delivery: Delivery, driverId: string) => {
    try {
      await assignDeliveryToDriver(delivery.id, driverId);
      showToast('Driver assigned', 'success');
      fetchAll();
    } catch {
      showToast('Failed to assign driver', 'error');
    }
  };

  const handleDelete = async (delivery: Delivery) => {
    if (!window.confirm('Delete this delivery permanently?')) return;
    try {
      await deleteDelivery(delivery.id);
      showToast('Delivery deleted', 'success');
      fetchAll();
    } catch {
      showToast('Failed to delete delivery', 'error');
    }
  };

  const filtered = deliveries.filter(d => {
    const matchStatus = statusFilter === 'all' || d.status === statusFilter;
    const matchSearch =
      (d.orderId || '').toLowerCase().includes(search.toLowerCase()) ||
      (d.driver?.name || '').toLowerCase().includes(search.toLowerCase()) ||
      (d.order?.deliveryAddress || '').toLowerCase().includes(search.toLowerCase());
    return matchStatus && matchSearch;
  });

  const counts = {
    all: deliveries.length,
    pending: deliveries.filter(d => d.status === 'pending').length,
    in_transit: deliveries.filter(d => d.status === 'in_transit').length,
    delivered: deliveries.filter(d => d.status === 'delivered').length,
    cancelled: deliveries.filter(d => d.status === 'cancelled').length,
  };

  return (
    <div className="space-y-6">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-6 right-6 z-50 flex items-center px-5 py-3 rounded-lg shadow-xl text-sm font-medium ${
          toast.type === 'success' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
        }`}>
          {toast.message}
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Deliveries</h1>
          <p className="text-sm text-gray-400 mt-1">Track and manage all delivery logistics</p>
        </div>
        <button
          onClick={openAdd}
          className="flex items-center px-4 py-2 bg-green-600 hover:bg-green-500 text-white rounded-lg transition-colors font-medium"
        >
          <Plus size={18} className="mr-2" />
          New Delivery
        </button>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {(Object.keys(STATUS_CONFIG) as DeliveryStatus[]).map(s => {
          const cfg = STATUS_CONFIG[s];
          return (
            <button
              key={s}
              onClick={() => setStatusFilter(statusFilter === s ? 'all' : s)}
              className={`bg-gray-900 border rounded-xl p-4 text-left transition-all hover:border-gray-600 ${
                statusFilter === s ? 'border-green-500/50 ring-1 ring-green-500/30' : 'border-gray-800'
              }`}
            >
              <div className={`inline-flex p-2 rounded-lg ${cfg.bg} mb-2`}>
                <span className={cfg.color}>{cfg.icon}</span>
              </div>
              <p className="text-2xl font-bold text-white">{counts[s] ?? 0}</p>
              <p className={`text-xs font-medium ${cfg.color}`}>{cfg.label}</p>
            </button>
          );
        })}
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={17} />
          <input
            type="text"
            placeholder="Search by address, order ID or driver..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-gray-900 border border-gray-800 rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
          />
        </div>
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value as DeliveryStatus | 'all')}
          className="px-4 py-2.5 bg-gray-900 border border-gray-800 rounded-lg text-white focus:ring-2 focus:ring-green-500 outline-none"
        >
          <option value="all">All Statuses ({counts.all})</option>
          {(Object.keys(STATUS_CONFIG) as DeliveryStatus[]).map(s => (
            <option key={s} value={s}>{STATUS_CONFIG[s].label} ({counts[s]})</option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        {isLoading ? (
          <div className="flex justify-center p-16">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-green-500" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-500">
            <Package size={40} className="mb-3 opacity-40" />
            <p className="font-medium">No deliveries found</p>
            <p className="text-sm mt-1">
              {search || statusFilter !== 'all' ? 'Try adjusting your filters' : 'Click "New Delivery" to get started'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-800">
              <thead className="bg-gray-800/50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Address</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Order ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Driver</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Created</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-gray-900 divide-y divide-gray-800">
                {filtered.map(del => {
                  const cfg = STATUS_CONFIG[del.status] ?? STATUS_CONFIG.pending;
                  const next = NEXT_STATUS[del.status];
                  const address = del.order?.deliveryAddress
                    ? (() => { try { return JSON.parse(del.order.deliveryAddress)?.address || del.order.deliveryAddress; } catch { return del.order.deliveryAddress; } })()
                    : '—';
                  return (
                    <tr key={del.id} className="hover:bg-gray-800/50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${cfg.bg} ${cfg.color}`}>
                          {cfg.icon}
                          {cfg.label}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-white max-w-xs truncate">{address}</div>
                        {del.notes && (
                          <div className="text-xs text-gray-500 truncate mt-0.5">{del.notes}</div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                        <div className="font-mono">{del.orderId.slice(0, 8)}…</div>
                        {del.order?.customer && (
                          <div className="text-xs text-gray-500">{del.order.customer.name}</div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {del.status === 'delivered' || del.status === 'cancelled' ? (
                          <span className="text-sm text-gray-400">
                            {del.driver?.name || <span className="italic text-gray-600">Unassigned</span>}
                          </span>
                        ) : (
                          <select
                            value={del.driverId || ''}
                            onChange={e => handleAssignDriver(del, e.target.value)}
                            className="text-sm bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-green-500 outline-none"
                          >
                            <option value="">Unassigned</option>
                            {drivers.map(d => (
                              <option key={d.id} value={d.id}>{d.name}</option>
                            ))}
                          </select>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                        {new Date(del.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <div className="flex items-center justify-end gap-1">
                          {next && (
                            <button
                              onClick={() => handleStatusAdvance(del)}
                              title={`Mark as ${STATUS_CONFIG[next].label}`}
                              className="text-xs px-2.5 py-1.5 bg-green-600/20 hover:bg-green-600/40 text-green-400 rounded-lg transition-colors font-medium"
                            >
                              → {STATUS_CONFIG[next].label}
                            </button>
                          )}
                          {del.status !== 'cancelled' && del.status !== 'delivered' && (
                            <button
                              onClick={() => handleCancel(del)}
                              title="Cancel delivery"
                              className="p-1.5 text-yellow-400 hover:text-yellow-300 hover:bg-yellow-400/10 rounded-lg transition-colors"
                            >
                              <AlertCircle size={15} />
                            </button>
                          )}
                          <button
                            onClick={() => handleDelete(del)}
                            title="Delete"
                            className="p-1.5 text-red-400 hover:text-red-300 hover:bg-red-400/10 rounded-lg transition-colors"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create Delivery Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-gray-900 border border-gray-800 rounded-xl w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between p-6 border-b border-gray-800">
              <h2 className="text-xl font-bold text-white">New Delivery</h2>
              <button onClick={closeModal} className="text-gray-400 hover:text-white p-1 transition-colors">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Link to Order <span className="text-red-500">*</span>
                </label>
                <select
                  required
                  value={form.orderId}
                  onChange={e => setForm({ ...form, orderId: e.target.value })}
                  className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 text-white rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                >
                  <option value="">— Select an order —</option>
                  {orders.map(o => (
                    <option key={o.id} value={o.id}>
                      {o.customer?.name || 'Customer'} — {o.id.slice(0, 8)}…
                    </option>
                  ))}
                </select>
                {orders.length === 0 && (
                  <p className="text-xs text-yellow-500 mt-1">All orders already have a delivery assigned.</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Assign Driver</label>
                <select
                  value={form.driverId}
                  onChange={e => setForm({ ...form, driverId: e.target.value })}
                  className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 text-white rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                >
                  <option value="">— Leave unassigned —</option>
                  {drivers.map(d => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
                {drivers.length === 0 && (
                  <p className="text-xs text-yellow-500 mt-1">
                    No active drivers found. Add employees with the "Driver" role first.
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Notes (optional)</label>
                <textarea
                  rows={2}
                  value={form.notes}
                  onChange={e => setForm({ ...form, notes: e.target.value })}
                  placeholder="Special instructions for the driver..."
                  className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 text-white rounded-lg focus:ring-2 focus:ring-green-500 outline-none resize-none placeholder-gray-500"
                />
              </div>
              <div className="flex justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex items-center px-6 py-2 bg-green-600 hover:bg-green-500 text-white rounded-lg font-medium transition-colors disabled:opacity-60"
                >
                  {saving && <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />}
                  Create Delivery
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
