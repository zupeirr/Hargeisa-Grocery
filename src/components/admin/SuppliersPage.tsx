import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, XCircle } from 'lucide-react';
import { getSuppliers, createSupplier, updateSupplier, deleteSupplier, getPurchaseOrders, createPurchaseOrder, updatePurchaseOrderStatus, updatePurchaseOrderPayment, getProducts } from '../../data/adminStore';

export default function SuppliersPage() {
  const [activeTab, setActiveTab] = useState<'suppliers' | 'orders'>('suppliers');
  
  // State for Suppliers
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [isEditingSupplier, setIsEditingSupplier] = useState(false);
  const [currentSupplier, setCurrentSupplier] = useState<any>(null);
  
  // State for Purchase Orders
  const [purchaseOrders, setPurchaseOrders] = useState<any[]>([]);
  const [isCreatingPO, setIsCreatingPO] = useState(false);
  const [currentPO, setCurrentPO] = useState<any>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [poItems, setPoItems] = useState<{ productId: string, quantity: number, unitCost: number }[]>([]);

  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      if (activeTab === 'suppliers') {
        const data = await getSuppliers();
        setSuppliers(data);
      } else {
        const data = await getPurchaseOrders();
        setPurchaseOrders(data);
        const prodData = await getProducts();
        setProducts(prodData);
      }
    } catch (err) {
      console.error('Error fetching data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // --- Supplier Handlers ---
  const handleSaveSupplier = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (currentSupplier.id) {
        await updateSupplier(currentSupplier.id, currentSupplier);
      } else {
        await createSupplier(currentSupplier);
      }
      setIsEditingSupplier(false);
      setCurrentSupplier(null);
      fetchData();
    } catch (err) {
      console.error('Error saving supplier:', err);
      alert('Failed to save supplier');
    }
  };

  const handleDeleteSupplier = async (id: string) => {
    if (confirm('Are you sure you want to delete this supplier? This may affect products and purchase orders.')) {
      try {
        await deleteSupplier(id);
        fetchData();
      } catch (err) {
        console.error('Error deleting supplier:', err);
        alert('Failed to delete supplier');
      }
    }
  };

  // --- Purchase Order Handlers ---
  const handleSavePO = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPO.supplierId || poItems.length === 0) {
      alert('Please select a supplier and add at least one item.');
      return;
    }
    
    try {
      await createPurchaseOrder({
        supplierId: currentPO.supplierId,
        items: poItems
      });
      setIsCreatingPO(false);
      setCurrentPO(null);
      setPoItems([]);
      fetchData();
    } catch (err) {
      console.error('Error saving PO:', err);
      alert('Failed to create purchase order');
    }
  };

  const updatePOStatus = async (id: string, status: string) => {
    try {
      await updatePurchaseOrderStatus(id, status);
      fetchData();
    } catch (err) {
      alert('Failed to update status');
    }
  };

  const updatePOPayment = async (id: string, paymentStatus: string) => {
    try {
      await updatePurchaseOrderPayment(id, paymentStatus);
      fetchData();
    } catch (err) {
      alert('Failed to update payment');
    }
  };

  const addPoItem = () => {
    setPoItems([...poItems, { productId: '', quantity: 1, unitCost: 0 }]);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-white">Supplier Management</h1>
        <div className="flex space-x-2 bg-gray-800 p-1 rounded-lg border border-gray-700">
          <button
            onClick={() => setActiveTab('suppliers')}
            className={`px-4 py-2 rounded-md font-medium transition-colors ${
              activeTab === 'suppliers' ? 'bg-gray-700 shadow-sm text-green-500' : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
            }`}
          >
            Suppliers
          </button>
          <button
            onClick={() => setActiveTab('orders')}
            className={`px-4 py-2 rounded-md font-medium transition-colors ${
              activeTab === 'orders' ? 'bg-gray-700 shadow-sm text-green-500' : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
            }`}
          >
            Purchase Orders
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center p-12"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div></div>
      ) : activeTab === 'suppliers' ? (
        <>
          <div className="flex justify-end">
            <button
              onClick={() => {
                setCurrentSupplier({ name: '', contactName: '', email: '', phone: '', address: '' });
                setIsEditingSupplier(true);
              }}
              className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              <Plus size={20} className="mr-2" />
              Add Supplier
            </button>
          </div>
          
          <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-x-auto custom-scrollbar">
            <table className="min-w-full divide-y divide-gray-800">
              <thead className="bg-gray-800/50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Supplier</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Contact</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Products</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Orders</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-400 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-gray-900 divide-y divide-gray-800">
                {suppliers.map((supplier) => (
                  <tr key={supplier.id} className="hover:bg-gray-800/50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-medium text-white">{supplier.name}</div>
                      <div className="text-sm text-gray-400">{supplier.address}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                      <div>{supplier.contactName}</div>
                      <div>{supplier.email}</div>
                      <div>{supplier.phone}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                      <span className="bg-blue-500/10 text-blue-500 px-2.5 py-0.5 rounded-full">
                        {supplier._count?.products || 0}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                      <span className="bg-purple-500/10 text-purple-500 px-2.5 py-0.5 rounded-full">
                        {supplier._count?.purchaseOrders || 0}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button 
                        onClick={() => {
                          setCurrentSupplier(supplier);
                          setIsEditingSupplier(true);
                        }}
                        className="text-blue-400 hover:text-blue-300 p-2 transition-colors"
                        title="Edit"
                      >
                        <Edit2 size={18} />
                      </button>
                      <button 
                        onClick={() => handleDeleteSupplier(supplier.id)}
                        className="text-red-400 hover:text-red-300 p-2 transition-colors"
                        title="Delete"
                      >
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      ) : (
        <>
          <div className="flex justify-end">
            <button
              onClick={() => {
                getSuppliers().then(data => {
                  setSuppliers(data);
                  setCurrentPO({ supplierId: '' });
                  setPoItems([]);
                  setIsCreatingPO(true);
                });
              }}
              className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              <Plus size={20} className="mr-2" />
              Create PO
            </button>
          </div>
          
          <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-x-auto custom-scrollbar">
            <table className="min-w-full divide-y divide-gray-800">
              <thead className="bg-gray-800/50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">PO #</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Supplier</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Amount</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Payment</th>
                </tr>
              </thead>
              <tbody className="bg-gray-900 divide-y divide-gray-800">
                {purchaseOrders.map((po) => (
                  <tr key={po.id} className="hover:bg-gray-800/50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">
                      {po.id.substring(0, 8).toUpperCase()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                      {po.supplier?.name || 'Unknown'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                      {new Date(po.orderDate).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-white font-medium">
                      ${po.totalAmount.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <select 
                        value={po.status}
                        onChange={(e) => updatePOStatus(po.id, e.target.value)}
                        className={`text-xs font-medium px-2 py-1 rounded-full border-0 focus:ring-2 focus:ring-offset-1 focus:ring-green-500 bg-gray-800 ${
                          po.status === 'received' ? 'text-green-500' :
                          po.status === 'sent' ? 'text-blue-500' :
                          'text-gray-300'
                        }`}
                      >
                        <option value="draft">Draft</option>
                        <option value="sent">Sent</option>
                        <option value="received">Received</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <select 
                        value={po.paymentStatus || 'unpaid'}
                        onChange={(e) => updatePOPayment(po.id, e.target.value)}
                        className={`text-xs font-medium px-2 py-1 rounded-full border-0 focus:ring-2 focus:ring-offset-1 focus:ring-green-500 bg-gray-800 ${
                          po.paymentStatus === 'paid' ? 'text-green-500' :
                          po.paymentStatus === 'partial' ? 'text-yellow-500' :
                          'text-red-500'
                        }`}
                      >
                        <option value="unpaid">Unpaid</option>
                        <option value="partial">Partial</option>
                        <option value="paid">Paid</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* Supplier Modal */}
      {isEditingSupplier && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-gray-900 border border-gray-800 rounded-xl max-w-md w-full">
            <div className="p-6">
              <h2 className="text-xl font-bold text-white mb-4">
                {currentSupplier.id ? 'Edit Supplier' : 'Add Supplier'}
              </h2>
              <form onSubmit={handleSaveSupplier} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300">Company Name</label>
                  <input
                    type="text"
                    required
                    value={currentSupplier.name}
                    onChange={e => setCurrentSupplier({...currentSupplier, name: e.target.value})}
                    className="mt-1 block w-full px-4 py-2 bg-gray-800 border border-gray-700 text-white rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300">Contact Person</label>
                  <input
                    type="text"
                    value={currentSupplier.contactName || ''}
                    onChange={e => setCurrentSupplier({...currentSupplier, contactName: e.target.value})}
                    className="mt-1 block w-full px-4 py-2 bg-gray-800 border border-gray-700 text-white rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300">Email</label>
                  <input
                    type="email"
                    value={currentSupplier.email || ''}
                    onChange={e => setCurrentSupplier({...currentSupplier, email: e.target.value})}
                    className="mt-1 block w-full px-4 py-2 bg-gray-800 border border-gray-700 text-white rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300">Phone</label>
                  <input
                    type="text"
                    value={currentSupplier.phone || ''}
                    onChange={e => setCurrentSupplier({...currentSupplier, phone: e.target.value})}
                    className="mt-1 block w-full px-4 py-2 bg-gray-800 border border-gray-700 text-white rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300">Address</label>
                  <textarea
                    rows={2}
                    value={currentSupplier.address || ''}
                    onChange={e => setCurrentSupplier({...currentSupplier, address: e.target.value})}
                    className="mt-1 block w-full px-4 py-2 bg-gray-800 border border-gray-700 text-white rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none resize-none"
                  />
                </div>
                <div className="flex justify-end space-x-3 mt-6 pt-4 border-t border-gray-800">
                  <button
                    type="button"
                    onClick={() => setIsEditingSupplier(false)}
                    className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2 bg-green-600 hover:bg-green-500 text-white rounded-lg font-medium transition-colors"
                  >
                    Save Supplier
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* PO Modal */}
      {isCreatingPO && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-gray-900 border border-gray-800 rounded-xl max-w-2xl w-full">
            <div className="p-6">
              <h2 className="text-xl font-bold text-white mb-4">Create Purchase Order</h2>
              <form onSubmit={handleSavePO} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300">Supplier</label>
                  <select
                    required
                    value={currentPO.supplierId}
                    onChange={e => setCurrentPO({...currentPO, supplierId: e.target.value})}
                    className="mt-1 block w-full px-4 py-2 bg-gray-800 border border-gray-700 text-white rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                  >
                    <option value="">Select Supplier</option>
                    {suppliers.map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>

                <div className="mt-4">
                  <div className="flex justify-between items-center mb-2">
                    <label className="block text-sm font-medium text-gray-300">Items</label>
                    <button type="button" onClick={addPoItem} className="text-sm text-green-500 hover:text-green-400">
                      + Add Item
                    </button>
                  </div>
                  
                  {poItems.map((item, index) => (
                    <div key={index} className="flex space-x-2 mb-2 items-center">
                      <select
                        required
                        value={item.productId}
                        onChange={(e) => {
                          const newItems = [...poItems];
                          newItems[index].productId = e.target.value;
                          setPoItems(newItems);
                        }}
                        className="flex-1 px-4 py-2 bg-gray-800 border border-gray-700 text-white rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                      >
                        <option value="">Select Product</option>
                        {products.map(p => (
                          <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                      </select>
                      <input
                        type="number"
                        min="1"
                        placeholder="Qty"
                        required
                        value={item.quantity}
                        onChange={(e) => {
                          const newItems = [...poItems];
                          newItems[index].quantity = parseInt(e.target.value);
                          setPoItems(newItems);
                        }}
                        className="w-20 px-4 py-2 bg-gray-800 border border-gray-700 text-white rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                      />
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="Cost"
                        required
                        value={item.unitCost}
                        onChange={(e) => {
                          const newItems = [...poItems];
                          newItems[index].unitCost = parseFloat(e.target.value);
                          setPoItems(newItems);
                        }}
                        className="w-24 px-4 py-2 bg-gray-800 border border-gray-700 text-white rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const newItems = poItems.filter((_, i) => i !== index);
                          setPoItems(newItems);
                        }}
                        className="text-red-400 hover:text-red-300 p-1"
                      >
                        <XCircle size={18} />
                      </button>
                    </div>
                  ))}
                  {poItems.length === 0 && <p className="text-sm text-gray-500 text-center py-2">No items added yet.</p>}
                  
                  <div className="text-right font-bold mt-4 pt-4 border-t border-gray-800 text-white">
                    Total: ${poItems.reduce((sum, item) => sum + (item.quantity * item.unitCost), 0).toFixed(2)}
                  </div>
                </div>

                <div className="flex justify-end space-x-3 mt-6 pt-4 border-t border-gray-800">
                  <button
                    type="button"
                    onClick={() => {
                      setIsCreatingPO(false);
                      setPoItems([]);
                    }}
                    className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2 bg-green-600 hover:bg-green-500 text-white rounded-lg font-medium transition-colors"
                  >
                    Create PO
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
