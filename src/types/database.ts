export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  role: 'user' | 'admin';
  created_at: string;
}

export interface Category {
  id: string;
  name: string;
  image_url: string;
  created_at: string;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  category_id: string | null;
  price: number;
  stock: number;
  featured: boolean;
  main_image_url: string;
  additional_images: string[]; // JSON array of string URLs
  created_at: string;
  category?: Category; // Joined category details
}

export type OrderStatus = 'PENDING_VERIFICATION' | 'PAID' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';
export type PaymentStatus = 'PENDING_VERIFICATION' | 'PAID' | 'REJECTED';

export interface ShippingAddress {
  fullName: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
}

export interface Order {
  id: string;
  user_id: string | null;
  total_amount: number;
  status: OrderStatus;
  payment_status: PaymentStatus;
  shipping_address: ShippingAddress;
  created_at: string;
  profile?: Profile;
  items?: OrderItem[];
  payment_proof?: PaymentProof;
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string | null;
  quantity: number;
  price: number;
  selected_variant?: string | null;
  product?: Product;
}

export interface PaymentProof {
  id: string;
  order_id: string;
  screenshot_url: string;
  uploaded_at: string;
}

export interface WishlistItem {
  id: string;
  user_id: string;
  product_id: string;
  created_at: string;
  product?: Product;
}

export interface Review {
  id: string;
  product_id: string;
  user_id: string;
  user_name: string;
  rating: number;
  review_text: string;
  review_images: string[]; // Array of image URLs
  verified_purchase: boolean;
  status: 'APPROVED' | 'PENDING' | 'REJECTED';
  created_at: string;
  likes_count?: number;
  is_liked_by_user?: boolean;
}

export interface ProductQuestion {
  id: string;
  product_id: string;
  user_id: string | null;
  question: string;
  answer: string | null;
  created_at: string;
  profile?: {
    full_name: string | null;
  };
}

export interface NewsletterSubscriber {
  id: string;
  email: string;
  created_at: string;
}

export interface ContactMessage {
  id: string;
  name: string;
  email: string;
  message: string;
  created_at: string;
}

export type ReplacementStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'PROCESSING' | 'RESOLVED';

export interface ReplacementRequest {
  id: string;
  order_id: string;
  user_id: string;
  reason: string;
  description: string;
  photo_url?: string | null;
  status: ReplacementStatus;
  admin_notes?: string | null;
  created_at: string;
  // joined
  order?: Order;
}
