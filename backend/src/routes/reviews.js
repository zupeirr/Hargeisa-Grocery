const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Get all reviews (for Admin Dashboard)
router.get('/', async (req, res) => {
  try {
    const reviews = await prisma.review.findMany({
      include: {
        customer: true,
        product: true
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json(reviews);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch reviews' });
  }
});

// Get reviews for a specific product
router.get('/product/:productId', async (req, res) => {
  const { productId } = req.params;
  try {
    const reviews = await prisma.review.findMany({
      where: { productId, status: 'published' },
      include: { customer: true },
      orderBy: { createdAt: 'desc' }
    });
    res.json(reviews);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch product reviews' });
  }
});

// Get reviews by a specific customer
router.get('/customer/:customerId', async (req, res) => {
  const { customerId } = req.params;
  try {
    const reviews = await prisma.review.findMany({
      where: { customerId },
      include: { product: true },
      orderBy: { createdAt: 'desc' }
    });
    res.json(reviews);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch customer reviews' });
  }
});

// Create a review
router.post('/', async (req, res) => {
  const { productId, rating, comment } = req.body;
  let { customerId } = req.body;

  try {
    // If no customerId provided, attempt to find any existing customer as a fallback mock
    if (!customerId) {
      const fallbackCustomer = await prisma.customer.findFirst();
      if (!fallbackCustomer) {
        return res.status(400).json({ error: 'No customers available in the database to link to the review.' });
      }
      customerId = fallbackCustomer.id;
    }

    const review = await prisma.review.create({
      data: {
        customerId,
        productId,
        rating: parseInt(rating),
        comment,
        status: 'published'
      },
      include: { customer: true }
    });

    // Recalculate average rating for the product
    const productReviews = await prisma.review.findMany({
      where: { productId, status: 'published' }
    });

    const totalReviews = productReviews.length;
    const avgRating = totalReviews > 0
      ? productReviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews
      : 0;

    await prisma.product.update({
      where: { id: productId },
      data: {
        rating: parseFloat(avgRating.toFixed(1)),
        reviews: totalReviews
      }
    });

    res.json(review);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to create review' });
  }
});

// Delete a review
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const review = await prisma.review.delete({
      where: { id }
    });

    // Recalculate average rating for the product after deletion
    const productReviews = await prisma.review.findMany({
      where: { productId: review.productId, status: 'published' }
    });

    const totalReviews = productReviews.length;
    const avgRating = totalReviews > 0
      ? productReviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews
      : 0;

    await prisma.product.update({
      where: { id: review.productId },
      data: {
        rating: parseFloat(avgRating.toFixed(1)),
        reviews: totalReviews
      }
    });

    res.json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to delete review' });
  }
});

module.exports = router;
