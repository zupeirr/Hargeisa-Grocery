import React, { useState, useEffect } from 'react';
import { getCustomers, getCustomerDetails, updateCustomerSegment, getCustomerReviews, deleteReview } from '../../data/adminStore';
import { Customer, Review } from '../../types';
import { Search, Mail, Phone, Calendar } from 'lucide-react';

const CustomersPage: React.FC = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [customerDetails, setCustomerDetails] = useState<any | null>(null);
  const [activeTab, setActiveTab] = useState<'profile' | 'history' | 'reviews'>('profile');
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);

  const fetchCustomers = async () => {
    try {
      const data = await getCustomers();
      setCustomers(data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const handleRowClick = async (customer: Customer) => {
    setSelectedCustomer(customer);
    setCustomerDetails(null);
    setActiveTab('profile');
    setExpandedOrderId(null);
    try {
      const [data, reviewsData] = await Promise.all([
        getCustomerDetails(customer.id),
        getCustomerReviews(customer.id)
      ]);
      setCustomerDetails({ ...data, reviews: reviewsData });
    } catch (err) {
      console.error(err);
    }
  };

  const handleSegmentChange = async (segment: string) => {
    if (!selectedCustomer) return;
    try {
      await updateCustomerSegment(selectedCustomer.id, segment);
      setCustomerDetails((prev: any) => prev ? { ...prev, segment } : null);
      setSelectedCustomer((prev: any) => prev ? { ...prev, segment } : null);
      await fetchCustomers();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteReview = async (reviewId: string) => {
    if (confirm('Are you sure you want to delete this review?')) {
      try {
        await deleteReview(reviewId);
        setCustomerDetails((prev: any) => ({
          ...prev,
          reviews: prev.reviews.filter((r: Review) => r.id !== reviewId)
        }));
      } catch (err) {
        console.error(err);
      }
    }
  };

  const filteredCustomers = customers.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.phone.includes(searchTerm) ||
    (c.segment && c.segment.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold text-white">Customers</h1>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        <div className="p-4 border-b border-gray-800">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search by name, email or phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 text-white rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-800/50 text-gray-400">
              <tr>
                <th className="px-6 py-3 font-medium">Customer</th>
                <th className="px-6 py-3 font-medium">Contact</th>
                <th className="px-6 py-3 font-medium">Address Location</th>
                <th className="px-6 py-3 font-medium">Segment</th>
                <th className="px-6 py-3 font-medium">Orders</th>
                <th className="px-6 py-3 font-medium">Total Spent</th>
                <th className="px-6 py-3 font-medium">Loyalty Points</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {filteredCustomers.map(customer => (
                <tr 
                  key={customer.id} 
                  onClick={() => handleRowClick(customer)}
                  className="hover:bg-gray-800/50 transition-colors cursor-pointer"
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-500 to-blue-500 flex items-center justify-center text-white font-bold flex-shrink-0">
                        {customer.name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-medium text-white">{customer.name}</p>
                        <div className="flex items-center text-xs text-gray-500 mt-1">
                          <Calendar size={12} className="mr-1" />
                          Joined {customer.joinDate.toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="space-y-1">
                      <div className="flex items-center text-gray-300">
                        <Mail size={14} className="mr-2 text-gray-500" />
                        {customer.email}
                      </div>
                      <div className="flex items-center text-gray-300">
                        <Phone size={14} className="mr-2 text-gray-500" />
                        {customer.phone || 'N/A'}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-gray-300">
                    {customer.address ? (
                      <span className="truncate block max-w-[150px]" title={customer.address}>{customer.address}</span>
                    ) : (
                      <span className="text-gray-500 italic">Not provided</span>
                    )}
                  </td>
                  <td className="px-6 py-4 capitalize">
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                      customer.segment === 'vip' ? 'bg-yellow-500/10 text-yellow-500 border border-yellow-500/20' :
                      customer.segment === 'returning' ? 'bg-blue-500/10 text-blue-500 border border-blue-500/20' :
                      'bg-green-500/10 text-green-500 border border-green-500/20'
                    }`}>
                      {customer.segment || 'New'}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-medium text-white">{customer.totalOrders}</td>
                  <td className="px-6 py-4 font-medium text-green-500">${customer.totalSpent.toFixed(2)}</td>
                  <td className="px-6 py-4">
                    <span className="px-2 py-1 bg-yellow-500/10 text-yellow-500 text-xs font-medium rounded-full">
                      {customer.loyaltyPoints} pts
                    </span>
                  </td>
                </tr>
              ))}
              {filteredCustomers.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                    No customers found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Customer Details Modal */}
      {selectedCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-gray-900 border border-gray-800 rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto custom-scrollbar shadow-2xl flex flex-col">
            <div className="sticky top-0 bg-gray-900 border-b border-gray-800 px-6 py-4 flex items-center justify-between z-10">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-500 to-blue-500 flex items-center justify-center text-white font-bold">
                  {selectedCustomer.name.charAt(0)}
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">{selectedCustomer.name}</h2>
                  <p className="text-xs text-gray-400 capitalize">Segment: {selectedCustomer.segment || 'New'}</p>
                </div>
              </div>
              <button 
                onClick={() => setSelectedCustomer(null)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                Close
              </button>
            </div>

            <div className="flex border-b border-gray-800 bg-gray-900/50">
              <button
                onClick={() => setActiveTab('profile')}
                className={`flex-1 py-3 text-sm font-semibold transition-colors border-b-2 ${
                  activeTab === 'profile' ? 'text-green-500 border-green-500' : 'text-gray-400 border-transparent hover:text-white'
                }`}
              >
                Profile Info
              </button>
              <button
                onClick={() => setActiveTab('history')}
                className={`flex-1 py-3 text-sm font-semibold transition-colors border-b-2 ${
                  activeTab === 'history' ? 'text-green-500 border-green-500' : 'text-gray-400 border-transparent hover:text-white'
                }`}
              >
                Order History ({(customerDetails?.orders || []).length})
              </button>
              <button
                onClick={() => setActiveTab('reviews')}
                className={`flex-1 py-3 text-sm font-semibold transition-colors border-b-2 ${
                  activeTab === 'reviews' ? 'text-green-500 border-green-500' : 'text-gray-400 border-transparent hover:text-white'
                }`}
              >
                Reviews ({(customerDetails?.reviews || []).length})
              </button>
            </div>

            <div className="p-6 space-y-6 flex-1 overflow-y-auto">
              {!customerDetails ? (
                <div className="text-center py-8 text-gray-500">Loading details...</div>
              ) : activeTab === 'profile' ? (
                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gray-800/40 p-4 rounded-lg border border-gray-800">
                      <span className="text-xs text-gray-400 block">Email Address</span>
                      <span className="text-white font-medium break-all">{customerDetails.email}</span>
                    </div>
                    <div className="bg-gray-800/40 p-4 rounded-lg border border-gray-800">
                      <span className="text-xs text-gray-400 block">Phone Number</span>
                      <span className="text-white font-medium">{customerDetails.phone || 'N/A'}</span>
                    </div>
                    <div className="bg-gray-800/40 p-4 rounded-lg border border-gray-800">
                      <span className="text-xs text-gray-400 block">Loyalty Points</span>
                      <span className="text-yellow-500 font-bold">{customerDetails.loyaltyPoints} pts</span>
                    </div>
                    <div className="bg-gray-800/40 p-4 rounded-lg border border-gray-800">
                      <span className="text-xs text-gray-400 block">Member Since</span>
                      <span className="text-white font-medium">{new Date(customerDetails.joinDate).toLocaleDateString()}</span>
                    </div>
                  </div>

                  <div className="bg-gray-800/40 p-4 rounded-lg border border-gray-800 space-y-2">
                    <label className="text-sm font-medium text-gray-300 block">Override Customer Segment</label>
                    <select
                      value={customerDetails.segment || 'new'}
                      onChange={(e) => handleSegmentChange(e.target.value)}
                      className="w-full px-4 py-2 bg-gray-900 border border-gray-700 text-white rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                    >
                      <option value="new">New</option>
                      <option value="returning">Returning</option>
                      <option value="vip">VIP</option>
                    </select>
                  </div>
                </div>
              ) : activeTab === 'history' ? (
                <div className="space-y-4">
                  {(customerDetails.orders || []).length === 0 ? (
                    <p className="text-center py-8 text-gray-500">No order history found for this customer.</p>
                  ) : (
                    customerDetails.orders.map((order: any) => {
                      const isExpanded = expandedOrderId === order.id;
                      return (
                        <div key={order.id} className="border border-gray-800 rounded-lg overflow-hidden">
                          <button
                            onClick={() => setExpandedOrderId(isExpanded ? null : order.id)}
                            className="w-full flex items-center justify-between p-4 bg-gray-800/40 hover:bg-gray-800/60 transition-colors text-left"
                          >
                            <div>
                              <span className="text-xs font-semibold text-white block">{order.id}</span>
                              <span className="text-[10px] text-gray-400">{new Date(order.orderDate).toLocaleDateString()}</span>
                            </div>
                            <div className="flex items-center space-x-3">
                              <span className="text-sm font-bold text-white">${order.total.toFixed(2)}</span>
                              <span className={`px-2 py-0.5 text-[10px] font-semibold rounded-full capitalize ${
                                order.status === 'delivered' ? 'bg-green-500/10 text-green-500' :
                                order.status === 'pending' ? 'bg-yellow-500/10 text-yellow-500' :
                                order.status === 'cancelled' ? 'bg-red-500/10 text-red-500' : 'bg-blue-500/10 text-blue-500'
                              }`}>
                                {order.status}
                              </span>
                            </div>
                          </button>
                          {isExpanded && (
                            <div className="p-4 bg-gray-900/50 border-t border-gray-800">
                              <h4 className="text-xs font-semibold text-gray-400 mb-2">Order Items</h4>
                              <table className="w-full text-left text-xs">
                                <thead>
                                  <tr className="text-gray-500 border-b border-gray-800">
                                    <th className="pb-1">Item</th>
                                    <th className="pb-1 text-center">Qty</th>
                                    <th className="pb-1 text-right">Price</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {(order.items || []).map((item: any, itemIdx: number) => (
                                    <tr key={itemIdx} className="text-gray-300">
                                      <td className="py-2">{item.product?.name || 'Unknown Item'}</td>
                                      <td className="py-2 text-center">x{item.quantity}</td>
                                      <td className="py-2 text-right">${(item.price || item.product?.price || 0).toFixed(2)}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  {(customerDetails.reviews || []).length === 0 ? (
                    <p className="text-center py-8 text-gray-500">No reviews found for this customer.</p>
                  ) : (
                    customerDetails.reviews.map((review: Review) => (
                      <div key={review.id} className="bg-gray-800/40 border border-gray-800 rounded-lg p-4">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h4 className="text-sm font-bold text-white">{review.product?.name || 'Unknown Product'}</h4>
                            <div className="flex items-center space-x-1 text-yellow-500 mt-1">
                              {[...Array(5)].map((_, i) => (
                                <span key={i} className={i < review.rating ? 'text-yellow-500' : 'text-gray-600'}>★</span>
                              ))}
                              <span className="text-xs text-gray-400 ml-2">{new Date(review.createdAt).toLocaleDateString()}</span>
                            </div>
                          </div>
                          <button
                            onClick={() => handleDeleteReview(review.id)}
                            className="text-red-500 hover:text-red-400 text-xs px-2 py-1 rounded bg-red-500/10 hover:bg-red-500/20 transition-colors"
                          >
                            Delete
                          </button>
                        </div>
                        {review.comment && (
                          <p className="text-sm text-gray-300 mt-2">{review.comment}</p>
                        )}
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomersPage;
