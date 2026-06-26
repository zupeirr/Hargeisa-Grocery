const { Router } = require('express');
const prisma = require('../lib/prisma');

const router = Router();

// Get all coupons
router.get('/', async (req, res) => {
  try {
    const coupons = await prisma.discountCode.findMany({
      orderBy: { createdAt: 'desc' },
    });
    res.json(coupons);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch coupons' });
  }
});

// Create a coupon
router.post('/', async (req, res) => {
  try {
    const { code, discountPct, maxUses, validFrom, validUntil, active } = req.body;
    
    // Check if code already exists
    const existing = await prisma.discountCode.findUnique({
      where: { code }
    });
    
    if (existing) {
      return res.status(400).json({ error: 'Coupon code already exists' });
    }

    const coupon = await prisma.discountCode.create({
      data: {
        code,
        discountPct: parseFloat(discountPct),
        maxUses: parseInt(maxUses, 10),
        validFrom: validFrom ? new Date(validFrom) : new Date(),
        validUntil: validUntil ? new Date(validUntil) : null,
        active: active !== undefined ? active : true,
      },
    });
    
    res.status(201).json(coupon);
  } catch (err) {
    console.error('Create coupon error:', err);
    res.status(500).json({ error: 'Failed to create coupon' });
  }
});

// Update a coupon
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { code, discountPct, maxUses, validFrom, validUntil, active } = req.body;

    const coupon = await prisma.discountCode.update({
      where: { id },
      data: {
        code,
        discountPct: parseFloat(discountPct),
        maxUses: parseInt(maxUses, 10),
        validFrom: validFrom ? new Date(validFrom) : undefined,
        validUntil: validUntil ? new Date(validUntil) : null,
        active,
      },
    });
    res.json(coupon);
  } catch (err) {
    console.error('Update coupon error:', err);
    res.status(500).json({ error: 'Failed to update coupon' });
  }
});

// Delete a coupon
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.discountCode.delete({
      where: { id },
    });
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete coupon' });
  }
});

// Validate a coupon for checkout
router.post('/validate', async (req, res) => {
  try {
    const { code } = req.body;
    if (!code) {
      return res.status(400).json({ error: 'Coupon code is required' });
    }

    const coupon = await prisma.discountCode.findUnique({
      where: { code }
    });

    if (!coupon) {
      return res.status(404).json({ error: 'Invalid coupon code' });
    }

    if (!coupon.active) {
      return res.status(400).json({ error: 'Coupon is inactive' });
    }

    const now = new Date();
    if (coupon.validFrom && now < coupon.validFrom) {
      return res.status(400).json({ error: 'Coupon is not yet valid' });
    }

    if (coupon.validUntil && now > coupon.validUntil) {
      return res.status(400).json({ error: 'Coupon has expired' });
    }

    if (coupon.uses >= coupon.maxUses) {
      return res.status(400).json({ error: 'Coupon usage limit reached' });
    }

    res.json({
      valid: true,
      discountPct: coupon.discountPct,
      code: coupon.code,
      id: coupon.id
    });

  } catch (err) {
    console.error('Validate coupon error:', err);
    res.status(500).json({ error: 'Failed to validate coupon' });
  }
});

module.exports = router;
