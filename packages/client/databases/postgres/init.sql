-- PostgreSQL Test Database Initialization
-- This script creates tables with array columns and populates them with test data
-- for comprehensive array operation integration testing

-- Drop tables if they exist (for clean re-initialization)
DROP TABLE IF EXISTS comments CASCADE;
DROP TABLE IF EXISTS posts CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS jsonb_users CASCADE;
DROP TABLE IF EXISTS jsonb_products CASCADE;

-- Create users table with array columns
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE,
    active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    -- Array columns for testing
    tags TEXT[] DEFAULT '{}',
    permissions TEXT[] DEFAULT '{}',
    scores INTEGER[] DEFAULT '{}'
);

-- Create posts table with array columns
CREATE TABLE posts (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id),
    title VARCHAR(255) NOT NULL,
    content TEXT,
    published BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    -- Array columns for testing
    categories TEXT[] DEFAULT '{}',
    ratings INTEGER[] DEFAULT '{}'
);

-- Create comments table (no arrays, for JOIN testing)
CREATE TABLE comments (
    id SERIAL PRIMARY KEY,
    post_id INTEGER NOT NULL REFERENCES posts(id),
    user_id INTEGER NOT NULL REFERENCES users(id),
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create JSONB tables for existing JSONB tests
CREATE TABLE jsonb_users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE,
    settings JSONB DEFAULT '{}',
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE jsonb_products (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    attributes JSONB DEFAULT '{}',
    analytics JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert test data that matches original test expectations
-- Original tests expect exactly 5 users with specific names and properties
INSERT INTO users (name, email, active, tags, permissions, scores) VALUES
-- User 1: John Doe (active, has email, admin permissions, typescript skills)
('John Doe', 'john@example.com', true, 
 ARRAY['typescript', 'nodejs', 'react'], 
 ARRAY['admin', 'write', 'read'], 
 ARRAY[95, 87, 92]),

-- User 2: Jane Smith (active, has email, read permissions, python skills)
('Jane Smith', 'jane@example.com', true, 
 ARRAY['python', 'django', 'postgresql'], 
 ARRAY['read'], 
 ARRAY[88, 91, 85]),

-- User 3: Bob Johnson (INACTIVE, NO EMAIL - for IS NULL tests)
('Bob Johnson', NULL, false,
 ARRAY['java', 'spring'], 
 ARRAY['read'], 
 ARRAY[80, 75]),

-- User 4: Alice Wilson (active, has email, admin permissions, devops skills)
('Alice Wilson', 'alice@example.com', true, 
 ARRAY['docker', 'kubernetes', 'aws'], 
 ARRAY['admin', 'deploy', 'read', 'write'], 
 ARRAY[90, 93, 88]),

-- User 5: Charlie Brown (active, has email, read permissions, frontend skills)
('Charlie Brown', 'charlie@example.com', true, 
 ARRAY['html', 'css', 'javascript'], 
 ARRAY['read'], 
 ARRAY[75, 78, 82]);

-- Posts data for testing (designed to work with 5 users and test array operations)
INSERT INTO posts (user_id, title, content, published, categories, ratings) VALUES
-- Posts by John Doe (user 1) - TypeScript developer
(1, 'Getting Started with pgvibe', 'This is my first post about pgvibe, a type-safe query builder...', true,
 ARRAY['tech', 'tutorial', 'typescript'], 
 ARRAY[5, 4, 5, 4, 5]),

(1, 'Advanced TypeScript Patterns', 'Today I want to discuss some advanced TypeScript patterns...', false,
 ARRAY['typescript', 'advanced'], 
 ARRAY[4, 5]),

-- Posts by Jane Smith (user 2) - Python developer  
(2, 'Database Design Best Practices', 'When designing databases, there are several key principles...', true,
 ARRAY['database', 'postgresql', 'tutorial'], 
 ARRAY[4, 5, 4, 5]),

(2, 'Query Optimization Tips', 'Here are some tips for optimizing your database queries...', true,
 ARRAY['database', 'optimization'], 
 ARRAY[5, 4, 5]),

-- Posts by Alice Wilson (user 4) - DevOps engineer
(4, 'Introduction to SQL', 'SQL is a powerful language for managing data...', true,
 ARRAY['sql', 'tutorial', 'beginner'], 
 ARRAY[3, 4, 3, 4]),

(4, 'Docker Best Practices', 'Essential Docker practices for production...', true,
 ARRAY['devops', 'docker', 'production'], 
 ARRAY[5, 5, 4, 5]),

-- Posts by Charlie Brown (user 5) - Frontend developer
(5, 'Draft Post', 'This is just a draft...', false,
 ARRAY['draft'], 
 ARRAY[3]),

(5, 'React vs Vue Comparison', 'Comparing modern frontend frameworks...', true,
 ARRAY['frontend', 'react', 'vue', 'comparison'], 
 ARRAY[4, 4, 5, 3, 4]),

-- Additional posts for comprehensive array testing
(1, 'JavaScript Tips and Tricks', 'Useful JavaScript techniques...', true,
 ARRAY['javascript', 'tips', 'frontend'], 
 ARRAY[5, 4, 5, 4, 3]),

(2, 'Full-Stack Development Guide', 'Complete guide to full-stack development...', true,
 ARRAY['fullstack', 'frontend', 'backend', 'database', 'deployment'], 
 ARRAY[5, 5, 4, 5, 4, 5]);

-- Insert some comments for JOIN testing
INSERT INTO comments (post_id, user_id, content) VALUES
(1, 2, 'Great tutorial! Very helpful.'),
(1, 3, 'Thanks for sharing this.'),
(2, 1, 'Excellent explanation of array operations.'),
(3, 4, 'Good comparison between React and Vue.'),
(4, 5, 'This helped me understand Docker better.'),
(5, 1, 'Nice beginner-friendly guide.'),
(9, 2, 'These JavaScript tips are really useful.'),
(10, 3, 'Comprehensive guide, thanks!');

-- Insert JSONB test data for existing tests (matching test expectations)
INSERT INTO jsonb_users (name, email, settings, metadata) VALUES
-- User 1: John Doe with dark theme and premium status
('John Doe', 'john@example.com', 
 '{"theme": "dark", "notifications": {"email": true, "push": false}, "language": "en", "features": ["beta"]}',
 '{"premium": true, "verified": true, "last_login": "2024-01-15"}'),

-- User 2: Jane Smith with light theme and path-based notifications
('Jane Smith', 'jane@example.com',
 '{"theme": "light", "notifications": {"email": false, "push": true}, "language": "es", "features": ["standard"]}',
 '{"premium": false, "verified": true, "activity_score": 85}'),

-- User 3: Bob Johnson with both email and push notifications enabled
('Bob Johnson', 'bob@example.com',
 '{"theme": "dark", "notifications": {"email": true, "push": true}, "language": "en", "features": ["beta", "premium"]}',
 '{"premium": true, "early_adopter": true, "beta_tester": true}'),

-- User 4: Alice Wilson (churned user)
('Alice Wilson', 'alice@example.com',
 '{"theme": "light", "notifications": {"email": false, "push": false}, "language": "fr", "features": []}',
 '{"churned": true, "last_activity": "2023-12-01"}'),

-- User 5: Charlie Brown with premium and verified status
('Charlie Brown', 'charlie@example.com',
 '{"theme": "dark", "notifications": {"email": true, "push": true}, "language": "en", "features": ["premium", "analytics"]}',
 '{"premium": true, "verified": true, "high_engagement": true}');

INSERT INTO jsonb_products (name, attributes, analytics) VALUES
-- Product 1: Blue T-Shirt (on sale)
('Blue T-Shirt', 
 '{"color": "blue", "size": "M", "price": 25.99, "tags": ["clothing", "casual"], "sale": true}',
 '{"views": 1250, "clicks": 89, "conversions": 12, "revenue": 311.88}'),

-- Product 2: Red Sneakers (featured)
('Red Sneakers',
 '{"color": "red", "size": "10", "price": 89.99, "tags": ["shoes", "sport"], "featured": true}',
 '{"views": 2100, "clicks": 156, "conversions": 23, "revenue": 2069.77}'),

-- Product 3: Green Backpack (trending)
('Green Backpack',
 '{"color": "green", "size": "large", "price": 45.50, "tags": ["accessories", "outdoor"], "trending": true}',
 '{"views": 890, "clicks": 67, "conversions": 8, "revenue": 364.00}'),

-- Product 4: White Hoodie (basic product)
('White Hoodie',
 '{"color": "white", "size": "L", "price": 35.00, "tags": ["clothing", "casual", "popular"]}',
 '{"views": 567, "clicks": 34, "conversions": 5, "revenue": 175.00}'),

-- Product 5: Black Jeans (sale and featured)
('Black Jeans',
 '{"color": "black", "size": "32", "price": 65.00, "tags": ["clothing", "formal"], "sale": true, "featured": true}',
 '{"views": 1890, "clicks": 142, "conversions": 28, "revenue": 1820.00}');

-- Create indexes for better performance in tests
CREATE INDEX idx_users_tags_gin ON users USING GIN (tags);
CREATE INDEX idx_users_permissions_gin ON users USING GIN (permissions);
CREATE INDEX idx_users_scores_gin ON users USING GIN (scores);
CREATE INDEX idx_posts_categories_gin ON posts USING GIN (categories);
CREATE INDEX idx_posts_ratings_gin ON posts USING GIN (ratings);

-- Create JSONB indexes for efficient JSONB querying
CREATE INDEX idx_jsonb_users_settings ON jsonb_users USING GIN (settings);
CREATE INDEX idx_jsonb_users_metadata ON jsonb_users USING GIN (metadata);
CREATE INDEX idx_jsonb_products_attributes ON jsonb_products USING GIN (attributes);
CREATE INDEX idx_jsonb_products_analytics ON jsonb_products USING GIN (analytics);

-- Create additional indexes for performance testing
CREATE INDEX idx_users_active ON users (active);
CREATE INDEX idx_posts_published ON posts (published);
CREATE INDEX idx_users_created_at ON users (created_at);
CREATE INDEX idx_posts_created_at ON posts (created_at);
CREATE INDEX idx_users_email ON users (email);
CREATE INDEX idx_posts_user_id ON posts (user_id);
CREATE INDEX idx_comments_post_id ON comments (post_id);
CREATE INDEX idx_comments_user_id ON comments (user_id);

-- Analyze tables for better query planning
ANALYZE users;
ANALYZE posts;
ANALYZE comments;
ANALYZE jsonb_users;
ANALYZE jsonb_products; 