const { Router } = require('express');
const prisma = require('../lib/prisma');

const router = Router();

// Get all purchase orders
router.get('/', async (req, res) => {
  try {
    const purchaseOrders = await prisma.purchaseOrder.findMany({
      include: {
        supplier: true,
        items: {
          include: {
            product: true
          }
        }
      },
      orderBy: { orderDate: 'desc' },
    });
    res.json(purchaseOrders);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch purchase orders' });
  }
});

// Get a single purchase order
router.get('/:id', async (req, res) => {
  try {
    const po = await prisma.purchaseOrder.findUnique({
      where: { id: req.params.id },
      include: {
        supplier: true,
        items: {
          include: {
            product: true
          }
        }
      }
    });
    if (!po) return res.status(404).json({ error: 'Purchase order not found' });
    res.json(po);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch purchase order details' });
  }
});

// Create a new purchase order
router.post('/', async (req, res) => {
  try {
    const { supplierId, items } = req.body;
    
    // Calculate total amount
    const totalAmount = items.reduce((sum, item) => sum + (item.quantity * item.unitCost), 0);

    const po = await prisma.purchaseOrder.create({
      data: {
        supplierId,
        totalAmount,
        status: 'draft',
        paymentStatus: 'unpaid',
        items: {
          create: items.map(item => ({
            productId: item.productId,
            quantity: item.quantity,
            unitCost: item.unitCost
          }))
        }
      },
      include: {
        supplier: true,
        items: true
      }
    });
    res.status(201).json(po);
  } catch (err) {
    console.error('Create PO error:', err);
    res.status(500).json({ error: 'Failed to create purchase order' });
  }
});

// Update purchase order status
router.patch('/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    
    // Fetch the PO with items to process inventory if needed
    const existingPo = await prisma.purchaseOrder.findUnique({
      where: { id: req.params.id },
      include: { items: true }
    });

    if (!existingPo) {
      return res.status(404).json({ error: 'Purchase order not found' });
    }

    const po = await prisma.purchaseOrder.update({
      where: { id: req.params.id },
      data: { status },
      include: { supplier: true }
    });

    // Auto stock_in if status changed to received
    if (status === 'received' && existingPo.status !== 'received') {
      for (const item of existingPo.items) {
        // Create transaction
        await prisma.inventoryTransaction.create({
          data: {
            productId: item.productId,
            type: 'stock_in',
            quantity: item.quantity,
            note: 'Auto stock-in from PO Receipt',
            reference: `PO-${existingPo.id.substring(0,8)}`
          }
        });

        // Update product stock level
        await prisma.product.update({
          where: { id: item.productId },
          data: {
            stockLevel: {
              increment: item.quantity
            }
          }
        });
      }
    }

    res.json(po);
  } catch (err) {
    console.error('PO status update error:', err);
    res.status(500).json({ error: 'Failed to update purchase order status' });
  }
});

// Update purchase order payment status
router.patch('/:id/payment', async (req, res) => {
  try {
    const { paymentStatus } = req.body;
    const paymentDate = paymentStatus === 'paid' ? new Date() : null;
    
    const po = await prisma.purchaseOrder.update({
      where: { id: req.params.id },
      data: { 
        paymentStatus,
        paymentDate: paymentStatus === 'paid' ? new Date() : undefined
      },
      include: { supplier: true }
    });
    res.json(po);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update payment status' });
  }
});

// Delete a purchase order
router.delete('/:id', async (req, res) => {
  try {
    // Delete items first
    await prisma.poItem.deleteMany({
      where: { purchaseOrderId: req.params.id }
    });
    
    await prisma.purchaseOrder.delete({
      where: { id: req.params.id }
    });
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete purchase order' });
  }
});

module.exports = router;
