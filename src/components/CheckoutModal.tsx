import React, { useState } from 'react';
import { X, MapPin, CreditCard, CheckCircle } from 'lucide-react';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import { createOrderAPI, createCustomerAPI } from '../data/adminStore';

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOrderSuccess?: () => void;
}

const CheckoutModal: React.FC<CheckoutModalProps> = ({ isOpen, onClose, onOrderSuccess }) => {
  const { state: cartState, dispatch } = useCart();
  const { state: authState } = useAuth();
  const [step, setStep] = useState(1);
  const [selectedAddress, setSelectedAddress] = useState<string>('');
  const [guestName, setGuestName] = useState('');
  const [guestPhone, setGuestPhone] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'zaad' | 'evc' | 'edahab' | 'cod'>('zaad');
  const [isProcessing, setIsProcessing] = useState(false);
  const [orderComplete, setOrderComplete] = useState(false);
  const [placedOrderId, setPlacedOrderId] = useState('');

  const deliveryFee = cartState.total >= 25 ? 0 : 3.50;
  const finalTotal = cartState.total + deliveryFee;

  const handlePaymentSelect = (method: 'zaad' | 'evc' | 'edahab' | 'cod') => {
    setPaymentMethod(method);
    setStep(3);
  };

  const handlePlaceOrder = async () => {
    setIsProcessing(true);
    
    try {
      const payloadItems = cartState.items.map(item => ({
        productId: item.product.id,
        quantity: item.quantity,
        price: item.product.price
      }));

      let customerId = authState.user?.id;
      if (!customerId || !customerId.includes('-')) {
        try {
          const nameToUse = authState.user?.name || guestName || 'Guest';
          const emailToUse = authState.user?.email || `guest_${Date.now()}@hargeisa.com`;
          const phoneToUse = authState.user?.phone || guestPhone || '0000000';
          const guestCust = await createCustomerAPI(nameToUse, emailToUse, phoneToUse);
          customerId = guestCust.id;

          // Attempt to patch local storage so we don't keep creating duplicates
          if (authState.user && authState.user.id !== customerId) {
            const sessionStr = localStorage.getItem('hargeisa_session');
            if (sessionStr) {
              const sessionObj = JSON.parse(sessionStr);
              sessionObj.id = customerId;
              localStorage.setItem('hargeisa_session', JSON.stringify(sessionObj));
            }
          }
        } catch (e) {
          console.error("Failed to create guest customer", e);
          customerId = '1';
        }
      }

      // Create the order on backend database
      const createdOrder = await createOrderAPI({
        customerId: customerId,
        items: payloadItems,
        total: finalTotal,
        paymentMethod: paymentMethod,
        deliveryAddress: selectedAddress,
      });

      setPlacedOrderId(createdOrder.id);
      setIsProcessing(false);
      setOrderComplete(true);

      // Clear cart after successful order
      setTimeout(() => {
        dispatch({ type: 'CLEAR_CART' });
        if (onOrderSuccess) {
          onOrderSuccess();
        } else {
          onClose();
        }
        setStep(1);
        setSelectedAddress('');
        setOrderComplete(false);
        setPlacedOrderId('');

        // Dispatch the openOrderTracking event with the new order details
        window.dispatchEvent(new CustomEvent('openOrderTracking', {
          detail: { order: createdOrder }
        }));
      }, 3000);

    } catch (err: any) {
      console.error('Failed to place order on backend:', err);
      alert(err.message || 'Failed to place order. Please try again.');
      setIsProcessing(false);
    }
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
            <p className="text-sm text-gray-500">Order ID: {placedOrderId}</p>
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
                {!authState.isAuthenticated && (
                  <>
                    <h3 className="font-semibold text-lg mb-4">Contact Information</h3>
                    <div className="space-y-4">
                      <input
                        type="text"
                        placeholder="Full Name"
                        value={guestName}
                        onChange={(e) => setGuestName(e.target.value)}
                        className="w-full p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      />
                      <input
                        type="tel"
                        placeholder="Phone Number"
                        value={guestPhone}
                        onChange={(e) => setGuestPhone(e.target.value)}
                        className="w-full p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      />
                    </div>
                    <hr className="my-6 border-gray-200" />
                  </>
                )}
                <h3 className="font-semibold text-lg mb-4">Enter Delivery Address</h3>
                
                <div className="relative">
                  <textarea
                    value={selectedAddress}
                    onChange={(e) => setSelectedAddress(e.target.value)}
                    placeholder="Enter your full address including district and landmarks"
                    rows={5}
                    className="w-full p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none text-gray-800"
                  />
                </div>
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
                      <p className="font-medium text-sm">Delivery Address</p>
                      <p className="text-gray-600 text-sm whitespace-pre-wrap">{selectedAddress}</p>
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
                  onClick={() => setStep(step + 1)}
                  disabled={step === 1 && (!selectedAddress.trim() || (!authState.isAuthenticated && (!guestName.trim() || !guestPhone.trim())))}
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