// Basic Usage Examples for PGVibe Query Builder

import { pgvibe } from "@pgvibe/client";

// Define individual table schemas
export interface Users {
  id: number;
  name: string;
  email: string;
  active: boolean;
}

export interface Posts {
  id: number;
  user_id: number;
  title: string;
  content: string;
  published: boolean;
}

export interface Comments {
  id: number;
  post_id: number;
  user_id: number;
  content: string;
}

// Compose them into a database schema
interface MyDatabase {
  users: Users;
  posts: Posts;
  comments: Comments;
}

// Create a query builder with your schema
const db = pgvibe<MyDatabase>();

async function basicExamples() {
  // ===== BASIC QUERIES =====
  
  // Select all columns
  const allUsers = await db
    .selectFrom("users")
    .execute(); // Returns all columns: { id, name, email, active }[]
  
  // Select specific columns
  const userNames = await db
    .selectFrom("users")
    .select(["id", "name"])
    .execute(); // Returns { id: number, name: string }[]
  
  // Select with column aliases
  const aliasedUsers = await db
    .selectFrom("users")
    .select([
      "id as userId",
      "name as userName",
      "email as userEmail"
    ])
    .execute(); // Returns { userId: number, userName: string, userEmail: string }[]
  
  // ===== TABLE ALIASES =====
  
  // Use table aliases for cleaner queries
  const usersWithAlias = await db
    .selectFrom("users as u")
    .select(["u.id", "u.name"])
    .execute(); // Returns { id: number, name: string }[]
  
  // Mix qualified and unqualified columns
  const mixedColumns = await db
    .selectFrom("users as u")
    .select(["u.id", "name", "email"]) // u.id is qualified, name and email are unqualified
    .execute();
  
  // ===== BASIC JOINS =====
  
  // Inner join users with their posts
  const userPosts = await db
    .selectFrom("users as u")
    .innerJoin("posts as p", "u.id", "p.user_id")
    .select([
      "u.name as authorName",
      "p.title as postTitle",
      "p.published"
    ])
    .execute(); // Returns { authorName: string, postTitle: string, published: boolean }[]
  
  // Left join to include users without posts
  const allUsersWithPosts = await db
    .selectFrom("users as u")
    .leftJoin("posts as p", "u.id", "p.user_id")
    .select([
      "u.name",
      "p.title" // This will be string | null due to LEFT JOIN
    ])
    .execute(); // Returns { name: string, title: string | null }[]
  
  // ===== MULTIPLE JOINS =====
  
  // Join users, posts, and comments
  const fullData = await db
    .selectFrom("users as u")
    .innerJoin("posts as p", "u.id", "p.user_id")
    .leftJoin("comments as c", "p.id", "c.post_id")
    .select([
      "u.name as author",
      "p.title as post",
      "c.content as comment" // nullable from LEFT JOIN
    ])
    .execute(); // Returns { author: string, post: string, comment: string | null }[]
  
  // Chain multiple operations
  const complexQuery = await db
    .selectFrom("users as u")
    .innerJoin("posts as p", "u.id", "p.user_id")
    .leftJoin("comments as c", "p.id", "c.post_id")
    .select([
      "u.id as userId",
      "u.name as userName",
      "p.id as postId", 
      "p.title as postTitle",
      "c.id as commentId",
      "c.content as commentText"
    ])
    .execute();
  
  console.log("Basic examples completed!");
}

// Run examples
basicExamples().catch(console.error);