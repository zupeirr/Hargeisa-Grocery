import React from 'react';
import { Star, Plus, Minus, ShoppingCart, Heart } from 'lucide-react';
import { Product } from '../types';
import { useCart } from '../contexts/CartContext';

interface ProductCardProps {
  product: Product;
}

const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const { state, dispatch } = useCart();
  const [isFavorite, setIsFavorite] = React.useState(false);
  
  const cartItem = state.items.find(item => item.product.id === product.id);
  const quantity = cartItem?.quantity || 0;

  const handleAddToCart = () => {
    dispatch({ type: 'ADD_ITEM', payload: product });
  };

  const handleUpdateQuantity = (newQuantity: number) => {
    if (newQuantity === 0) {
      dispatch({ type: 'REMOVE_ITEM', payload: product.id });
    } else {
      dispatch({ type: 'UPDATE_QUANTITY', payload: { id: product.id, quantity: newQuantity } });
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden group">
      <div className="relative overflow-hidden">
        <img
          src={product.image}
          alt={product.name}
          className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
        />
        {product.originalPrice && (
          <div className="absolute top-2 left-2 bg-red-500 text-white px-2 py-1 rounded-full text-xs font-semibold">
            SALE
          </div>
        )}
        {!product.inStock && (
          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <span className="text-white font-semibold">Out of Stock</span>
          </div>
        )}
        <button
          onClick={() => setIsFavorite(!isFavorite)}
          className="absolute top-2 right-2 p-2 bg-white rounded-full shadow-md hover:shadow-lg transition-shadow"
        >
          <Heart className={`w-4 h-4 ${isFavorite ? 'text-red-500 fill-current' : 'text-gray-400'}`} />
        </button>
      </div>

      <div className="p-4">
        <h3 className="font-semibold text-gray-800 mb-2 line-clamp-2">{product.name}</h3>
        <p className="text-gray-600 text-sm mb-3 line-clamp-2">{product.description}</p>

        {/* Rating */}
        <div className="flex items-center mb-3">
          <div className="flex items-center">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                className={`w-4 h-4 ${
                  i < Math.floor(product.rating)
                    ? 'text-yellow-400 fill-current'
                    : 'text-gray-300'
                }`}
              />
            ))}
          </div>
          <span className="text-sm text-gray-600 ml-2">
            {product.rating} ({product.reviews})
          </span>
        </div>

        {/* Price */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <span className="text-lg font-bold text-green-600">
              ${product.price.toFixed(2)}
            </span>
            {product.originalPrice && (
              <span className="text-sm text-gray-500 line-through">
                ${product.originalPrice.toFixed(2)}
              </span>
            )}
          </div>
          <span className="text-sm text-gray-500">{product.unit}</span>
        </div>

        {/* Add to cart controls */}
        {product.inStock && (
          <div className="flex items-center justify-between">
            {quantity === 0 ? (
              <button
                onClick={handleAddToCart}
                className="flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors w-full justify-center"
              >
                <ShoppingCart className="w-4 h-4" />
                <span>Add to Cart</span>
              </button>
            ) : (
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => handleUpdateQuantity(quantity - 1)}
                    className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center hover:bg-gray-300 transition-colors"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="font-semibold text-lg">{quantity}</span>
                  <button
                    onClick={() => handleUpdateQuantity(quantity + 1)}
                    className="w-8 h-8 rounded-full bg-green-600 text-white flex items-center justify-center hover:bg-green-700 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
                <span className="text-sm font-semibold text-green-600">
                  ${(product.price * quantity).toFixed(2)}
                </span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductCard;