import type { Product, ProductVariant } from "./product";

export type OrderStatus =
  | "pending"
  | "processing"
  | "shipped"
  | "delivered"
  | "canceled"
  | "returned";

export interface ShippingAddress {
  line1: string;
  city: string;
  zip: string;
  country: string;
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_variant_id: string;
  product_name: string;
  variant_name: string | null;
  thumbnail_url: string | null;
  quantity: number;
  unit_price: number;
  total_price: number;
  discount: number | null;
  created_at: string;
  updated_at: string;
}

export interface Order {
  id: string;
  site_id: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string | null;
  shipping_address: ShippingAddress;
  status: OrderStatus;
  total_amount: number;
  discount: number | null;
  notes: string | null;
  metadata: unknown;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
  items: OrderItem[];
}

export interface PlaceOrderPayload {
  customer_name: string;
  customer_email: string;
  shipping_address: ShippingAddress;
  items: Array<{
    product_variant_id: string;
    quantity: number;
  }>;
  customer_phone?: string | null;
  notes?: string | null;
  discount?: number | null;
  metadata?: unknown;
}

export interface CartItem {
  variant: ProductVariant;
  product: Product;
  quantity: number;
}
