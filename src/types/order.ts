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
  /** Any other address fields (line2, state, ...) are stored and returned as-is. */
  [key: string]: string | undefined;
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_variant_id: string;
  product_name: string;
  variant_name: string | null;
  thumbnail_url: string | null;
  quantity: number;
  /** Absent when the store hides prices. */
  unit_price?: number;
  /** Absent when the store hides prices. */
  total_price?: number;
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
  /** Absent when the store hides prices. */
  total_amount?: number;
  /** Always null today; absent when the store hides prices. */
  discount?: number | null;
  notes: string | null;
  metadata: unknown;
  /** False for inquiry-mode orders (site had price_visibility off) — stock was neither checked nor decremented. */
  inventory_tracked: boolean;
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
  }>; // at most MAX_ORDER_ITEMS (50)
  customer_phone?: string | null;
  notes?: string | null;
  /** @deprecated Ignored — the API always stores no discount. */
  discount?: number | null;
  /** Flat string map only — the API validates `Record<string, string>` on a
   *  strict schema, so nested objects, numbers and arrays are rejected (400). */
  metadata?: Record<string, string>;
}

export interface CartItem {
  variant: ProductVariant;
  product: Product;
  quantity: number;
}
