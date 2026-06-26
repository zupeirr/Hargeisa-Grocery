import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AdminAuthProvider } from '../../contexts/AdminAuthContext';
import { AdminGuard } from './AdminGuard';
import AdminLayout from './AdminLayout';
import AdminLogin from './AdminLogin';
import DashboardPage from './DashboardPage';
import ProductsPage from './ProductsPage';
import OrdersPage from './OrdersPage';
import CustomersPage from './CustomersPage';
import SettingsPage from './SettingsPage';
import CouponsPage from './CouponsPage';
import SuppliersPage from './SuppliersPage';
import ExpensesPage from './ExpensesPage';
import InventoryPage from './InventoryPage';
import ReportsPage from './ReportsPage';
import EmployeesPage from './EmployeesPage';
import CategoriesPage from './CategoriesPage';
import DeliveriesPage from './DeliveriesPage';
import FinancialPage from './FinancialPage';

const AdminApp: React.FC = () => {
  return (
    <AdminAuthProvider>
      <Routes>
        <Route path="login" element={<AdminLogin />} />
        
        <Route path="/" element={
          <AdminGuard>
            <AdminLayout />
          </AdminGuard>
        }>
          <Route index element={<DashboardPage />} />
          <Route path="products" element={<ProductsPage />} />
          <Route path="orders" element={<OrdersPage />} />
          <Route path="customers" element={<CustomersPage />} />
          <Route path="settings" element={<SettingsPage />} />
          <Route path="coupons" element={<CouponsPage />} />
          <Route path="suppliers" element={<SuppliersPage />} />
          <Route path="expenses" element={<ExpensesPage />} />
          <Route path="inventory" element={<InventoryPage />} />
          <Route path="reports" element={<ReportsPage />} />
          <Route path="employees" element={<EmployeesPage />} />
          <Route path="categories" element={<CategoriesPage />} />
          <Route path="deliveries" element={<DeliveriesPage />} />
          <Route path="financial" element={<FinancialPage />} />
          <Route path="*" element={<Navigate to="/admin" replace />} />
        </Route>
      </Routes>
    </AdminAuthProvider>
  );
};

export default AdminApp;
