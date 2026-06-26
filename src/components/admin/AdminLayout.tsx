import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAdminAuth } from '../../contexts/AdminAuthContext';
import { useSettings } from '../../contexts/SettingsContext';
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  Settings,
  LogOut,
  Menu,
  X,
  Bell,
  Tag,
  Truck,
  DollarSign,
  Boxes,
  BarChart,
  Folder,
  PieChart
} from 'lucide-react';

const AdminLayout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth >= 768);
  const { state, logout } = useAdminAuth();
  const { settings } = useSettings();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/admin/login');
  };

  const navItems = [
    { path: '/admin', icon: <LayoutDashboard size={20} />, label: 'Dashboard', end: true },
    { path: '/admin/products', icon: <Package size={20} />, label: 'Products' },
    { path: '/admin/orders', icon: <ShoppingCart size={20} />, label: 'Orders' },
    { path: '/admin/customers', icon: <Users size={20} />, label: 'Customers' },
    { path: '/admin/suppliers', icon: <Truck size={20} />, label: 'Suppliers' },
    { path: '/admin/inventory', icon: <Boxes size={20} />, label: 'Inventory' },
    { path: '/admin/categories', icon: <Folder size={20} />, label: 'Categories' },
    { path: '/admin/deliveries', icon: <Truck size={20} />, label: 'Deliveries' },
    { path: '/admin/expenses', icon: <DollarSign size={20} />, label: 'Expenses' },
    { path: '/admin/reports', icon: <BarChart size={20} />, label: 'Reports' },
    { path: '/admin/financial', icon: <PieChart size={20} />, label: 'Financial' },
    { path: '/admin/employees', icon: <Users size={20} />, label: 'Employees' },
    { path: '/admin/coupons', icon: <Tag size={20} />, label: 'Coupons' },
    { path: '/admin/settings', icon: <Settings size={20} />, label: 'Settings' },
  ];

  return (
    <div 
      className="flex h-screen bg-gray-900 text-gray-100 overflow-hidden"
      style={{ filter: settings.adminDarkMode ? 'none' : 'invert(1) hue-rotate(180deg)' }}
    >
      {/* Mobile Backdrop */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`${sidebarOpen ? 'translate-x-0 w-64' : '-translate-x-full w-64 md:w-20 md:translate-x-0'} 
          fixed inset-y-0 left-0 md:relative z-50 flex flex-col bg-gray-900 border-r border-gray-800 transition-all duration-300`}
      >
        <div className="flex items-center justify-between h-16 px-4 border-b border-gray-800">
          <div className={`flex items-center space-x-2 ${!sidebarOpen && 'md:hidden'}`}>
            <div 
              className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center font-bold text-white"
              style={{ filter: settings.adminDarkMode ? 'none' : 'invert(1) hue-rotate(180deg)' }}
            >
              {settings.adminDashboardName.charAt(0).toUpperCase()}
            </div>
            <span className="font-bold text-xl tracking-tight text-white truncate max-w-[150px]">
              {settings.adminDashboardName}
            </span>
          </div>
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="md:hidden text-gray-400 hover:text-white"
          >
            <X size={24} />
          </button>
        </div>

        <nav className="flex-1 py-6 px-3 space-y-2 overflow-y-auto custom-scrollbar">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.end}
              className={({ isActive }) =>
                `flex items-center px-3 py-3 rounded-lg transition-colors group ${isActive
                  ? 'bg-green-600/10 text-green-500'
                  : 'text-gray-400 hover:bg-gray-800 hover:text-gray-200'
                } ${!sidebarOpen ? 'justify-center md:px-0' : ''}`
              }
              title={!sidebarOpen ? item.label : undefined}
            >
              <span className="flex-shrink-0">{item.icon}</span>
              <span className={`ml-3 font-medium ${!sidebarOpen ? 'md:hidden' : ''}`}>
                {item.label}
              </span>
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t border-gray-800">
          <button
            onClick={handleLogout}
            className={`flex items-center w-full px-3 py-3 text-red-400 hover:bg-red-400/10 rounded-lg transition-colors ${!sidebarOpen ? 'justify-center md:px-0' : ''
              }`}
            title={!sidebarOpen ? 'Logout' : undefined}
          >
            <LogOut size={20} />
            <span className={`ml-3 font-medium ${!sidebarOpen ? 'md:hidden' : ''}`}>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header */}
        <header className="h-16 flex items-center justify-between px-4 sm:px-6 lg:px-8 bg-gray-900/50 backdrop-blur-md border-b border-gray-800 z-10">
          <div className="flex items-center">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="text-gray-400 hover:text-white focus:outline-none"
            >
              <Menu size={24} />
            </button>
          </div>

          <div className="flex items-center space-x-4">
            <button className="text-gray-400 hover:text-white relative">
              <Bell size={20} />
              <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full border border-gray-900"></span>
            </button>
            <div className="flex items-center space-x-3 pl-4 border-l border-gray-800">
              <div className="hidden sm:block text-right">
                <p className="text-sm font-medium text-white">{state.user?.name}</p>
                <p className="text-xs text-green-500 capitalize">{state.user?.role}</p>
              </div>
              <div 
                className="w-9 h-9 rounded-full bg-gradient-to-tr from-green-500 to-blue-500 flex items-center justify-center text-white font-bold"
                style={{ filter: settings.adminDarkMode ? 'none' : 'invert(1) hue-rotate(180deg)' }}
              >
                {state.user?.name.charAt(0)}
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-950 p-4 sm:p-6 lg:p-8 custom-scrollbar">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
