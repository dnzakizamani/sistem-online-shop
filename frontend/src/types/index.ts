export interface User {
  id: string;
  name: string;
  email: string;
}

export interface Product {
  id: number;
  product_code: string;
  product_name: string;
  stock: number;
  price: number;
  created_at: string;
  updated_at: string;
  deleted_at?: string | null;
}

export interface Customer {
  id: string;
  customer_name: string;
  customer_address: string;
  gender: 'Pria' | 'Wanita';
  birth_date: string;
  phone?: string | null;
  created_at: string;
  updated_at: string;
  deleted_at?: string | null;
}

export interface OrderItem {
  id: number;
  product_id: number;
  product_code: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
}

export interface Order {
  id: number;
  order_number: string;
  customer_id: string;
  customer_name: string;
  customer_phone?: string | null;
  order_date: string;
  total_amount: number;
  items_count: number;
  created_at: string;
  items: OrderItem[];
}

export interface OrderDetail extends Order {
  customer: {
    id: string;
    customer_name: string;
    customer_address: string;
    gender: 'Pria' | 'Wanita';
    birth_date: string;
    phone?: string | null;
  };
  created_by: {
    id: string;
    name: string;
    email: string;
  };
}

export interface TopProduct {
  product_id: number;
  product_code: string;
  product_name: string;
  total_quantity_sold: number;
  total_revenue: number;
}

export interface LowStockProduct {
  id: number;
  product_code: string;
  product_name: string;
  stock: number;
  price: number;
}

export interface DailySale {
  date: string;
  total_orders: number;
  total_amount: number;
}

export interface DashboardSummary {
  total_transactions: number;
  total_sales_amount: number;
  top_selling_products: TopProduct[];
  low_stock_products: LowStockProduct[];
  daily_sales: DailySale[];
}

export interface PaginationMeta {
  page: number;
  per_page: number;
  total: number;
  total_pages: number;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
  meta?: PaginationMeta;
  errors?: Record<string, string[]>;
}
