import React, { useState, useEffect } from 'react';
import { getOrders, updateOrderStatus } from '../../data/adminStore';
import { Order, OrderStatus } from '../../types';
import { Search, Eye, Filter, Printer } from 'lucide-react';

const OrdersPage: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<OrderStatus | 'all'>('all');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  const fetchOrders = async () => {
    try {
      const data = await getOrders();
      setOrders(data);
    } catch (err) {
      console.error(err);
    }
  };

  const handlePrintInvoice = (order: Order) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    
    const itemsHtml = order.items.map(item => `
      <tr>
        <td style="padding: 10px; border-bottom: 1px solid #ddd;">${item.product.name}</td>
        <td style="padding: 10px; border-bottom: 1px solid #ddd; text-align: center;">${item.product.unit}</td>
        <td style="padding: 10px; border-bottom: 1px solid #ddd; text-align: center;">x${item.quantity}</td>
        <td style="padding: 10px; border-bottom: 1px solid #ddd; text-align: right;">$${item.product.price.toFixed(2)}</td>
        <td style="padding: 10px; border-bottom: 1px solid #ddd; text-align: right;">$${(item.product.price * item.quantity).toFixed(2)}</td>
      </tr>
    `).join('');

    const html = `
      <html>
        <head>
          <title>Invoice - ${order.id}</title>
          <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #333; padding: 20px; line-height: 1.5; }
            .invoice-container { max-width: 800px; margin: 0 auto; border: 1px solid #eee; padding: 30px; border-radius: 8px; box-shadow: 0 0 10px rgba(0,0,0,0.05); }
            .header { display: flex; justify-content: space-between; border-bottom: 2px solid #22c55e; padding-bottom: 20px; margin-bottom: 30px; }
            .logo { font-size: 24px; font-weight: bold; color: #22c55e; }
            .meta-info { text-align: right; }
            .billing-info { display: flex; justify-content: space-between; margin-bottom: 30px; }
            .billing-info div { flex: 1; }
            table { width: 100%; border-collapse: collapse; }
            th { background: #f9fafb; padding: 12px 10px; text-align: left; font-weight: 600; border-bottom: 2px solid #ddd; }
            .totals { text-align: right; margin-left: auto; width: 300px; margin-top: 20px; }
            .totals table { width: 100%; }
            .totals td { padding: 6px 0; }
            .totals .grand-total { font-weight: bold; font-size: 18px; color: #22c55e; border-top: 2px solid #22c55e; padding-top: 10px; }
            .footer { text-align: center; margin-top: 50px; font-size: 12px; color: #777; border-top: 1px solid #eee; padding-top: 20px; }
            @media print {
              body { padding: 0; }
              .invoice-container { border: none; box-shadow: none; padding: 0; }
            }
          </style>
        </head>
        <body>
          <div class="invoice-container">
            <div class="header">
              <div>
                <div class="logo">Hargeisa Grocery</div>
                <div style="font-size: 12px; color: #666; margin-top: 5px;">
                  Jidka Xoriyada, Hargeisa, Somaliland<br/>
                  Phone: +252 63 609 7266<br/>
                  Email: hello@hargeisa.com
                </div>
              </div>
              <div class="meta-info">
                <h2 style="margin: 0; color: #333;">INVOICE</h2>
                <p style="margin: 5px 0 0 0; font-size: 14px; color: #666;">Invoice #: ${order.id}</p>
                <p style="margin: 5px 0 0 0; font-size: 14px; color: #666;">Date: ${new Date(order.orderDate).toLocaleDateString()}</p>
              </div>
            </div>
            
            <div class="billing-info">
              <div>
                <h4 style="margin: 0 0 8px 0; color: #555;">Bill To:</h4>
                <p style="margin: 0; font-weight: 500;">Customer ID: ${order.userId}</p>
                <p style="margin: 4px 0 0 0; color: #666;">Address: ${order.deliveryAddress.street}</p>
                <p style="margin: 4px 0 0 0; color: #666;">${order.deliveryAddress.district}, ${order.deliveryAddress.city}</p>
              </div>
              <div style="text-align: right;">
                <h4 style="margin: 0 0 8px 0; color: #555;">Payment Details:</h4>
                <p style="margin: 0; text-transform: uppercase; font-weight: 500;">Method: ${order.paymentMethod}</p>
                <p style="margin: 4px 0 0 0; color: #666;">Status: <span style="text-transform: capitalize;">${order.status}</span></p>
              </div>
            </div>

            <table>
              <thead>
                <tr>
                  <th>Item Description</th>
                  <th style="text-align: center;">Unit</th>
                  <th style="text-align: center;">Qty</th>
                  <th style="text-align: right;">Price</th>
                  <th style="text-align: right;">Total</th>
                </tr>
              </thead>
              <tbody>
                ${itemsHtml}
              </tbody>
            </table>

            <div class="totals">
              <table>
                <tr>
                  <td>Subtotal:</td>
                  <td style="text-align: right;">$${order.total.toFixed(2)}</td>
                </tr>
                <tr>
                  <td>Delivery Fee:</td>
                  <td style="text-align: right;">$0.00</td>
                </tr>
                <tr class="grand-total">
                  <td>Grand Total:</td>
                  <td style="text-align: right;">$${order.total.toFixed(2)}</td>
                </tr>
              </table>
            </div>

            <div class="footer">
              <p>Thank you for shopping with Hargeisa Grocery!</p>
              <p style="font-size: 10px; margin-top: 5px;">If you have any questions about this invoice, please contact hello@hargeisa.com</p>
            </div>
          </div>
          <script>
            window.onload = function() { window.print(); }
          </script>
        </body>
      </html>
    `;
    
    printWindow.document.write(html);
    printWindow.document.close();
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleStatusChange = async (orderId: string, status: OrderStatus) => {
    try {
      await updateOrderStatus(orderId, status);
      await fetchOrders();
    } catch (err) {
      console.error(err);
    }
  };

  const filteredOrders = orders.filter(o => {
    const matchesSearch = o.id.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          o.deliveryAddress.label.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || o.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: OrderStatus) => {
    switch(status) {
      case 'confirmed': return 'bg-yellow-500/10 text-yellow-500';
      case 'processing': return 'bg-purple-500/10 text-purple-500';
      case 'paid': return 'bg-blue-500/10 text-blue-500';
      case 'delivered': return 'bg-green-500/10 text-green-500';
      case 'cancelled': return 'bg-red-500/10 text-red-500';
      default: return 'bg-gray-500/10 text-gray-500';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold text-white">Orders</h1>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        <div className="p-4 border-b border-gray-800 flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search by order ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 text-white rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
            />
          </div>
          <div className="relative md:w-64">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as OrderStatus | 'all')}
              className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 text-white rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none appearance-none cursor-pointer"
            >
              <option value="all">All Statuses</option>
              <option value="confirmed">Confirmed</option>
              <option value="processing">Processing</option>
              <option value="paid">Paid</option>
              <option value="delivered">Delivered</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-800/50 text-gray-400">
              <tr>
                <th className="px-6 py-3 font-medium">Order ID</th>
                <th className="px-6 py-3 font-medium">Date</th>
                <th className="px-6 py-3 font-medium">Total</th>
                <th className="px-6 py-3 font-medium">Payment Type</th>
                <th className="px-6 py-3 font-medium">Status</th>
                <th className="px-6 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {filteredOrders.map(order => (
                <tr key={order.id} className="hover:bg-gray-800/50 transition-colors">
                  <td className="px-6 py-4 font-medium text-white">{order.id}</td>
                  <td className="px-6 py-4 text-gray-300">{new Date(order.orderDate).toLocaleString()}</td>
                  <td className="px-6 py-4 font-medium text-white">${order.total.toFixed(2)}</td>
                  <td className="px-6 py-4">
                    <span className="capitalize px-2 py-1 bg-gray-800 text-gray-300 rounded text-xs">
                      {order.paymentMethod}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <select
                      value={order.status}
                      onChange={(e) => handleStatusChange(order.id, e.target.value as OrderStatus)}
                      className={`px-2 py-1 text-xs font-medium rounded-full outline-none cursor-pointer border-none ${getStatusColor(order.status)}`}
                    >
                      <option value="confirmed" className="bg-gray-800 text-white">Confirmed</option>
                      <option value="processing" className="bg-gray-800 text-white">Processing</option>
                      <option value="paid" className="bg-gray-800 text-white">Paid</option>
                      <option value="delivered" className="bg-gray-800 text-white">Delivered</option>
                      <option value="cancelled" className="bg-gray-800 text-white">Cancelled</option>
                    </select>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end space-x-2">
                      <button
                        onClick={() => handlePrintInvoice(order)}
                        className="text-gray-400 hover:text-green-500 p-2 transition-colors"
                        title="Print Invoice"
                      >
                        <Printer size={18} />
                      </button>
                      <button
                        onClick={() => setSelectedOrder(order)}
                        className="text-gray-400 hover:text-white p-2 transition-colors"
                        title="View Details"
                      >
                        <Eye size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredOrders.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                    No orders found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Order Details Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-gray-900 border border-gray-800 rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto custom-scrollbar shadow-2xl">
            <div className="sticky top-0 bg-gray-900 border-b border-gray-800 px-6 py-4 flex items-center justify-between z-10">
              <div>
                <h2 className="text-xl font-bold text-white">Order Details</h2>
                <p className="text-sm text-gray-400">{selectedOrder.id}</p>
              </div>
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => handlePrintInvoice(selectedOrder)}
                  className="px-3 py-1.5 bg-green-600 hover:bg-green-500 text-white rounded text-xs font-semibold transition-colors flex items-center"
                >
                  Print Invoice
                </button>
                <button 
                  onClick={() => setSelectedOrder(null)}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
            
            <div className="p-6 space-y-6">
              {selectedOrder.status === 'cancelled' ? (
                <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 text-center">
                  <p className="text-red-500 font-semibold">This order has been cancelled.</p>
                </div>
              ) : (
                <div className="bg-gray-800/40 border border-gray-800 rounded-lg p-4 space-y-4">
                  <h3 className="text-sm font-medium text-gray-400">Delivery Tracking</h3>
                  <div className="flex items-center justify-between relative px-2 py-4">
                    {/* Progress Line */}
                    <div className="absolute left-6 right-6 top-1/2 h-0.5 bg-gray-700 -translate-y-1/2 z-0"></div>
                    <div 
                      className="absolute left-6 top-1/2 h-0.5 bg-green-500 -translate-y-1/2 z-0 transition-all duration-300"
                      style={{ 
                        width: `${
                          selectedOrder.status === 'delivered' ? 100 :
                          selectedOrder.status === 'paid' ? 66 :
                          selectedOrder.status === 'processing' ? 33 : 0
                        }%` 
                      }}
                    ></div>
                    
                    {/* Steps */}
                    {['confirmed', 'processing', 'paid', 'delivered'].map((step, idx) => {
                      const statusList = ['confirmed', 'processing', 'paid', 'delivered'];
                      const stepIndex = statusList.indexOf(selectedOrder.status);
                      const isCompleted = idx <= stepIndex;
                      const isActive = idx === stepIndex;
                      
                      return (
                        <div key={step} className="flex flex-col items-center z-10 relative">
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                            isCompleted ? 'bg-green-500 text-white' : 'bg-gray-700 text-gray-400'
                          } ${isActive ? 'ring-4 ring-green-500/20 scale-110' : ''}`}>
                            {idx + 1}
                          </div>
                          <span className={`text-[10px] mt-1.5 capitalize font-medium whitespace-nowrap absolute top-6 ${
                            isCompleted ? 'text-green-500' : 'text-gray-500'
                          }`}>
                            {step.replace(/-/g, ' ')}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-400 mb-2">Customer Info</h3>
                  <div className="bg-gray-800 rounded-lg p-4">
                    <p className="text-white font-medium">User ID: {selectedOrder.userId}</p>
                    <p className="text-sm text-gray-400 capitalize">Payment: {selectedOrder.paymentMethod}</p>
                  </div>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-400 mb-2">Delivery Address</h3>
                  <div className="bg-gray-800 rounded-lg p-4">
                    <p className="text-white font-medium">{selectedOrder.deliveryAddress.label}</p>
                    <p className="text-sm text-gray-400">{selectedOrder.deliveryAddress.street}</p>
                    <p className="text-sm text-gray-400">{selectedOrder.deliveryAddress.district}, {selectedOrder.deliveryAddress.city}</p>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-400 mb-2">Order Items</h3>
                <div className="bg-gray-800 rounded-lg overflow-hidden">
                  <table className="w-full text-left text-sm">
                    <tbody className="divide-y divide-gray-700">
                      {selectedOrder.items.map((item, idx) => (
                        <tr key={idx}>
                          <td className="px-4 py-3">
                            <div className="flex items-center space-x-3">
                              <img src={item.product.image} alt={item.product.name} className="w-10 h-10 rounded object-cover" />
                              <span className="text-white font-medium">{item.product.name}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-gray-300">x{item.quantity}</td>
                          <td className="px-4 py-3 font-medium text-white text-right">${(item.product.price * item.quantity).toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-gray-900/50">
                      <tr>
                        <td colSpan={2} className="px-4 py-3 text-right font-medium text-gray-400">Total</td>
                        <td className="px-4 py-3 font-bold text-green-500 text-right">${selectedOrder.total.toFixed(2)}</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrdersPage;
