export interface Product {
  id: string;
  name: string;
  price: number;
  originalPrice?: number;
  image: string;
  category: string;
  description: string;
  inStock: boolean;
  unit: string;
  rating: number;
  reviews: number;
  barcode?: string;
  sku?: string;
  stockLevel: number;
  lowStockAlert: number;
  expiryDate?: string;
  isDamaged?: boolean;
  damagedQty?: number;
  damagedReason?: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  addresses: Address[];
  loyaltyPoints: number;
}

export interface Address {
  id: string;
  label: string;
  street: string;
  district: string;
  city: string;
  isDefault: boolean;
}

export type OrderStatus = 'pending' | 'confirmed' | 'preparing' | 'out-for-delivery' | 'delivered' | 'cancelled';

export interface Order {
  id: string;
  userId: string;
  items: CartItem[];
  total: number;
  status: OrderStatus;
  deliveryAddress: Address | string;
  paymentMethod: 'cod' | 'zaad' | 'evc' | 'edahab';
  orderDate: Date;
  deliveryDate?: Date;
}

export type Category = 'fruits' | 'vegetables' | 'dairy' | 'meat' | 'dry-foods' | 'beverages' | 'household' | 'personal-care' | 'baby-products';

// Admin Types
export interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'manager';
  token?: string;
}

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  address?: string;
  totalOrders: number;
  totalSpent: number;
  loyaltyPoints: number;
  joinDate: Date;
  segment?: string;
}

export interface DashboardStats {
  totalProducts: number;
  totalOrders: number;
  totalCustomers: number;
  todaySales: number;
  todayProfit: number;
  monthlyRevenue: number;
  recentOrders: Order[];
  topProducts: { product: Product; sales: number }[];
}

export interface Review {
  id: string;
  customerId: string;
  productId: string;
  rating: number;
  comment?: string;
  status: string;
  createdAt: string;
  customer?: Customer;
  product?: Product;
}