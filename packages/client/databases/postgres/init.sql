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

-- Insert comprehensive test data for array operations

-- Users with diverse array data for testing
INSERT INTO users (name, email, active, tags, permissions, scores) VALUES
-- User 1: TypeScript developer with admin permissions
('John Doe', 'john@example.com', true, 
 ARRAY['typescript', 'nodejs', 'react'], 
 ARRAY['admin', 'write', 'read'], 
 ARRAY[95, 87, 92]),

-- User 2: Python developer with read permissions
('Jane Smith', 'jane@example.com', true, 
 ARRAY['python', 'django', 'postgresql'], 
 ARRAY['read'], 
 ARRAY[88, 91, 85]),

-- User 3: Full-stack developer with write permissions
('Bob Wilson', 'bob@example.com', true, 
 ARRAY['javascript', 'typescript', 'python', 'react', 'vue'], 
 ARRAY['write', 'read'], 
 ARRAY[92, 89, 94, 87]),

-- User 4: DevOps engineer with special permissions
('Alice Johnson', 'alice@example.com', true, 
 ARRAY['docker', 'kubernetes', 'aws', 'terraform'], 
 ARRAY['admin', 'deploy', 'read', 'write'], 
 ARRAY[90, 93, 88]),

-- User 5: Junior developer with limited permissions
('Charlie Brown', 'charlie@example.com', true, 
 ARRAY['html', 'css', 'javascript'], 
 ARRAY['read'], 
 ARRAY[75, 78, 82]),

-- User 6: Inactive user for testing active filter
('David Lee', 'david@example.com', false, 
 ARRAY['java', 'spring', 'mysql'], 
 ARRAY['read', 'write'], 
 ARRAY[85, 87]),

-- User 7: User with empty arrays for edge case testing
('Emma Davis', 'emma@example.com', true, 
 ARRAY[]::TEXT[], 
 ARRAY[]::TEXT[], 
 ARRAY[]::INTEGER[]),

-- User 8: User with single elements for testing
('Frank Miller', 'frank@example.com', true, 
 ARRAY['go'], 
 ARRAY['read'], 
 ARRAY[95]),

-- User 9: User with duplicate elements for testing
('Grace Wilson', 'grace@example.com', true, 
 ARRAY['react', 'react', 'javascript', 'javascript'], 
 ARRAY['read', 'read', 'write'], 
 ARRAY[90, 90, 85, 85]),

-- User 10: User with many elements for performance testing
('Henry Taylor', 'henry@example.com', true, 
 ARRAY['javascript', 'typescript', 'python', 'java', 'go', 'rust', 'c++', 'c#', 'php', 'ruby'], 
 ARRAY['admin', 'write', 'read', 'deploy', 'manage', 'audit'], 
 ARRAY[88, 92, 85, 90, 87, 94, 89, 91, 86, 93]);

-- Posts with diverse array data for testing
INSERT INTO posts (user_id, title, content, published, categories, ratings) VALUES
-- Post 1: Tech tutorial
(1, 'Getting Started with TypeScript', 'A comprehensive guide to TypeScript...', true,
 ARRAY['tech', 'tutorial', 'typescript'], 
 ARRAY[5, 4, 5, 4, 5]),

-- Post 2: Database article
(2, 'PostgreSQL Array Operations', 'Learn how to use PostgreSQL arrays...', true,
 ARRAY['database', 'postgresql', 'tutorial'], 
 ARRAY[4, 5, 4, 5]),

-- Post 3: Frontend development
(3, 'React vs Vue Comparison', 'Comparing modern frontend frameworks...', true,
 ARRAY['frontend', 'react', 'vue', 'comparison'], 
 ARRAY[4, 4, 5, 3, 4]),

-- Post 4: DevOps guide
(4, 'Docker Best Practices', 'Essential Docker practices for production...', true,
 ARRAY['devops', 'docker', 'production'], 
 ARRAY[5, 5, 4, 5]),

-- Post 5: Beginner guide
(5, 'HTML Basics for Beginners', 'Learn HTML from scratch...', true,
 ARRAY['beginner', 'html', 'tutorial'], 
 ARRAY[3, 4, 3, 4]),

-- Post 6: Unpublished draft
(6, 'Advanced Java Concepts', 'Deep dive into Java internals...', false,
 ARRAY['java', 'advanced', 'programming'], 
 ARRAY[4, 5]),

-- Post 7: Post with empty arrays
(7, 'Untitled Draft', 'Work in progress...', false,
 ARRAY[]::TEXT[], 
 ARRAY[]::INTEGER[]),

-- Post 8: Single category post
(8, 'Go Programming Introduction', 'Introduction to Go language...', true,
 ARRAY['go'], 
 ARRAY[4]),

-- Post 9: Post with duplicate categories
(9, 'JavaScript Tips and Tricks', 'Useful JavaScript techniques...', true,
 ARRAY['javascript', 'tips', 'javascript', 'frontend'], 
 ARRAY[5, 4, 5, 4, 3]),

-- Post 10: Multi-category post
(10, 'Full-Stack Development Guide', 'Complete guide to full-stack development...', true,
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

-- Insert JSONB test data for existing tests
INSERT INTO jsonb_users (name, email, settings, metadata) VALUES
('JSONB User 1', 'jsonb1@example.com', 
 '{"theme": "dark", "notifications": {"email": true, "push": false}, "language": "en", "features": ["beta", "advanced"]}',
 '{"role": "admin", "department": "engineering"}'),
('JSONB User 2', 'jsonb2@example.com', 
 '{"theme": "light", "notifications": {"email": false, "push": true}, "language": "es", "features": ["basic"]}',
 '{"role": "user", "department": "marketing"}');

INSERT INTO jsonb_products (name, attributes, analytics) VALUES
('Product 1', 
 '{"color": "red", "size": "large", "price": 99.99, "tags": ["featured", "sale"], "sale": true}',
 '{"views": 1500, "clicks": 120, "conversions": 15, "revenue": 1499.85}'),
('Product 2', 
 '{"color": "blue", "size": "medium", "price": 79.99, "tags": ["new"], "featured": true}',
 '{"views": 800, "clicks": 65, "conversions": 8, "revenue": 639.92}');

-- Create indexes for better performance in tests
CREATE INDEX idx_users_tags_gin ON users USING GIN (tags);
CREATE INDEX idx_users_permissions_gin ON users USING GIN (permissions);
CREATE INDEX idx_users_scores_gin ON users USING GIN (scores);
CREATE INDEX idx_posts_categories_gin ON posts USING GIN (categories);
CREATE INDEX idx_posts_ratings_gin ON posts USING GIN (ratings);

-- Create additional indexes for performance testing
CREATE INDEX idx_users_active ON users (active);
CREATE INDEX idx_posts_published ON posts (published);
CREATE INDEX idx_users_created_at ON users (created_at);
CREATE INDEX idx_posts_created_at ON posts (created_at);

-- Analyze tables for better query planning
ANALYZE users;
ANALYZE posts;
ANALYZE comments;
ANALYZE jsonb_users;
ANALYZE jsonb_products; 