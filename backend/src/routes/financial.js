const express = require('express');
const router = express.Router();
const prisma = require('../lib/prisma');

// ─── Helper: parse date range from query ─────────────────────────────────────
function dateRange(query) {
  const now = new Date();
  const start = new Date(); start.setDate(now.getDate() - 30);
  return {
    gte: query.startDate ? new Date(query.startDate) : start,
    lte: query.endDate   ? new Date(query.endDate)   : now,
  };
}

// ─── Helper: get tax rate from settings ──────────────────────────────────────
async function getTaxRate() {
  try {
    const setting = await prisma.setting.findUnique({ where: { key: 'taxRate' } });
    return setting ? parseFloat(setting.value) || 0 : 0;
  } catch { return 0; }
}

// ─── 1. Income Tracking ───────────────────────────────────────────────────────
// GET /api/financial/income?startDate=&endDate=&groupBy=day|week|month
router.get('/income', async (req, res) => {
  try {
    const range = dateRange(req.query);
    const orders = await prisma.order.findMany({
      where: { createdAt: range, status: { notIn: ['cancelled'] } },
      include: { customer: { select: { name: true } } },
      orderBy: { createdAt: 'asc' },
    });

    // Group by day
    const byDay = {};
    orders.forEach(o => {
      const d = o.createdAt.toISOString().split('T')[0];
      if (!byDay[d]) byDay[d] = { date: d, revenue: 0, orders: 0 };
      byDay[d].revenue += o.total;
      byDay[d].orders  += 1;
    });

    // Group by payment method
    const byPayment = {};
    orders.forEach(o => {
      const m = o.paymentMethod || 'unknown';
      if (!byPayment[m]) byPayment[m] = { method: m, total: 0, count: 0 };
      byPayment[m].total += o.total;
      byPayment[m].count += 1;
    });

    const totalRevenue = orders.reduce((s, o) => s + o.total, 0);

    res.json({
      summary: {
        totalRevenue,
        totalOrders: orders.length,
        avgOrderValue: orders.length ? totalRevenue / orders.length : 0,
        uniqueCustomers: new Set(orders.map(o => o.customerId)).size,
      },
      dailyTrend: Object.values(byDay),
      byPaymentMethod: Object.values(byPayment),
      recentOrders: orders.slice(-20).reverse().map(o => ({
        id: o.id,
        customer: o.customer?.name || '—',
        total: o.total,
        paymentMethod: o.paymentMethod,
        status: o.status,
        date: o.createdAt,
      })),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch income data' });
  }
});

// ─── 2. Profit & Loss Statement ───────────────────────────────────────────────
// GET /api/financial/pl?startDate=&endDate=
router.get('/pl', async (req, res) => {
  try {
    const range = dateRange(req.query);

    const [orders, expenses, salaries, purchaseOrders] = await Promise.all([
      prisma.order.findMany({
        where: { createdAt: range, status: { notIn: ['cancelled'] } },
      }),
      prisma.expense.findMany({ where: { date: range } }),
      prisma.salaryRecord.findMany({ where: { paymentDate: range } }),
      prisma.purchaseOrder.findMany({
        where: { orderDate: range, status: { not: 'cancelled' } },
      }),
    ]);

    // Income
    const grossRevenue   = orders.reduce((s, o) => s + o.total, 0);

    // Costs
    const cogs           = purchaseOrders.reduce((s, p) => s + p.totalAmount, 0);
    const grossProfit    = grossRevenue - cogs;
    const grossMargin    = grossRevenue > 0 ? (grossProfit / grossRevenue) * 100 : 0;

    // Operating expenses
    const payroll        = salaries.reduce((s, r) => s + r.amount + r.bonus - r.deduction, 0);
    const opExpenses     = expenses.reduce((s, e) => s + e.amount, 0);
    const totalOpEx      = payroll + opExpenses;

    const operatingProfit = grossProfit - totalOpEx;
    const netProfit       = operatingProfit; // (no interest/tax line for now)
    const netMargin       = grossRevenue > 0 ? (netProfit / grossRevenue) * 100 : 0;

    // Expense breakdown by category
    const expByCategory = {};
    expenses.forEach(e => { expByCategory[e.category] = (expByCategory[e.category] || 0) + e.amount; });

    // Monthly trend for chart
    const byMonth = {};
    orders.forEach(o => {
      const m = o.createdAt.toISOString().slice(0, 7);
      if (!byMonth[m]) byMonth[m] = { month: m, revenue: 0, costs: 0 };
      byMonth[m].revenue += o.total;
    });
    expenses.forEach(e => {
      const m = e.date.toISOString().slice(0, 7);
      if (!byMonth[m]) byMonth[m] = { month: m, revenue: 0, costs: 0 };
      byMonth[m].costs += e.amount;
    });

    res.json({
      period: { from: range.gte, to: range.lte },
      income: {
        grossRevenue,
        label: 'Gross Revenue',
      },
      cogs: {
        total: cogs,
        label: 'Cost of Goods Sold (Purchases)',
      },
      grossProfit,
      grossMargin,
      operatingExpenses: {
        payroll,
        otherExpenses: opExpenses,
        byCategory: Object.entries(expByCategory).map(([cat, amt]) => ({ category: cat, amount: amt })),
        total: totalOpEx,
      },
      operatingProfit,
      netProfit,
      netMargin,
      monthlyTrend: Object.values(byMonth).sort((a, b) => a.month.localeCompare(b.month)),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to generate P&L report' });
  }
});

// ─── 3. Tax Report ────────────────────────────────────────────────────────────
// GET /api/financial/tax?startDate=&endDate=
router.get('/tax', async (req, res) => {
  try {
    const range    = dateRange(req.query);
    const taxRate  = await getTaxRate();          // e.g. 5 = 5%
    const taxMult  = taxRate / 100;

    const orders = await prisma.order.findMany({
      where: { createdAt: range, status: { notIn: ['cancelled'] } },
      orderBy: { createdAt: 'asc' },
    });

    const grossRevenue = orders.reduce((s, o) => s + o.total, 0);
    // Treat order totals as tax-inclusive: tax = total × rate / (1 + rate)
    const taxCollected = taxRate > 0
      ? grossRevenue * taxMult / (1 + taxMult)
      : 0;
    const netBeforeTax = grossRevenue - taxCollected;

    // Group by month
    const byMonth = {};
    orders.forEach(o => {
      const m = o.createdAt.toISOString().slice(0, 7);
      if (!byMonth[m]) byMonth[m] = { month: m, gross: 0, tax: 0, net: 0 };
      const t = taxRate > 0 ? o.total * taxMult / (1 + taxMult) : 0;
      byMonth[m].gross += o.total;
      byMonth[m].tax   += t;
      byMonth[m].net   += o.total - t;
    });

    res.json({
      taxRate,
      summary: {
        grossRevenue,
        taxCollected,
        netBeforeTax,
        orderCount: orders.length,
      },
      byMonth: Object.values(byMonth).sort((a, b) => a.month.localeCompare(b.month)),
      notice: taxRate === 0
        ? 'Tax rate is 0%. Configure it in Settings → Tax Rate.'
        : `${taxRate}% VAT applied to all non-cancelled orders.`,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to generate tax report' });
  }
});

// ─── 4. Payment Records ───────────────────────────────────────────────────────
// GET /api/financial/payments?startDate=&endDate=
router.get('/payments', async (req, res) => {
  try {
    const range = dateRange(req.query);
    const orders = await prisma.order.findMany({
      where: { createdAt: range, status: { notIn: ['cancelled'] } },
      include: { customer: { select: { name: true } } },
      orderBy: { createdAt: 'desc' },
    });

    // Breakdown by payment method
    const byMethod = {};
    orders.forEach(o => {
      const m = o.paymentMethod || 'unknown';
      if (!byMethod[m]) byMethod[m] = { method: m, total: 0, count: 0, share: 0 };
      byMethod[m].total += o.total;
      byMethod[m].count += 1;
    });

    const grandTotal = orders.reduce((s, o) => s + o.total, 0);
    Object.values(byMethod).forEach(m => {
      m.share = grandTotal > 0 ? (m.total / grandTotal) * 100 : 0;
    });

    // Status breakdown
    const allOrders = await prisma.order.findMany({ where: { createdAt: range } });
    const byStatus = {};
    allOrders.forEach(o => {
      byStatus[o.status] = (byStatus[o.status] || 0) + 1;
    });

    res.json({
      summary: {
        totalCollected:  grandTotal,
        totalOrders:     orders.length,
        avgTransaction:  orders.length ? grandTotal / orders.length : 0,
        topMethod: Object.values(byMethod).sort((a, b) => b.total - a.total)[0]?.method || '—',
      },
      byMethod: Object.values(byMethod).sort((a, b) => b.total - a.total),
      byStatus: Object.entries(byStatus).map(([status, count]) => ({ status, count })),
      recentPayments: orders.slice(0, 30).map(o => ({
        id:            o.id.slice(0, 8),
        customer:      o.customer?.name || '—',
        amount:        o.total,
        method:        o.paymentMethod,
        status:        o.status,
        date:          o.createdAt,
      })),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch payment records' });
  }
});

module.exports = router;
