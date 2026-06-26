const { Router } = require('express');
const prisma = require('../lib/prisma');

const router = Router();

// Get all inventory transactions
router.get('/transactions', async (req, res) => {
  try {
    const { productId, type, startDate, endDate } = req.query;
    
    let whereClause = {};
    if (productId) whereClause.productId = productId;
    if (type) whereClause.type = type;
    
    if (startDate || endDate) {
      whereClause.createdAt = {};
      if (startDate) whereClause.createdAt.gte = new Date(startDate);
      if (endDate) whereClause.createdAt.lte = new Date(endDate);
    }

    const transactions = await prisma.inventoryTransaction.findMany({
      where: whereClause,
      include: {
        product: {
          select: { name: true, sku: true }
        }
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json(transactions);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch inventory transactions' });
  }
});

// Create inventory transaction (stock in/out/adjustment)
router.post('/transaction', async (req, res) => {
  try {
    const { productId, type, quantity, note, reference } = req.body;
    
    const qty = parseInt(quantity);
    if (isNaN(qty) || qty === 0) {
        return res.status(400).json({ error: 'Invalid quantity' });
    }

    // 1. Create the transaction record
    const transaction = await prisma.inventoryTransaction.create({
      data: {
        productId,
        type,
        quantity: qty,
        note,
        reference
      }
    });

    // 2. Update the product stock level
    // For stock_out and damaged, we expect a negative quantity from the frontend,
    // or we handle it based on type. Let's assume quantity is absolute value 
    // and we determine add/subtract based on type.
    
    let stockChange = qty;
    if (type === 'stock_out' || type === 'damaged') {
        stockChange = -Math.abs(qty);
    } else if (type === 'stock_in') {
        stockChange = Math.abs(qty);
    }
    // For 'adjustment', it could be positive or negative, so we use the raw qty value.

    const product = await prisma.product.update({
      where: { id: productId },
      data: {
        stockLevel: {
          increment: stockChange
        }
      }
    });

    res.status(201).json({ transaction, productStock: product.stockLevel });
  } catch (err) {
    console.error('Create inventory transaction error:', err);
    res.status(500).json({ error: 'Failed to create inventory transaction' });
  }
});

// Update product expiry date
router.put('/products/:id/expiry', async (req, res) => {
  try {
    const { expiryDate } = req.body;
    const product = await prisma.product.update({
      where: { id: req.params.id },
      data: {
        expiryDate: expiryDate ? new Date(expiryDate) : null
      }
    });
    res.json(product);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update expiry date' });
  }
});

// Update product damage tracking
router.put('/products/:id/damage', async (req, res) => {
  try {
    const { isDamaged, damagedQty, damagedReason } = req.body;
    const product = await prisma.product.update({
      where: { id: req.params.id },
      data: {
        isDamaged: isDamaged !== undefined ? isDamaged : undefined,
        damagedQty: damagedQty !== undefined ? parseInt(damagedQty) : undefined,
        damagedReason: damagedReason !== undefined ? damagedReason : undefined,
      }
    });
    res.json(product);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update damage tracking' });
  }
});

module.exports = router;
