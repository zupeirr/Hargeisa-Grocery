import { Product } from '../types';

export const products: Product[] = [
  // Fruits & Vegetables
  {
    id: '1',
    name: 'Fresh Bananas',
    price: 2.50,
    originalPrice: 3.00,
    image: 'https://images.pexels.com/photos/2872755/pexels-photo-2872755.jpeg?auto=compress&cs=tinysrgb&w=400',
    category: 'fruits',
    description: 'Sweet, ripe bananas perfect for snacking or smoothies',
    inStock: true,
    unit: 'per kg',
    rating: 4.5,
    reviews: 128
  },
  {
    id: '2',
    name: 'Red Apples',
    price: 4.00,
    image: 'https://images.pexels.com/photos/102104/pexels-photo-102104.jpeg?auto=compress&cs=tinysrgb&w=400',
    category: 'fruits',
    description: 'Crisp and juicy red apples, locally sourced',
    inStock: true,
    unit: 'per kg',
    rating: 4.7,
    reviews: 95
  },
  {
    id: '3',
    name: 'Fresh Tomatoes',
    price: 3.25,
    image: 'https://images.pexels.com/photos/533280/pexels-photo-533280.jpeg?auto=compress&cs=tinysrgb&w=400',
    category: 'vegetables',
    description: 'Vine-ripened tomatoes, perfect for cooking',
    inStock: true,
    unit: 'per kg',
    rating: 4.3,
    reviews: 76
  },
  {
    id: '4',
    name: 'Green Onions',
    price: 1.75,
    image: 'https://images.pexels.com/photos/143133/pexels-photo-143133.jpeg?auto=compress&cs=tinysrgb&w=400',
    category: 'vegetables',
    description: 'Fresh green onions for seasoning and garnish',
    inStock: true,
    unit: 'per bunch',
    rating: 4.2,
    reviews: 42
  },
  
  // Dairy & Beverages
  {
    id: '5',
    name: 'Fresh Milk',
    price: 2.00,
    image: 'https://images.pexels.com/photos/248412/pexels-photo-248412.jpeg?auto=compress&cs=tinysrgb&w=400',
    category: 'dairy',
    description: 'Pure fresh milk from local farms',
    inStock: true,
    unit: 'per liter',
    rating: 4.6,
    reviews: 203
  },
  {
    id: '6',
    name: 'Natural Yogurt',
    price: 1.50,
    image: 'https://images.pexels.com/photos/1435735/pexels-photo-1435735.jpeg?auto=compress&cs=tinysrgb&w=400',
    category: 'dairy',
    description: 'Creamy natural yogurt, rich in probiotics',
    inStock: true,
    unit: 'per 500g',
    rating: 4.4,
    reviews: 87
  },
  {
    id: '7',
    name: 'Orange Juice',
    price: 3.50,
    image: 'https://images.pexels.com/photos/96974/pexels-photo-96974.jpeg?auto=compress&cs=tinysrgb&w=400',
    category: 'beverages',
    description: 'Freshly squeezed orange juice, no preservatives',
    inStock: true,
    unit: 'per liter',
    rating: 4.5,
    reviews: 156
  },
  
  // Dry Foods
  {
    id: '8',
    name: 'Basmati Rice',
    price: 8.00,
    originalPrice: 9.50,
    image: 'https://images.pexels.com/photos/723198/pexels-photo-723198.jpeg?auto=compress&cs=tinysrgb&w=400',
    category: 'dry-foods',
    description: 'Premium quality basmati rice, aromatic and fluffy',
    inStock: true,
    unit: 'per 5kg',
    rating: 4.8,
    reviews: 312
  },
  {
    id: '9',
    name: 'Whole Wheat Flour',
    price: 4.50,
    image: 'https://images.pexels.com/photos/1556688/pexels-photo-1556688.jpeg?auto=compress&cs=tinysrgb&w=400',
    category: 'dry-foods',
    description: 'Stone-ground whole wheat flour for healthy baking',
    inStock: true,
    unit: 'per 2kg',
    rating: 4.3,
    reviews: 89
  },
  
  // Meat & Poultry
  {
    id: '10',
    name: 'Fresh Chicken',
    price: 12.00,
    image: 'https://images.pexels.com/photos/616354/pexels-photo-616354.jpeg?auto=compress&cs=tinysrgb&w=400',
    category: 'meat',
    description: 'Fresh, halal chicken from trusted local suppliers',
    inStock: true,
    unit: 'per kg',
    rating: 4.7,
    reviews: 234
  },
  {
    id: '11',
    name: 'Ground Beef',
    price: 15.00,
    image: 'https://images.pexels.com/photos/361184/asparagus-steak-veal-steak-veal-361184.jpeg?auto=compress&cs=tinysrgb&w=400',
    category: 'meat',
    description: 'Lean ground beef, perfect for traditional dishes',
    inStock: true,
    unit: 'per kg',
    rating: 4.6,
    reviews: 178
  },
  
  // Household Essentials
  {
    id: '12',
    name: 'Dish Soap',
    price: 2.25,
    image: 'https://images.pexels.com/photos/4099238/pexels-photo-4099238.jpeg?auto=compress&cs=tinysrgb&w=400',
    category: 'household',
    description: 'Effective dish soap for sparkling clean dishes',
    inStock: true,
    unit: 'per 500ml',
    rating: 4.2,
    reviews: 67
  },
  {
    id: '13',
    name: 'Mango',
    price: 5.00,
    image: 'https://images.pexels.com/photos/918327/pexels-photo-918327.jpeg?auto=compress&cs=tinysrgb&w=400',
    category: 'fruits',
    description: 'Sweet tropical mangoes, perfectly ripe',
    inStock: true,
    unit: 'per kg',
    rating: 4.6,
    reviews: 89
  },
  {
    id: '14',
    name: 'Carrots',
    price: 2.75,
    image: 'https://images.pexels.com/photos/143133/pexels-photo-143133.jpeg?auto=compress&cs=tinysrgb&w=400',
    category: 'vegetables',
    description: 'Fresh orange carrots, great for cooking and snacking',
    inStock: true,
    unit: 'per kg',
    rating: 4.4,
    reviews: 56
  },
  {
    id: '15',
    name: 'Cheese',
    price: 6.50,
    image: 'https://images.pexels.com/photos/773253/pexels-photo-773253.jpeg?auto=compress&cs=tinysrgb&w=400',
    category: 'dairy',
    description: 'Premium aged cheese, perfect for sandwiches',
    inStock: true,
    unit: 'per 250g',
    rating: 4.7,
    reviews: 123
  },
  {
    id: '16',
    name: 'Pasta',
    price: 3.25,
    image: 'https://images.pexels.com/photos/1437267/pexels-photo-1437267.jpeg?auto=compress&cs=tinysrgb&w=400',
    category: 'dry-foods',
    description: 'Premium durum wheat pasta, perfect for Italian dishes',
    inStock: true,
    unit: 'per 500g',
    rating: 4.5,
    reviews: 78
  },
  {
    id: '17',
    name: 'Shampoo',
    price: 4.75,
    image: 'https://images.pexels.com/photos/3735657/pexels-photo-3735657.jpeg?auto=compress&cs=tinysrgb&w=400',
    category: 'personal-care',
    description: 'Gentle shampoo for all hair types',
    inStock: true,
    unit: 'per 400ml',
    rating: 4.3,
    reviews: 92
  },
  {
    id: '18',
    name: 'Coca Cola',
    price: 1.50,
    image: 'https://images.pexels.com/photos/50593/coca-cola-cold-drink-soft-drink-coke-50593.jpeg?auto=compress&cs=tinysrgb&w=400',
    category: 'beverages',
    description: 'Classic Coca Cola, refreshing and ice cold',
    inStock: true,
    unit: 'per 330ml',
    rating: 4.4,
    reviews: 156
  },
  {
    id: '19',
    name: 'Lamb Meat',
    price: 18.00,
    image: 'https://images.pexels.com/photos/361184/asparagus-steak-veal-steak-veal-361184.jpeg?auto=compress&cs=tinysrgb&w=400',
    category: 'meat',
    description: 'Fresh halal lamb meat, tender and flavorful',
    inStock: true,
    unit: 'per kg',
    rating: 4.8,
    reviews: 67
  },
  {
    id: '20',
    name: 'Toilet Paper',
    price: 3.00,
    image: 'https://images.pexels.com/photos/4099238/pexels-photo-4099238.jpeg?auto=compress&cs=tinysrgb&w=400',
    category: 'household',
    description: 'Soft and strong toilet paper, 12 rolls pack',
    inStock: true,
    unit: 'per pack',
    rating: 4.2,
    reviews: 89
  }
];