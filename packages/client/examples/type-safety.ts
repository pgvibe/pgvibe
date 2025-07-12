// TypeScript Type Safety Examples for PGVibe Query Builder

import { pgvibe } from "@pgvibe/client";

// Individual table schemas for reusability
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

// Compose into database schema
interface TypeSafetyDemo {
  users: Users;
  posts: Posts;
}

const db = pgvibe<TypeSafetyDemo>();

// ===== TYPESCRIPT AUTOCOMPLETE EXAMPLES =====

function autocompleteExamples() {
  // 1. Table name autocomplete
  // When you type db.selectFrom("") and press Ctrl+Space, you'll see:
  // "users", "posts"
  const tableExample = db.selectFrom("users");
  
  // 2. Column name autocomplete  
  // When you type .select([""]) and press Ctrl+Space, you'll see:
  // "id", "name", "email", "active"
  const columnExample = db.selectFrom("users").select(["id", "name"]);
  
  // 3. Qualified column autocomplete with aliases
  // After aliasing "users as u", you'll see:
  // "u.id", "u.name", "u.email", "u.active", "id", "name", "email", "active"
  const aliasExample = db.selectFrom("users as u").select(["u.name", "email"]);
  
  // 4. JOIN column autocomplete
  // After joining tables, autocomplete shows columns from both tables
  const joinExample = db
    .selectFrom("users as u")
    .innerJoin("posts as p", "u.id", "p.user_id")
    .select(["u.name", "p.title", "published"]); // All valid options
}

// ===== COMPILE-TIME ERROR PREVENTION =====

function errorPreventionExamples() {
  // ✅ THESE WORK (no TypeScript errors)
  
  db.selectFrom("users");                    // Valid table
  db.selectFrom("posts");                    // Valid table
  db.selectFrom("users as u");               // Valid alias
  
  db.selectFrom("users").select(["id", "name"]); // Valid columns
  db.selectFrom("users as u").select(["u.id"]);  // Valid qualified column
  db.selectFrom("users as u").select(["id"]);    // Valid unqualified column
  
  // Valid JOIN
  db.selectFrom("users as u")
    .innerJoin("posts as p", "u.id", "p.user_id");
  
  // ❌ THESE CAUSE TYPESCRIPT ERRORS (uncomment to see)
  
  // Invalid table names
  // db.selectFrom("invalid_table");              // Error: table doesn't exist
  // db.selectFrom("user");                       // Error: should be "users"
  
  // Invalid column names  
  // db.selectFrom("users").select(["invalid"]);  // Error: column doesn't exist
  // db.selectFrom("users").select(["title"]);    // Error: title is in posts, not users
  
  // Alias exclusivity violations
  // db.selectFrom("users as u").select(["users.id"]); // Error: can't use original name after aliasing
  
  // Invalid JOIN columns
  // db.selectFrom("users as u")
  //   .innerJoin("posts as p", "u.invalid", "p.user_id"); // Error: u.invalid doesn't exist
  
  // Columns from non-joined tables
  // db.selectFrom("users").select(["posts.title"]); // Error: posts not joined
}

// ===== RESULT TYPE INFERENCE =====

async function typeInferenceExamples() {
  // TypeScript automatically infers the correct result types
  
  // Basic query - infers { id: number, name: string }[]
  const basicResult = await db
    .selectFrom("users")
    .select(["id", "name"])
    .execute();
  
  // TypeScript knows the exact shape
  if (basicResult[0]) {
    const id: number = basicResult[0].id;     // ✅ number
    const name: string = basicResult[0].name; // ✅ string
    // const email = basicResult[0].email;    // ❌ Error: email not selected
  }
  
  // With aliases - infers { userId: number, userName: string }[]
  const aliasedResult = await db
    .selectFrom("users")
    .select(["id as userId", "name as userName"])
    .execute();
  
  if (aliasedResult[0]) {
    const userId: number = aliasedResult[0].userId;     // ✅ Renamed property
    const userName: string = aliasedResult[0].userName; // ✅ Renamed property
    // const id = aliasedResult[0].id;                  // ❌ Error: property renamed
  }
  
  // INNER JOIN - all columns non-nullable
  const innerJoinResult = await db
    .selectFrom("users as u")
    .innerJoin("posts as p", "u.id", "p.user_id")
    .select(["u.name", "p.title"])
    .execute();
  
  if (innerJoinResult[0]) {
    const name: string = innerJoinResult[0].name;   // ✅ string (not nullable)
    const title: string = innerJoinResult[0].title; // ✅ string (not nullable)
  }
  
  // LEFT JOIN - joined columns become nullable
  const leftJoinResult = await db
    .selectFrom("users as u")
    .leftJoin("posts as p", "u.id", "p.user_id")
    .select(["u.name", "p.title"])
    .execute();
  
  if (leftJoinResult[0]) {
    const name: string = leftJoinResult[0].name;         // ✅ string (from base table)
    const title: string | null = leftJoinResult[0].title; // ✅ nullable (from LEFT JOIN)
    
    // TypeScript enforces null checking
    if (title !== null) {
      console.log(title.toUpperCase()); // ✅ Safe to call string methods
    }
  }
  
  // Complex query with multiple aliases and JOINs
  const complexResult = await db
    .selectFrom("users as u")
    .innerJoin("posts as p", "u.id", "p.user_id")
    .select([
      "u.id as authorId",
      "u.name as authorName", 
      "p.title as postTitle",
      "p.published as isPublished"
    ])
    .execute();
  
  // TypeScript infers the complete shape:
  // { authorId: number, authorName: string, postTitle: string, isPublished: boolean }[]
  
  if (complexResult[0]) {
    const { authorId, authorName, postTitle, isPublished } = complexResult[0];
    console.log(`Author ${authorName} (${authorId}) wrote "${postTitle}" (published: ${isPublished})`);
  }
}

// ===== PROGRESSIVE TYPE SAFETY =====

function progressiveTyping() {
  // TypeScript tracks available columns as you build the query
  
  // Step 1: Only users table available
  const step1 = db.selectFrom("users as u");
  // Available: u.id, u.name, u.email, u.active, id, name, email, active
  
  // Step 2: Add posts table
  const step2 = step1.innerJoin("posts as p", "u.id", "p.user_id");  
  // Available: u.*, p.*, and unqualified versions of all columns
  
  // Step 3: Select specific columns
  const step3 = step2.select(["u.name", "p.title"]);
  // Result type: { name: string, title: string }[]
  
  // Each step maintains type safety
  step1.select(["u.name"]);        // ✅ Valid
  // step1.select(["p.title"]);    // ❌ Error: posts not joined yet
  
  step2.select(["u.name", "p.title"]); // ✅ Valid  
  // step2.select(["invalid"]);         // ❌ Error: column doesn't exist
}

console.log("Type safety examples loaded! Check your IDE for autocomplete and error detection.");

export {};