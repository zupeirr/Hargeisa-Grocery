import { Product, Order, Customer, DashboardStats } from '../types';

const API_BASE = import.meta.env.VITE_API_URL || '/api';

// Helper to handle API responses
export async function fetchAPI(endpoint: string, options?: RequestInit) {
  try {
    const res = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    });

    if (!res.ok) {
      let errDetails = res.statusText;
      try {
        const errBody = await res.json();
        errDetails = errBody.details || errBody.error || res.statusText;
      } catch (e) {
        // ignore
      }
      throw new Error(`API error: ${errDetails}`);
    }
    
    const text = await res.text();
    return JSON.parse(text);
  } catch (error) {
    console.error(`Network error on ${endpoint}:`, error);
    throw error;
  }
}

// Products
export const getProducts = async (): Promise<Product[]> => {
  return fetchAPI('/products');
};

export const saveProduct = async (product: Partial<Product>): Promise<Product> => {
  if (product.id && !product.id.startsWith('new-')) {
    return fetchAPI(`/products/${product.id}`, {
      method: 'PUT',
      body: JSON.stringify(product),
    });
  } else {
    const { id, ...data } = product; // Remove temporary ID if any
    return fetchAPI('/products', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }
};

export const deleteProduct = async (id: string): Promise<void> => {
  await fetchAPI(`/products/${id}`, { method: 'DELETE' });
};

// Orders
export const getOrders = async (): Promise<Order[]> => {
  const orders = await fetchAPI('/orders');
  return orders.map((o: any) => ({
    ...o,
    orderDate: new Date(o.createdAt),
    deliveryDate: o.updatedAt ? new Date(o.updatedAt) : undefined,
  }));
};

export const updateOrderStatus = async (orderId: string, status: Order['status']): Promise<void> => {
  await fetchAPI(`/orders/${orderId}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  });
};

// Customers
export const getCustomers = async (): Promise<Customer[]> => {
  const customers = await fetchAPI('/customers');
  return customers.map((c: any) => ({
    ...c,
    joinDate: new Date(c.joinDate || c.createdAt),
  }));
};

// Stats
export const getDashboardStats = async (): Promise<DashboardStats> => {
  const stats = await fetchAPI('/dashboard/stats');
  return {
    totalProducts: stats.totalProducts || 0,
    totalOrders: stats.totalOrders || 0,
    totalCustomers: stats.totalCustomers || 0,
    todaySales: stats.todaySales || 0,
    todayProfit: stats.todayProfit || 0,
    monthlyRevenue: stats.monthlyRevenue || 0,
    recentOrders: (stats.recentOrders || []).map((o: any) => ({
      ...o,
      orderDate: new Date(o.createdAt),
    })),
    topProducts: (stats.topProducts || []).map((tp: any) => ({
      product: tp.product,
      sales: tp.totalSold,
    })),
  };
};

// Settings
export const getSettings = async (): Promise<Record<string, string>> => {
  return fetchAPI('/settings');
};

export const saveSettings = async (settings: Record<string, string | number>): Promise<void> => {
  await fetchAPI('/settings', {
    method: 'PUT',
    body: JSON.stringify(settings),
  });
};

// Auth
export const loginAdmin = async (email: string, password: string): Promise<any> => {
  return fetchAPI('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
};

export const changeAdminPassword = async (currentPassword: string, newPassword: string): Promise<any> => {
  const adminUserStr = localStorage.getItem('admin_user');
  let token = '';
  if (adminUserStr) {
    const adminUser = JSON.parse(adminUserStr);
    token = adminUser.token || `mock-jwt-${adminUser.id}`;
  }
  return fetchAPI('/auth/change-password', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ currentPassword, newPassword }),
  });
};

// Customers details
export const getCustomerDetails = async (id: string): Promise<any> => {
  const customer = await fetchAPI(`/customers/${id}`);
  return {
    ...customer,
    joinDate: new Date(customer.joinDate || customer.createdAt),
    orders: (customer.orders || []).map((o: any) => ({
      ...o,
      orderDate: new Date(o.createdAt),
    })),
  };
};

export const updateCustomerSegment = async (id: string, segment: string): Promise<Customer> => {
  return fetchAPI(`/customers/${id}`, {
    method: 'PUT',
    body: JSON.stringify({ segment }),
  });
};

// Reviews
export const getReviews = async (): Promise<any[]> => {
  return fetchAPI('/reviews');
};

export const getProductReviews = async (productId: string): Promise<any[]> => {
  return fetchAPI(`/reviews/product/${productId}`);
};

export const getCustomerReviews = async (customerId: string): Promise<any[]> => {
  return fetchAPI(`/reviews/customer/${customerId}`);
};

export const createReview = async (productId: string, rating: number, comment: string, customerId?: string): Promise<any> => {
  return fetchAPI('/reviews', {
    method: 'POST',
    body: JSON.stringify({ productId, rating, comment, customerId }),
  });
};

export const deleteReview = async (id: string): Promise<void> => {
  await fetchAPI(`/reviews/${id}`, { method: 'DELETE' });
};

// Customer/Order creation on backend
export const createCustomerAPI = async (name: string, email: string, phone: string): Promise<Customer> => {
  return fetchAPI('/customers', {
    method: 'POST',
    body: JSON.stringify({ name, email, phone }),
  });
};

export const createOrderAPI = async (orderData: {
  customerId: string;
  items: { productId: string; quantity: number; price: number }[];
  total: number;
  paymentMethod: string;
  deliveryAddress: string;
}): Promise<Order> => {
  const o = await fetchAPI('/orders', {
    method: 'POST',
    body: JSON.stringify(orderData),
  });
  return {
    ...o,
    orderDate: new Date(o.createdAt),
    deliveryDate: o.updatedAt ? new Date(o.updatedAt) : undefined,
  };
};

// Coupons
export const getCoupons = async (): Promise<any[]> => {
  return fetchAPI('/coupons');
};

export const createCoupon = async (couponData: any): Promise<any> => {
  return fetchAPI('/coupons', {
    method: 'POST',
    body: JSON.stringify(couponData),
  });
};

export const updateCoupon = async (id: string, couponData: any): Promise<any> => {
  return fetchAPI(`/coupons/${id}`, {
    method: 'PUT',
    body: JSON.stringify(couponData),
  });
};

export const deleteCoupon = async (id: string): Promise<void> => {
  await fetchAPI(`/coupons/${id}`, { method: 'DELETE' });
};


// Suppliers
export const getSuppliers = async (): Promise<any[]> => {
  return fetchAPI('/suppliers');
};

export const getSupplierDetails = async (id: string): Promise<any> => {
  return fetchAPI(`/suppliers/${id}`);
};

export const createSupplier = async (supplierData: any): Promise<any> => {
  return fetchAPI('/suppliers', {
    method: 'POST',
    body: JSON.stringify(supplierData),
  });
};

export const updateSupplier = async (id: string, supplierData: any): Promise<any> => {
  return fetchAPI(`/suppliers/${id}`, {
    method: 'PUT',
    body: JSON.stringify(supplierData),
  });
};

export const deleteSupplier = async (id: string): Promise<void> => {
  await fetchAPI(`/suppliers/${id}`, { method: 'DELETE' });
};

// Purchase Orders
export const getPurchaseOrders = async (): Promise<any[]> => {
  return fetchAPI('/purchase-orders');
};

export const getPurchaseOrderDetails = async (id: string): Promise<any> => {
  return fetchAPI(`/purchase-orders/${id}`);
};

export const createPurchaseOrder = async (poData: any): Promise<any> => {
  return fetchAPI('/purchase-orders', {
    method: 'POST',
    body: JSON.stringify(poData),
  });
};

export const updatePurchaseOrderStatus = async (id: string, status: string): Promise<any> => {
  return fetchAPI(`/purchase-orders/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  });
};

export const updatePurchaseOrderPayment = async (id: string, paymentStatus: string): Promise<any> => {
  return fetchAPI(`/purchase-orders/${id}/payment`, {
    method: 'PATCH',
    body: JSON.stringify({ paymentStatus }),
  });
};

export const deletePurchaseOrder = async (id: string): Promise<void> => {
  await fetchAPI(`/purchase-orders/${id}`, { method: 'DELETE' });
};

// Expenses
export const getExpenses = async (filters?: { category?: string; startDate?: string; endDate?: string }): Promise<any[]> => {
  const query = filters ? new URLSearchParams(filters as any).toString() : '';
  return fetchAPI(`/expenses${query ? `?${query}` : ''}`);
};

export const getExpenseReport = async (filters?: { startDate?: string; endDate?: string }): Promise<any> => {
  const query = filters ? new URLSearchParams(filters as any).toString() : '';
  return fetchAPI(`/expenses/report${query ? `?${query}` : ''}`);
};

export const createExpense = async (expenseData: any): Promise<any> => {
  return fetchAPI('/expenses', {
    method: 'POST',
    body: JSON.stringify(expenseData),
  });
};

export const updateExpense = async (id: string, expenseData: any): Promise<any> => {
  return fetchAPI(`/expenses/${id}`, {
    method: 'PUT',
    body: JSON.stringify(expenseData),
  });
};

export const deleteExpense = async (id: string): Promise<void> => {
  await fetchAPI(`/expenses/${id}`, { method: 'DELETE' });
};

// Inventory
export const getInventoryTransactions = async (filters?: { productId?: string; type?: string; startDate?: string; endDate?: string }): Promise<any[]> => {
  const query = filters ? new URLSearchParams(filters as any).toString() : '';
  return fetchAPI(`/inventory/transactions${query ? `?${query}` : ''}`);
};

export const createInventoryTransaction = async (data: { productId: string; type: string; quantity: number; note?: string; reference?: string }): Promise<any> => {
  return fetchAPI('/inventory/transaction', {
    method: 'POST',
    body: JSON.stringify(data),
  });
};

export const updateProductExpiry = async (id: string, expiryDate: string | null): Promise<any> => {
  return fetchAPI(`/inventory/products/${id}/expiry`, {
    method: 'PUT',
    body: JSON.stringify({ expiryDate }),
  });
};

export const updateProductDamage = async (id: string, data: { isDamaged?: boolean; damagedQty?: number; damagedReason?: string | null }): Promise<any> => {
  return fetchAPI(`/inventory/products/${id}/damage`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
};

// ─── Reports ─────────────────────────────────────────────────────────────────

export interface DateRange {
  startDate?: string;
  endDate?: string;
}

function toQueryString(range?: DateRange): string {
  if (!range) return '';
  const q = new URLSearchParams(range as any).toString();
  return q ? `?${q}` : '';
}

export const getSalesReports = async (range?: DateRange): Promise<any> => {
  return fetchAPI(`/reports/sales${toQueryString(range)}`);
};

export const getProfitReports = async (range?: DateRange): Promise<any> => {
  return fetchAPI(`/reports/profit${toQueryString(range)}`);
};

export const getInventoryReport = async (): Promise<any> => {
  return fetchAPI('/reports/inventory');
};

export const getCustomerReport = async (range?: DateRange): Promise<any> => {
  return fetchAPI(`/reports/customers${toQueryString(range)}`);
};

export const getSupplierReport = async (range?: DateRange): Promise<any> => {
  return fetchAPI(`/reports/suppliers${toQueryString(range)}`);
};

export const getExpenseReport2 = async (range?: DateRange): Promise<any> => {
  return fetchAPI(`/reports/expenses${toQueryString(range)}`);
};

export const getEmployeeReport = async (range?: DateRange): Promise<any> => {
  return fetchAPI(`/reports/employees${toQueryString(range)}`);
};

// Employees
export const getEmployees = async (): Promise<any[]> => {
  return fetchAPI('/employees');
};

export const createEmployee = async (data: any): Promise<any> => {
  return fetchAPI('/employees', {
    method: 'POST',
    body: JSON.stringify(data),
  });
};

export const updateEmployee = async (id: string, data: any): Promise<any> => {
  return fetchAPI(`/employees/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
};

export const deleteEmployee = async (id: string): Promise<void> => {
  await fetchAPI(`/employees/${id}`, { method: 'DELETE' });
};

export const getEmployeeAttendance = async (id: string): Promise<any[]> => {
  return fetchAPI(`/employees/${id}/attendance`);
};

export const addEmployeeAttendance = async (id: string, data: any): Promise<any> => {
  return fetchAPI(`/employees/${id}/attendance`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
};

export const getEmployeeSalaries = async (id: string): Promise<any[]> => {
  return fetchAPI(`/employees/${id}/salary`);
};

export const addEmployeeSalary = async (id: string, data: any): Promise<any> => {
  return fetchAPI(`/employees/${id}/salary`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
};

// Categories
export const getCategories = async (): Promise<any[]> => {
  return fetchAPI('/categories');
};

export const createCategory = async (data: { name: string; description?: string }): Promise<any> => {
  return fetchAPI('/categories', {
    method: 'POST',
    body: JSON.stringify(data),
  });
};

export const updateCategory = async (id: string, data: { name?: string; description?: string }): Promise<any> => {
  return fetchAPI(`/categories/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
};

export const deleteCategory = async (id: string): Promise<void> => {
  await fetchAPI(`/categories/${id}`, { method: 'DELETE' });
};

// Deliveries
export const getDeliveries = async (): Promise<any[]> => {
  return fetchAPI('/deliveries');
};

export const createDelivery = async (data: {
  orderId: string;
  driverId?: string;
  notes?: string;
}): Promise<any> => {
  return fetchAPI('/deliveries', {
    method: 'POST',
    body: JSON.stringify(data),
  });
};

export const updateDeliveryStatus = async (id: string, status: string): Promise<any> => {
  return fetchAPI(`/deliveries/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  });
};

export const assignDeliveryToDriver = async (id: string, driverId: string): Promise<any> => {
  return fetchAPI(`/deliveries/${id}/assign`, {
    method: 'PATCH',
    body: JSON.stringify({ driverId }),
  });
};

export const deleteDelivery = async (id: string): Promise<void> => {
  await fetchAPI(`/deliveries/${id}`, { method: 'DELETE' });
};

// ─── Financial Management ─────────────────────────────────────────────────────

export const getFinancialIncome = async (range?: DateRange): Promise<any> =>
  fetchAPI(`/financial/income${toQueryString(range)}`);

export const getFinancialPL = async (range?: DateRange): Promise<any> =>
  fetchAPI(`/financial/pl${toQueryString(range)}`);

export const getFinancialTax = async (range?: DateRange): Promise<any> =>
  fetchAPI(`/financial/tax${toQueryString(range)}`);

export const getFinancialPayments = async (range?: DateRange): Promise<any> =>
  fetchAPI(`/financial/payments${toQueryString(range)}`);
