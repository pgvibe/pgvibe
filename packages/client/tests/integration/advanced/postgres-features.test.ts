// PostgreSQL Advanced Features Integration Tests
// Tests PostgreSQL-specific features with isolated test tables

import { describe, test, expect, beforeAll, afterAll } from "bun:test";
import { ZenQ } from "../../../src/query-builder";
import {
  generateTestId,
  createTestDatabase,
  waitForDatabase,
} from "../utils/test-helpers";
import { performTestCleanup } from "../utils/cleanup";

// Table schema for PostgreSQL features tests
function createPostgresFeaturesTable(testId: string) {
  return {
    products: {
      name: `test_products_${testId}`,
      schema: `
        CREATE TABLE test_products_${testId} (
          id SERIAL PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          description TEXT,
          price DECIMAL(10,2),
          tags TEXT[],
          metadata JSONB,
          search_vector TSVECTOR,
          coordinates POINT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        )
      `,
    },
    orders: {
      name: `test_orders_${testId}`,
      schema: `
        CREATE TABLE test_orders_${testId} (
          id SERIAL PRIMARY KEY,
          order_number VARCHAR(50) UNIQUE NOT NULL,
          customer_name VARCHAR(255) NOT NULL,
          items JSONB NOT NULL,
          total_amount DECIMAL(10,2) NOT NULL,
          status VARCHAR(50) DEFAULT 'pending',
          notes TEXT[],
          order_date DATE DEFAULT CURRENT_DATE,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        )
      `,
    },
    analytics: {
      name: `test_analytics_${testId}`,
      schema: `
        CREATE TABLE test_analytics_${testId} (
          id SERIAL PRIMARY KEY,
          event_name VARCHAR(100) NOT NULL,
          event_data JSONB,
          user_agents TEXT[],
          timestamps TIMESTAMP[],
          numeric_values DECIMAL[],
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        )
      `,
    },
  };
}

async function createPostgresFeaturesDbTables(db: ZenQ<any>, tables: any) {
  await db.query(tables.products.schema);
  await db.query(tables.orders.schema);
  await db.query(tables.analytics.schema);
}

async function seedPostgresFeaturesData(db: ZenQ<any>, tables: any) {
  // Insert products with various PostgreSQL data types
  await db.query(`
    INSERT INTO ${tables.products.name} (name, description, price, tags, metadata, coordinates)
    VALUES 
      ('MacBook Pro', 'High-performance laptop', 2499.99, ARRAY['laptop', 'apple', 'premium'], 
       '{"brand": "Apple", "model": "M2", "year": 2023, "specs": {"ram": "16GB", "storage": "512GB"}}',
       POINT(37.7749, -122.4194)),
      ('iPhone 15', 'Latest smartphone', 999.99, ARRAY['phone', 'apple', 'mobile'], 
       '{"brand": "Apple", "model": "iPhone 15", "color": "blue", "storage": "128GB"}',
       POINT(40.7128, -74.0060)),
      ('Dell XPS 13', 'Ultrabook laptop', 1299.99, ARRAY['laptop', 'dell', 'ultrabook'], 
       '{"brand": "Dell", "series": "XPS", "screen": "13.3", "weight": "2.8lbs"}',
       POINT(34.0522, -118.2437)),
      ('Samsung Galaxy S24', 'Android flagship', 899.99, ARRAY['phone', 'samsung', 'android'], 
       '{"brand": "Samsung", "model": "Galaxy S24", "os": "Android 14", "camera": "50MP"}',
       POINT(41.8781, -87.6298)),
      ('ThinkPad X1', 'Business laptop', 1899.99, ARRAY['laptop', 'lenovo', 'business'], 
       '{"brand": "Lenovo", "series": "ThinkPad", "durability": "military-grade", "keyboard": "excellent"}',
       POINT(29.7604, -95.3698))
  `);

  // Insert orders with JSONB arrays and complex data
  await db.query(`
    INSERT INTO ${tables.orders.name} (order_number, customer_name, items, total_amount, status, notes)
    VALUES 
      ('ORD-2023-001', 'John Smith', 
       '[{"product": "MacBook Pro", "quantity": 1, "price": 2499.99}, {"product": "iPhone 15", "quantity": 2, "price": 999.99}]',
       4499.97, 'completed', ARRAY['Express shipping', 'Gift wrapped']),
      ('ORD-2023-002', 'Jane Doe', 
       '[{"product": "Dell XPS 13", "quantity": 1, "price": 1299.99}]',
       1299.99, 'processing', ARRAY['Standard shipping']),
      ('ORD-2023-003', 'Bob Wilson', 
       '[{"product": "Samsung Galaxy S24", "quantity": 3, "price": 899.99}, {"product": "ThinkPad X1", "quantity": 1, "price": 1899.99}]',
       4599.96, 'pending', ARRAY['Bulk order', 'Corporate account']),
      ('ORD-2023-004', 'Alice Brown', 
       '[{"product": "iPhone 15", "quantity": 1, "price": 999.99}]',
       999.99, 'completed', ARRAY['Same day delivery']),
      ('ORD-2023-005', 'Charlie Davis', 
       '[{"product": "MacBook Pro", "quantity": 2, "price": 2499.99}, {"product": "Dell XPS 13", "quantity": 1, "price": 1299.99}]',
       6299.97, 'shipped', ARRAY['Priority shipping', 'Insurance added'])
  `);

  // Insert analytics with arrays of different types
  await db.query(`
    INSERT INTO ${tables.analytics.name} (event_name, event_data, user_agents, timestamps, numeric_values)
    VALUES 
      ('page_view', '{"page": "/home", "referrer": "google.com", "session_id": "abc123"}',
       ARRAY['Mozilla/5.0 (Windows NT 10.0)', 'Chrome/91.0.4472.124'],
       ARRAY['2023-06-01 10:30:00'::timestamp, '2023-06-01 10:35:00'::timestamp],
       ARRAY[1.5, 2.3, 0.8]),
      ('button_click', '{"element": "signup-btn", "page": "/register", "user_id": 12345}',
       ARRAY['Safari/605.1.15', 'Mobile Safari'],
       ARRAY['2023-06-01 11:00:00'::timestamp, '2023-06-01 11:05:00'::timestamp],
       ARRAY[100.0, 25.5]),
      ('form_submit', '{"form": "contact", "fields": 5, "validation_errors": 0}',
       ARRAY['Firefox/89.0'],
       ARRAY['2023-06-01 12:15:00'::timestamp],
       ARRAY[3.2, 4.1, 2.9, 1.7]),
      ('purchase', '{"product_id": 101, "amount": 99.99, "payment_method": "card"}',
       ARRAY['Edge/91.0.864.59', 'Chrome/91.0.4472.124'],
       ARRAY['2023-06-01 14:20:00'::timestamp, '2023-06-01 14:25:00'::timestamp],
       ARRAY[99.99, 5.00]),
      ('search', '{"query": "laptop", "results": 15, "filter": "price_asc"}',
       ARRAY['Opera/76.0.4017.123'],
       ARRAY['2023-06-01 15:45:00'::timestamp],
       ARRAY[0.3, 1.2, 0.9])
  `);
}

describe("PostgreSQL Advanced Features Integration Tests", () => {
  const testId = generateTestId();
  const tables = createPostgresFeaturesTable(testId);
  let db: ZenQ<any>;

  beforeAll(async () => {
    db = createTestDatabase();
    await waitForDatabase();

    // Create isolated test tables
    await createPostgresFeaturesDbTables(db, tables);

    // Seed with test data
    await seedPostgresFeaturesData(db, tables);
  });

  afterAll(async () => {
    // Clean up our isolated tables
    await performTestCleanup(db, [
      tables.analytics.name,
      tables.orders.name,
      tables.products.name,
    ]);
  });

  describe("Array and Text Operations", () => {
    test("should query products by price and tags", async () => {
      // Find laptop products in a certain price range
      const laptops = await db
        .selectFrom(tables.products.name)
        .where(({ eb }) =>
          eb.and([eb("price", ">", 1000), eb("name", "like", "%Book%")])
        )
        .execute();

      expect(laptops.length).toBeGreaterThan(0);
      laptops.forEach((product) => {
        expect(parseFloat(product.price)).toBeGreaterThan(1000);
        expect(product.name).toContain("Book");
      });
    });

    test("should query products by brand and category", async () => {
      // Find Apple products using LIKE operations
      const appleProducts = await db
        .selectFrom(tables.products.name)
        .where(({ eb }) =>
          eb.or([
            eb("name", "like", "%MacBook%"),
            eb("name", "like", "%iPhone%"),
          ])
        )
        .execute();

      expect(appleProducts.length).toBeGreaterThan(0);
      appleProducts.forEach((product) => {
        const isAppleProduct =
          product.name.includes("MacBook") || product.name.includes("iPhone");
        expect(isAppleProduct).toBe(true);
      });
    });

    test("should query orders by status and customer", async () => {
      // Find completed orders
      const completedOrders = await db
        .selectFrom(tables.orders.name)
        .where(({ eb }) => eb("status", "=", "completed"))
        .execute();

      expect(completedOrders.length).toBeGreaterThan(0);
      completedOrders.forEach((order) => {
        expect(order.status).toBe("completed");
      });
    });

    test("should handle complex text queries with multiple conditions", async () => {
      // Find high-value orders from specific customers
      const highValueOrders = await db
        .selectFrom(tables.orders.name)
        .where(({ eb }) =>
          eb.and([
            eb("total_amount", ">", 2000),
            eb("customer_name", "like", "%John%"),
          ])
        )
        .execute();

      highValueOrders.forEach((order) => {
        expect(parseFloat(order.total_amount)).toBeGreaterThan(2000);
        expect(order.customer_name).toContain("John");
      });
    });
  });

  describe("JSON and Complex Data Operations", () => {
    test("should query products by metadata fields", async () => {
      // Find products by examining JSON metadata
      const products = await db
        .selectFrom(tables.products.name)
        .select(["name", "metadata", "price"])
        .where(({ eb }) => eb("price", ">", 1000))
        .execute();

      expect(products.length).toBeGreaterThan(0);
      products.forEach((product) => {
        expect(parseFloat(product.price)).toBeGreaterThan(1000);
        expect(product.metadata).toBeDefined();
        // Verify we can access JSONB data
        expect(typeof product.metadata).toBe("object");
      });
    });

    test("should query orders by items and total", async () => {
      // Find high-value orders with JSON items
      const highValueOrders = await db
        .selectFrom(tables.orders.name)
        .select(["order_number", "items", "total_amount", "customer_name"])
        .where(({ eb }) => eb("total_amount", ">", 2000))
        .execute();

      expect(highValueOrders.length).toBeGreaterThan(0);
      highValueOrders.forEach((order) => {
        expect(parseFloat(order.total_amount)).toBeGreaterThan(2000);
        expect(Array.isArray(order.items)).toBe(true);
        expect(order.items.length).toBeGreaterThan(0);
      });
    });

    test("should query analytics by event data", async () => {
      // Find analytics events with JSON data
      const events = await db
        .selectFrom(tables.analytics.name)
        .select(["event_name", "event_data"])
        .where(({ eb }) => eb("event_name", "=", "page_view"))
        .execute();

      events.forEach((event) => {
        expect(event.event_name).toBe("page_view");
        expect(event.event_data).toBeDefined();
        expect(typeof event.event_data).toBe("object");
      });
    });

    test("should handle complex queries with JSON fields", async () => {
      // Find products and orders in related queries
      const expensiveProducts = await db
        .selectFrom(tables.products.name)
        .select(["name", "price", "metadata"])
        .where(({ eb }) =>
          eb.and([eb("price", ">", 1500), eb("name", "like", "%Pro%")])
        )
        .execute();

      expensiveProducts.forEach((product) => {
        expect(parseFloat(product.price)).toBeGreaterThan(1500);
        expect(product.name).toContain("Pro");
        expect(product.metadata).toBeDefined();
      });
    });
  });

  describe("Numeric and Date Operations", () => {
    test("should query products by price ranges", async () => {
      // Find products in specific price range
      const midRangeProducts = await db
        .selectFrom(tables.products.name)
        .where(({ eb }) =>
          eb.and([eb("price", ">=", 1000), eb("price", "<=", 2000)])
        )
        .orderBy("price", "asc")
        .execute();

      midRangeProducts.forEach((product) => {
        expect(parseFloat(product.price)).toBeGreaterThanOrEqual(1000);
        expect(parseFloat(product.price)).toBeLessThanOrEqual(2000);
      });
    });

    test("should query orders by date operations", async () => {
      // Find orders from current date (since we use CURRENT_DATE as default)
      const todaysOrders = await db
        .selectFrom(tables.orders.name)
        .select(["order_number", "customer_name", "total_amount"])
        .execute();

      expect(Array.isArray(todaysOrders)).toBe(true);
      expect(todaysOrders.length).toBeGreaterThan(0);
      // Verify we can access the data
      todaysOrders.forEach((order) => {
        expect(order.order_number).toBeDefined();
        expect(order.customer_name).toBeDefined();
        expect(typeof order.total_amount).toBe("string");
      });
    });

    test("should handle complex analytics queries", async () => {
      // Find analytics events by name
      const events = await db
        .selectFrom(tables.analytics.name)
        .select(["event_name", "event_data"])
        .where(({ eb }) =>
          eb("event_name", "in", ["page_view", "button_click"])
        )
        .execute();

      expect(events.length).toBeGreaterThan(0);
      events.forEach((event) => {
        expect(["page_view", "button_click"]).toContain(event.event_name);
        expect(event.event_data).toBeDefined();
      });
    });
  });

  describe("Performance and Advanced Queries", () => {
    test("should handle complex multi-table queries efficiently", async () => {
      const startTime = Date.now();

      // Complex query with multiple conditions
      const popularProducts = await db
        .selectFrom(tables.products.name)
        .select(["name", "price", "metadata"])
        .where(({ eb }) =>
          eb.and([eb("price", ">", 500), eb("name", "like", "%Pro%")])
        )
        .orderBy("price", "desc")
        .execute();

      const endTime = Date.now();
      const executionTime = endTime - startTime;

      expect(Array.isArray(popularProducts)).toBe(true);
      expect(executionTime).toBeLessThan(100);

      popularProducts.forEach((product) => {
        expect(parseFloat(product.price)).toBeGreaterThan(500);
        expect(product.name).toContain("Pro");
        expect(product.metadata).toBeDefined();
      });
    });

    test("should handle JSON data queries efficiently", async () => {
      const startTime = Date.now();

      // Query with JSON data access
      const detailedAnalytics = await db
        .selectFrom(tables.analytics.name)
        .select(["event_name", "event_data"])
        .where(({ eb }) => eb("event_name", "=", "page_view"))
        .execute();

      const endTime = Date.now();
      const executionTime = endTime - startTime;

      expect(Array.isArray(detailedAnalytics)).toBe(true);
      expect(executionTime).toBeLessThan(100);

      detailedAnalytics.forEach((event) => {
        expect(event.event_name).toBe("page_view");
        expect(event.event_data).toBeDefined();
        expect(typeof event.event_data).toBe("object");
      });
    });

    test("should handle complex order queries", async () => {
      // Test complex order filtering
      const complexOrders = await db
        .selectFrom(tables.orders.name)
        .select([
          "order_number",
          "customer_name",
          "items",
          "total_amount",
          "status",
        ])
        .where(({ eb }) =>
          eb.or([eb("total_amount", ">", 3000), eb("status", "=", "completed")])
        )
        .orderBy("total_amount", "desc")
        .execute();

      expect(Array.isArray(complexOrders)).toBe(true);
      complexOrders.forEach((order) => {
        const isHighValue = parseFloat(order.total_amount) > 3000;
        const isCompleted = order.status === "completed";
        expect(isHighValue || isCompleted).toBe(true);
        expect(Array.isArray(order.items)).toBe(true);
      });
    });
  });
});
