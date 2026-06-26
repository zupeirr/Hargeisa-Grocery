const { Router } = require('express');
const prisma = require('../lib/prisma');

const router = Router();

// Get all suppliers
router.get('/', async (req, res) => {
  try {
    const suppliers = await prisma.supplier.findMany({
      include: {
        _count: {
          select: { products: true, purchaseOrders: true }
        }
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json(suppliers);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch suppliers' });
  }
});

// Get single supplier by id
router.get('/:id', async (req, res) => {
  try {
    const supplier = await prisma.supplier.findUnique({
      where: { id: req.params.id },
      include: {
        products: true,
        purchaseOrders: {
          include: {
            items: true
          },
          orderBy: { orderDate: 'desc' }
        }
      }
    });
    if (!supplier) return res.status(404).json({ error: 'Supplier not found' });
    res.json(supplier);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch supplier details' });
  }
});

// Create new supplier
router.post('/', async (req, res) => {
  try {
    const { name, contactName, email, phone, address, rating } = req.body;
    const supplier = await prisma.supplier.create({
      data: {
        name,
        contactName,
        email,
        phone,
        address,
        rating: rating !== undefined ? parseFloat(rating) : 5.0,
      },
    });
    res.status(201).json(supplier);
  } catch (err) {
    console.error('Create supplier error:', err);
    res.status(500).json({ error: 'Failed to create supplier' });
  }
});

// Update supplier
router.put('/:id', async (req, res) => {
  try {
    const { name, contactName, email, phone, address, rating } = req.body;
    const supplier = await prisma.supplier.update({
      where: { id: req.params.id },
      data: {
        name,
        contactName,
        email,
        phone,
        address,
        rating: rating !== undefined ? parseFloat(rating) : undefined,
      },
    });
    res.json(supplier);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update supplier' });
  }
});

// Delete supplier
router.delete('/:id', async (req, res) => {
  try {
    await prisma.supplier.delete({
      where: { id: req.params.id },
    });
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete supplier' });
  }
});

module.exports = router;
