import { qb } from "../src/index.js";

// Demo showing type inference with column aliases
async function typeDemo() {
  // Basic alias example
  const users = await qb
    .selectFrom("users")
    .select(["id as userId", "name as userName", "email"])
    .execute();
  
  // TypeScript infers: { userId: number, userName: string, email: string }[]
  console.log("User type:", users[0]?.userId, users[0]?.userName, users[0]?.email);
  
  // Complex JOIN with aliases - like demo5
  const demo5 = await qb
    .selectFrom("users as u")
    .innerJoin("posts as pasta", "u.id", "pasta.user_id")
    .leftJoin("comments as c", "pasta.id", "c.post_id")
    .select(["u.name", "pasta.title as ttiii", "c.content", "c.user_id"])
    .execute();
  
  // TypeScript infers: { name: string, ttiii: string, content: string | null, user_id: number | null }[]
  if (demo5[0]) {
    console.log("Demo5 type:");
    console.log("  name:", demo5[0].name); // string
    console.log("  ttiii:", demo5[0].ttiii); // string (aliased from pasta.title)
    console.log("  content:", demo5[0].content); // string | null (from LEFT JOIN)
    console.log("  user_id:", demo5[0].user_id); // number | null (from LEFT JOIN)
  }
  
  // More complex aliases
  const complexQuery = await qb
    .selectFrom("users as u")
    .innerJoin("posts as p", "u.id", "p.user_id")
    .leftJoin("comments as c", "p.id", "c.post_id")
    .select([
      "u.id as authorId",
      "u.name as authorName",
      "p.title as postTitle",
      "p.published as isPublished",
      "c.content as comment"
    ])
    .execute();
  
  // TypeScript infers all the renamed properties correctly
  if (complexQuery[0]) {
    console.log("Complex query type:");
    console.log("  authorId:", complexQuery[0].authorId); // number
    console.log("  authorName:", complexQuery[0].authorName); // string
    console.log("  postTitle:", complexQuery[0].postTitle); // string
    console.log("  isPublished:", complexQuery[0].isPublished); // boolean
    console.log("  comment:", complexQuery[0].comment); // string | null
  }
}

// Run the demo
typeDemo().catch(console.error);

export {};