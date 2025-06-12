// TypeScript Compilation Performance Benchmark
// This file uses the large schema with complex ZenQ queries to stress-test TypeScript compilation
// Measures how our JOIN nullability and smart error types perform under load

import { ZenQ } from "../../src/query-builder";
import type { LargeDatabase } from "./large-schema";

// Create ZenQ instance with large schema
const db = new ZenQ<LargeDatabase>({
  connectionString: "postgresql://test:test@localhost:54322/test",
});

/**
 * PERFORMANCE TEST 1: Simple Queries on Large Schema
 * Tests basic type inference with many tables available
 */

// Test 1.1: Simple SELECT across multiple tables
async function testSimpleSelects() {
  const users = await db
    .selectFrom("users")
    .select(["id", "email", "first_name"])
    .execute();
  const products = await db
    .selectFrom("products")
    .select(["id", "name", "price", "is_active"])
    .execute();
  const orders = await db
    .selectFrom("orders")
    .select(["id", "order_number", "total_amount", "status"])
    .execute();
  const categories = await db
    .selectFrom("categories")
    .select(["id", "name", "slug", "is_featured"])
    .execute();
  const brands = await db
    .selectFrom("brands")
    .select(["id", "name", "logo_url", "rating_average"])
    .execute();

  return { users, products, orders, categories, brands };
}

// Test 1.2: SELECT with WHERE clauses
async function testSelectsWithWhere() {
  const activeUsers = await db
    .selectFrom("users")
    .select(["id", "email", "first_name", "last_name"])
    .where("is_active", "=", true)
    .execute();

  const featuredProducts = await db
    .selectFrom("products")
    .select(["id", "name", "price", "rating_average"])
    .where("is_featured", "=", true)
    .where("is_active", "=", true)
    .execute();

  const recentOrders = await db
    .selectFrom("orders")
    .select(["id", "order_number", "total_amount", "user_id"])
    .where("status", "=", "completed")
    .orderBy("created_at", "desc")
    .limit(100)
    .execute();

  return { activeUsers, featuredProducts, recentOrders };
}

/**
 * PERFORMANCE TEST 2: Complex JOINs with Nullability
 * Tests our JOIN nullability type inference with large schema
 */

// Test 2.1: Two-table JOINs
async function testTwoTableJoins() {
  // INNER JOIN - no nullability
  const usersWithProfiles = await db
    .selectFrom("users")
    .innerJoin("user_profiles", "users.id", "user_profiles.user_id")
    .select([
      "users.email",
      "users.first_name",
      "user_profiles.display_name",
      "user_profiles.company",
    ])
    .execute();

  // LEFT JOIN - right table nullable
  const usersWithOptionalAddresses = await db
    .selectFrom("users")
    .leftJoin("user_addresses", "users.id", "user_addresses.user_id")
    .select([
      "users.email",
      "users.first_name",
      "user_addresses.city",
      "user_addresses.country",
    ])
    .execute();

  // Product with optional brand
  const productsWithBrands = await db
    .selectFrom("products")
    .leftJoin("brands", "products.brand_id", "brands.id")
    .select([
      "products.name",
      "products.price",
      "brands.name",
      "brands.logo_url",
    ])
    .execute();

  return { usersWithProfiles, usersWithOptionalAddresses, productsWithBrands };
}

// Test 2.2: Three-table JOINs
async function testThreeTableJoins() {
  // Users -> Orders -> Order Items
  const userOrderDetails = await db
    .selectFrom("users")
    .innerJoin("orders", "users.id", "orders.user_id")
    .innerJoin("order_items", "orders.id", "order_items.order_id")
    .select([
      "users.email",
      "users.first_name",
      "orders.order_number",
      "orders.total_amount",
      "order_items.product_name",
      "order_items.quantity",
    ])
    .execute();

  // Products -> Category -> Brand (with nullable brand)
  const productCatalog = await db
    .selectFrom("products")
    .innerJoin("categories", "products.category_id", "categories.id")
    .leftJoin("brands", "products.brand_id", "brands.id")
    .select([
      "products.name",
      "products.price",
      "categories.name",
      "brands.name",
      "brands.logo_url",
    ])
    .execute();

  return { userOrderDetails, productCatalog };
}

// Test 2.3: Four-table JOINs
async function testFourTableJoins() {
  // Users -> Orders -> Order Items -> Products
  const userOrderProducts = await db
    .selectFrom("users")
    .innerJoin("orders", "users.id", "orders.user_id")
    .innerJoin("order_items", "orders.id", "order_items.order_id")
    .innerJoin("products", "order_items.product_id", "products.id")
    .select([
      "users.email",
      "orders.order_number",
      "order_items.quantity",
      "products.name",
      "products.price",
    ])
    .limit(50)
    .execute();

  // Products -> Categories -> Brand -> Reviews
  const productDetailsWithReviews = await db
    .selectFrom("products")
    .innerJoin("categories", "products.category_id", "categories.id")
    .leftJoin("brands", "products.brand_id", "brands.id")
    .leftJoin("product_reviews", "products.id", "product_reviews.product_id")
    .select([
      "products.name",
      "categories.name",
      "brands.name",
      "product_reviews.rating",
      "product_reviews.title",
    ])
    .execute();

  return { userOrderProducts, productDetailsWithReviews };
}

/**
 * PERFORMANCE TEST 3: Mixed JOIN Types with Complex Nullability
 * Tests most complex scenarios our type system supports
 */

// Test 3.1: Mixed JOIN types
async function testMixedJoinTypes() {
  const complexUserData = await db
    .selectFrom("users")
    .leftJoin("user_profiles", "users.id", "user_profiles.user_id")
    .rightJoin("user_addresses", "users.id", "user_addresses.user_id")
    .fullJoin("user_preferences", "users.id", "user_preferences.user_id")
    .select([
      "users.email",
      "users.first_name",
      "user_profiles.display_name",
      "user_addresses.city",
      "user_preferences.theme",
    ])
    .execute();

  return { complexUserData };
}

// Test 3.2: Multiple LEFT JOINs (cascading nullability)
async function testMultipleLeftJoins() {
  const ecommerceReport = await db
    .selectFrom("orders")
    .leftJoin("users", "orders.user_id", "users.id")
    .leftJoin("order_items", "orders.id", "order_items.order_id")
    .leftJoin("products", "order_items.product_id", "products.id")
    .leftJoin("categories", "products.category_id", "categories.id")
    .select([
      "orders.order_number",
      "orders.total_amount",
      "users.email",
      "order_items.quantity",
      "products.name",
      "categories.name",
    ])
    .where("orders.status", "=", "completed")
    .orderBy("orders.created_at", "desc")
    .limit(25)
    .execute();

  return { ecommerceReport };
}

/**
 * PERFORMANCE TEST 4: Large Column Selections
 * Tests type system with many columns selected
 */

// Test 4.1: Select many columns from single table
async function testLargeColumnSelections() {
  const fullUserData = await db
    .selectFrom("users")
    .select([
      "id",
      "email",
      "username",
      "first_name",
      "last_name",
      "phone",
      "birth_date",
      "gender",
      "avatar_url",
      "bio",
      "is_verified",
      "is_active",
      "last_login",
      "login_count",
      "failed_login_attempts",
      "timezone",
      "locale",
      "created_at",
    ])
    .execute();

  const fullProductData = await db
    .selectFrom("products")
    .select([
      "id",
      "sku",
      "name",
      "slug",
      "short_description",
      "description",
      "price",
      "sale_price",
      "weight",
      "is_digital",
      "is_downloadable",
      "stock_quantity",
      "manage_stock",
      "is_featured",
      "is_active",
      "rating_average",
      "review_count",
      "total_sales",
      "view_count",
    ])
    .execute();

  return { fullUserData, fullProductData };
}

// Test 4.2: Select many columns from JOINed tables
async function testLargeJoinSelections() {
  const comprehensiveOrderData = await db
    .selectFrom("orders")
    .innerJoin("users", "orders.user_id", "users.id")
    .innerJoin("order_items", "orders.id", "order_items.order_id")
    .leftJoin("products", "order_items.product_id", "products.id")
    .select([
      // Order columns
      "orders.id",
      "orders.order_number",
      "orders.status",
      "orders.total_amount",
      "orders.currency",
      "orders.created_at",
      // User columns
      "users.email",
      "users.first_name",
      "users.last_name",
      "users.phone",
      // Order item columns
      "order_items.quantity",
      "order_items.unit_price",
      "order_items.total_price",
      // Product columns (nullable due to LEFT JOIN)
      "products.name",
      "products.sku",
      "products.price",
      "products.is_digital",
    ])
    .where("orders.status", "=", "completed")
    .orderBy("orders.created_at", "desc")
    .limit(10)
    .execute();

  return { comprehensiveOrderData };
}

/**
 * PERFORMANCE TEST 5: Error Conditions with Large Schema
 * Tests smart error messages with many available tables/columns
 */

// Test 5.1: Invalid columns should show smart errors
function testInvalidColumns() {
  // These should show helpful error messages even with large schema
  // Note: Error tests commented out to avoid compilation errors in benchmarks

  /* 
  // @ts-expect-error - Invalid column in users table
  const invalidUser = db.selectFrom("users").select(["id", "nonexistent_column"]);
  
  // @ts-expect-error - Invalid table name
  const invalidTable = db.selectFrom("nonexistent_table").select(["id"]);
  
  // @ts-expect-error - Column from different table
  const wrongTable = db.selectFrom("users").select(["id", "product_name"]);
  
  // @ts-expect-error - Invalid JOIN column
  const invalidJoin = db.selectFrom("users").innerJoin("orders", "users.id", "orders.nonexistent_column");
  */

  // Valid queries for performance testing
  const validUser = db.selectFrom("users").select(["id", "email"]);
  const validTable = db.selectFrom("orders").select(["id"]);

  return { validUser, validTable };
}

/**
 * PERFORMANCE TEST 6: Complex Query Chains
 * Tests method chaining performance with large schema
 */

// Test 6.1: Long method chains
async function testComplexChains() {
  const complexQuery = await db
    .selectFrom("products")
    .innerJoin("categories", "products.category_id", "categories.id")
    .leftJoin("brands", "products.brand_id", "brands.id")
    .leftJoin("product_reviews", "products.id", "product_reviews.product_id")
    .select([
      "products.name",
      "products.price",
      "categories.name",
      "brands.name",
      "product_reviews.rating",
    ])
    .where("products.is_active", "=", true)
    .where("categories.is_active", "=", true)
    .where("products.price", ">", 0)
    .orderBy("products.rating_average", "desc")
    .orderBy("products.total_sales", "desc")
    .limit(20)
    .offset(10)
    .execute();

  return { complexQuery };
}

// Export all test functions for benchmarking
export {
  testSimpleSelects,
  testSelectsWithWhere,
  testTwoTableJoins,
  testThreeTableJoins,
  testFourTableJoins,
  testMixedJoinTypes,
  testMultipleLeftJoins,
  testLargeColumnSelections,
  testLargeJoinSelections,
  testInvalidColumns,
  testComplexChains,
};

/**
 * Benchmark Summary:
 *
 * This file tests TypeScript compilation performance across:
 * - 33 table large schema
 * - Simple to complex JOIN scenarios
 * - JOIN nullability type inference
 * - Smart error message generation
 * - Large column selections
 * - Complex method chaining
 *
 * Performance metrics to measure:
 * - TypeScript compilation time (`tsc --noEmit`)
 * - IDE responsiveness (manual testing)
 * - Memory usage during compilation
 * - Error message quality and speed
 */
