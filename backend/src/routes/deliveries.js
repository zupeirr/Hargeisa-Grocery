const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const crypto = require('crypto');

// Get all deliveries
router.get('/', async (req, res) => {
  try {
    const deliveries = await prisma.delivery.findMany({
      include: {
        order: {
          include: { customer: true }
        },
        driver: true
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json(deliveries);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching deliveries' });
  }
});

// Create delivery
router.post('/', async (req, res) => {
  try {
    const { orderId, driverId, status, notes, estimatedTime } = req.body;
    
    // Auto-generate tracking code
    const trackingCode = 'TRK-' + crypto.randomBytes(4).toString('hex').toUpperCase();

    const delivery = await prisma.delivery.create({
      data: {
        orderId,
        driverId: driverId || null,
        status: status || 'pending',
        notes,
        estimatedTime: estimatedTime ? new Date(estimatedTime) : null,
        trackingCode
      },
      include: {
        order: true,
        driver: true
      }
    });

    // Also update order status if necessary
    if (status) {
      await prisma.order.update({
        where: { id: orderId },
        data: { status: status === 'delivered' ? 'delivered' : 'out-for-delivery' }
      });
    }

    res.status(201).json(delivery);
  } catch (error) {
    if (error.code === 'P2002') {
      return res.status(400).json({ error: 'Delivery for this order already exists' });
    }
    res.status(500).json({ error: 'Error creating delivery' });
  }
});

// Update delivery
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { driverId, status, notes, estimatedTime, actualTime } = req.body;
    
    const updateData = {};
    if (driverId !== undefined) updateData.driverId = driverId || null;
    if (status !== undefined) updateData.status = status;
    if (notes !== undefined) updateData.notes = notes;
    if (estimatedTime !== undefined) updateData.estimatedTime = estimatedTime ? new Date(estimatedTime) : null;
    if (actualTime !== undefined) updateData.actualTime = actualTime ? new Date(actualTime) : null;

    // If status changes to delivered, auto-set actualTime if not provided
    if (status === 'delivered' && !actualTime) {
      updateData.actualTime = new Date();
    }

    const delivery = await prisma.delivery.update({
      where: { id },
      data: updateData,
      include: { order: true }
    });

    // Sync order status
    if (status) {
      const orderStatus = status === 'pending' ? 'confirmed' :
                          status === 'delivered' ? 'delivered' : 'out-for-delivery';
      await prisma.order.update({
        where: { id: delivery.orderId },
        data: { status: orderStatus }
      });
    }

    res.json(delivery);
  } catch (error) {
    res.status(500).json({ error: 'Error updating delivery' });
  }
});

// PATCH /deliveries/:id/status  — advance delivery status
router.patch('/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const allowed = ['pending', 'in_transit', 'delivered', 'cancelled'];
    if (!allowed.includes(status)) {
      return res.status(400).json({ error: `Invalid status. Must be one of: ${allowed.join(', ')}` });
    }
    const updateData = { status };
    if (status === 'delivered') updateData.actualTime = new Date();

    const delivery = await prisma.delivery.update({
      where: { id },
      data: updateData,
      include: { order: true, driver: true }
    });

    // Sync order status when delivery status changes
    if (delivery.orderId) {
      const orderStatus =
        status === 'pending'    ? 'confirmed' :
        status === 'in_transit' ? 'out-for-delivery' :
        status === 'delivered'  ? 'delivered' : 'confirmed';
      try {
        await prisma.order.update({ where: { id: delivery.orderId }, data: { status: orderStatus } });
      } catch (_) { /* order might not exist */ }
    }

    res.json(delivery);
  } catch (error) {
    res.status(500).json({ error: 'Error updating delivery status' });
  }
});

// PATCH /deliveries/:id/assign  — assign or re-assign driver
router.patch('/:id/assign', async (req, res) => {
  try {
    const { id } = req.params;
    const { driverId } = req.body;
    const delivery = await prisma.delivery.update({
      where: { id },
      data: { driverId: driverId || null },
      include: { driver: true }
    });
    res.json(delivery);
  } catch (error) {
    res.status(500).json({ error: 'Error assigning driver' });
  }
});

// DELETE /deliveries/:id
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.delivery.delete({ where: { id } });
    res.json({ message: 'Delivery deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Error deleting delivery' });
  }
});

module.exports = router;

