// Advanced Query Examples for PGVibe Query Builder

import { pgvibe } from "@pgvibe/client";

// Define individual table schemas
export interface Users {
  id: number;
  name: string;
  email: string;
  active: boolean;
  created_at: Date;
}

export interface Posts {
  id: number;
  user_id: number;
  title: string;
  content: string;
  published: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface Comments {
  id: number;
  post_id: number;
  user_id: number;
  content: string;
  created_at: Date;
}

export interface Categories {
  id: number;
  name: string;
  description: string;
}

export interface PostCategories {
  post_id: number;
  category_id: number;
}

// Compose them into an advanced database schema
interface AdvancedDatabase {
  users: Users;
  posts: Posts;
  comments: Comments;
  categories: Categories;
  post_categories: PostCategories;
}

const db = pgvibe<AdvancedDatabase>();

async function advancedExamples() {
  
  // ===== COMPLEX JOIN PATTERNS =====
  
  // Many-to-many relationships through junction table
  const postsWithCategories = await db
    .selectFrom("posts as p")
    .innerJoin("post_categories as pc", "p.id", "pc.post_id")
    .innerJoin("categories as c", "pc.category_id", "c.id")
    .innerJoin("users as u", "p.user_id", "u.id")
    .select([
      "p.title as postTitle",
      "u.name as authorName",
      "c.name as categoryName",
      "p.published",
      "p.created_at as publishedDate"
    ])
    .execute();
  
  // Self-referencing with multiple aliases
  const userActivitySummary = await db
    .selectFrom("users as u")
    .leftJoin("posts as p", "u.id", "p.user_id")
    .leftJoin("comments as c", "u.id", "c.user_id")
    .select([
      "u.name",
      "u.email",
      "p.title as latestPost",      // nullable
      "c.content as latestComment", // nullable
      "u.created_at as memberSince"
    ])
    .execute();
  
  // ===== COMPLEX COLUMN SELECTIONS =====
  
  // Mix of qualified, unqualified, and aliased columns
  const detailedPostView = await db
    .selectFrom("posts as p")
    .innerJoin("users as author", "p.user_id", "author.id")
    .leftJoin("comments as c", "p.id", "c.post_id")
    .leftJoin("users as commenter", "c.user_id", "commenter.id")
    .select([
      "p.id",                           // unqualified
      "p.title as postTitle",           // qualified with alias
      "author.name as authorName",      // different table alias
      "author.email as authorEmail",
      "c.content as commentText",       // nullable from LEFT JOIN
      "commenter.name as commenterName", // nullable from LEFT JOIN
      "published",                      // unqualified (from posts)
      "p.created_at as publishedAt"
    ])
    .execute();
  
  // ===== HANDLING NULLABLE COLUMNS =====
  
  // Demonstrate proper typing of nullable columns from LEFT JOINs
  const usersWithOptionalPosts = await db
    .selectFrom("users as u")
    .leftJoin("posts as p", "u.id", "p.user_id")
    .select([
      "u.id as userId",
      "u.name as userName",
      "p.title as postTitle",     // string | null
      "p.published as isPublished" // boolean | null
    ])
    .execute();
  
  // TypeScript will enforce proper null checking
  usersWithOptionalPosts.forEach(row => {
    console.log(`User: ${row.userName}`);
    
    // TypeScript knows these might be null
    if (row.postTitle) {
      console.log(`Latest post: ${row.postTitle}`);
    } else {
      console.log("No posts found");
    }
    
    // Type assertion needed for boolean | null
    if (row.isPublished !== null) {
      console.log(`Published: ${row.isPublished}`);
    }
  });
  
  // ===== REAL-WORLD QUERY PATTERNS =====
  
  // Blog dashboard query
  const blogDashboard = await db
    .selectFrom("users as u")
    .leftJoin("posts as p", "u.id", "p.user_id")
    .leftJoin("comments as c", "p.id", "c.post_id")
    .select([
      "u.id as authorId",
      "u.name as authorName",
      "u.email as authorEmail",
      "p.id as postId",
      "p.title as postTitle",
      "p.published as isPublished",
      "p.created_at as postDate",
      "c.id as commentId",
      "c.content as commentText",
      "c.created_at as commentDate"
    ])
    .execute();
  
  // Content moderation query
  const contentForReview = await db
    .selectFrom("posts as p")
    .innerJoin("users as u", "p.user_id", "u.id")
    .leftJoin("comments as c", "p.id", "c.post_id")
    .leftJoin("users as commenter", "c.user_id", "commenter.id")
    .select([
      "p.id as postId",
      "p.title",
      "p.content as postContent",
      "u.name as authorName",
      "c.id as commentId",
      "c.content as commentContent",
      "commenter.name as commenterName"
    ])
    .execute();
  
  // User engagement analytics
  const userEngagement = await db
    .selectFrom("users as u")
    .leftJoin("posts as authored_posts", "u.id", "authored_posts.user_id")
    .leftJoin("comments as user_comments", "u.id", "user_comments.user_id")
    .select([
      "u.id",
      "u.name",
      "u.email",
      "authored_posts.title as latestPostTitle",
      "authored_posts.created_at as lastPostDate",
      "user_comments.content as latestComment",
      "user_comments.created_at as lastCommentDate"
    ])
    .execute();
  
  // ===== SQL GENERATION =====
  
  // Generate SQL without executing
  const sqlQuery = db
    .selectFrom("users as u")
    .innerJoin("posts as p", "u.id", "p.user_id")
    .select(["u.name", "p.title"])
    .toSQL();
  
  console.log("Generated SQL:", sqlQuery);
  // Output: "SELECT u.name, p.title FROM users AS u INNER JOIN posts AS p ON u.id = p.user_id"
  
  console.log("Advanced examples completed!");
}

// Run examples
advancedExamples().catch(console.error);