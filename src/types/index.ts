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

export interface Order {
  id: string;
  userId: string;
  items: CartItem[];
  total: number;
  status: 'pending' | 'confirmed' | 'preparing' | 'out-for-delivery' | 'delivered' | 'cancelled';
  deliveryAddress: Address;
  paymentMethod: 'cod' | 'zaad' | 'evc';
  orderDate: Date;
  deliveryDate?: Date;
}

export type Category = 'fruits' | 'vegetables' | 'dairy' | 'meat' | 'dry-foods' | 'beverages' | 'household' | 'personal-care' | 'baby-products';