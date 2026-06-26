const { Router } = require('express');
const prisma = require('../lib/prisma');

const router = Router();

// Get all expenses with optional filtering
router.get('/', async (req, res) => {
  try {
    const { category, startDate, endDate } = req.query;
    
    let whereClause = {};
    
    if (category) {
      whereClause.category = category;
    }
    
    if (startDate || endDate) {
      whereClause.date = {};
      if (startDate) whereClause.date.gte = new Date(startDate);
      if (endDate) whereClause.date.lte = new Date(endDate);
    }

    const expenses = await prisma.expense.findMany({
      where: whereClause,
      orderBy: { date: 'desc' },
    });
    res.json(expenses);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch expenses' });
  }
});

// Get expense report (summary for profit/loss)
router.get('/report', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    // 1. Calculate Total Expenses
    let expenseWhere = {};
    if (startDate || endDate) {
      expenseWhere.date = {};
      if (startDate) expenseWhere.date.gte = new Date(startDate);
      if (endDate) expenseWhere.date.lte = new Date(endDate);
    }

    const expenses = await prisma.expense.findMany({
      where: expenseWhere,
    });
    
    const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0);
    
    // Group expenses by category
    const expensesByCategory = expenses.reduce((acc, exp) => {
      acc[exp.category] = (acc[exp.category] || 0) + exp.amount;
      return acc;
    }, {});

    // 2. Calculate Total Revenue (from completed orders)
    let orderWhere = { status: 'delivered' }; // Only count completed orders as revenue
    if (startDate || endDate) {
      orderWhere.createdAt = {}; // Use createdAt for order date for now
      if (startDate) orderWhere.createdAt.gte = new Date(startDate);
      if (endDate) orderWhere.createdAt.lte = new Date(endDate);
    }
    
    const orders = await prisma.order.findMany({
      where: orderWhere,
    });
    
    const totalRevenue = orders.reduce((sum, order) => sum + order.total, 0);

    res.json({
      totalRevenue,
      totalExpenses,
      netProfit: totalRevenue - totalExpenses,
      expensesByCategory: Object.entries(expensesByCategory).map(([category, amount]) => ({
        category,
        amount
      }))
    });
  } catch (err) {
    console.error('Expense report error:', err);
    res.status(500).json({ error: 'Failed to generate expense report' });
  }
});

// Get single expense
router.get('/:id', async (req, res) => {
  try {
    const expense = await prisma.expense.findUnique({
      where: { id: req.params.id }
    });
    if (!expense) return res.status(404).json({ error: 'Expense not found' });
    res.json(expense);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch expense' });
  }
});

// Create new expense
router.post('/', async (req, res) => {
  try {
    const { category, amount, description, date } = req.body;
    const expense = await prisma.expense.create({
      data: {
        category,
        amount: parseFloat(amount),
        description,
        date: date ? new Date(date) : new Date(),
      },
    });
    res.status(201).json(expense);
  } catch (err) {
    console.error('Create expense error:', err);
    res.status(500).json({ error: 'Failed to create expense' });
  }
});

// Update expense
router.put('/:id', async (req, res) => {
  try {
    const { category, amount, description, date } = req.body;
    const expense = await prisma.expense.update({
      where: { id: req.params.id },
      data: {
        category,
        amount: amount !== undefined ? parseFloat(amount) : undefined,
        description,
        date: date ? new Date(date) : undefined,
      },
    });
    res.json(expense);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update expense' });
  }
});

// Delete expense
router.delete('/:id', async (req, res) => {
  try {
    await prisma.expense.delete({
      where: { id: req.params.id },
    });
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete expense' });
  }
});

module.exports = router;
