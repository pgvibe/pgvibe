// Large Database Schema for Performance Testing
// This schema contains 30+ tables with 20+ columns each to stress-test TypeScript compilation
// Tests our JOIN nullability types and smart error messages under load

/**
 * Large-scale e-commerce application database schema for performance testing
 * Contains realistic tables with various data types and relationships
 */

// Core User Management Tables (5 tables)
export interface UserTable {
  id: number;
  email: string;
  username: string | null;
  password_hash: string;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  birth_date: Date | null;
  gender: string | null;
  avatar_url: string | null;
  bio: string | null;
  is_verified: boolean;
  is_active: boolean;
  last_login: Date | null;
  login_count: number;
  failed_login_attempts: number;
  locked_until: Date | null;
  timezone: string | null;
  locale: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface UserProfileTable {
  id: number;
  user_id: number;
  display_name: string | null;
  profile_picture: string | null;
  cover_photo: string | null;
  website: string | null;
  social_twitter: string | null;
  social_facebook: string | null;
  social_instagram: string | null;
  social_linkedin: string | null;
  company: string | null;
  job_title: string | null;
  location: string | null;
  interests: string | null;
  skills: string | null;
  experience_level: string | null;
  visibility: string;
  allow_messages: boolean;
  allow_friend_requests: boolean;
  newsletter_subscribed: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface UserAddressTable {
  id: number;
  user_id: number;
  type: string;
  label: string | null;
  first_name: string;
  last_name: string;
  company: string | null;
  address_line_1: string;
  address_line_2: string | null;
  city: string;
  state: string | null;
  postal_code: string;
  country: string;
  phone: string | null;
  is_default: boolean;
  is_verified: boolean;
  instructions: string | null;
  latitude: number | null;
  longitude: number | null;
  created_at: Date;
  updated_at: Date;
}

export interface UserPreferencesTable {
  id: number;
  user_id: number;
  notifications_email: boolean;
  notifications_sms: boolean;
  notifications_push: boolean;
  notifications_marketing: boolean;
  theme: string;
  language: string;
  currency: string;
  date_format: string;
  time_format: string;
  week_start: number;
  auto_save: boolean;
  two_factor_enabled: boolean;
  privacy_profile: string;
  privacy_email: string;
  privacy_phone: string;
  data_sharing: boolean;
  analytics_tracking: boolean;
  performance_tracking: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface UserSessionTable {
  id: number;
  user_id: number;
  session_token: string;
  refresh_token: string | null;
  ip_address: string;
  user_agent: string;
  device_type: string | null;
  browser: string | null;
  os: string | null;
  location: string | null;
  is_mobile: boolean;
  is_trusted: boolean;
  last_activity: Date;
  expires_at: Date;
  created_at: Date;
  revoked_at: Date | null;
  revoke_reason: string | null;
}

// Product Catalog Tables (8 tables)
export interface CategoryTable {
  id: number;
  parent_id: number | null;
  name: string;
  slug: string;
  description: string | null;
  image_url: string | null;
  icon: string | null;
  sort_order: number;
  is_featured: boolean;
  is_active: boolean;
  seo_title: string | null;
  seo_description: string | null;
  seo_keywords: string | null;
  commission_rate: number | null;
  min_price: number | null;
  max_price: number | null;
  product_count: number;
  view_count: number;
  created_at: Date;
  updated_at: Date;
}

export interface BrandTable {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  logo_url: string | null;
  website: string | null;
  founded_year: number | null;
  headquarters: string | null;
  is_featured: boolean;
  is_active: boolean;
  sort_order: number;
  seo_title: string | null;
  seo_description: string | null;
  social_twitter: string | null;
  social_facebook: string | null;
  social_instagram: string | null;
  product_count: number;
  rating_average: number | null;
  review_count: number;
  created_at: Date;
  updated_at: Date;
}

export interface ProductTable {
  id: number;
  category_id: number;
  brand_id: number | null;
  sku: string;
  name: string;
  slug: string;
  short_description: string | null;
  description: string | null;
  price: number;
  sale_price: number | null;
  cost_price: number | null;
  weight: number | null;
  dimensions: string | null;
  is_digital: boolean;
  is_downloadable: boolean;
  download_limit: number | null;
  download_expiry: number | null;
  tax_class: string | null;
  stock_quantity: number;
  low_stock_threshold: number | null;
  manage_stock: boolean;
  allow_backorders: boolean;
  sold_individually: boolean;
  is_featured: boolean;
  is_active: boolean;
  status: string;
  visibility: string;
  rating_average: number | null;
  review_count: number;
  total_sales: number;
  view_count: number;
  created_at: Date;
  updated_at: Date;
}

export interface ProductVariantTable {
  id: number;
  product_id: number;
  sku: string;
  name: string | null;
  price: number | null;
  sale_price: number | null;
  cost_price: number | null;
  weight: number | null;
  stock_quantity: number;
  image_url: string | null;
  sort_order: number;
  is_active: boolean;
  attributes: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface ProductImageTable {
  id: number;
  product_id: number;
  variant_id: number | null;
  url: string;
  alt_text: string | null;
  sort_order: number;
  is_featured: boolean;
  file_name: string;
  file_size: number;
  mime_type: string;
  width: number | null;
  height: number | null;
  created_at: Date;
  updated_at: Date;
}

export interface ProductAttributeTable {
  id: number;
  name: string;
  slug: string;
  type: string;
  required: boolean;
  filterable: boolean;
  sort_order: number;
  options: string | null;
  validation_rules: string | null;
  description: string | null;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface ProductAttributeValueTable {
  id: number;
  product_id: number;
  variant_id: number | null;
  attribute_id: number;
  value: string;
  sort_order: number | null;
  created_at: Date;
  updated_at: Date;
}

export interface ProductReviewTable {
  id: number;
  product_id: number;
  user_id: number;
  order_item_id: number | null;
  rating: number;
  title: string | null;
  content: string | null;
  pros: string | null;
  cons: string | null;
  is_verified_purchase: boolean;
  is_featured: boolean;
  is_approved: boolean;
  helpful_count: number;
  unhelpful_count: number;
  reported_count: number;
  reply_content: string | null;
  replied_at: Date | null;
  replied_by: number | null;
  created_at: Date;
  updated_at: Date;
}

// E-commerce Order Tables (10 tables)
export interface CartTable {
  id: number;
  user_id: number | null;
  session_id: string | null;
  coupon_id: number | null;
  subtotal: number;
  tax_amount: number;
  shipping_amount: number;
  discount_amount: number;
  total_amount: number;
  currency: string;
  expires_at: Date | null;
  created_at: Date;
  updated_at: Date;
}

export interface CartItemTable {
  id: number;
  cart_id: number;
  product_id: number;
  variant_id: number | null;
  quantity: number;
  unit_price: number;
  total_price: number;
  product_name: string;
  product_sku: string;
  product_image: string | null;
  attributes: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface OrderTable {
  id: number;
  order_number: string;
  user_id: number | null;
  guest_email: string | null;
  status: string;
  payment_status: string;
  fulfillment_status: string;
  subtotal: number;
  tax_amount: number;
  shipping_amount: number;
  discount_amount: number;
  total_amount: number;
  currency: string;
  notes: string | null;
  internal_notes: string | null;
  coupon_code: string | null;
  coupon_discount: number | null;
  billing_address: string;
  shipping_address: string;
  shipping_method: string | null;
  tracking_number: string | null;
  estimated_delivery: Date | null;
  delivered_at: Date | null;
  created_at: Date;
  updated_at: Date;
}

export interface OrderItemTable {
  id: number;
  order_id: number;
  product_id: number;
  variant_id: number | null;
  quantity: number;
  unit_price: number;
  total_price: number;
  product_name: string;
  product_sku: string;
  product_image: string | null;
  attributes: string | null;
  weight: number | null;
  dimensions: string | null;
  is_digital: boolean;
  download_url: string | null;
  download_expires: Date | null;
  created_at: Date;
  updated_at: Date;
}

export interface PaymentTable {
  id: number;
  order_id: number;
  payment_method: string;
  gateway: string;
  gateway_transaction_id: string | null;
  amount: number;
  currency: string;
  status: string;
  reference_number: string | null;
  gateway_response: string | null;
  risk_score: number | null;
  processor_fee: number | null;
  settled_at: Date | null;
  refunded_amount: number | null;
  created_at: Date;
  updated_at: Date;
}

export interface ShipmentTable {
  id: number;
  order_id: number;
  tracking_number: string;
  carrier: string;
  service_type: string | null;
  status: string;
  shipped_at: Date | null;
  estimated_delivery: Date | null;
  delivered_at: Date | null;
  weight: number | null;
  dimensions: string | null;
  insurance_amount: number | null;
  shipping_cost: number | null;
  tracking_url: string | null;
  delivery_signature: string | null;
  delivery_notes: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface ShipmentItemTable {
  id: number;
  shipment_id: number;
  order_item_id: number;
  quantity: number;
  created_at: Date;
  updated_at: Date;
}

export interface CouponTable {
  id: number;
  code: string;
  type: string;
  value: number;
  minimum_amount: number | null;
  maximum_amount: number | null;
  usage_limit: number | null;
  usage_limit_per_user: number | null;
  used_count: number;
  is_active: boolean;
  starts_at: Date | null;
  expires_at: Date | null;
  applicable_to: string;
  applicable_ids: string | null;
  exclude_sale_items: boolean;
  description: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface CouponUsageTable {
  id: number;
  coupon_id: number;
  user_id: number | null;
  order_id: number;
  discount_amount: number;
  created_at: Date;
}

export interface WishlistTable {
  id: number;
  user_id: number;
  name: string;
  description: string | null;
  is_public: boolean;
  is_default: boolean;
  sort_order: number;
  created_at: Date;
  updated_at: Date;
}

// Content Management Tables (5 tables)
export interface BlogPostTable {
  id: number;
  author_id: number;
  category_id: number | null;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string;
  featured_image: string | null;
  status: string;
  visibility: string;
  password: string | null;
  comment_status: string;
  is_featured: boolean;
  is_sticky: boolean;
  view_count: number;
  like_count: number;
  comment_count: number;
  share_count: number;
  reading_time: number | null;
  seo_title: string | null;
  seo_description: string | null;
  seo_keywords: string | null;
  published_at: Date | null;
  created_at: Date;
  updated_at: Date;
}

export interface BlogCategoryTable {
  id: number;
  parent_id: number | null;
  name: string;
  slug: string;
  description: string | null;
  image: string | null;
  color: string | null;
  sort_order: number;
  post_count: number;
  is_active: boolean;
  seo_title: string | null;
  seo_description: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface BlogCommentTable {
  id: number;
  post_id: number;
  parent_id: number | null;
  author_id: number | null;
  author_name: string;
  author_email: string;
  author_url: string | null;
  author_ip: string;
  content: string;
  status: string;
  is_approved: boolean;
  like_count: number;
  dislike_count: number;
  reply_count: number;
  created_at: Date;
  updated_at: Date;
}

export interface PageTable {
  id: number;
  parent_id: number | null;
  author_id: number;
  title: string;
  slug: string;
  content: string;
  excerpt: string | null;
  featured_image: string | null;
  template: string | null;
  status: string;
  visibility: string;
  password: string | null;
  sort_order: number;
  is_homepage: boolean;
  comment_status: string;
  view_count: number;
  seo_title: string | null;
  seo_description: string | null;
  seo_keywords: string | null;
  published_at: Date | null;
  created_at: Date;
  updated_at: Date;
}

export interface MenuTable {
  id: number;
  name: string;
  slug: string;
  location: string;
  description: string | null;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

/**
 * Large Database Interface
 * Contains 33 realistic tables with 20+ columns each
 * Designed to stress-test TypeScript compilation performance
 */
export interface LargeDatabase {
  // Core User Management (5 tables)
  users: UserTable;
  user_profiles: UserProfileTable;
  user_addresses: UserAddressTable;
  user_preferences: UserPreferencesTable;
  user_sessions: UserSessionTable;

  // Product Catalog (8 tables)
  categories: CategoryTable;
  brands: BrandTable;
  products: ProductTable;
  product_variants: ProductVariantTable;
  product_images: ProductImageTable;
  product_attributes: ProductAttributeTable;
  product_attribute_values: ProductAttributeValueTable;
  product_reviews: ProductReviewTable;

  // E-commerce Orders (10 tables)
  carts: CartTable;
  cart_items: CartItemTable;
  orders: OrderTable;
  order_items: OrderItemTable;
  payments: PaymentTable;
  shipments: ShipmentTable;
  shipment_items: ShipmentItemTable;
  coupons: CouponTable;
  coupon_usage: CouponUsageTable;
  wishlists: WishlistTable;

  // Content Management (5 tables)
  blog_posts: BlogPostTable;
  blog_categories: BlogCategoryTable;
  blog_comments: BlogCommentTable;
  pages: PageTable;
  menus: MenuTable;
}

/**
 * Performance Test Summary:
 * - 33 tables total
 * - Average 20+ columns per table
 * - Mix of required/nullable columns
 * - Realistic business data types
 * - Complex foreign key relationships
 *
 * This schema will stress-test:
 * - TypeScript compilation time
 * - JOIN nullability type inference
 * - Smart error message generation
 * - IDE responsiveness with autocomplete
 */
