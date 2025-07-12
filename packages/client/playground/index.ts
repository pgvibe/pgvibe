import { qb } from "../src/index.js";

const demo5 = await qb
  .selectFrom("users as u")
  .innerJoin("posts as pasta", "u.id", "pasta.user_id")
  .leftJoin("comments as c", "pasta.id", "c.post_id")
  .select(["u.name", "pasta.title as ttiii", "c.content", "c.user_id"])
  .execute();

// TypeScript correctly infers the type of demo5:
// { name: string, ttiii: string, content: string | null, user_id: number | null }[]
type Demo5Type = typeof demo5;
// ^? { name: string, ttiii: string, content: string | null, user_id: number | null }[]

// You can access the properties with full type safety:
if (demo5[0]) {
  console.log("Result:");
  console.log("  name:", demo5[0].name);         // string
  console.log("  ttiii:", demo5[0].ttiii);       // string (aliased from pasta.title)
  console.log("  content:", demo5[0].content);   // string | null
  console.log("  user_id:", demo5[0].user_id);   // number | null
}
