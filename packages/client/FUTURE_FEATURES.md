# pgvibe Future Features

This document outlines planned advanced PostgreSQL features for pgvibe. The Foundation MVP is **complete** and includes comprehensive SELECT, INSERT, JOIN operations, full PostgreSQL array/JSONB support, type-safe aliases, and a complete migration system.

## 🎯 Current Implementation Status

### ✅ Foundation MVP - COMPLETE

- **SELECT queries** with full type safety and alias support
- **INSERT queries** with optional/default column handling and RETURNING
- **JOIN operations** (INNER, LEFT, RIGHT, FULL) with proper nullability
- **WHERE clauses** with expression builder and complex logical operations
- **ORDER BY, LIMIT, OFFSET** with full type safety
- **Table aliases** with comprehensive type safety throughout
- **Raw SQL** support with parameterization and template literals
- **PostgreSQL arrays** with full type safety (@>, <@, &&, ANY, ALL)
- **JSONB operations** with fluent API (@>, <@, ?, ->, ->>, #>, #>>)
- **Complete AST system** with immutable operation nodes
- **PostgreSQL query compiler** with proper SQL generation
- **Type-safe parameter binding** with PostgreSQL driver integration
- **Connection pooling** with lifecycle management
- **Migration system** with schema parsing, diffing, and safe execution
- **Comprehensive test suite** with 26+ test categories
- **Performance benchmarks** and compilation optimization

## 🚀 Planned Advanced Features

### Core SQL Operations

#### UPDATE Operations

- **UPDATE query builder** with type-safe column updates
- **SET clause** with expression support
- **WHERE clause** integration with existing expression builder
- **RETURNING clause** for UPDATE statements
- **Bulk UPDATE** operations with efficient batching

#### DELETE Operations

- **DELETE query builder** with type-safe WHERE clauses
- **RETURNING clause** for DELETE statements
- **Cascading DELETE** with proper foreign key handling
- **Bulk DELETE** operations with safety checks

#### Subqueries and Complex Queries

- **Subquery support** in SELECT, WHERE, and JOIN clauses
- **Correlated subqueries** with proper scoping
- **EXISTS and NOT EXISTS** operations
- **IN and NOT IN** with subquery support
- **Scalar subqueries** in SELECT clauses

### Advanced PostgreSQL Features

#### Window Functions

- **Window function AST nodes** for OVER clauses
- **PARTITION BY and ORDER BY** in window specifications
- **Frame specifications** (ROWS, RANGE, GROUPS)
- **Built-in window functions** (ROW_NUMBER, RANK, DENSE_RANK, LAG, LEAD)
- **Aggregate functions** as window functions

#### Common Table Expressions (CTEs)

- **CTE AST nodes** for WITH clauses
- **Non-recursive CTEs** with proper scoping
- **Recursive CTEs** with UNION and termination conditions
- **Multiple CTE** support in single queries
- **CTE materialization** hints

#### Full-Text Search

- **tsvector and tsquery** type support
- **Full-text search operators** (@@, @@@)
- **Text search functions** (to_tsvector, to_tsquery, plainto_tsquery)
- **Search result ranking** (ts_rank, ts_rank_cd)
- **Search result highlighting** (ts_headline)
- **GIN and GiST indexes** for full-text search

#### Set Operations

- **UNION, UNION ALL** with proper type handling
- **INTERSECT, INTERSECT ALL** operations
- **EXCEPT, EXCEPT ALL** operations
- **Proper column alignment** and type coercion
- **ORDER BY** with set operations

### Data Types and Schema

#### Type-Safe Expression Builder

- **Column type-aware expression methods** - Prevent invalid expression builder usage in WHERE clauses
  - `array()` method only callable on array-typed columns (e.g., `array("tags").overlaps([...])`)
  - `json()` method only callable on JSON/JSONB-typed columns (e.g., `json("profile").at("email")`)
  - Compile-time type checking to prevent calling `array("name")` on string columns
  - Compile-time type checking to prevent calling `json("active")` on boolean columns
  - Clear TypeScript errors for invalid expression builder method usage
  - Enhanced WHERE clause type safety based on actual column types

#### Custom Types and Enums

- **PostgreSQL ENUM** type support with TypeScript unions
- **Custom domain types** with validation
- **Composite types** (row types) with proper destructuring
- **Range types** (int4range, tsrange, etc.)
- **Array types** for custom types and enums

#### Advanced Data Types

- **UUID type** with proper validation
- **Network address types** (inet, cidr, macaddr)
- **Geometric types** (point, line, circle, polygon)
- **Binary data types** (bytea) with proper encoding
- **XML type** with XPath support

### Performance and Production Features

#### Advanced Queries

- **Materialized views** support
- **Stored procedure calls** with parameter handling
- **User-defined functions** calls
- **Trigger function** support
- **Prepared statements** with caching

#### Bulk Operations

- **Bulk INSERT** with efficient batching
- **Bulk UPDATE** with temporary tables
- **Bulk DELETE** with chunking
- **COPY operations** for large data sets
- **Streaming results** for large query results

#### Query Optimization

- **Query plan analysis** integration
- **Index usage hints** and recommendations
- **Query caching** with invalidation
- **Connection pooling** optimization
- **Prepared statement** lifecycle management

### Developer Experience

#### Advanced Type Features

- **Expression builder type safety** - Restrict array/JSON methods to appropriate column types in WHERE clauses
- **Schema introspection** from live databases
- **Type generation** from database schema
- **Migration-aware types** that update with schema changes
- **Custom type validators** for complex business logic
- **Type-safe view definitions**

#### Debugging and Monitoring

- **Query logging** with performance metrics
- **Slow query detection** and alerting
- **Connection pool monitoring**
- **SQL query formatting** and pretty-printing
- **Development-mode query explanations**

#### Testing and Development

- **Mock query builder** for unit testing
- **Test data factories** with realistic data generation
- **Schema fixtures** for integration testing
- **Transaction helpers** for test isolation
- **Database seeding** utilities

## 📋 Implementation Roadmap

### Phase 1: Core Operations (Next Priority)

1. **Type-safe expression builder** - Prevent invalid array/json methods in WHERE clauses
2. **UPDATE operations** - Complete the CRUD operations suite
3. **DELETE operations** - Finish basic data manipulation
4. **Subqueries** - Enable complex query patterns
5. **Set operations** - UNION, INTERSECT, EXCEPT support

### Phase 2: Advanced PostgreSQL Features

1. **Window functions** - Essential for analytics queries
2. **CTEs** - Important for complex query organization
3. **Full-text search** - Critical for search functionality
4. **Custom types** - Better PostgreSQL integration

### Phase 3: Performance and Production

1. **Bulk operations** - Handle large datasets efficiently
2. **Query optimization** - Performance-focused features
3. **Monitoring** - Production debugging tools
4. **Advanced types** - Enhanced type system

### Phase 4: Developer Experience

1. **Schema introspection** - Live database integration
2. **Testing utilities** - Comprehensive testing support
3. **Development tools** - Enhanced debugging experience
4. **Documentation** - Comprehensive guides and examples

## 🎯 Strategic Goals

- **Complete PostgreSQL coverage** - Support all major PostgreSQL features
- **Best-in-class type safety** - Maintain superior TypeScript integration
- **Production-ready performance** - Optimize for real-world usage
- **Excellent developer experience** - Prioritize ease of use and debugging
- **Comprehensive testing** - Ensure reliability and stability

---

_This roadmap will be updated based on community feedback and usage patterns. The Foundation MVP provides a solid base for building complex applications, while these advanced features will unlock PostgreSQL's full potential._
