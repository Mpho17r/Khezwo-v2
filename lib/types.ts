export type OrderStatus = "received" | "preparing" | "ready" | "completed" | "cancelled";
export type PaymentMethod = "cash" | "card";
export type VendorPlan = "free" | "pro" | "enterprise";
export type VendorStatus = "active" | "suspended";
export type CatalogItemType = "product" | "service";
export type UserRole = "vendor" | "admin";

export interface Profile {
  id: string;
  role: UserRole;
  full_name: string | null;
  created_at: string;
}

export interface Vendor {
  id: string;
  owner_id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  primary_color: string;
  secondary_color: string;
  status: VendorStatus;
  plan: VendorPlan;
  platform_fee_percent: number;
  business_hours: Record<string, { open: string; close: string } | null>;
  closing_message: string | null;
  created_at: string;
}

export interface MenuCategory {
  id: string;
  vendor_id: string;
  name: string;
  sort_order: number;
}

export interface MenuItem {
  id: string;
  item_type: CatalogItemType;
  vendor_id: string;
  category_id: string | null;
  name: string;
  description: string | null;
  price: number;
  photo_url: string | null;
  is_available: boolean;
  sort_order: number;
  created_at: string;
}

export interface Order {
  id: string;
  vendor_id: string;
  order_number: number;
  customer_name: string;
  status: OrderStatus;
  payment_method: PaymentMethod;
  subtotal: number;
  platform_fee: number;
  total: number;
  estimated_wait_minutes: number;
  created_at: string;
  updated_at: string;
}

export interface OrderItem {
  id: string;
  order_id: string;
  menu_item_id: string | null;
  name_snapshot: string;
  price_snapshot: number;
  quantity: number;
  notes: string | null;
}

export interface CartLine {
  menuItemId: string;
  name: string;
  price: number;
  quantity: number;
  notes?: string;
}

export type ServiceEnquiryStatus = "new" | "contacted" | "closed";

export interface ServiceEnquiry {
  id: string;
  vendor_id: string;
  menu_item_id: string;
  customer_name: string;
  contact_value: string;
  message: string;
  status: ServiceEnquiryStatus;
  created_at: string;
  updated_at: string;
}
