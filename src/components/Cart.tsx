import React from 'react';
import { X, Plus, Minus, ShoppingBag, Truck } from 'lucide-react';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import CheckoutModal from './CheckoutModal';

interface CartProps {
  isOpen: boolean;
  onClose: () => void;
}

const Cart: React.FC<CartProps> = ({ isOpen, onClose }) => {
  const { state, dispatch } = useCart();
  const { state: authState } = useAuth();
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);

  const handleUpdateQuantity = (id: string, quantity: number) => {
    if (quantity === 0) {
      dispatch({ type: 'REMOVE_ITEM', payload: id });
    } else {
      dispatch({ type: 'UPDATE_QUANTITY', payload: { id, quantity } });
    }
  };

  const deliveryFee = state.total >= 25 ? 0 : 3.50;
  const finalTotal = state.total + deliveryFee;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div className="absolute inset-0 bg-black bg-opacity-50" onClick={onClose} />
      
      <div className="absolute right-0 top-0 h-full w-full max-w-md bg-white shadow-xl">
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b">
            <h2 className="text-lg font-semibold flex items-center space-x-2">
              <ShoppingBag className="w-5 h-5" />
              <span>Your Cart ({state.items.reduce((sum, item) => sum + item.quantity, 0)})</span>
            </h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Cart items */}
          <div className="flex-1 overflow-y-auto p-4">
            {state.items.length === 0 ? (
              <div className="text-center py-12">
                <ShoppingBag className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 mb-2">Your cart is empty</p>
                <p className="text-sm text-gray-400">Add some products to get started</p>
              </div>
            ) : (
              <div className="space-y-4">
                {state.items.map((item) => (
                  <div key={item.product.id} className="flex items-center space-x-3 bg-gray-50 p-3 rounded-lg">
                    <img
                      src={item.product.image}
                      alt={item.product.name}
                      className="w-16 h-16 object-cover rounded-lg"
                    />
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-800 line-clamp-1">{item.product.name}</h3>
                      <p className="text-sm text-gray-600">${item.product.price.toFixed(2)} {item.product.unit}</p>
                      <div className="flex items-center space-x-2 mt-2">
                        <button
                          onClick={() => handleUpdateQuantity(item.product.id, item.quantity - 1)}
                          className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center hover:bg-gray-300 transition-colors"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="font-medium">{item.quantity}</span>
                        <button
                          onClick={() => handleUpdateQuantity(item.product.id, item.quantity + 1)}
                          className="w-6 h-6 rounded-full bg-green-600 text-white flex items-center justify-center hover:bg-green-700 transition-colors"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-green-600">
                        ${(item.product.price * item.quantity).toFixed(2)}
                      </p>
                      <button
                        onClick={() => dispatch({ type: 'REMOVE_ITEM', payload: item.product.id })}
                        className="text-xs text-red-500 hover:text-red-700 transition-colors mt-1"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          {state.items.length > 0 && (
            <div className="border-t p-4 space-y-4">
              {/* Delivery info */}
              <div className="flex items-center space-x-2 text-sm">
                <Truck className="w-4 h-4 text-green-600" />
                <span className="text-gray-600">
                  {deliveryFee === 0 ? 'Free delivery!' : `Delivery: $${deliveryFee.toFixed(2)}`}
                </span>
              </div>

              {/* Totals */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Subtotal:</span>
                  <span>${state.total.toFixed(2)}</span>
                </div>
                {deliveryFee > 0 && (
                  <div className="flex justify-between text-sm">
                    <span>Delivery:</span>
                    <span>${deliveryFee.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between font-semibold text-lg border-t pt-2">
                  <span>Total:</span>
                  <span className="text-green-600">${finalTotal.toFixed(2)}</span>
                </div>
              </div>

              {/* Checkout button */}
              <button
                onClick={() => {
                  if (!authState.isAuthenticated) {
                    alert('Please sign in to checkout');
                    return;
                  }
                  setIsCheckoutOpen(true);
                }}
                className="w-full bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors"
              >
                {authState.isAuthenticated ? 'Proceed to Checkout' : 'Sign In to Checkout'}
              </button>

              {state.total < 25 && (
                <p className="text-xs text-center text-gray-500">
                  Add ${(25 - state.total).toFixed(2)} more for free delivery
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      <CheckoutModal
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
      />
    </div>
  );
};

export default Cart;