import React from 'react';
import { Search } from 'lucide-react';
import { Product } from '../types';
import ProductCard from './ProductCard';

interface SearchResultsProps {
  query: string;
  products: Product[];
  isOpen: boolean;
  onClose: () => void;
}

const SearchResults: React.FC<SearchResultsProps> = ({ query, products, isOpen, onClose }) => {
  if (!isOpen || !query) return null;

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(query.toLowerCase()) ||
    product.description.toLowerCase().includes(query.toLowerCase()) ||
    product.category.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-50" onClick={onClose}>
      <div className="absolute top-20 left-1/2 transform -translate-x-1/2 w-full max-w-4xl bg-white rounded-lg shadow-xl max-h-96 overflow-y-auto mx-4">
        <div className="p-4 border-b">
          <div className="flex items-center space-x-2">
            <Search className="w-5 h-5 text-gray-400" />
            <span className="font-medium">Search results for "{query}"</span>
            <span className="text-sm text-gray-500">({filteredProducts.length} found)</span>
          </div>
        </div>
        
        <div className="p-4">
          {filteredProducts.length === 0 ? (
            <div className="text-center py-8">
              <Search className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No products found for "{query}"</p>
              <p className="text-sm text-gray-400 mt-2">Try searching with different keywords</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredProducts.slice(0, 6).map((product) => (
                <div key={product.id} onClick={onClose}>
                  <ProductCard product={product} />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SearchResults;