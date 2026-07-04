const { Router } = require('express');
const prisma = require('../lib/prisma');

const router = Router();

router.get('/', async (req, res) => {
  try {
    const status = req.query.status;
    const orders = await prisma.order.findMany({
      where: { ...(status && status !== 'all' ? { status } : {}) },
      include: {
        customer: { select: { id: true, name: true, email: true, phone: true } },
        items: { include: { product: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json(orders);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const order = await prisma.order.findUnique({
      where: { id: req.params.id },
      include: {
        customer: true,
        items: { include: { product: true } },
      },
    });
    if (!order) return res.status(404).json({ error: 'Order not found' });
    res.json(order);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch order' });
  }
});

router.post('/', async (req, res) => {
  try {
    const { customerId, items, total, paymentMethod, deliveryAddress, discountCode } = req.body;
    
    // Validate customer exists
    const customer = await prisma.customer.findUnique({ where: { id: customerId } });
    if (!customer) {
      return res.status(400).json({ error: 'Customer not found. Invalid customerId.', details: `Customer ID ${customerId} does not exist.` });
    }

    // Validate products exist
    const productIds = items.map(i => i.productId);
    const existingProducts = await prisma.product.findMany({
      where: { id: { in: productIds } }
    });
    if (existingProducts.length !== productIds.length) {
      return res.status(400).json({ 
        error: 'One or more products in your cart no longer exist. Please clear your cart and try again.',
        details: 'Cart contains stale products.' 
      });
    }

    // Check stock levels
    for (const item of items) {
      const product = existingProducts.find(p => p.id === item.productId);
      if (product.stockLevel < item.quantity) {
        return res.status(400).json({
          error: `Insufficient stock for ${product.name}. Available: ${product.stockLevel}, Requested: ${item.quantity}.`
        });
      }
    }

    const year = new Date().getFullYear();
    const prefix = `HG-${year}-`;
    const lastOrder = await prisma.order.findFirst({
      where: { id: { startsWith: prefix } },
      orderBy: { id: 'desc' },
    });
    
    let sequence = 1;
    if (lastOrder) {
      const lastSequence = parseInt(lastOrder.id.replace(prefix, ''), 10);
      if (!isNaN(lastSequence)) {
        sequence = lastSequence + 1;
      }
    }
    
    const customId = `${prefix}${String(sequence).padStart(6, '0')}`;

    if (discountCode) {
      const coupon = await prisma.discountCode.findUnique({ where: { code: discountCode } });
      if (coupon) {
        if (!coupon.active || (coupon.validFrom && new Date() < coupon.validFrom) || (coupon.validUntil && new Date() > coupon.validUntil) || coupon.uses >= coupon.maxUses) {
          return res.status(400).json({ error: 'Invalid or expired discount code' });
        }
        await prisma.discountCode.update({
          where: { code: discountCode },
          data: { uses: { increment: 1 } },
        });
      }
    }

    const order = await prisma.order.create({
      data: {
        id: customId,
        customerId,
        total,
        paymentMethod,
        deliveryAddress: JSON.stringify(deliveryAddress),
        items: {
          create: items.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
            price: item.price,
          })),
        },
      },
      include: { items: { include: { product: true } }, customer: true },
    });
    await prisma.customer.update({
      where: { id: customerId },
      data: {
        totalOrders: { increment: 1 },
        totalSpent: { increment: total },
        loyaltyPoints: { increment: Math.floor(total) },
        address: deliveryAddress,
      },
    });

    // Deduct stock and create inventory transactions
    for (const item of items) {
      const product = existingProducts.find(p => p.id === item.productId);
      const newStock = product.stockLevel - item.quantity;
      
      await prisma.product.update({
        where: { id: item.productId },
        data: {
          stockLevel: newStock,
          inStock: newStock > 0
        }
      });

      await prisma.inventoryTransaction.create({
        data: {
          productId: item.productId,
          type: 'stock_out',
          quantity: item.quantity,
          note: 'Order placed',
          reference: customId
        }
      });
    }
    
    req.app.get('io').emit('ORDERS_UPDATED');
    req.app.get('io').emit('CUSTOMERS_UPDATED');
    req.app.get('io').emit('PRODUCTS_UPDATED');

    res.status(201).json(order);
  } catch (err) {
    console.error('Order creation error:', err);
    res.status(500).json({ error: 'Failed to create order', details: err.message || err.toString() });
  }
});

router.patch('/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    const oldOrder = await prisma.order.findUnique({
      where: { id: req.params.id },
      include: { items: true }
    });

    const order = await prisma.order.update({
      where: { id: req.params.id },
      data: { status },
      include: { customer: true, items: { include: { product: true } } },
    });

    // If order is cancelled, return items to stock
    if (status === 'cancelled' && oldOrder && oldOrder.status !== 'cancelled') {
      for (const item of oldOrder.items) {
        await prisma.product.update({
          where: { id: item.productId },
          data: {
            stockLevel: { increment: item.quantity },
            inStock: true
          }
        });
        
        await prisma.inventoryTransaction.create({
          data: {
            productId: item.productId,
            type: 'stock_in',
            quantity: item.quantity,
            note: 'Order cancelled',
            reference: order.id
          }
        });
      }
      req.app.get('io').emit('PRODUCTS_UPDATED');
    }

    req.app.get('io').emit('ORDERS_UPDATED');
    res.json(order);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update order status' });
  }
});

module.exports = router;
