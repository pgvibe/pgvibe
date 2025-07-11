import { qb } from "../src/index.js";

const demo5 = await qb
  .selectFrom("users as u")
  .innerJoin("posts as pasta", "u.id", "pasta.user_id")
  .leftJoin("comments as c", "pasta.id", "c.post_id")
  .select(["u.name", "pasta.title as ttiii", "c.content", "c.user_id"])
  .execute();
