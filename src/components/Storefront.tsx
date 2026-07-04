import React, { useState, useEffect } from 'react';
import Header from './Header';
import Hero from './Hero';
import ProductCard from './ProductCard';
import Footer from './Footer';
import { getProducts, getCategories } from '../data/adminStore';
import { Product } from '../types';
import { useSettings } from '../contexts/SettingsContext';
import { useSocket } from '../hooks/useSocket';

const Storefront: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [products, setProducts] = useState<Product[]>([]);
  const [categoriesData, setCategoriesData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { settings, isLoading: isSettingsLoading } = useSettings();
  const { socket } = useSocket();

  const fetchProducts = async () => {
    try {
      const data = await getProducts();
      setProducts(data);
    } catch (err) {
      console.error('Failed to fetch products:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
    const fetchCats = async () => {
      try {
        const data = await getCategories();
        if (data && data.length > 0) {
          setCategoriesData(data);
        }
      } catch (err) {
        console.error('Failed to fetch categories:', err);
      }
    };
    fetchCats();
  }, []);

  useEffect(() => {
    if (socket) {
      socket.on('PRODUCTS_UPDATED', fetchProducts);
      return () => {
        socket.off('PRODUCTS_UPDATED', fetchProducts);
      };
    }
  }, [socket]);

  const filteredProducts = selectedCategory === 'all'
    ? products
    : products.filter(product => product.category === selectedCategory);

  const categoryNames: { [key: string]: string } = {
    'all': 'All Products',
    ...categoriesData.reduce((acc: any, c: any) => {
      acc[c.name.toLowerCase().replace(/\s+/g, '-')] = c.name;
      return acc;
    }, {})
  };
  
  // Fallback if categories are not loaded yet but we have products with these categories
  if (Object.keys(categoryNames).length === 1) {
    const hardcoded = {
      'fruits': 'Fresh Fruits',
      'vegetables': 'Fresh Vegetables',
      'dairy': 'Dairy Products',
      'meat': 'Meat & Poultry',
      'dry-foods': 'Dry Foods',
      'beverages': 'Beverages',
      'household': 'Household Items',
      'personal-care': 'Personal Care'
    };
    Object.assign(categoryNames, hardcoded);
  }

  if (isSettingsLoading) {
    return <div className="min-h-screen bg-gray-50 flex items-center justify-center">Loading...</div>;
  }

  if (settings.maintenanceMode) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
        <div className="bg-white p-8 rounded-xl shadow-lg max-w-md w-full text-center">
          <h1 className="text-3xl font-bold text-gray-800 mb-4">Under Maintenance</h1>
          <p className="text-gray-600 mb-6">
            We are currently performing scheduled maintenance to improve your experience.
            Please check back soon!
          </p>
          <div className="w-16 h-16 border-4 border-green-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
        </div>
      </div>
    );
  }

  return (
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

        {isLoading ? (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">Loading products...</p>
          </div>
        ) : filteredProducts.length === 0 ? (
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
    </div>
  );
};

export default Storefront;
