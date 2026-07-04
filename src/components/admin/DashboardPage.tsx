import React, { useState, useEffect, useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer } from 'recharts';
import { getDashboardStats } from '../../data/adminStore';
import { DashboardStats } from '../../types';
import { DollarSign, ShoppingBag, TrendingUp } from 'lucide-react';
import { useSocket } from '../../hooks/useSocket';

const DashboardPage: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);

  const salesData = useMemo(() => {
    if (!stats) return [];
    const map = new Map<string, number>();
    stats.recentOrders.forEach(order => {
      const d = new Date(order.orderDate);
      const label = d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
      map.set(label, (map.get(label) ?? 0) + order.total);
    });
    const sorted = Array.from(map.entries())
      .sort(([a], [b]) => new Date(a).getTime() - new Date(b).getTime())
      .map(([date, revenue]) => ({ date, revenue }));
    return sorted;
  }, [stats]);

  const { socket } = useSocket();

  const fetchStats = async () => {
    try {
      const data = await getDashboardStats();
      setStats(data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  useEffect(() => {
    if (socket) {
      socket.on('ORDERS_UPDATED', fetchStats);
      socket.on('CUSTOMERS_UPDATED', fetchStats);
      socket.on('PRODUCTS_UPDATED', fetchStats);
      return () => {
        socket.off('ORDERS_UPDATED', fetchStats);
        socket.off('CUSTOMERS_UPDATED', fetchStats);
        socket.off('PRODUCTS_UPDATED', fetchStats);
      };
    }
  }, [socket]);

  if (!stats) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
      </div>
    );
  }

  const statCards = [
    { 
      title: "Today's Sales", 
      value: `$${stats.todaySales.toFixed(2)}`, 
      icon: <DollarSign className="text-green-500" size={24} />,
      bgColor: 'bg-green-500/10'
    },
    { 
      title: "Today's Profit", 
      value: `$${stats.todayProfit.toFixed(2)}`, 
      icon: <TrendingUp className="text-purple-500" size={24} />,
      bgColor: 'bg-purple-500/10'
    },
    { 
      title: 'Total Orders', 
      value: stats.totalOrders.toString(), 
      icon: <ShoppingBag className="text-blue-500" size={24} />,
      bgColor: 'bg-blue-500/10'
    },
    { 
      title: 'Monthly Revenue', 
      value: `$${stats.monthlyRevenue.toFixed(2)}`, 
      icon: <DollarSign className="text-orange-500" size={24} />,
      bgColor: 'bg-orange-500/10'
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-white">Dashboard Overview</h1>
        <div className="text-sm text-gray-400">
          Last updated: {new Date().toLocaleTimeString()}
        </div>
      </div>
<div className="bg-gray-900 border border-gray-800 rounded-xl p-6 mb-6">
            <h2 className="text-lg font-bold text-white mb-4">Revenue Over Time</h2>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={salesData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#444" />
                <XAxis dataKey="date" stroke="#aaa" />
                <YAxis stroke="#aaa" />
                <Tooltip />
                <Line type="monotone" dataKey="revenue" stroke="#34d399" strokeWidth={2} dot={{ r: 3 }} animationDuration={500} />
              </LineChart>
            </ResponsiveContainer>
          </div>
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((card, index) => (
          <div key={index} className="bg-gray-900 border border-gray-800 rounded-xl p-6 hover:border-gray-700 transition-colors">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-gray-400 mb-1">{card.title}</p>
                <h3 className="text-2xl font-bold text-white">{card.value}</h3>
              </div>
              <div className={`p-3 rounded-lg ${card.bgColor}`}>
                {card.icon}
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm">
              <TrendingUp className="text-green-500 mr-1" size={16} />
              <span className="text-green-500 font-medium">+12.5%</span>
              <span className="text-gray-500 ml-2">from last month</span>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Orders */}
        <div className="lg:col-span-2 bg-gray-900 border border-gray-800 rounded-xl p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-bold text-white">Recent Orders</h2>
            <button className="text-sm text-green-500 hover:text-green-400 font-medium">View All</button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-gray-400 border-b border-gray-800">
                <tr>
                  <th className="pb-3 font-medium">Order ID</th>
                  <th className="pb-3 font-medium">Date</th>
                  <th className="pb-3 font-medium">Items</th>
                  <th className="pb-3 font-medium">Total</th>
                  <th className="pb-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {stats.recentOrders.slice(0, 5).map(order => (
                  <tr key={order.id} className="hover:bg-gray-800/50 transition-colors">
                    <td className="py-3 font-medium text-white">{order.id}</td>
                    <td className="py-3 text-gray-400">{order.orderDate.toLocaleDateString()}</td>
                    <td className="py-3 text-gray-400">{order.items.reduce((acc, item) => acc + item.quantity, 0)} items</td>
                    <td className="py-3 font-medium text-white">${order.total.toFixed(2)}</td>
                    <td className="py-3">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        order.status === 'delivered' ? 'bg-green-500/10 text-green-500' :
                        order.status === 'paid' ? 'bg-blue-500/10 text-blue-500' :
                        order.status === 'processing' ? 'bg-purple-500/10 text-purple-500' :
                        order.status === 'cancelled' ? 'bg-red-500/10 text-red-500' :
                        'bg-yellow-500/10 text-yellow-500'
                      }`}>
                        {order.status.replace('-', ' ')}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Top Products */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          <h2 className="text-lg font-bold text-white mb-4">Top Products</h2>
          <div className="space-y-4">
            {stats.topProducts.map((item) => (
              <div key={item.product.id} className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded bg-gray-800 flex-shrink-0 overflow-hidden">
                  <img src={item.product.image} alt={item.product.name} className="w-full h-full object-cover" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">{item.product.name}</p>
                  <p className="text-xs text-gray-400">{item.sales} sold</p>
                </div>
                <div className="text-sm font-bold text-green-500">
                  ${(item.product.price * item.sales).toFixed(2)}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
