import React, { useState } from 'react';
import { X, MapPin, CreditCard, Truck, CheckCircle } from 'lucide-react';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import { Address } from '../types';

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const CheckoutModal: React.FC<CheckoutModalProps> = ({ isOpen, onClose }) => {
  const { state: cartState, dispatch } = useCart();
  const { state: authState } = useAuth();
  const [step, setStep] = useState(1);
  const [selectedAddress, setSelectedAddress] = useState<Address | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'zaad' | 'evc' | 'edahab' | 'cod'>('zaad');
  const [isProcessing, setIsProcessing] = useState(false);
  const [orderComplete, setOrderComplete] = useState(false);

  const deliveryFee = cartState.total >= 25 ? 0 : 3.50;
  const finalTotal = cartState.total + deliveryFee;

  const handleAddressSelect = (address: Address) => {
    setSelectedAddress(address);
    setStep(2);
  };

  const handlePaymentSelect = (method: 'zaad' | 'evc' | 'edahab' | 'cod') => {
    setPaymentMethod(method);
    setStep(3);
  };

  const handlePlaceOrder = async () => {
    setIsProcessing(true);
    
    // Simulate order processing
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    setIsProcessing(false);
    setOrderComplete(true);
    
    // Clear cart after successful order
    setTimeout(() => {
      dispatch({ type: 'CLEAR_CART' });
      onClose();
      setStep(1);
      setOrderComplete(false);
    }, 3000);
  };

  if (!isOpen) return null;

  if (orderComplete) {
    return (
      <div className="fixed inset-0 z-50 overflow-hidden">
        <div className="absolute inset-0 bg-black bg-opacity-50" />
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-white rounded-xl shadow-xl">
          <div className="p-8 text-center">
            <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Order Placed!</h2>
            <p className="text-gray-600 mb-4">Your order has been confirmed and will be delivered soon.</p>
            <p className="text-sm text-gray-500">Order ID: HG-2024-001</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div className="absolute inset-0 bg-black bg-opacity-50" onClick={onClose} />
      
      <div className="absolute right-0 top-0 h-full w-full max-w-lg bg-white shadow-xl">
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b">
            <h2 className="text-lg font-semibold">Checkout</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Progress indicator */}
          <div className="flex items-center justify-center p-4 bg-gray-50">
            <div className="flex items-center space-x-4">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 1 ? 'bg-green-600 text-white' : 'bg-gray-300'}`}>1</div>
              <div className={`w-12 h-0.5 ${step >= 2 ? 'bg-green-600' : 'bg-gray-300'}`} />
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 2 ? 'bg-green-600 text-white' : 'bg-gray-300'}`}>2</div>
              <div className={`w-12 h-0.5 ${step >= 3 ? 'bg-green-600' : 'bg-gray-300'}`} />
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 3 ? 'bg-green-600 text-white' : 'bg-gray-300'}`}>3</div>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-4">
            {step === 1 && (
              <div className="space-y-4">
                <h3 className="font-semibold text-lg mb-4">Select Delivery Address</h3>
                
                {authState.user?.addresses.map((address) => (
                  <div
                    key={address.id}
                    onClick={() => handleAddressSelect(address)}
                    className="p-4 border border-gray-200 rounded-lg hover:border-green-500 cursor-pointer transition-colors"
                  >
                    <div className="flex items-start space-x-3">
                      <MapPin className="w-5 h-5 text-green-600 mt-1" />
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <span className="font-medium">{address.label}</span>
                          {address.isDefault && (
                            <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">Default</span>
                          )}
                        </div>
                        <p className="text-gray-600 text-sm">{address.street}</p>
                        <p className="text-gray-600 text-sm">{address.district}, {address.city}</p>
                      </div>
                    </div>
                  </div>
                ))}

                <button className="w-full p-4 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-green-500 hover:text-green-600 transition-colors">
                  + Add New Address
                </button>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-4">
                <h3 className="font-semibold text-lg mb-4">Select Payment Method</h3>
                
                <div className="space-y-3">
                  {[
                    { id: 'zaad', name: 'ZAAD Service', color: 'bg-blue-600' },
                    { id: 'evc', name: 'EVC Plus', color: 'bg-orange-600' },
                    { id: 'edahab', name: 'Edahab', color: 'bg-purple-600' },
                    { id: 'cod', name: 'Cash on Delivery', color: 'bg-gray-600' }
                  ].map((method) => (
                    <div
                      key={method.id}
                      onClick={() => handlePaymentSelect(method.id as any)}
                      className="p-4 border border-gray-200 rounded-lg hover:border-green-500 cursor-pointer transition-colors"
                    >
                      <div className="flex items-center space-x-3">
                        <CreditCard className="w-5 h-5 text-gray-600" />
                        <div className="flex-1">
                          <span className="font-medium">{method.name}</span>
                        </div>
                        <div className={`${method.color} text-white px-3 py-1 rounded text-sm font-semibold`}>
                          {method.name.split(' ')[0]}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-6">
                <h3 className="font-semibold text-lg mb-4">Order Summary</h3>
                
                {/* Order items */}
                <div className="space-y-3">
                  {cartState.items.map((item) => (
                    <div key={item.product.id} className="flex items-center space-x-3">
                      <img
                        src={item.product.image}
                        alt={item.product.name}
                        className="w-12 h-12 object-cover rounded"
                      />
                      <div className="flex-1">
                        <p className="font-medium text-sm">{item.product.name}</p>
                        <p className="text-gray-600 text-xs">Qty: {item.quantity}</p>
                      </div>
                      <p className="font-semibold text-sm">${(item.product.price * item.quantity).toFixed(2)}</p>
                    </div>
                  ))}
                </div>

                {/* Delivery address */}
                <div className="bg-gray-50 p-3 rounded-lg">
                  <div className="flex items-start space-x-2">
                    <MapPin className="w-4 h-4 text-green-600 mt-1" />
                    <div>
                      <p className="font-medium text-sm">{selectedAddress?.label}</p>
                      <p className="text-gray-600 text-xs">{selectedAddress?.street}</p>
                      <p className="text-gray-600 text-xs">{selectedAddress?.district}, {selectedAddress?.city}</p>
                    </div>
                  </div>
                </div>

                {/* Payment method */}
                <div className="bg-gray-50 p-3 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <CreditCard className="w-4 h-4 text-green-600" />
                    <p className="font-medium text-sm capitalize">{paymentMethod} Payment</p>
                  </div>
                </div>

                {/* Totals */}
                <div className="space-y-2 pt-4 border-t">
                  <div className="flex justify-between text-sm">
                    <span>Subtotal:</span>
                    <span>${cartState.total.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Delivery:</span>
                    <span>{deliveryFee === 0 ? 'Free' : `$${deliveryFee.toFixed(2)}`}</span>
                  </div>
                  <div className="flex justify-between font-semibold text-lg border-t pt-2">
                    <span>Total:</span>
                    <span className="text-green-600">${finalTotal.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="border-t p-4">
            <div className="flex space-x-3">
              {step > 1 && (
                <button
                  onClick={() => setStep(step - 1)}
                  className="flex-1 py-3 border border-gray-300 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
                >
                  Back
                </button>
              )}
              
              {step < 3 ? (
                <button
                  disabled={step === 1 && !selectedAddress}
                  className="flex-1 bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Continue
                </button>
              ) : (
                <button
                  onClick={handlePlaceOrder}
                  disabled={isProcessing}
                  className="flex-1 bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors disabled:opacity-50"
                >
                  {isProcessing ? 'Processing...' : `Place Order - $${finalTotal.toFixed(2)}`}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckoutModal;