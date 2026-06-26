import React, { useState, useEffect } from 'react';
import { Boxes, Plus, AlertTriangle, Clock, ShieldAlert, Calendar } from 'lucide-react';
import { getProducts, getInventoryTransactions, createInventoryTransaction, updateProductDamage, updateProductExpiry } from '../../data/adminStore';
import { Product } from '../../types';

export default function InventoryPage() {
  const [activeTab, setActiveTab] = useState<'stock' | 'transactions' | 'damaged'>('stock');
  
  const [products, setProducts] = useState<Product[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modals
  const [isAdjustingStock, setIsAdjustingStock] = useState(false);
  const [isMarkingDamage, setIsMarkingDamage] = useState(false);
  const [isSettingExpiry, setIsSettingExpiry] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  // Form states
  const [adjustQty, setAdjustQty] = useState(0);
  const [adjustType, setAdjustType] = useState('stock_in');
  const [adjustNote, setAdjustNote] = useState('');
  
  const [damageQty, setDamageQty] = useState(1);
  const [damageReason, setDamageReason] = useState('');

  const [expiryDate, setExpiryDate] = useState('');

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      if (activeTab === 'stock' || activeTab === 'damaged') {
        const data = await getProducts();
        setProducts(data);
      } else if (activeTab === 'transactions') {
        const data = await getInventoryTransactions();
        setTransactions(data);
      }
    } catch (err) {
      console.error('Error fetching inventory:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStockAdjustment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) return;
    try {
      await createInventoryTransaction({
        productId: selectedProduct.id,
        type: adjustType,
        quantity: Math.abs(adjustQty),
        note: adjustNote
      });
      setIsAdjustingStock(false);
      fetchData();
    } catch (err) {
      alert('Failed to adjust stock');
    }
  };

  const handleMarkDamage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) return;
    try {
      // 1. Mark as damaged on product
      await updateProductDamage(selectedProduct.id, {
        isDamaged: true,
        damagedQty: (selectedProduct.damagedQty || 0) + damageQty,
        damagedReason: damageReason
      });

      // 2. Create stock_out transaction for damaged goods
      await createInventoryTransaction({
        productId: selectedProduct.id,
        type: 'damaged',
        quantity: damageQty,
        note: `Marked damaged: ${damageReason}`
      });

      setIsMarkingDamage(false);
      fetchData();
    } catch (err) {
      alert('Failed to mark damaged stock');
    }
  };

  const handleSetExpiry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) return;
    try {
      await updateProductExpiry(selectedProduct.id, expiryDate);
      setIsSettingExpiry(false);
      fetchData();
    } catch (err) {
      alert('Failed to set expiry date');
    }
  };

  const isLowStock = (product: Product) => product.stockLevel <= product.lowStockAlert;
  const isExpiringSoon = (dateStr?: string) => {
    if (!dateStr) return false;
    const days = (new Date(dateStr).getTime() - new Date().getTime()) / (1000 * 3600 * 24);
    return days <= 30 && days > 0;
  };
  const isExpired = (dateStr?: string) => {
    if (!dateStr) return false;
    return new Date(dateStr).getTime() < new Date().getTime();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold text-white">Inventory Management</h1>
        <div className="flex space-x-2 bg-gray-800 p-1 rounded-lg border border-gray-700">
          <button
            onClick={() => setActiveTab('stock')}
            className={`px-4 py-2 rounded-md font-medium transition-colors ${
              activeTab === 'stock' ? 'bg-gray-700 shadow-sm text-green-500' : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
            }`}
          >
            Stock Levels
          </button>
          <button
            onClick={() => setActiveTab('transactions')}
            className={`px-4 py-2 rounded-md font-medium transition-colors ${
              activeTab === 'transactions' ? 'bg-gray-700 shadow-sm text-green-500' : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
            }`}
          >
            Transactions
          </button>
          <button
            onClick={() => setActiveTab('damaged')}
            className={`px-4 py-2 rounded-md font-medium transition-colors ${
              activeTab === 'damaged' ? 'bg-gray-700 shadow-sm text-green-500' : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
            }`}
          >
            Damaged Stock
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center p-12"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div></div>
      ) : activeTab === 'stock' ? (
        <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-800/50 text-gray-400">
                <tr>
                  <th className="px-6 py-3 font-medium">Product</th>
                  <th className="px-6 py-3 font-medium">SKU / Barcode</th>
                  <th className="px-6 py-3 font-medium">Current Stock</th>
                  <th className="px-6 py-3 font-medium">Expiry Date</th>
                  <th className="px-6 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {products.map((product) => (
                  <tr key={product.id} className="hover:bg-gray-800/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className="h-10 w-10 flex-shrink-0 bg-gray-800 border border-gray-700 rounded-lg overflow-hidden flex items-center justify-center">
                          {product.image ? (
                            <img src={product.image} alt={product.name} className="h-full w-full object-cover" />
                          ) : (
                            <Boxes className="h-5 w-5 text-gray-500" />
                          )}
                        </div>
                        <div className="ml-4">
                          <div className="font-medium text-white">{product.name}</div>
                          <div className="text-gray-400 capitalize">{product.category}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-400">
                      <div>{product.sku || 'N/A'}</div>
                      <div className="text-xs">{product.barcode}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                        isLowStock(product) ? 'bg-red-500/10 text-red-500' : 'bg-green-500/10 text-green-500'
                      }`}>
                        {product.stockLevel} {product.unit}
                      </span>
                      {isLowStock(product) && (
                        <span className="ml-2 text-red-500" title="Low Stock"><AlertTriangle size={14} className="inline" /></span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {product.expiryDate ? (
                        <div className={`flex items-center text-sm ${
                          isExpired(product.expiryDate) ? 'text-red-500 font-bold' : 
                          isExpiringSoon(product.expiryDate) ? 'text-yellow-500 font-medium' : 'text-gray-400'
                        }`}>
                          <Clock size={16} className="mr-1" />
                          {new Date(product.expiryDate).toLocaleDateString()}
                        </div>
                      ) : (
                        <span className="text-gray-600">Not set</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right space-x-2">
                      <button 
                        onClick={() => {
                          setSelectedProduct(product);
                          setAdjustQty(0);
                          setIsAdjustingStock(true);
                        }}
                        className="text-blue-400 hover:text-blue-300 p-1 transition-colors"
                        title="Adjust Stock"
                      >
                        <Plus size={18} className="inline" />
                      </button>
                      <button 
                        onClick={() => {
                          setSelectedProduct(product);
                          setDamageQty(1);
                          setDamageReason('');
                          setIsMarkingDamage(true);
                        }}
                        className="text-orange-400 hover:text-orange-300 p-1 transition-colors"
                        title="Mark Damaged"
                      >
                        <ShieldAlert size={18} className="inline" />
                      </button>
                      <button 
                        onClick={() => {
                          setSelectedProduct(product);
                          setExpiryDate(product.expiryDate ? new Date(product.expiryDate).toISOString().split('T')[0] : '');
                          setIsSettingExpiry(true);
                        }}
                        className="text-gray-400 hover:text-gray-300 p-1 transition-colors"
                        title="Set Expiry"
                      >
                        <Calendar size={18} className="inline" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : activeTab === 'transactions' ? (
        <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-800/50 text-gray-400">
              <tr>
                <th className="px-6 py-3 font-medium">Date</th>
                <th className="px-6 py-3 font-medium">Product</th>
                <th className="px-6 py-3 font-medium">Type</th>
                <th className="px-6 py-3 font-medium">Quantity</th>
                <th className="px-6 py-3 font-medium">Note / Ref</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {transactions.map((tx) => (
                <tr key={tx.id} className="hover:bg-gray-800/50 transition-colors">
                  <td className="px-6 py-4 text-gray-400">
                    {new Date(tx.createdAt).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 font-medium text-white">
                    {tx.product?.name || 'Unknown'} <span className="text-gray-500 font-normal ml-1">({tx.product?.sku})</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${
                      tx.type === 'stock_in' ? 'bg-green-500/10 text-green-500 border-green-500/20' :
                      tx.type === 'stock_out' ? 'bg-blue-500/10 text-blue-500 border-blue-500/20' :
                      tx.type === 'damaged' ? 'bg-red-500/10 text-red-500 border-red-500/20' :
                      'bg-gray-800 text-gray-300 border-gray-700'
                    }`}>
                      {tx.type.replace('_', ' ').toUpperCase()}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-medium text-white">
                    {tx.type === 'stock_in' ? '+' : tx.type === 'stock_out' || tx.type === 'damaged' ? '-' : ''}
                    {tx.quantity}
                  </td>
                  <td className="px-6 py-4 text-gray-400">
                    {tx.note && <div className="text-white">{tx.note}</div>}
                    {tx.reference && <div className="text-xs">Ref: {tx.reference}</div>}
                  </td>
                </tr>
              ))}
              {transactions.length === 0 && (
                <tr><td colSpan={5} className="px-6 py-8 text-center text-gray-500">No transactions found</td></tr>
              )}
            </tbody>
          </table>
          </div>
        </div>
      ) : (
        <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-800/50 text-gray-400">
              <tr>
                <th className="px-6 py-3 font-medium">Product</th>
                <th className="px-6 py-3 font-medium">SKU</th>
                <th className="px-6 py-3 font-medium">Damaged Qty</th>
                <th className="px-6 py-3 font-medium">Reason</th>
                <th className="px-6 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {products.filter(p => p.isDamaged || (p.damagedQty || 0) > 0).map((product) => (
                <tr key={product.id} className="hover:bg-gray-800/50 transition-colors">
                  <td className="px-6 py-4 font-medium text-white">
                    {product.name}
                  </td>
                  <td className="px-6 py-4 text-gray-400">
                    {product.sku || 'N/A'}
                  </td>
                  <td className="px-6 py-4 font-bold text-red-500">
                    {product.damagedQty} {product.unit}
                  </td>
                  <td className="px-6 py-4 text-gray-300">
                    {product.damagedReason || 'No reason provided'}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button 
                      onClick={async () => {
                        if(confirm('Clear damage record? This will not restore stock.')) {
                          await updateProductDamage(product.id, { isDamaged: false, damagedQty: 0, damagedReason: null });
                          fetchData();
                        }
                      }}
                      className="text-gray-400 hover:text-white transition-colors"
                    >
                      Clear Record
                    </button>
                  </td>
                </tr>
              ))}
              {products.filter(p => p.isDamaged || (p.damagedQty || 0) > 0).length === 0 && (
                <tr><td colSpan={5} className="px-6 py-8 text-center text-gray-500">No damaged stock recorded.</td></tr>
              )}
            </tbody>
          </table>
          </div>
        </div>
      )}

      {/* Adjust Stock Modal */}
      {isAdjustingStock && selectedProduct && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-gray-900 border border-gray-800 rounded-xl max-w-md w-full p-6">
            <h2 className="text-xl font-bold text-white mb-4">Adjust Stock: {selectedProduct.name}</h2>
            <p className="text-sm text-gray-400 mb-4">Current Stock: <span className="text-white">{selectedProduct.stockLevel} {selectedProduct.unit}</span></p>
            <form onSubmit={handleStockAdjustment} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300">Type</label>
                <select
                  value={adjustType}
                  onChange={(e) => setAdjustType(e.target.value)}
                  className="mt-1 block w-full px-4 py-2 bg-gray-800 border border-gray-700 text-white rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                >
                  <option value="stock_in">Stock In (+)</option>
                  <option value="stock_out">Stock Out (-)</option>
                  <option value="adjustment">Manual Adjustment</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300">Quantity</label>
                <input
                  type="number"
                  min="1"
                  required
                  value={adjustQty}
                  onChange={(e) => setAdjustQty(parseInt(e.target.value))}
                  className="mt-1 block w-full px-4 py-2 bg-gray-800 border border-gray-700 text-white rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300">Note</label>
                <input
                  type="text"
                  placeholder="Reason for adjustment..."
                  value={adjustNote}
                  onChange={(e) => setAdjustNote(e.target.value)}
                  className="mt-1 block w-full px-4 py-2 bg-gray-800 border border-gray-700 text-white rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                />
              </div>
              <div className="flex justify-end space-x-3 mt-6 pt-4 border-t border-gray-800">
                <button type="button" onClick={() => setIsAdjustingStock(false)} className="px-4 py-2 text-gray-400 hover:text-white transition-colors">Cancel</button>
                <button type="submit" className="px-6 py-2 bg-green-600 hover:bg-green-500 text-white rounded-lg font-medium transition-colors">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Mark Damaged Modal */}
      {isMarkingDamage && selectedProduct && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-gray-900 border border-gray-800 rounded-xl max-w-md w-full p-6">
            <h2 className="text-xl font-bold text-white mb-4">Mark Damaged: {selectedProduct.name}</h2>
            <form onSubmit={handleMarkDamage} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300">Damaged Quantity</label>
                <input
                  type="number"
                  min="1"
                  max={selectedProduct.stockLevel}
                  required
                  value={damageQty}
                  onChange={(e) => setDamageQty(parseInt(e.target.value))}
                  className="mt-1 block w-full px-4 py-2 bg-gray-800 border border-gray-700 text-white rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none"
                />
                <p className="text-xs text-gray-500 mt-1">This will deduct from current stock ({selectedProduct.stockLevel})</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300">Reason</label>
                <textarea
                  required
                  rows={2}
                  placeholder="e.g. Expired, Broken packaging"
                  value={damageReason}
                  onChange={(e) => setDamageReason(e.target.value)}
                  className="mt-1 block w-full px-4 py-2 bg-gray-800 border border-gray-700 text-white rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none resize-none"
                />
              </div>
              <div className="flex justify-end space-x-3 mt-6 pt-4 border-t border-gray-800">
                <button type="button" onClick={() => setIsMarkingDamage(false)} className="px-4 py-2 text-gray-400 hover:text-white transition-colors">Cancel</button>
                <button type="submit" className="px-6 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg font-medium transition-colors">Confirm</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Set Expiry Modal */}
      {isSettingExpiry && selectedProduct && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-gray-900 border border-gray-800 rounded-xl max-w-md w-full p-6">
            <h2 className="text-xl font-bold text-white mb-4">Set Expiry: {selectedProduct.name}</h2>
            <form onSubmit={handleSetExpiry} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300">Expiry Date</label>
                <input
                  type="date"
                  value={expiryDate}
                  onChange={(e) => setExpiryDate(e.target.value)}
                  className="mt-1 block w-full px-4 py-2 bg-gray-800 border border-gray-700 text-white rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                />
              </div>
              <div className="flex justify-end space-x-3 mt-6 pt-4 border-t border-gray-800">
                <button type="button" onClick={() => setIsSettingExpiry(false)} className="px-4 py-2 text-gray-400 hover:text-white transition-colors">Cancel</button>
                <button type="submit" className="px-6 py-2 bg-green-600 hover:bg-green-500 text-white rounded-lg font-medium transition-colors">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
