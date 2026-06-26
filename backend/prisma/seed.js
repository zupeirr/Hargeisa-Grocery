const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  await prisma.poItem.deleteMany();
  await prisma.purchaseOrder.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.product.deleteMany();
  await prisma.supplier.deleteMany();
  await prisma.customer.deleteMany();
  await prisma.setting.deleteMany();
  await prisma.user.deleteMany();
  await prisma.discountCode.deleteMany();
  await prisma.expense.deleteMany();

  await prisma.user.create({
    data: {
      email: 'admin@hargeisa.com',
      password: 'admin123',
      name: 'Admin',
      role: 'admin'
    }
  });

  const settings = [
    { key: 'storeName', value: 'Hargeisa Grocery' },
    { key: 'contactEmail', value: 'hello@hargeisa.com' },
    { key: 'contactPhone', value: '+252 63 609 7266' },
    { key: 'address', value: 'Jidka Xoriyada, Hargeisa, Somaliland' },
    { key: 'deliveryFee', value: '3.50' },
    { key: 'freeDeliveryThreshold', value: '25.00' },
    { key: 'currencySymbol', value: '$' }
  ];

  for (const s of settings) {
    await prisma.setting.create({ data: s });
  }

  const supplier1 = await prisma.supplier.create({
    data: {
      name: 'Hargeisa Fresh Farms',
      contactName: 'Mohamed Ali',
      email: 'mohamed@hffarms.com',
      phone: '+252 63 123 4567',
      address: 'Berbera Road, Hargeisa'
    }
  });

  const supplier2 = await prisma.supplier.create({
    data: {
      name: 'Somali Dairy Co.',
      contactName: 'Amina Jama',
      email: 'sales@somalidairy.com',
      phone: '+252 63 987 6543',
      address: 'Downtown, Hargeisa'
    }
  });

  const products = [
    { name: 'Fresh Bananas', price: 2.50, originalPrice: 3.00, image: 'https://images.pexels.com/photos/2872755/pexels-photo-2872755.jpeg?auto=compress&cs=tinysrgb&w=400', category: 'fruits', description: 'Sweet, ripe bananas perfect for snacking or smoothies', inStock: true, unit: 'per kg', rating: 4.5, reviews: 128, supplierId: supplier1.id, sku: 'SKU-001', stockLevel: 100 },
    { name: 'Red Apples', price: 4.00, image: 'https://images.pexels.com/photos/102104/pexels-photo-102104.jpeg?auto=compress&cs=tinysrgb&w=400', category: 'fruits', description: 'Crisp and juicy red apples, locally sourced', inStock: true, unit: 'per kg', rating: 4.7, reviews: 95, supplierId: supplier1.id, sku: 'SKU-002', stockLevel: 100 },
    { name: 'Fresh Tomatoes', price: 3.25, image: 'https://images.pexels.com/photos/533280/pexels-photo-533280.jpeg?auto=compress&cs=tinysrgb&w=400', category: 'vegetables', description: 'Vine-ripened tomatoes, perfect for cooking', inStock: true, unit: 'per kg', rating: 4.3, reviews: 76, supplierId: supplier1.id, sku: 'SKU-003', stockLevel: 100 },
    { name: 'Green Onions', price: 1.75, image: 'https://images.pexels.com/photos/143133/pexels-photo-143133.jpeg?auto=compress&cs=tinysrgb&w=400', category: 'vegetables', description: 'Fresh green onions for seasoning and garnish', inStock: true, unit: 'per bunch', rating: 4.2, reviews: 42, supplierId: supplier1.id, sku: 'SKU-004', stockLevel: 100 },
    { name: 'Fresh Milk', price: 2.00, image: 'https://images.pexels.com/photos/248412/pexels-photo-248412.jpeg?auto=compress&cs=tinysrgb&w=400', category: 'dairy', description: 'Pure fresh milk from local farms', inStock: true, unit: 'per liter', rating: 4.6, reviews: 203, supplierId: supplier2.id, sku: 'SKU-005', stockLevel: 100 },
    { name: 'Natural Yogurt', price: 1.50, image: 'https://images.pexels.com/photos/1435735/pexels-photo-1435735.jpeg?auto=compress&cs=tinysrgb&w=400', category: 'dairy', description: 'Creamy natural yogurt, rich in probiotics', inStock: true, unit: 'per 500g', rating: 4.4, reviews: 87, supplierId: supplier2.id, sku: 'SKU-006', stockLevel: 100 },
    { name: 'Orange Juice', price: 3.50, image: 'https://images.pexels.com/photos/96974/pexels-photo-96974.jpeg?auto=compress&cs=tinysrgb&w=400', category: 'beverages', description: 'Freshly squeezed orange juice, no preservatives', inStock: true, unit: 'per liter', rating: 4.5, reviews: 156, supplierId: supplier2.id, sku: 'SKU-007', stockLevel: 100 },
    { name: 'Basmati Rice', price: 8.00, originalPrice: 9.50, image: 'https://images.pexels.com/photos/723198/pexels-photo-723198.jpeg?auto=compress&cs=tinysrgb&w=400', category: 'dry-foods', description: 'Premium quality basmati rice, aromatic and fluffy', inStock: true, unit: 'per 5kg', rating: 4.8, reviews: 312, supplierId: supplier1.id, sku: 'SKU-008', stockLevel: 100 },
    { name: 'Whole Wheat Flour', price: 4.50, image: 'https://images.pexels.com/photos/1556688/pexels-photo-1556688.jpeg?auto=compress&cs=tinysrgb&w=400', category: 'dry-foods', description: 'Stone-ground whole wheat flour for healthy baking', inStock: true, unit: 'per 2kg', rating: 4.3, reviews: 89, supplierId: supplier1.id, sku: 'SKU-009', stockLevel: 100 },
    { name: 'Fresh Chicken', price: 12.00, image: 'https://images.pexels.com/photos/616354/pexels-photo-616354.jpeg?auto=compress&cs=tinysrgb&w=400', category: 'meat', description: 'Fresh, halal chicken from trusted local suppliers', inStock: true, unit: 'per kg', rating: 4.7, reviews: 234, supplierId: supplier2.id, sku: 'SKU-010', stockLevel: 100 },
    { name: 'Ground Beef', price: 15.00, image: 'https://images.pexels.com/photos/361184/asparagus-steak-veal-steak-veal-361184.jpeg?auto=compress&cs=tinysrgb&w=400', category: 'meat', description: 'Lean ground beef, perfect for traditional dishes', inStock: true, unit: 'per kg', rating: 4.6, reviews: 178, supplierId: supplier2.id, sku: 'SKU-011', stockLevel: 100 },
    { name: 'Dish Soap', price: 2.25, image: 'https://images.pexels.com/photos/4099238/pexels-photo-4099238.jpeg?auto=compress&cs=tinysrgb&w=400', category: 'household', description: 'Effective dish soap for sparkling clean dishes', inStock: true, unit: 'per 500ml', rating: 4.2, reviews: 67, supplierId: supplier1.id, sku: 'SKU-012', stockLevel: 100 },
    { name: 'Mango', price: 5.00, image: 'https://images.pexels.com/photos/918327/pexels-photo-918327.jpeg?auto=compress&cs=tinysrgb&w=400', category: 'fruits', description: 'Sweet tropical mangoes, perfectly ripe', inStock: true, unit: 'per kg', rating: 4.6, reviews: 89, supplierId: supplier1.id, sku: 'SKU-013', stockLevel: 100 },
    { name: 'Carrots', price: 2.75, image: 'https://images.pexels.com/photos/143133/pexels-photo-143133.jpeg?auto=compress&cs=tinysrgb&w=400', category: 'vegetables', description: 'Fresh orange carrots, great for cooking and snacking', inStock: true, unit: 'per kg', rating: 4.4, reviews: 56, supplierId: supplier1.id, sku: 'SKU-014', stockLevel: 100 },
    { name: 'Cheese', price: 6.50, image: 'https://images.pexels.com/photos/773253/pexels-photo-773253.jpeg?auto=compress&cs=tinysrgb&w=400', category: 'dairy', description: 'Premium aged cheese, perfect for sandwiches', inStock: true, unit: 'per 250g', rating: 4.7, reviews: 123, supplierId: supplier2.id, sku: 'SKU-015', stockLevel: 100 },
    { name: 'Pasta', price: 3.25, image: 'https://images.pexels.com/photos/1437267/pexels-photo-1437267.jpeg?auto=compress&cs=tinysrgb&w=400', category: 'dry-foods', description: 'Premium durum wheat pasta, perfect for Italian dishes', inStock: true, unit: 'per 500g', rating: 4.5, reviews: 78, supplierId: supplier1.id, sku: 'SKU-016', stockLevel: 100 },
    { name: 'Shampoo', price: 4.75, image: 'https://images.pexels.com/photos/3735657/pexels-photo-3735657.jpeg?auto=compress&cs=tinysrgb&w=400', category: 'personal-care', description: 'Gentle shampoo for all hair types', inStock: true, unit: 'per 400ml', rating: 4.3, reviews: 92, supplierId: supplier2.id, sku: 'SKU-017', stockLevel: 100 },
    { name: 'Coca Cola', price: 1.50, image: 'https://images.pexels.com/photos/50593/coca-cola-cold-drink-soft-drink-coke-50593.jpeg?auto=compress&cs=tinysrgb&w=400', category: 'beverages', description: 'Classic Coca Cola, refreshing and ice cold', inStock: true, unit: 'per 330ml', rating: 4.4, reviews: 156, supplierId: supplier1.id, sku: 'SKU-018', stockLevel: 100 },
    { name: 'Lamb Meat', price: 18.00, image: 'https://images.pexels.com/photos/361184/asparagus-steak-veal-steak-veal-361184.jpeg?auto=compress&cs=tinysrgb&w=400', category: 'meat', description: 'Fresh halal lamb meat, tender and flavorful', inStock: true, unit: 'per kg', rating: 4.8, reviews: 67, supplierId: supplier2.id, sku: 'SKU-019', stockLevel: 100 },
    { name: 'Toilet Paper', price: 3.00, image: 'https://images.pexels.com/photos/4099238/pexels-photo-4099238.jpeg?auto=compress&cs=tinysrgb&w=400', category: 'household', description: 'Soft and strong toilet paper, 12 rolls pack', inStock: true, unit: 'per pack', rating: 4.2, reviews: 89, supplierId: supplier1.id, sku: 'SKU-020', stockLevel: 100 }
  ];

  for (const p of products) {
    await prisma.product.create({ data: p });
  }

  await prisma.discountCode.create({
    data: {
      code: 'WELCOME10',
      discountPct: 10.0,
      maxUses: 100,
      uses: 15,
      active: true
    }
  });

  await prisma.expense.create({
    data: {
      category: 'Utilities',
      amount: 150.00,
      description: 'Monthly electricity bill'
    }
  });

  console.log('Database seeded successfully with new ERP models!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
