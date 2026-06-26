import React, { useState, useEffect } from 'react';
import { DollarSign, Plus, Edit2, Trash2, TrendingUp, TrendingDown } from 'lucide-react';
import { getExpenses, createExpense, updateExpense, deleteExpense, getExpenseReport } from '../../data/adminStore';

const EXCHANGE_RATE = 571.5; // 1 USD = 571.5 SOS

const formatCurrency = (amount: number) => {
  const usd = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
  const sos = new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(amount * EXCHANGE_RATE) + ' SOS';
  return `${usd} (${sos})`;
};

export default function ExpensesPage() {
  const [activeTab, setActiveTab] = useState<'expenses' | 'report'>('expenses');
  const [expenses, setExpenses] = useState<any[]>([]);
  const [report, setReport] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Modal State
  const [isEditing, setIsEditing] = useState(false);
  const [currentExpense, setCurrentExpense] = useState<any>(null);

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      if (activeTab === 'expenses') {
        const data = await getExpenses();
        setExpenses(data);
      } else {
        const data = await getExpenseReport();
        setReport(data);
      }
    } catch (err) {
      console.error('Error fetching expenses:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (currentExpense.id) {
        await updateExpense(currentExpense.id, currentExpense);
      } else {
        await createExpense(currentExpense);
      }
      setIsEditing(false);
      setCurrentExpense(null);
      fetchData();
    } catch (err) {
      alert('Failed to save expense');
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this expense?')) {
      try {
        await deleteExpense(id);
        fetchData();
      } catch (err) {
        alert('Failed to delete expense');
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-white">Expenses & Financials</h1>
        <div className="flex space-x-2 bg-gray-800 p-1 rounded-lg border border-gray-700">
          <button
            onClick={() => setActiveTab('expenses')}
            className={`px-4 py-2 rounded-md font-medium transition-colors ${
              activeTab === 'expenses' ? 'bg-gray-700 shadow-sm text-green-500' : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
            }`}
          >
            Expenses Log
          </button>
          <button
            onClick={() => setActiveTab('report')}
            className={`px-4 py-2 rounded-md font-medium transition-colors ${
              activeTab === 'report' ? 'bg-gray-700 shadow-sm text-green-500' : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
            }`}
          >
            Profit Report
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center p-12"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div></div>
      ) : activeTab === 'expenses' ? (
        <>
          <div className="flex justify-end">
            <button
              onClick={() => {
                setCurrentExpense({ category: 'Utilities', amount: 0, description: '', date: new Date().toISOString().split('T')[0] });
                setIsEditing(true);
              }}
              className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              <Plus size={20} className="mr-2" />
              Record Expense
            </button>
          </div>

          <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-x-auto custom-scrollbar">
            <table className="min-w-full divide-y divide-gray-800">
              <thead className="bg-gray-800/50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Category</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Description</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Amount</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-400 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-gray-900 divide-y divide-gray-800">
                {expenses.map((exp) => (
                  <tr key={exp.id} className="hover:bg-gray-800/50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                      {new Date(exp.date).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="bg-gray-800 text-gray-300 px-2.5 py-0.5 rounded-full text-xs font-medium border border-gray-700">
                        {exp.category}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                      {exp.description || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-red-400">
                      {formatCurrency(exp.amount)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button 
                        onClick={() => {
                          setCurrentExpense({...exp, date: new Date(exp.date).toISOString().split('T')[0]});
                          setIsEditing(true);
                        }}
                        className="text-blue-400 hover:text-blue-300 p-2 transition-colors"
                        title="Edit"
                      >
                        <Edit2 size={18} />
                      </button>
                      <button 
                        onClick={() => handleDelete(exp.id)}
                        className="text-red-400 hover:text-red-300 p-2 transition-colors"
                        title="Delete"
                      >
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                ))}
                {expenses.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                      No expenses recorded yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      ) : report ? (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-400">Total Revenue</p>
                  <p className="text-2xl font-bold text-white mt-1">{formatCurrency(report.totalRevenue)}</p>
                </div>
                <div className="w-12 h-12 bg-green-500/10 rounded-full flex items-center justify-center">
                  <TrendingUp className="text-green-500" size={24} />
                </div>
              </div>
            </div>

            <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-400">Total Expenses</p>
                  <p className="text-2xl font-bold text-white mt-1">{formatCurrency(report.totalExpenses)}</p>
                </div>
                <div className="w-12 h-12 bg-red-500/10 rounded-full flex items-center justify-center">
                  <TrendingDown className="text-red-500" size={24} />
                </div>
              </div>
            </div>

            <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-400">Net Profit</p>
                  <p className={`text-2xl font-bold mt-1 ${report.netProfit >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                    {formatCurrency(report.netProfit)}
                  </p>
                </div>
                <div className={`w-12 h-12 rounded-full flex items-center justify-center ${report.netProfit >= 0 ? 'bg-green-500/10' : 'bg-red-500/10'}`}>
                  <DollarSign className={report.netProfit >= 0 ? 'text-green-500' : 'text-red-500'} size={24} />
                </div>
              </div>
            </div>
          </div>

          <div className="bg-gray-900 border border-gray-800 rounded-xl">
            <div className="px-6 py-4 border-b border-gray-800">
              <h3 className="text-lg font-medium text-white">Expenses by Category</h3>
            </div>
            <div className="p-6">
              {report.expensesByCategory.length > 0 ? (
                <div className="space-y-4">
                  {report.expensesByCategory.map((item: any, idx: number) => (
                    <div key={idx} className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="w-3 h-3 rounded-full bg-blue-500 mr-3"></div>
                        <span className="text-sm font-medium text-gray-300">{item.category}</span>
                      </div>
                      <span className="text-sm text-white font-medium">{formatCurrency(item.amount)}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center">No expense data available.</p>
              )}
            </div>
          </div>
        </div>
      ) : null}

      {/* Expense Modal */}
      {isEditing && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-gray-900 border border-gray-800 rounded-xl max-w-md w-full">
            <div className="p-6">
              <h2 className="text-xl font-bold text-white mb-4">
                {currentExpense.id ? 'Edit Expense' : 'Record Expense'}
              </h2>
              <form onSubmit={handleSave} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300">Date</label>
                  <input
                    type="date"
                    required
                    value={currentExpense.date}
                    onChange={e => setCurrentExpense({...currentExpense, date: e.target.value})}
                    className="mt-1 block w-full px-4 py-2 bg-gray-800 border border-gray-700 text-white rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300">Category</label>
                  <select
                    required
                    value={currentExpense.category}
                    onChange={e => setCurrentExpense({...currentExpense, category: e.target.value})}
                    className="mt-1 block w-full px-4 py-2 bg-gray-800 border border-gray-700 text-white rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                  >
                    <option value="Utilities">Utilities (Electricity, Water)</option>
                    <option value="Payroll">Payroll / Wages</option>
                    <option value="Rent">Rent</option>
                    <option value="Marketing">Marketing</option>
                    <option value="Maintenance">Maintenance & Repairs</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300">Amount (USD)</label>
                  <input
                    type="number"
                    min="0.01"
                    step="0.01"
                    required
                    value={currentExpense.amount}
                    onChange={e => setCurrentExpense({...currentExpense, amount: e.target.value})}
                    className="mt-1 block w-full px-4 py-2 bg-gray-800 border border-gray-700 text-white rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300">Description</label>
                  <textarea
                    rows={3}
                    value={currentExpense.description || ''}
                    onChange={e => setCurrentExpense({...currentExpense, description: e.target.value})}
                    className="mt-1 block w-full px-4 py-2 bg-gray-800 border border-gray-700 text-white rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none resize-none"
                  />
                </div>
                <div className="flex justify-end space-x-3 mt-6 pt-4 border-t border-gray-800">
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2 bg-green-600 hover:bg-green-500 text-white rounded-lg font-medium transition-colors"
                  >
                    Save Expense
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
