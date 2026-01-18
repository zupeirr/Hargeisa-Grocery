import React, { useState } from 'react';
import { Analytics } from '@vercel/analytics/react';
import { CartProvider } from './contexts/CartContext';
import { AuthProvider } from './contexts/AuthContext';
import Header from './components/Header';
import Hero from './components/Hero';
import ProductCard from './components/ProductCard';
import Footer from './components/Footer';
import { products } from './data/products';

function App() {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const filteredProducts = selectedCategory === 'all' 
    ? products 
    : products.filter(product => product.category === selectedCategory);

  const categoryNames: { [key: string]: string } = {
    'all': 'All Products',
    'fruits': 'Fresh Fruits',
    'vegetables': 'Fresh Vegetables',
    'dairy': 'Dairy Products',
    'meat': 'Meat & Poultry',
    'dry-foods': 'Dry Foods',
    'beverages': 'Beverages',
    'household': 'Household Items',
    'personal-care': 'Personal Care'
  };

  return (
    <AuthProvider>
      <CartProvider>
        <div className="min-h-screen bg-gray-50">
          <Header onCategorySelect={setSelectedCategory} />
          
          {selectedCategory === 'all' && <Hero />}
          
          {/* Products section */}
          <div id="products" className="max-w-7xl mx-auto px-4 py-12">
            <div className="mb-8">
              <h2 className="text-3xl font-bold text-gray-800 mb-2">
                {categoryNames[selectedCategory]}
              </h2>
              <p className="text-gray-600">
                {selectedCategory === 'all' 
                  ? `Discover our full range of ${products.length} quality products`
                  : `Fresh ${categoryNames[selectedCategory].toLowerCase()} sourced from trusted suppliers`
                }
              </p>
            </div>

            {filteredProducts.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500 text-lg">No products found in this category.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredProducts.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            )}
          </div>

          <Footer />
          <Analytics />
        </div>
      </CartProvider>
    </AuthProvider>
  );
}

export default App;