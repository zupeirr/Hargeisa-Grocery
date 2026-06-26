import { useState, useEffect, useCallback } from 'react';
import {
  DollarSign, TrendingUp, TrendingDown, CreditCard,
  ArrowUpRight, ArrowDownRight, Download, RefreshCw,
  Calendar, Receipt, BarChart2, FileText, AlertCircle
} from 'lucide-react';
import {
  getFinancialIncome, getFinancialPL, getFinancialTax,
  getFinancialPayments, DateRange
} from '../../data/adminStore';

// ─── Types ────────────────────────────────────────────────────────────────────

type TabId = 'income' | 'pl' | 'tax' | 'payments';

const TABS: { id: TabId; label: string; icon: React.ReactNode }[] = [
  { id: 'income',   label: 'Income',        icon: <TrendingUp size={15} /> },
  { id: 'pl',       label: 'Profit & Loss',  icon: <BarChart2 size={15} /> },
  { id: 'tax',      label: 'Tax Report',     icon: <Receipt size={15} /> },
  { id: 'payments', label: 'Payments',       icon: <CreditCard size={15} /> },
];

const PAYMENT_COLORS: Record<string, string> = {
  zaad:   '#3b82f6',
  evc:    '#f97316',
  edahab: '#a855f7',
  cod:    '#6b7280',
  unknown:'#374151',
};

const today = new Date().toISOString().split('T')[0];
const thirtyDaysAgo = (() => {
  const d = new Date(); d.setDate(d.getDate() - 30); return d.toISOString().split('T')[0];
})();

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmt(n: number) { return `$${n.toFixed(2)}`; }
function pct(n: number) { return `${n.toFixed(1)}%`; }

function exportCSV(rows: Record<string, any>[], filename: string) {
  if (!rows.length) return;
  const headers = Object.keys(rows[0]);
  const csv = [headers.join(','), ...rows.map(r =>
    headers.map(h => JSON.stringify(r[h] ?? '')).join(',')
  )].join('\n');
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
  a.download = filename; a.click();
}

// ─── Reusable UI ──────────────────────────────────────────────────────────────

function KpiCard({ label, value, sub, color = 'green', icon, trend }: {
  label: string; value: string; sub?: string; color?: string;
  icon: React.ReactNode; trend?: number;
}) {
  const colors: Record<string, string> = {
    green:  'text-green-500 bg-green-500/10',
    red:    'text-red-400  bg-red-500/10',
    blue:   'text-blue-400 bg-blue-500/10',
    yellow: 'text-yellow-500 bg-yellow-500/10',
    purple: 'text-purple-400 bg-purple-500/10',
    gray:   'text-gray-400 bg-gray-700/50',
  };
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
      <div className="flex items-start justify-between mb-3">
        <div className={`p-2.5 rounded-lg ${colors[color]}`}>{icon}</div>
        {trend !== undefined && (
          <span className={`flex items-center text-xs font-medium ${trend >= 0 ? 'text-green-500' : 'text-red-400'}`}>
            {trend >= 0 ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
            {Math.abs(trend).toFixed(1)}%
          </span>
        )}
      </div>
      <p className="text-2xl font-bold text-white">{value}</p>
      <p className="text-sm text-gray-400 mt-0.5">{label}</p>
      {sub && <p className="text-xs text-gray-500 mt-1">{sub}</p>}
    </div>
  );
}

function PLRow({ label, value, indent = 0, bold = false, color = 'white', border = false }: {
  label: string; value: number; indent?: number; bold?: boolean; color?: string; border?: boolean;
}) {
  return (
    <div className={`flex justify-between items-center py-2 ${border ? 'border-t border-gray-700 mt-1 pt-3' : ''}`}
      style={{ paddingLeft: indent * 16 }}>
      <span className={`text-sm ${bold ? 'font-bold text-white' : 'text-gray-300'}`}>{label}</span>
      <span className={`text-sm font-${bold ? 'bold' : 'medium'} text-${color}`}>
        {value >= 0 ? fmt(value) : `-${fmt(Math.abs(value))}`}
      </span>
    </div>
  );
}

function ProgressBar({ label, value, total, color = '#22c55e' }: {
  label: string; value: number; total: number; color?: string;
}) {
  const w = total > 0 ? (value / total) * 100 : 0;
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-sm">
        <span className="text-gray-300 truncate max-w-[60%] capitalize">{label}</span>
        <span className="text-white font-medium">{fmt(value)}</span>
      </div>
      <div className="w-full bg-gray-800 rounded-full h-2">
        <div className="h-2 rounded-full transition-all duration-500"
          style={{ width: `${w}%`, backgroundColor: color }} />
      </div>
    </div>
  );
}

function MiniBarChart({ data, xKey, yKey, color = '#22c55e' }: {
  data: any[]; xKey: string; yKey: string; color?: string;
}) {
  if (!data.length) return (
    <div className="h-40 flex items-center justify-center text-gray-500 text-sm">No data for period</div>
  );
  const max = Math.max(...data.map(d => d[yKey] || 0), 1);
  return (
    <div className="flex items-end gap-1 h-40">
      {data.map((d, i) => {
        const h = (d[yKey] / max) * 100;
        return (
          <div key={i} className="flex-1 flex flex-col items-center justify-end group relative min-w-0">
            <div title={`${d[xKey]}: ${fmt(d[yKey])}`}
              className="w-full rounded-t-sm hover:opacity-70 transition-opacity cursor-pointer"
              style={{ height: `${h}%`, minHeight: 3, backgroundColor: color }} />
            <span className="text-[9px] text-gray-500 mt-1 truncate w-full text-center">
              {String(d[xKey]).slice(-5)}
            </span>
          </div>
        );
      })}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function FinancialPage() {
  const [activeTab, setActiveTab] = useState<TabId>('income');
  const [data, setData] = useState<Record<TabId, any>>({} as any);
  const [isLoading, setIsLoading] = useState(false);
  const [range, setRange] = useState<DateRange>({ startDate: thirtyDaysAgo, endDate: today });
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToast(msg); setTimeout(() => setToast(null), 3500);
  };

  const fetchTab = useCallback(async (tab: TabId) => {
    setIsLoading(true);
    try {
      let result: any;
      if (tab === 'income')   result = await getFinancialIncome(range);
      if (tab === 'pl')       result = await getFinancialPL(range);
      if (tab === 'tax')      result = await getFinancialTax(range);
      if (tab === 'payments') result = await getFinancialPayments(range);
      setData(prev => ({ ...prev, [tab]: result }));
    } catch (err: any) {
      showToast(err?.message || 'Failed to load financial data');
    } finally {
      setIsLoading(false);
    }
  }, [range]);

  useEffect(() => { fetchTab(activeTab); }, [activeTab, fetchTab]);

  const d = data[activeTab];

  return (
    <div className="space-y-6">
      {/* Toast */}
      {toast && (
        <div className="fixed top-6 right-6 z-50 bg-red-600 text-white px-5 py-3 rounded-lg shadow-xl text-sm font-medium flex items-center gap-2">
          <AlertCircle size={16} /> {toast}
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Financial Management</h1>
          <p className="text-sm text-gray-400 mt-0.5">Income, P&L, Tax & Payment tracking</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-2 bg-gray-900 border border-gray-800 rounded-lg px-3 py-2">
            <Calendar size={14} className="text-gray-400 flex-shrink-0" />
            <input type="date" value={range.startDate}
              onChange={e => setRange(r => ({ ...r, startDate: e.target.value }))}
              className="bg-transparent text-white text-sm outline-none w-32" />
            <span className="text-gray-600">→</span>
            <input type="date" value={range.endDate}
              onChange={e => setRange(r => ({ ...r, endDate: e.target.value }))}
              className="bg-transparent text-white text-sm outline-none w-32" />
          </div>
          <button onClick={() => fetchTab(activeTab)}
            className="flex items-center gap-1.5 px-3 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg text-sm transition-colors">
            <RefreshCw size={14} /> Refresh
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-900 border border-gray-800 rounded-xl p-1 overflow-x-auto">
        {TABS.map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
              activeTab === t.id
                ? 'bg-gray-800 text-green-400 shadow'
                : 'text-gray-500 hover:text-gray-300 hover:bg-gray-800/50'
            }`}>
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="flex justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500" />
        </div>
      )}

      {/* ── INCOME ──────────────────────────────────────────────────────────── */}
      {!isLoading && activeTab === 'income' && d && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <KpiCard label="Total Revenue"     value={fmt(d.summary.totalRevenue)}    icon={<DollarSign size={18} />} color="green" />
            <KpiCard label="Total Orders"      value={String(d.summary.totalOrders)}  icon={<TrendingUp size={18} />} color="blue" />
            <KpiCard label="Avg Order Value"   value={fmt(d.summary.avgOrderValue)}   icon={<BarChart2 size={18} />}  color="purple" />
            <KpiCard label="Unique Customers"  value={String(d.summary.uniqueCustomers)} icon={<FileText size={18} />} color="yellow" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Daily trend */}
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-white">Daily Revenue</h3>
                <button onClick={() => exportCSV(d.dailyTrend, 'income-daily.csv')}
                  className="flex items-center gap-1 text-xs text-gray-400 hover:text-white transition-colors">
                  <Download size={12} /> CSV
                </button>
              </div>
              <MiniBarChart data={d.dailyTrend} xKey="date" yKey="revenue" />
            </div>

            {/* By payment method */}
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
              <h3 className="font-bold text-white mb-5">Revenue by Payment Method</h3>
              <div className="space-y-4">
                {d.byPaymentMethod.map((m: any) => (
                  <ProgressBar key={m.method} label={`${m.method} (${m.count} orders)`}
                    value={m.total} total={d.summary.totalRevenue}
                    color={PAYMENT_COLORS[m.method] || '#22c55e'} />
                ))}
                {!d.byPaymentMethod.length && (
                  <p className="text-gray-500 text-sm text-center py-8">No orders in this period</p>
                )}
              </div>
            </div>
          </div>

          {/* Recent orders table */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
            <div className="flex justify-between items-center p-4 border-b border-gray-800">
              <h3 className="font-bold text-white">Recent Orders</h3>
              <button onClick={() => exportCSV(d.recentOrders, 'recent-orders.csv')}
                className="flex items-center gap-1 text-xs text-gray-400 hover:text-white"><Download size={12} /> CSV</button>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="bg-gray-800/50">
                  <tr>
                    {['Order ID', 'Customer', 'Amount', 'Method', 'Status', 'Date'].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-xs text-gray-400 uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800">
                  {d.recentOrders.map((o: any, i: number) => (
                    <tr key={i} className="hover:bg-gray-800/30">
                      <td className="px-4 py-3 text-sm font-mono text-gray-400">{o.id}</td>
                      <td className="px-4 py-3 text-sm text-white">{o.customer}</td>
                      <td className="px-4 py-3 text-sm font-medium text-green-400">{fmt(o.total)}</td>
                      <td className="px-4 py-3">
                        <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 capitalize">{o.paymentMethod}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-0.5 rounded-full capitalize ${
                          o.status === 'delivered' ? 'bg-green-500/10 text-green-400' :
                          o.status === 'cancelled' ? 'bg-red-500/10 text-red-400' :
                          'bg-yellow-500/10 text-yellow-500'
                        }`}>{o.status}</span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-400">{new Date(o.date).toLocaleDateString()}</td>
                    </tr>
                  ))}
                  {!d.recentOrders.length && (
                    <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-500">No orders in this period</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ── PROFIT & LOSS ────────────────────────────────────────────────────── */}
      {!isLoading && activeTab === 'pl' && d && (
        <div className="space-y-6">
          {/* Summary KPIs */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <KpiCard label="Gross Revenue"     value={fmt(d.income.grossRevenue)}   icon={<TrendingUp size={18} />}   color="green" />
            <KpiCard label="Gross Profit"      value={fmt(d.grossProfit)}           icon={<DollarSign size={18} />}   color={d.grossProfit >= 0 ? 'blue' : 'red'}
              sub={`Margin: ${pct(d.grossMargin)}`} />
            <KpiCard label="Operating Profit"  value={fmt(d.operatingProfit)}       icon={<BarChart2 size={18} />}    color={d.operatingProfit >= 0 ? 'purple' : 'red'} />
            <KpiCard label="Net Profit"        value={fmt(d.netProfit)}             icon={<TrendingUp size={18} />}   color={d.netProfit >= 0 ? 'green' : 'red'}
              sub={`Net margin: ${pct(d.netMargin)}`} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* P&L Statement */}
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-white">P&L Statement</h3>
                <button onClick={() => exportCSV([{
                  'Gross Revenue': d.income.grossRevenue,
                  'COGS': d.cogs.total,
                  'Gross Profit': d.grossProfit,
                  'Payroll': d.operatingExpenses.payroll,
                  'Other Expenses': d.operatingExpenses.otherExpenses,
                  'Operating Profit': d.operatingProfit,
                  'Net Profit': d.netProfit,
                }], 'pl-statement.csv')}
                  className="flex items-center gap-1 text-xs text-gray-400 hover:text-white"><Download size={12} /> CSV</button>
              </div>
              <div className="space-y-1 font-mono text-sm">
                <PLRow label="Gross Revenue"        value={d.income.grossRevenue}                 bold color="green-400" />
                <div className="border-t border-gray-800 my-2" />
                <PLRow label="Cost of Goods Sold"   value={-d.cogs.total}                          color="red-400" />
                <PLRow label="Gross Profit"          value={d.grossProfit}   bold border color={d.grossProfit >= 0 ? 'green-400' : 'red-400'} />
                <div className="border-t border-gray-800 my-2" />
                <PLRow label="Operating Expenses"   value={0}               bold />
                <PLRow label="  Payroll & Salaries" value={-d.operatingExpenses.payroll}           indent={1} color="red-400" />
                <PLRow label="  Other Expenses"     value={-d.operatingExpenses.otherExpenses}    indent={1} color="red-400" />
                <PLRow label="Total OpEx"            value={-d.operatingExpenses.total}            border color="red-400" />
                <PLRow label="Operating Profit"      value={d.operatingProfit} bold border color={d.operatingProfit >= 0 ? 'green-400' : 'red-400'} />
                <div className="border-t-2 border-gray-600 my-2" />
                <PLRow label="NET PROFIT"            value={d.netProfit}     bold color={d.netProfit >= 0 ? 'green-400' : 'red-400'} />
              </div>
            </div>

            {/* Charts */}
            <div className="space-y-5">
              <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
                <h3 className="font-bold text-white mb-4">Monthly Revenue vs Costs</h3>
                <MiniBarChart data={d.monthlyTrend} xKey="month" yKey="revenue" color="#22c55e" />
              </div>
              <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
                <h3 className="font-bold text-white mb-4">Expense Breakdown</h3>
                <div className="space-y-3">
                  {d.operatingExpenses.byCategory.map((c: any) => (
                    <ProgressBar key={c.category} label={c.category}
                      value={c.amount} total={d.operatingExpenses.otherExpenses || 1} color="#ef4444" />
                  ))}
                  {!d.operatingExpenses.byCategory.length && (
                    <p className="text-gray-500 text-sm text-center py-4">No expenses in period</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── TAX REPORT ───────────────────────────────────────────────────────── */}
      {!isLoading && activeTab === 'tax' && d && (
        <div className="space-y-6">
          {d.taxRate === 0 && (
            <div className="flex items-start gap-3 bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4">
              <AlertCircle size={18} className="text-yellow-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-yellow-400 font-medium text-sm">Tax Rate Not Configured</p>
                <p className="text-yellow-500/70 text-xs mt-0.5">
                  Go to <strong>Settings</strong> and set a <strong>taxRate</strong> (e.g. 5 for 5% VAT) to see tax calculations.
                </p>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <KpiCard label="Tax Rate"         value={`${d.taxRate}%`}              icon={<Receipt size={18} />}     color="yellow" />
            <KpiCard label="Gross Revenue"    value={fmt(d.summary.grossRevenue)}  icon={<TrendingUp size={18} />}  color="green" />
            <KpiCard label="Tax Collected"    value={fmt(d.summary.taxCollected)}  icon={<DollarSign size={18} />}  color="red" />
            <KpiCard label="Net (ex-tax)"     value={fmt(d.summary.netBeforeTax)}  icon={<TrendingDown size={18} />} color="blue" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-white">Monthly Tax Summary</h3>
                <button onClick={() => exportCSV(d.byMonth, 'tax-monthly.csv')}
                  className="flex items-center gap-1 text-xs text-gray-400 hover:text-white"><Download size={12} /> CSV</button>
              </div>
              <MiniBarChart data={d.byMonth} xKey="month" yKey="tax" color="#eab308" />
            </div>

            <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
              <div className="p-4 border-b border-gray-800">
                <h3 className="font-bold text-white">Monthly Breakdown</h3>
              </div>
              <table className="min-w-full">
                <thead className="bg-gray-800/50">
                  <tr>
                    {['Month', 'Gross', 'Tax', 'Net'].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-xs text-gray-400 uppercase">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800">
                  {d.byMonth.map((m: any, i: number) => (
                    <tr key={i} className="hover:bg-gray-800/30">
                      <td className="px-4 py-3 text-sm text-white">{m.month}</td>
                      <td className="px-4 py-3 text-sm font-medium text-green-400">{fmt(m.gross)}</td>
                      <td className="px-4 py-3 text-sm font-medium text-yellow-500">{fmt(m.tax)}</td>
                      <td className="px-4 py-3 text-sm font-medium text-blue-400">{fmt(m.net)}</td>
                    </tr>
                  ))}
                  {!d.byMonth.length && (
                    <tr><td colSpan={4} className="px-4 py-8 text-center text-gray-500">No orders in this period</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ── PAYMENTS ─────────────────────────────────────────────────────────── */}
      {!isLoading && activeTab === 'payments' && d && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <KpiCard label="Total Collected"  value={fmt(d.summary.totalCollected)}  icon={<DollarSign size={18} />}  color="green" />
            <KpiCard label="Orders"           value={String(d.summary.totalOrders)}  icon={<TrendingUp size={18} />}  color="blue" />
            <KpiCard label="Avg Transaction"  value={fmt(d.summary.avgTransaction)}  icon={<CreditCard size={18} />}  color="purple" />
            <KpiCard label="Top Method"       value={d.summary.topMethod}            icon={<BarChart2 size={18} />}   color="yellow" sub="by revenue" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Method breakdown */}
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
              <h3 className="font-bold text-white mb-5">Payment Methods</h3>
              <div className="space-y-4">
                {d.byMethod.map((m: any) => (
                  <div key={m.method} className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full flex-shrink-0"
                          style={{ backgroundColor: PAYMENT_COLORS[m.method] || '#6b7280' }} />
                        <span className="text-gray-300 capitalize">{m.method}</span>
                        <span className="text-gray-600 text-xs">({m.count} orders)</span>
                      </div>
                      <div className="text-right">
                        <span className="text-white font-medium">{fmt(m.total)}</span>
                        <span className="text-gray-500 text-xs ml-1">{pct(m.share)}</span>
                      </div>
                    </div>
                    <div className="w-full bg-gray-800 rounded-full h-2.5">
                      <div className="h-2.5 rounded-full transition-all duration-500"
                        style={{ width: `${m.share}%`, backgroundColor: PAYMENT_COLORS[m.method] || '#6b7280' }} />
                    </div>
                  </div>
                ))}
                {!d.byMethod.length && (
                  <p className="text-gray-500 text-sm text-center py-8">No payments in this period</p>
                )}
              </div>
            </div>

            {/* Order status breakdown */}
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
              <h3 className="font-bold text-white mb-5">Orders by Status</h3>
              <div className="space-y-3">
                {d.byStatus.map((s: any) => {
                  const colors: Record<string, string> = {
                    delivered: '#22c55e', cancelled: '#ef4444', pending: '#eab308',
                    confirmed: '#3b82f6', preparing: '#8b5cf6', 'out-for-delivery': '#06b6d4',
                  };
                  const total = d.byStatus.reduce((sum: number, x: any) => sum + x.count, 0);
                  return (
                    <ProgressBar key={s.status} label={s.status} value={s.count} total={total}
                      color={colors[s.status] || '#6b7280'} />
                  );
                })}
              </div>
            </div>
          </div>

          {/* Payment records table */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
            <div className="flex justify-between items-center p-4 border-b border-gray-800">
              <h3 className="font-bold text-white">Payment Records</h3>
              <button onClick={() => exportCSV(d.recentPayments, 'payment-records.csv')}
                className="flex items-center gap-1 text-xs text-gray-400 hover:text-white"><Download size={12} /> CSV</button>
            </div>
            <div className="overflow-x-auto max-h-96 overflow-y-auto">
              <table className="min-w-full">
                <thead className="bg-gray-800/50 sticky top-0">
                  <tr>
                    {['Order', 'Customer', 'Amount', 'Method', 'Status', 'Date'].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-xs text-gray-400 uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800">
                  {d.recentPayments.map((p: any, i: number) => (
                    <tr key={i} className="hover:bg-gray-800/30">
                      <td className="px-4 py-3 text-sm font-mono text-gray-400">{p.id}…</td>
                      <td className="px-4 py-3 text-sm text-white">{p.customer}</td>
                      <td className="px-4 py-3 text-sm font-bold text-green-400">{fmt(p.amount)}</td>
                      <td className="px-4 py-3">
                        <span className="text-xs px-2 py-0.5 rounded-full capitalize"
                          style={{ backgroundColor: `${PAYMENT_COLORS[p.method] || '#374151'}20`, color: PAYMENT_COLORS[p.method] || '#9ca3af' }}>
                          {p.method}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-0.5 rounded-full capitalize ${
                          p.status === 'delivered' ? 'bg-green-500/10 text-green-400' :
                          p.status === 'cancelled' ? 'bg-red-500/10 text-red-400' :
                          'bg-yellow-500/10 text-yellow-500'
                        }`}>{p.status}</span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-400">{new Date(p.date).toLocaleDateString()}</td>
                    </tr>
                  ))}
                  {!d.recentPayments.length && (
                    <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-500">No payments in this period</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
