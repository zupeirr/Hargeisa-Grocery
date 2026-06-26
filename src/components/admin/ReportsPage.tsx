import { useState, useEffect, useCallback } from 'react';
import {
  TrendingUp, DollarSign, ShoppingBag, Users, Package,
  Truck, BarChart2, Download, RefreshCw, AlertTriangle,
  Calendar, ArrowUpRight, ArrowDownRight
} from 'lucide-react';
import {
  getSalesReports, getProfitReports, getInventoryReport,
  getCustomerReport, getSupplierReport, getExpenseReport2,
  getEmployeeReport, DateRange
} from '../../data/adminStore';

// ─── Types ────────────────────────────────────────────────────────────────────

type TabId = 'sales' | 'financial' | 'inventory' | 'customers' | 'suppliers' | 'expenses' | 'employees';

const TABS: { id: TabId; label: string; icon: React.ReactNode }[] = [
  { id: 'sales',     label: 'Sales',      icon: <TrendingUp size={15} /> },
  { id: 'financial', label: 'Financial',  icon: <DollarSign size={15} /> },
  { id: 'inventory', label: 'Inventory',  icon: <Package size={15} /> },
  { id: 'customers', label: 'Customers',  icon: <Users size={15} /> },
  { id: 'suppliers', label: 'Suppliers',  icon: <Truck size={15} /> },
  { id: 'expenses',  label: 'Expenses',   icon: <BarChart2 size={15} /> },
  { id: 'employees', label: 'Employees',  icon: <Users size={15} /> },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmt(n: number) { return `$${n.toFixed(2)}`; }

function StatCard({ label, value, sub, color = 'green', icon, trend }: {
  label: string; value: string; sub?: string; color?: string; icon?: React.ReactNode; trend?: number;
}) {
  const colors: Record<string, string> = {
    green: 'text-green-500 bg-green-500/10',
    blue:  'text-blue-400 bg-blue-500/10',
    red:   'text-red-400 bg-red-500/10',
    yellow:'text-yellow-500 bg-yellow-500/10',
    purple:'text-purple-400 bg-purple-500/10',
  };
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
      <div className="flex items-start justify-between">
        <div className={`p-2.5 rounded-lg ${colors[color]}`}>{icon}</div>
        {trend !== undefined && (
          <span className={`flex items-center text-xs font-medium ${trend >= 0 ? 'text-green-500' : 'text-red-400'}`}>
            {trend >= 0 ? <ArrowUpRight size={13} /> : <ArrowDownRight size={13} />}
            {Math.abs(trend).toFixed(1)}%
          </span>
        )}
      </div>
      <p className="text-2xl font-bold text-white mt-3">{value}</p>
      <p className="text-sm text-gray-400 mt-0.5">{label}</p>
      {sub && <p className="text-xs text-gray-500 mt-0.5">{sub}</p>}
    </div>
  );
}

function MiniBar({ label, value, max, color = '#22c55e' }: { label: string; value: number; max: number; color?: string }) {
  const pct = max > 0 ? (value / max) * 100 : 0;
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-sm">
        <span className="text-gray-300 truncate max-w-[60%]">{label}</span>
        <span className="text-white font-medium">{typeof value === 'number' && value % 1 !== 0 ? fmt(value) : value}</span>
      </div>
      <div className="w-full bg-gray-800 rounded-full h-2">
        <div className="h-2 rounded-full transition-all duration-500" style={{ width: `${pct}%`, backgroundColor: color }} />
      </div>
    </div>
  );
}

// ─── CSV Export ───────────────────────────────────────────────────────────────

function exportCSV(rows: Record<string, any>[], filename: string) {
  if (!rows.length) return;
  const headers = Object.keys(rows[0]);
  const csv = [headers.join(','), ...rows.map(r => headers.map(h => JSON.stringify(r[h] ?? '')).join(','))].join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

// ─── Bar Chart ────────────────────────────────────────────────────────────────

function BarChart({ data, xKey, yKey, color = '#22c55e' }: {
  data: any[]; xKey: string; yKey: string; color?: string;
}) {
  if (!data.length) return <div className="h-48 flex items-center justify-center text-gray-500">No data</div>;
  const max = Math.max(...data.map(d => d[yKey] || 0));
  return (
    <div className="flex items-end gap-1 h-48 pt-4">
      {data.map((d, i) => {
        const h = max > 0 ? (d[yKey] / max) * 100 : 0;
        return (
          <div key={i} className="flex-1 flex flex-col items-center justify-end group relative min-w-0">
            <div
              className="w-full rounded-t-sm transition-all duration-300 hover:opacity-80 cursor-pointer"
              style={{ height: `${h}%`, minHeight: 3, backgroundColor: color }}
              title={`${d[xKey]}: ${typeof d[yKey] === 'number' && d[yKey] % 1 !== 0 ? fmt(d[yKey]) : d[yKey]}`}
            />
            <span className="text-[9px] text-gray-500 mt-1 truncate w-full text-center">{String(d[xKey]).slice(-5)}</span>
          </div>
        );
      })}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

const today = new Date().toISOString().split('T')[0];
const thirtyDaysAgo = (() => { const d = new Date(); d.setDate(d.getDate() - 30); return d.toISOString().split('T')[0]; })();

export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState<TabId>('sales');
  const [isLoading, setIsLoading] = useState(false);
  const [data, setData] = useState<Record<TabId, any>>({} as any);
  const [range, setRange] = useState<DateRange>({ startDate: thirtyDaysAgo, endDate: today });
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 3000); };

  const fetchTab = useCallback(async (tab: TabId) => {
    setIsLoading(true);
    try {
      let result: any;
      if (tab === 'sales')     result = await getSalesReports(range);
      if (tab === 'financial') result = await getProfitReports(range);
      if (tab === 'inventory') result = await getInventoryReport();
      if (tab === 'customers') result = await getCustomerReport(range);
      if (tab === 'suppliers') result = await getSupplierReport(range);
      if (tab === 'expenses')  result = await getExpenseReport2(range);
      if (tab === 'employees') result = await getEmployeeReport(range);
      setData(prev => ({ ...prev, [tab]: result }));
    } catch {
      showToast('Failed to load report data');
    } finally {
      setIsLoading(false);
    }
  }, [range]);

  useEffect(() => { fetchTab(activeTab); }, [activeTab, fetchTab]);

  const d = data[activeTab];

  return (
    <div className="space-y-6">
      {toast && (
        <div className="fixed top-6 right-6 z-50 bg-red-600 text-white px-5 py-3 rounded-lg shadow-xl text-sm font-medium">
          {toast}
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Reports & Analytics</h1>
          <p className="text-sm text-gray-400 mt-0.5">Business intelligence across all modules</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-2 bg-gray-900 border border-gray-800 rounded-lg px-3 py-2">
            <Calendar size={14} className="text-gray-400" />
            <input type="date" value={range.startDate} onChange={e => setRange(r => ({ ...r, startDate: e.target.value }))}
              className="bg-transparent text-white text-sm outline-none" />
            <span className="text-gray-600">→</span>
            <input type="date" value={range.endDate} onChange={e => setRange(r => ({ ...r, endDate: e.target.value }))}
              className="bg-transparent text-white text-sm outline-none" />
          </div>
          <button onClick={() => fetchTab(activeTab)}
            className="flex items-center gap-1.5 px-3 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg text-sm transition-colors">
            <RefreshCw size={14} />
            Refresh
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-900 border border-gray-800 rounded-xl p-1 overflow-x-auto">
        {TABS.map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
              activeTab === t.id ? 'bg-gray-800 text-green-400' : 'text-gray-500 hover:text-gray-300 hover:bg-gray-800/50'
            }`}>
            {t.icon}{t.label}
          </button>
        ))}
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="flex justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500" />
        </div>
      ) : !d ? null : (
        <>
          {/* ── SALES ─────────────────────────────────────────────────────── */}
          {activeTab === 'sales' && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatCard label="Total Revenue"   value={fmt(d.summary.totalRevenue)}   icon={<DollarSign size={18} />} color="green" />
                <StatCard label="Total Orders"    value={String(d.summary.totalOrders)} icon={<ShoppingBag size={18} />} color="blue" />
                <StatCard label="Avg Order Value" value={fmt(d.summary.avgOrderValue)}  icon={<TrendingUp size={18} />} color="purple" />
                <StatCard label="Unique Customers" value={String(d.summary.uniqueCustomers)} icon={<Users size={18} />} color="yellow" />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="font-bold text-white">Daily Revenue Trend</h3>
                    <button onClick={() => exportCSV(d.chartData, 'sales-trend.csv')}
                      className="flex items-center gap-1 text-xs text-gray-400 hover:text-white transition-colors">
                      <Download size={12} /> CSV
                    </button>
                  </div>
                  <BarChart data={d.chartData} xKey="date" yKey="revenue" />
                </div>

                <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="font-bold text-white">Top Products by Revenue</h3>
                    <button onClick={() => exportCSV(d.topProducts, 'top-products.csv')}
                      className="flex items-center gap-1 text-xs text-gray-400 hover:text-white transition-colors">
                      <Download size={12} /> CSV
                    </button>
                  </div>
                  <div className="space-y-3">
                    {d.topProducts.slice(0, 7).map((p: any, i: number) => (
                      <MiniBar key={i} label={p.name} value={p.revenue}
                        max={d.topProducts[0]?.revenue || 1} />
                    ))}
                    {!d.topProducts.length && <p className="text-gray-500 text-sm text-center py-8">No product data</p>}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── FINANCIAL / PROFIT ────────────────────────────────────────── */}
          {activeTab === 'financial' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <StatCard label="Gross Revenue"  value={fmt(d.revenue)}   icon={<TrendingUp size={18} />} color="green" />
                <StatCard label="Total Costs"    value={fmt(d.costs.total)} icon={<ArrowDownRight size={18} />} color="red" />
                <StatCard label="Net Profit"     value={fmt(d.netProfit)}
                  sub={`Margin: ${d.profitMargin.toFixed(1)}%`}
                  icon={<DollarSign size={18} />} color={d.netProfit >= 0 ? 'green' : 'red'} />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
                  <h3 className="font-bold text-white mb-5">Cost Breakdown</h3>
                  <div className="space-y-4">
                    {[
                      { label: 'Inventory Purchases', value: d.costs.inventoryPurchases, color: '#3b82f6' },
                      { label: 'Payroll & Salaries',  value: d.costs.payroll,           color: '#a855f7' },
                      { label: 'Operating Expenses',  value: d.costs.operatingExpenses, color: '#eab308' },
                    ].map((item, i) => (
                      <MiniBar key={i} label={item.label} value={item.value} max={d.costs.total} color={item.color} />
                    ))}
                  </div>
                </div>

                <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
                  <h3 className="font-bold text-white mb-5">Expense Categories</h3>
                  <div className="space-y-3">
                    {(d.costs.byCategory || []).map((c: any, i: number) => (
                      <MiniBar key={i} label={c.category} value={c.amount}
                        max={(d.costs.byCategory[0]?.amount || 1)} color="#22c55e" />
                    ))}
                    {!d.costs.byCategory?.length && <p className="text-gray-500 text-sm text-center py-8">No expense category data</p>}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── INVENTORY ─────────────────────────────────────────────────── */}
          {activeTab === 'inventory' && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                <StatCard label="Total Products"   value={String(d.summary.totalProducts)}   icon={<Package size={16} />} color="blue" />
                <StatCard label="Stock Value"       value={fmt(d.summary.totalStockValue)}    icon={<DollarSign size={16} />} color="green" />
                <StatCard label="Low Stock"         value={String(d.summary.lowStockCount)}   icon={<AlertTriangle size={16} />} color="yellow" />
                <StatCard label="Out of Stock"      value={String(d.summary.outOfStockCount)} icon={<AlertTriangle size={16} />} color="red" />
                <StatCard label="Damaged Items"     value={String(d.summary.damagedCount)}    icon={<Package size={16} />} color="red" />
                <StatCard label="Expiring Soon"     value={String(d.summary.expiringSoonCount)} icon={<Calendar size={16} />} color="yellow" />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Low Stock */}
                <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-x-auto custom-scrollbar">
                  <div className="flex justify-between items-center p-4 border-b border-gray-800 bg-yellow-500/5">
                    <h3 className="font-bold text-white flex items-center gap-2"><AlertTriangle size={15} className="text-yellow-500" />Low Stock</h3>
                    <button onClick={() => exportCSV(d.lowStock, 'low-stock.csv')}
                      className="flex items-center gap-1 text-xs text-gray-400 hover:text-white"><Download size={12} /> CSV</button>
                  </div>
                  <div className="max-h-64 overflow-y-auto custom-scrollbar">
                    <table className="min-w-full">
                      <tbody className="divide-y divide-gray-800">
                        {d.lowStock.map((p: any) => (
                          <tr key={p.id} className="hover:bg-gray-800/30">
                            <td className="px-4 py-3 text-sm text-white">{p.name}</td>
                            <td className="px-4 py-3 text-sm text-gray-400">{p.category}</td>
                            <td className="px-4 py-3 text-sm font-medium text-yellow-500">{p.stockLevel} / {p.lowStockAlert}</td>
                          </tr>
                        ))}
                        {!d.lowStock.length && <tr><td colSpan={3} className="px-4 py-8 text-center text-gray-500">All items well-stocked ✓</td></tr>}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Expiring Soon */}
                <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-x-auto custom-scrollbar">
                  <div className="flex justify-between items-center p-4 border-b border-gray-800 bg-red-500/5">
                    <h3 className="font-bold text-white flex items-center gap-2"><Calendar size={15} className="text-red-400" />Expiring ≤ 30 Days</h3>
                    <button onClick={() => exportCSV(d.expiringSoon, 'expiring-soon.csv')}
                      className="flex items-center gap-1 text-xs text-gray-400 hover:text-white"><Download size={12} /> CSV</button>
                  </div>
                  <div className="max-h-64 overflow-y-auto custom-scrollbar">
                    <table className="min-w-full">
                      <tbody className="divide-y divide-gray-800">
                        {d.expiringSoon.map((p: any) => (
                          <tr key={p.id} className="hover:bg-gray-800/30">
                            <td className="px-4 py-3 text-sm text-white">{p.name}</td>
                            <td className="px-4 py-3 text-sm text-gray-400">{new Date(p.expiryDate).toLocaleDateString()}</td>
                            <td className="px-4 py-3 text-sm font-medium text-red-400">{p.daysLeft}d left</td>
                          </tr>
                        ))}
                        {!d.expiringSoon.length && <tr><td colSpan={3} className="px-4 py-8 text-center text-gray-500">No items expiring soon ✓</td></tr>}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── CUSTOMERS ─────────────────────────────────────────────────── */}
          {activeTab === 'customers' && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatCard label="Total Customers"  value={String(d.summary.totalCustomers)}  icon={<Users size={18} />} color="blue" />
                <StatCard label="New Customers"    value={String(d.summary.newCustomers)}    icon={<Users size={18} />} color="green" />
                <StatCard label="Active Customers" value={String(d.summary.activeCustomers)} icon={<Users size={18} />} color="purple" />
                <StatCard label="Avg Lifetime Value" value={fmt(d.summary.avgLifetimeValue)} icon={<DollarSign size={18} />} color="yellow" />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 col-span-1">
                  <h3 className="font-bold text-white mb-4">By Segment</h3>
                  <div className="space-y-3">
                    {d.bySegment.map((s: any, i: number) => (
                      <MiniBar key={i} label={s.segment} value={s.count} max={d.summary.totalCustomers} />
                    ))}
                  </div>
                </div>
                <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-x-auto custom-scrollbar col-span-1 lg:col-span-2">
                  <div className="flex justify-between items-center p-4 border-b border-gray-800">
                    <h3 className="font-bold text-white">Top Customers by Spend</h3>
                    <button onClick={() => exportCSV(d.topCustomers, 'top-customers.csv')}
                      className="flex items-center gap-1 text-xs text-gray-400 hover:text-white"><Download size={12} /> CSV</button>
                  </div>
                  <table className="min-w-full">
                    <thead className="bg-gray-800/50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs text-gray-400 uppercase">Customer</th>
                        <th className="px-4 py-3 text-left text-xs text-gray-400 uppercase">Orders</th>
                        <th className="px-4 py-3 text-left text-xs text-gray-400 uppercase">Spent</th>
                        <th className="px-4 py-3 text-left text-xs text-gray-400 uppercase">Segment</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-800">
                      {d.topCustomers.map((c: any, i: number) => (
                        <tr key={i} className="hover:bg-gray-800/30">
                          <td className="px-4 py-3"><div className="text-sm font-medium text-white">{c.name}</div><div className="text-xs text-gray-500">{c.email}</div></td>
                          <td className="px-4 py-3 text-sm text-gray-300">{c.totalOrders}</td>
                          <td className="px-4 py-3 text-sm font-medium text-green-400">{fmt(c.totalSpent)}</td>
                          <td className="px-4 py-3"><span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 capitalize">{c.segment}</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ── SUPPLIERS ─────────────────────────────────────────────────── */}
          {activeTab === 'suppliers' && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatCard label="Total Suppliers"   value={String(d.summary.totalSuppliers)}   icon={<Truck size={18} />} color="blue" />
                <StatCard label="POs in Period"     value={String(d.summary.totalPOsInRange)}  icon={<ShoppingBag size={18} />} color="green" />
                <StatCard label="Total Spend"       value={fmt(d.summary.totalSpendInRange)}   icon={<DollarSign size={18} />} color="red" />
                <StatCard label="Pending POs"       value={String(d.summary.pendingPOs)}       icon={<AlertTriangle size={18} />} color="yellow" />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
                  <h3 className="font-bold text-white mb-4">Top Suppliers by Spend</h3>
                  <div className="space-y-3">
                    {d.topSuppliers.map((s: any, i: number) => (
                      <MiniBar key={i} label={`${s.name} (${s.orders} POs)`} value={s.total}
                        max={d.topSuppliers[0]?.total || 1} />
                    ))}
                    {!d.topSuppliers.length && <p className="text-gray-500 text-sm text-center py-8">No supplier purchase data</p>}
                  </div>
                </div>
                <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-x-auto custom-scrollbar">
                  <div className="flex justify-between items-center p-4 border-b border-gray-800">
                    <h3 className="font-bold text-white">Recent Purchase Orders</h3>
                    <button onClick={() => exportCSV(d.recentPOs, 'purchase-orders.csv')}
                      className="flex items-center gap-1 text-xs text-gray-400 hover:text-white"><Download size={12} /> CSV</button>
                  </div>
                  <div className="max-h-72 overflow-y-auto custom-scrollbar">
                    <table className="min-w-full">
                      <thead className="bg-gray-800/50 sticky top-0">
                        <tr>
                          <th className="px-4 py-2 text-left text-xs text-gray-400 uppercase">Supplier</th>
                          <th className="px-4 py-2 text-left text-xs text-gray-400 uppercase">Amount</th>
                          <th className="px-4 py-2 text-left text-xs text-gray-400 uppercase">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-800">
                        {d.recentPOs.map((po: any, i: number) => (
                          <tr key={i} className="hover:bg-gray-800/30">
                            <td className="px-4 py-3 text-sm text-white">{po.supplier}</td>
                            <td className="px-4 py-3 text-sm font-medium text-green-400">{fmt(po.totalAmount)}</td>
                            <td className="px-4 py-3">
                              <span className={`text-xs px-2 py-0.5 rounded-full capitalize ${
                                po.status === 'received' ? 'bg-green-500/10 text-green-400' :
                                po.status === 'cancelled' ? 'bg-red-500/10 text-red-400' :
                                'bg-yellow-500/10 text-yellow-500'
                              }`}>{po.status}</span>
                            </td>
                          </tr>
                        ))}
                        {!d.recentPOs.length && <tr><td colSpan={3} className="px-4 py-8 text-center text-gray-500">No purchase orders in this period</td></tr>}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── EXPENSES ──────────────────────────────────────────────────── */}
          {activeTab === 'expenses' && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatCard label="Total Expenses" value={fmt(d.summary.totalExpenses)} icon={<DollarSign size={18} />} color="red" />
                <StatCard label="# of Expenses"  value={String(d.summary.expenseCount)} icon={<BarChart2 size={18} />} color="blue" />
                <StatCard label="Avg per Entry"  value={fmt(d.summary.avgExpense)}     icon={<TrendingUp size={18} />} color="purple" />
                <StatCard label="Top Category"   value={d.summary.topCategory}         icon={<BarChart2 size={18} />} color="yellow" />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
                  <h3 className="font-bold text-white mb-4">By Category</h3>
                  <div className="space-y-3">
                    {d.byCategory.map((c: any, i: number) => (
                      <MiniBar key={i} label={c.category} value={c.amount} max={d.byCategory[0]?.amount || 1} color="#ef4444" />
                    ))}
                  </div>
                </div>

                <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="font-bold text-white">Monthly Trend</h3>
                    <button onClick={() => exportCSV(d.byMonth, 'expense-monthly.csv')}
                      className="flex items-center gap-1 text-xs text-gray-400 hover:text-white"><Download size={12} /> CSV</button>
                  </div>
                  <BarChart data={d.byMonth} xKey="month" yKey="total" color="#ef4444" />
                </div>
              </div>

              <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-x-auto custom-scrollbar">
                <div className="flex justify-between items-center p-4 border-b border-gray-800">
                  <h3 className="font-bold text-white">Recent Expenses</h3>
                  <button onClick={() => exportCSV(d.recent, 'expenses.csv')}
                    className="flex items-center gap-1 text-xs text-gray-400 hover:text-white"><Download size={12} /> CSV</button>
                </div>
                <table className="min-w-full">
                  <thead className="bg-gray-800/50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs text-gray-400 uppercase">Date</th>
                      <th className="px-4 py-3 text-left text-xs text-gray-400 uppercase">Category</th>
                      <th className="px-4 py-3 text-left text-xs text-gray-400 uppercase">Description</th>
                      <th className="px-4 py-3 text-right text-xs text-gray-400 uppercase">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-800">
                    {d.recent.map((e: any, i: number) => (
                      <tr key={i} className="hover:bg-gray-800/30">
                        <td className="px-4 py-3 text-sm text-gray-400">{new Date(e.date).toLocaleDateString()}</td>
                        <td className="px-4 py-3"><span className="text-xs px-2 py-0.5 rounded-full bg-red-500/10 text-red-400">{e.category}</span></td>
                        <td className="px-4 py-3 text-sm text-gray-300">{e.description || '—'}</td>
                        <td className="px-4 py-3 text-sm font-medium text-red-400 text-right">{fmt(e.amount)}</td>
                      </tr>
                    ))}
                    {!d.recent.length && <tr><td colSpan={4} className="px-4 py-8 text-center text-gray-500">No expenses in this period</td></tr>}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ── EMPLOYEES ─────────────────────────────────────────────────── */}
          {activeTab === 'employees' && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatCard label="Total Employees"  value={String(d.summary.totalEmployees)}   icon={<Users size={18} />} color="blue" />
                <StatCard label="Active"           value={String(d.summary.activeEmployees)}  icon={<Users size={18} />} color="green" />
                <StatCard label="Salaries Paid"    value={fmt(d.summary.totalSalariesPaid)}  icon={<DollarSign size={18} />} color="purple" />
                <StatCard label="Avg Salary"       value={fmt(d.summary.avgSalary)}          icon={<TrendingUp size={18} />} color="yellow" />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 space-y-6">
                  <div>
                    <h3 className="font-bold text-white mb-4">By Role</h3>
                    <div className="space-y-3">
                      {d.byRole.map((r: any, i: number) => (
                        <MiniBar key={i} label={r.role} value={r.count} max={d.summary.totalEmployees} />
                      ))}
                    </div>
                  </div>
                  <div>
                    <h3 className="font-bold text-white mb-4">By Status</h3>
                    <div className="space-y-3">
                      {d.byStatus.map((r: any, i: number) => (
                        <MiniBar key={i} label={r.status} value={r.count} max={d.summary.totalEmployees}
                          color={r.status === 'active' ? '#22c55e' : r.status === 'leave' ? '#eab308' : '#ef4444'} />
                      ))}
                    </div>
                  </div>
                  <div>
                    <h3 className="font-bold text-white mb-3">Attendance</h3>
                    <p className="text-sm text-gray-400">Total records: <span className="text-white font-medium">{d.attendance.total}</span></p>
                    <div className="mt-3 space-y-2">
                      {d.attendance.byStatus.map((a: any, i: number) => (
                        <MiniBar key={i} label={a.status} value={a.count} max={d.attendance.total}
                          color={a.status === 'present' ? '#22c55e' : a.status === 'absent' ? '#ef4444' : '#eab308'} />
                      ))}
                    </div>
                  </div>
                </div>

                <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-x-auto custom-scrollbar col-span-1 lg:col-span-2">
                  <div className="flex justify-between items-center p-4 border-b border-gray-800">
                    <h3 className="font-bold text-white">Employee Directory</h3>
                    <button onClick={() => exportCSV(d.employees, 'employees.csv')}
                      className="flex items-center gap-1 text-xs text-gray-400 hover:text-white"><Download size={12} /> CSV</button>
                  </div>
                  <div className="max-h-[480px] overflow-y-auto custom-scrollbar">
                    <table className="min-w-full">
                      <thead className="bg-gray-800/50 sticky top-0">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs text-gray-400 uppercase">Name</th>
                          <th className="px-4 py-3 text-left text-xs text-gray-400 uppercase">Role</th>
                          <th className="px-4 py-3 text-left text-xs text-gray-400 uppercase">Status</th>
                          <th className="px-4 py-3 text-right text-xs text-gray-400 uppercase">Salary</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-800">
                        {d.employees.map((e: any, i: number) => (
                          <tr key={i} className="hover:bg-gray-800/30">
                            <td className="px-4 py-3 text-sm font-medium text-white">{e.name}</td>
                            <td className="px-4 py-3"><span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 capitalize">{e.role}</span></td>
                            <td className="px-4 py-3">
                              <span className={`text-xs px-2 py-0.5 rounded-full capitalize ${
                                e.status === 'active' ? 'bg-green-500/10 text-green-400' :
                                e.status === 'leave' ? 'bg-yellow-500/10 text-yellow-500' :
                                'bg-red-500/10 text-red-400'
                              }`}>{e.status}</span>
                            </td>
                            <td className="px-4 py-3 text-sm font-medium text-white text-right">{fmt(e.baseSalary)}</td>
                          </tr>
                        ))}
                        {!d.employees.length && <tr><td colSpan={4} className="px-4 py-8 text-center text-gray-500">No employees found</td></tr>}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
