import React, { useState } from 'react';
import { Package, Truck, CheckCircle, Clock, MapPin, Phone } from 'lucide-react';
import { Order } from '../types';

interface OrderTrackingProps {
  isOpen: boolean;
  onClose: () => void;
}

const OrderTracking: React.FC<OrderTrackingProps> = ({ isOpen, onClose }) => {
  const [trackingId, setTrackingId] = useState('');
  const [order, setOrder] = useState<Order | null>(null);

  // Mock order data
  const mockOrder: Order = {
    id: 'HG-2024-001',
    userId: '1',
    items: [
      { product: { id: '1', name: 'Fresh Bananas', price: 2.50, image: '', category: 'fruits', description: '', inStock: true, unit: 'per kg', rating: 4.5, reviews: 128 }, quantity: 2 },
      { product: { id: '5', name: 'Fresh Milk', price: 2.00, image: '', category: 'dairy', description: '', inStock: true, unit: 'per liter', rating: 4.6, reviews: 203 }, quantity: 1 }
    ],
    total: 7.00,
    status: 'out-for-delivery',
    deliveryAddress: {
      id: '1',
      label: 'Home',
      street: 'Jidka Xoriyada, Building 123',
      district: 'Maroodi Jeex',
      city: 'Hargeisa',
      isDefault: true
    },
    paymentMethod: 'zaad',
    orderDate: new Date('2024-01-15T10:30:00'),
    deliveryDate: new Date('2024-01-15T15:30:00')
  };

  const handleTrackOrder = () => {
    if (trackingId.toLowerCase().includes('hg-2024-001') || trackingId === '001') {
      setOrder(mockOrder);
    } else {
      setOrder(null);
      alert('Order not found. Try tracking ID: HG-2024-001');
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'confirmed':
        return <CheckCircle className="w-6 h-6 text-green-600" />;
      case 'preparing':
        return <Package className="w-6 h-6 text-blue-600" />;
      case 'out-for-delivery':
        return <Truck className="w-6 h-6 text-orange-600" />;
      case 'delivered':
        return <CheckCircle className="w-6 h-6 text-green-600" />;
      default:
        return <Clock className="w-6 h-6 text-gray-400" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending':
        return 'Order Received';
      case 'confirmed':
        return 'Order Confirmed';
      case 'preparing':
        return 'Preparing Order';
      case 'out-for-delivery':
        return 'Out for Delivery';
      case 'delivered':
        return 'Delivered';
      default:
        return 'Unknown Status';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div className="absolute inset-0 bg-black bg-opacity-50" onClick={onClose} />
      
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl bg-white rounded-xl shadow-xl max-h-96 overflow-y-auto">
        <div className="p-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">Track Your Order</h2>
          
          {/* Tracking input */}
          <div className="mb-6">
            <div className="flex space-x-3">
              <input
                type="text"
                placeholder="Enter tracking ID (e.g., HG-2024-001)"
                value={trackingId}
                onChange={(e) => setTrackingId(e.target.value)}
                className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
              <button
                onClick={handleTrackOrder}
                className="bg-green-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors"
              >
                Track
              </button>
            </div>
          </div>

          {/* Order details */}
          {order && (
            <div className="space-y-6">
              {/* Order header */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="font-semibold text-lg">Order #{order.id}</h3>
                    <p className="text-gray-600">Placed on {order.orderDate.toLocaleDateString()}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-green-600">${order.total.toFixed(2)}</p>
                    <p className="text-sm text-gray-600 capitalize">{order.paymentMethod} Payment</p>
                  </div>
                </div>
              </div>

              {/* Status timeline */}
              <div className="space-y-4">
                <h4 className="font-semibold">Order Status</h4>
                <div className="flex items-center space-x-3 p-4 bg-orange-50 border border-orange-200 rounded-lg">
                  {getStatusIcon(order.status)}
                  <div>
                    <p className="font-semibold text-orange-800">{getStatusText(order.status)}</p>
                    <p className="text-sm text-orange-600">
                      {order.status === 'out-for-delivery' 
                        ? 'Your order is on the way! Expected delivery by 3:30 PM'
                        : 'Status updated'
                      }
                    </p>
                  </div>
                </div>
              </div>

              {/* Delivery info */}
              <div className="space-y-3">
                <h4 className="font-semibold">Delivery Information</h4>
                <div className="flex items-start space-x-3">
                  <MapPin className="w-5 h-5 text-green-600 mt-1" />
                  <div>
                    <p className="font-medium">{order.deliveryAddress.label}</p>
                    <p className="text-gray-600">{order.deliveryAddress.street}</p>
                    <p className="text-gray-600">{order.deliveryAddress.district}, {order.deliveryAddress.city}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <Phone className="w-5 h-5 text-green-600" />
                  <span className="text-gray-600">+252 63 609 7266</span>
                </div>
              </div>

              {/* Order items */}
              <div className="space-y-3">
                <h4 className="font-semibold">Order Items</h4>
                <div className="space-y-2">
                  {order.items.map((item, index) => (
                    <div key={index} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-b-0">
                      <div>
                        <p className="font-medium">{item.product.name}</p>
                        <p className="text-sm text-gray-600">Qty: {item.quantity}</p>
                      </div>
                      <p className="font-semibold">${(item.product.price * item.quantity).toFixed(2)}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          <div className="mt-6 flex justify-end">
            <button
              onClick={onClose}
              className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderTracking;