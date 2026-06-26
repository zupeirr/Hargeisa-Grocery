const express = require('express');
const router = express.Router();
const prisma = require('../lib/prisma');

// ─── Helpers ─────────────────────────────────────────────────────────────────

function parseDateRange(query) {
  const now = new Date();
  const thirtyDaysAgo = new Date(); thirtyDaysAgo.setDate(now.getDate() - 30);
  return {
    gte: query.startDate ? new Date(query.startDate) : thirtyDaysAgo,
    lte: query.endDate   ? new Date(query.endDate)   : now,
  };
}

// ─── 1. Sales Report ─────────────────────────────────────────────────────────

router.get('/sales', async (req, res) => {
  try {
    const range = parseDateRange(req.query);
    const orders = await prisma.order.findMany({
      where: { createdAt: range, status: { not: 'cancelled' } },
      include: { items: { include: { product: true } }, customer: true },
      orderBy: { createdAt: 'asc' }
    });

    // Group by day
    const byDay = {};
    orders.forEach(o => {
      const d = o.createdAt.toISOString().split('T')[0];
      if (!byDay[d]) byDay[d] = { date: d, revenue: 0, orders: 0 };
      byDay[d].revenue += o.total;
      byDay[d].orders  += 1;
    });

    // Top products
    const productSales = {};
    orders.forEach(o => o.items.forEach(item => {
      const pid = item.productId;
      if (!productSales[pid]) productSales[pid] = { name: item.product?.name || pid, qty: 0, revenue: 0 };
      productSales[pid].qty     += item.quantity;
      productSales[pid].revenue += item.price * item.quantity;
    }));

    res.json({
      summary: {
        totalRevenue: orders.reduce((s, o) => s + o.total, 0),
        totalOrders: orders.length,
        avgOrderValue: orders.length ? orders.reduce((s, o) => s + o.total, 0) / orders.length : 0,
        uniqueCustomers: new Set(orders.map(o => o.customerId)).size,
      },
      chartData: Object.values(byDay),
      topProducts: Object.values(productSales)
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 10),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error fetching sales reports' });
  }
});

// ─── 2. Profit / Financial Report ────────────────────────────────────────────

router.get('/profit', async (req, res) => {
  try {
    const range = parseDateRange(req.query);

    const [orders, expenses, salaries, pos] = await Promise.all([
      prisma.order.findMany({ where: { createdAt: range, status: { not: 'cancelled' } } }),
      prisma.expense.findMany({ where: { date: range } }),
      prisma.salaryRecord.findMany({ where: { paymentDate: range } }),
      prisma.purchaseOrder.findMany({ where: { orderDate: range, status: { not: 'cancelled' } } }),
    ]);

    const totalRevenue    = orders.reduce((s, o)  => s + o.total, 0);
    const totalExpenses   = expenses.reduce((s, e) => s + e.amount, 0);
    const totalSalaries   = salaries.reduce((s, r) => s + r.amount + r.bonus - r.deduction, 0);
    const totalPurchases  = pos.reduce((s, p)     => s + p.totalAmount, 0);
    const totalCosts      = totalExpenses + totalSalaries + totalPurchases;

    // Expense breakdown by category
    const expByCategory = {};
    expenses.forEach(e => { expByCategory[e.category] = (expByCategory[e.category] || 0) + e.amount; });

    res.json({
      revenue:   totalRevenue,
      costs: {
        operatingExpenses:  totalExpenses,
        payroll:            totalSalaries,
        inventoryPurchases: totalPurchases,
        total:              totalCosts,
        byCategory: Object.entries(expByCategory).map(([cat, amt]) => ({ category: cat, amount: amt })),
      },
      netProfit:    totalRevenue - totalCosts,
      profitMargin: totalRevenue > 0 ? ((totalRevenue - totalCosts) / totalRevenue) * 100 : 0,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error fetching profit reports' });
  }
});

// ─── 3. Inventory Report ─────────────────────────────────────────────────────

router.get('/inventory', async (req, res) => {
  try {
    const products = await prisma.product.findMany({
      orderBy: { stockLevel: 'asc' },
    });

    const lowStock    = products.filter(p => p.stockLevel <= p.lowStockAlert);
    const outOfStock  = products.filter(p => !p.inStock || p.stockLevel === 0);
    const damaged     = products.filter(p => p.isDamaged && p.damagedQty > 0);
    const expiringSoon = products.filter(p => {
      if (!p.expiryDate) return false;
      const daysLeft = (new Date(p.expiryDate) - new Date()) / (1000 * 60 * 60 * 24);
      return daysLeft > 0 && daysLeft <= 30;
    });

    res.json({
      summary: {
        totalProducts:  products.length,
        totalStockValue: products.reduce((s, p) => s + p.stockLevel * p.price, 0),
        lowStockCount:  lowStock.length,
        outOfStockCount: outOfStock.length,
        damagedCount:   damaged.length,
        expiringSoonCount: expiringSoon.length,
      },
      lowStock: lowStock.map(p => ({ id: p.id, name: p.name, stockLevel: p.stockLevel, lowStockAlert: p.lowStockAlert, category: p.category })),
      outOfStock: outOfStock.map(p => ({ id: p.id, name: p.name, category: p.category })),
      damaged: damaged.map(p => ({ id: p.id, name: p.name, damagedQty: p.damagedQty, damagedReason: p.damagedReason })),
      expiringSoon: expiringSoon.map(p => ({
        id: p.id, name: p.name, expiryDate: p.expiryDate,
        daysLeft: Math.ceil((new Date(p.expiryDate) - new Date()) / (1000 * 60 * 60 * 24)),
      })),
      stockByCategory: products.reduce((acc, p) => {
        acc[p.category] = (acc[p.category] || 0) + p.stockLevel;
        return acc;
      }, {}),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error fetching inventory reports' });
  }
});

// ─── 4. Customer Report ───────────────────────────────────────────────────────

router.get('/customers', async (req, res) => {
  try {
    const range = parseDateRange(req.query);

    const [customers, newCustomers, orders] = await Promise.all([
      prisma.customer.findMany({ orderBy: { totalSpent: 'desc' } }),
      prisma.customer.findMany({ where: { createdAt: range } }),
      prisma.order.findMany({ where: { createdAt: range, status: { not: 'cancelled' } } }),
    ]);

    const bySegment = customers.reduce((acc, c) => {
      acc[c.segment] = (acc[c.segment] || 0) + 1;
      return acc;
    }, {});

    res.json({
      summary: {
        totalCustomers: customers.length,
        newCustomers:   newCustomers.length,
        activeCustomers: customers.filter(c => c.totalOrders > 0).length,
        avgLifetimeValue: customers.length
          ? customers.reduce((s, c) => s + c.totalSpent, 0) / customers.length
          : 0,
      },
      topCustomers: customers.slice(0, 10).map(c => ({
        id: c.id, name: c.name, email: c.email,
        totalOrders: c.totalOrders, totalSpent: c.totalSpent, segment: c.segment,
      })),
      bySegment: Object.entries(bySegment).map(([segment, count]) => ({ segment, count })),
      ordersInRange: orders.length,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error fetching customer reports' });
  }
});

// ─── 5. Supplier Report ───────────────────────────────────────────────────────

router.get('/suppliers', async (req, res) => {
  try {
    const range = parseDateRange(req.query);

    const [suppliers, pos] = await Promise.all([
      prisma.supplier.findMany({ include: { _count: { select: { purchaseOrders: true, products: true } } } }),
      prisma.purchaseOrder.findMany({
        where: { orderDate: range },
        include: { supplier: true },
        orderBy: { orderDate: 'desc' },
      }),
    ]);

    const spendBySupplier = {};
    pos.forEach(po => {
      const sid = po.supplierId;
      if (!spendBySupplier[sid]) spendBySupplier[sid] = { name: po.supplier?.name || sid, total: 0, orders: 0 };
      spendBySupplier[sid].total  += po.totalAmount;
      spendBySupplier[sid].orders += 1;
    });

    res.json({
      summary: {
        totalSuppliers: suppliers.length,
        totalPOsInRange: pos.length,
        totalSpendInRange: pos.reduce((s, p) => s + p.totalAmount, 0),
        pendingPOs: pos.filter(p => p.status === 'draft' || p.status === 'sent').length,
      },
      topSuppliers: Object.values(spendBySupplier).sort((a, b) => b.total - a.total).slice(0, 10),
      recentPOs: pos.slice(0, 20).map(po => ({
        id: po.id, supplier: po.supplier?.name, status: po.status,
        totalAmount: po.totalAmount, paymentStatus: po.paymentStatus,
        orderDate: po.orderDate,
      })),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error fetching supplier reports' });
  }
});

// ─── 6. Expenses Report ───────────────────────────────────────────────────────

router.get('/expenses', async (req, res) => {
  try {
    const range = parseDateRange(req.query);
    const expenses = await prisma.expense.findMany({
      where: { date: range },
      orderBy: { date: 'desc' },
    });

    const byCategory = {};
    expenses.forEach(e => { byCategory[e.category] = (byCategory[e.category] || 0) + e.amount; });

    // Group by month
    const byMonth = {};
    expenses.forEach(e => {
      const m = e.date.toISOString().slice(0, 7);
      if (!byMonth[m]) byMonth[m] = { month: m, total: 0 };
      byMonth[m].total += e.amount;
    });

    res.json({
      summary: {
        totalExpenses: expenses.reduce((s, e) => s + e.amount, 0),
        expenseCount:  expenses.length,
        avgExpense:    expenses.length ? expenses.reduce((s, e) => s + e.amount, 0) / expenses.length : 0,
        topCategory:   Object.entries(byCategory).sort((a, b) => b[1] - a[1])[0]?.[0] || '—',
      },
      byCategory: Object.entries(byCategory).map(([category, amount]) => ({ category, amount })).sort((a, b) => b.amount - a.amount),
      byMonth: Object.values(byMonth).sort((a, b) => a.month.localeCompare(b.month)),
      recent: expenses.slice(0, 20),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error fetching expense reports' });
  }
});

// ─── 7. Employee Report ───────────────────────────────────────────────────────

router.get('/employees', async (req, res) => {
  try {
    const range = parseDateRange(req.query);

    const [employees, attendance, salaries] = await Promise.all([
      prisma.employee.findMany({ include: { _count: { select: { attendance: true } } } }),
      prisma.attendance.findMany({ where: { date: range } }),
      prisma.salaryRecord.findMany({ where: { paymentDate: range } }),
    ]);

    const byRole = employees.reduce((acc, e) => { acc[e.role] = (acc[e.role] || 0) + 1; return acc; }, {});
    const byStatus = employees.reduce((acc, e) => { acc[e.status] = (acc[e.status] || 0) + 1; return acc; }, {});

    const totalSalaries = salaries.reduce((s, r) => s + r.amount + r.bonus - r.deduction, 0);

    // Attendance breakdown
    const attByStatus = attendance.reduce((acc, a) => { acc[a.status] = (acc[a.status] || 0) + 1; return acc; }, {});

    res.json({
      summary: {
        totalEmployees:  employees.length,
        activeEmployees: employees.filter(e => e.status === 'active').length,
        totalSalariesPaid: totalSalaries,
        avgSalary: employees.length ? employees.reduce((s, e) => s + (e.baseSalary || 0), 0) / employees.length : 0,
      },
      byRole:   Object.entries(byRole).map(([role, count]) => ({ role, count })),
      byStatus: Object.entries(byStatus).map(([status, count]) => ({ status, count })),
      attendance: {
        total:    attendance.length,
        byStatus: Object.entries(attByStatus).map(([status, count]) => ({ status, count })),
      },
      employees: employees.map(e => ({
        id: e.id, name: e.name, role: e.role, status: e.status,
        baseSalary: e.baseSalary, joinDate: e.joinDate,
        attendanceCount: e._count.attendance,
      })),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error fetching employee reports' });
  }
});

module.exports = router;
