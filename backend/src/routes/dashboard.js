const { Router } = require('express');
const prisma = require('../lib/prisma');

const router = Router();

router.get('/stats', async (req, res) => {
  try {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const [
      totalProducts,
      totalOrders,
      totalCustomers,
      todayOrders,
      monthOrders,
      recentOrders,
      lowStockProducts,
      topProductsRaw,
      todayExpenses,
      todayPurchases
    ] = await Promise.all([
      prisma.product.count(),
      prisma.order.count(),
      prisma.customer.count(),
      prisma.order.aggregate({
        where: { createdAt: { gte: todayStart }, status: { not: 'cancelled' } },
        _sum: { total: true },
      }),
      prisma.order.aggregate({
        where: { createdAt: { gte: monthStart }, status: { not: 'cancelled' } },
        _sum: { total: true },
      }),
      prisma.order.findMany({
        take: 8,
        orderBy: { createdAt: 'desc' },
        include: {
          customer: { select: { name: true } },
          items: { include: { product: { select: { name: true } } } },
        },
      }),
      prisma.product.findMany({
        where: { inStock: false },
        take: 5,
      }),
      prisma.orderItem.groupBy({
        by: ['productId'],
        _sum: { quantity: true },
        orderBy: { _sum: { quantity: 'desc' } },
        take: 5,
      }),
      prisma.expense.aggregate({
        where: { date: { gte: todayStart } },
        _sum: { amount: true },
      }),
      prisma.purchaseOrder.aggregate({
        where: { orderDate: { gte: todayStart }, status: { not: 'cancelled' } },
        _sum: { totalAmount: true },
      }),
    ]);

    const topProducts = await Promise.all(
      topProductsRaw.map(async (item) => {
        const product = await prisma.product.findUnique({ where: { id: item.productId } });
        return { product, totalSold: item._sum.quantity || 0 };
      })
    );

    const categories = await prisma.product.groupBy({
      by: ['category'],
      _count: true,
    });

    const todaySalesAmount = todayOrders._sum.total || 0;
    const todayExpensesAmount = todayExpenses._sum.amount || 0;
    const todayPurchasesAmount = todayPurchases._sum.totalAmount || 0;
    const todayProfit = todaySalesAmount - todayExpensesAmount - todayPurchasesAmount;

    res.json({
      totalProducts,
      totalOrders,
      totalCustomers,
      totalCategories: categories.length,
      todaySales: todaySalesAmount,
      todayProfit,
      monthlyRevenue: monthOrders._sum.total || 0,
      recentOrders,
      lowStockAlerts: lowStockProducts,
      topProducts,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch dashboard stats' });
  }
});

module.exports = router;
