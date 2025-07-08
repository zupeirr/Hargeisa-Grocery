import React, { useState } from 'react';
import { ShoppingCart, User, Search, Menu, X, MapPin, Phone } from 'lucide-react';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import Cart from './Cart';
import AuthModal from './AuthModal';
import SearchResults from './SearchResults';
import OrderTracking from './OrderTracking';
import { products } from '../data/products';

interface HeaderProps {
  onCategorySelect: (category: string) => void;
}

const Header: React.FC<HeaderProps> = ({ onCategorySelect }) => {
  const { state: cartState } = useCart();
  const { state: authState, logout } = useAuth();
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [isOrderTrackingOpen, setIsOrderTrackingOpen] = useState(false);

  const categories = [
    { id: 'fruits', name: 'Fruits' },
    { id: 'vegetables', name: 'Vegetables' },
    { id: 'dairy', name: 'Dairy' },
    { id: 'meat', name: 'Meat & Poultry' },
    { id: 'dry-foods', name: 'Dry Foods' },
    { id: 'beverages', name: 'Beverages' },
    { id: 'household', name: 'Household' },
    { id: 'personal-care', name: 'Personal Care' }
  ];

  const totalItems = cartState.items.reduce((sum, item) => sum + item.quantity, 0);

  React.useEffect(() => {
    const handleOpenOrderTracking = () => {
      setIsOrderTrackingOpen(true);
    };

    window.addEventListener('openOrderTracking', handleOpenOrderTracking);
    return () => window.removeEventListener('openOrderTracking', handleOpenOrderTracking);
  }, []);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    setShowSearchResults(query.length > 0);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setShowSearchResults(true);
    }
  };
  return (
    <>
      <header className="bg-white shadow-lg sticky top-0 z-40">
        {/* Top bar */}
        <div className="bg-green-600 text-white py-2">
          <div className="max-w-7xl mx-auto px-4 flex justify-between items-center text-sm">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-1">
                <MapPin className="w-4 h-4" />
                <span>Hargeisa, Somaliland</span>
              </div>
              <div className="flex items-center space-x-1">
                <Phone className="w-4 h-4" />
                <span>+252 63 609 7266</span>
              </div>
            </div>
            <div className="hidden md:block">
              <div className="flex items-center space-x-4">
                <span>Free delivery on orders over $25</span>
                <button
                  onClick={() => setIsOrderTrackingOpen(true)}
                  className="hover:underline"
                >
                  Track Order
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Main header */}
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <div className="flex items-center space-x-2">
              <div className="bg-green-600 p-2 rounded-lg">
                <ShoppingCart className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-800">Hargeisa Grocery</h1>
                <p className="text-sm text-gray-600">Fresh. Fast. Local.</p>
              </div>
            </div>

            {/* Search bar */}
            <div className="hidden md:flex flex-1 max-w-2xl mx-8">
              <form onSubmit={handleSearchSubmit} className="relative w-full">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Search for products..."
                    value={searchQuery}
                    onChange={handleSearchChange}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>
              </form>
            </div>

            {/* Actions */}
            <div className="flex items-center space-x-4">
              {/* User menu */}
              <div className="relative">
                {authState.isAuthenticated ? (
                  <div className="flex items-center space-x-2">
                    <div className="hidden md:block text-right">
                      <p className="text-sm font-medium text-gray-800">{authState.user?.name}</p>
                      <p className="text-xs text-gray-600">{authState.user?.loyaltyPoints} points</p>
                    </div>
                    <button
                      onClick={logout}
                      className="p-2 text-gray-600 hover:text-green-600 transition-colors"
                    >
                      <User className="w-6 h-6" />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setIsAuthModalOpen(true)}
                    className="flex items-center space-x-1 px-4 py-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                  >
                    <User className="w-5 h-5" />
                    <span className="hidden md:inline">Sign In</span>
                  </button>
                )}
              </div>

              {/* Cart */}
              <button
                onClick={() => setIsCartOpen(true)}
                className="relative p-2 text-gray-600 hover:text-green-600 transition-colors"
              >
                <ShoppingCart className="w-6 h-6" />
                {totalItems > 0 && (
                  <span className="absolute -top-1 -right-1 bg-green-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {totalItems}
                  </span>
                )}
              </button>

              {/* Mobile menu toggle */}
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="md:hidden p-2 text-gray-600 hover:text-green-600 transition-colors"
              >
                {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>

          {/* Mobile search */}
          <div className="md:hidden mt-4">
            <form onSubmit={handleSearchSubmit}>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search for products..."
                  value={searchQuery}
                  onChange={handleSearchChange}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>
            </form>
          </div>
        </div>

        {/* Categories navigation */}
        <nav className="bg-gray-50 border-t">
          <div className="max-w-7xl mx-auto px-4">
            <div className="hidden md:flex space-x-8 py-4">
              <button
                onClick={() => onCategorySelect('all')}
                className="text-gray-700 hover:text-green-600 font-medium transition-colors"
              >
                All Products
              </button>
              {categories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => onCategorySelect(category.id)}
                  className="text-gray-700 hover:text-green-600 font-medium transition-colors whitespace-nowrap"
                >
                  {category.name}
                </button>
              ))}
            </div>

            {/* Mobile categories */}
            {isMobileMenuOpen && (
              <div className="md:hidden py-4 space-y-2">
                <button
                  onClick={() => {
                    onCategorySelect('all');
                    setIsMobileMenuOpen(false);
                  }}
                  className="block w-full text-left py-2 text-gray-700 hover:text-green-600 font-medium transition-colors"
                >
                  All Products
                </button>
                {categories.map((category) => (
                  <button
                    key={category.id}
                    onClick={() => {
                      onCategorySelect(category.id);
                      setIsMobileMenuOpen(false);
                    }}
                    className="block w-full text-left py-2 text-gray-700 hover:text-green-600 font-medium transition-colors"
                  >
                    {category.name}
                  </button>
                ))}
              </div>
            )}
          </div>
        </nav>
      </header>

      {/* Cart sidebar */}
      <Cart isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />

      {/* Auth modal */}
      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />

      {/* Search results */}
      <SearchResults
        query={searchQuery}
        products={products}
        isOpen={showSearchResults}
        onClose={() => {
          setShowSearchResults(false);
          setSearchQuery('');
        }}
      />

      {/* Order tracking */}
      <OrderTracking
        isOpen={isOrderTrackingOpen}
        onClose={() => setIsOrderTrackingOpen(false)}
      />
    </>
  );
};

export default Header;