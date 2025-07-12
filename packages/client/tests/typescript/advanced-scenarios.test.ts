import { test, expect } from "bun:test";
import { pgvibe } from "../../src/index";
import type { TestDB } from "../fixtures/test-schema";

/**
 * ADVANCED TYPESCRIPT SCENARIO TESTS
 * 
 * Tests complex real-world scenarios that push the type system to its limits
 */

test("ADVANCED: Self-referencing table joins", async () => {
  const db = pgvibe<TestDB>();

  // Simulate user following relationships (users following other users)
  const result = await db
    .selectFrom("users as follower")
    .innerJoin("users as followed", "follower.id", "followed.id") // Contrived join for testing
    .select([
      "follower.name as followerName",
      "followed.name as followedName",
      "follower.active as followerActive",
      "followed.email as followedEmail"
    ])
    .execute();

  if (result[0]) {
    const _followerName: string = result[0].followerName;
    const _followedName: string = result[0].followedName;
    const _followerActive: boolean = result[0].followerActive;
    const _followedEmail: string | null = result[0].followedEmail;
  }
});

test("ADVANCED: Complex business logic query with multiple conditions", async () => {
  const db = pgvibe<TestDB>();

  const result = await db
    .selectFrom("users as active_users")
    .innerJoin("posts as published_posts", "active_users.id", "published_posts.user_id")
    .leftJoin("comments as post_feedback", "published_posts.id", "post_feedback.post_id")
    .select([
      "active_users.id as userId",
      "active_users.name as authorName",
      "active_users.email as contactInfo",
      "published_posts.id as postId",
      "published_posts.title as postTitle",
      "published_posts.content as postBody",
      "published_posts.published as isLive",
      "post_feedback.id as commentId",
      "post_feedback.content as commentText",
      "post_feedback.user_id as commentAuthorId"
    ])
    .execute();

  if (result[0]) {
    // Base table fields (always present)
    const _userId: number = result[0].userId;
    const _authorName: string = result[0].authorName;
    const _contactInfo: string | null = result[0].contactInfo;
    
    // INNER JOIN fields (always present)
    const _postId: number = result[0].postId;
    const _postTitle: string = result[0].postTitle;
    const _postBody: string = result[0].postBody;
    const _isLive: boolean = result[0].isLive;
    
    // LEFT JOIN fields (nullable)
    const _commentId: number | null = result[0].commentId;
    const _commentText: string | null = result[0].commentText;
    const _commentAuthorId: number | null = result[0].commentAuthorId;
  }
});

test("ADVANCED: Reporting query with aggregation-style field naming", async () => {
  const db = pgvibe<TestDB>();

  const result = await db
    .selectFrom("users as u")
    .innerJoin("posts as p", "u.id", "p.user_id")
    .leftJoin("comments as c", "p.id", "c.post_id")
    .select([
      "u.id as user_id",
      "u.name as user_name",
      "u.email as user_email",
      "u.active as user_active",
      "p.id as post_id",
      "p.title as post_title",
      "p.content as post_content",
      "p.published as post_published",
      "c.id as comment_id",
      "c.content as comment_content",
      "c.user_id as comment_user_id"
    ])
    .execute();

  if (result[0]) {
    // User fields
    const _userId: number = result[0].user_id;
    const _userName: string = result[0].user_name;
    const _userEmail: string | null = result[0].user_email;
    const _userActive: boolean = result[0].user_active;
    
    // Post fields
    const _postId: number = result[0].post_id;
    const _postTitle: string = result[0].post_title;
    const _postContent: string = result[0].post_content;
    const _postPublished: boolean = result[0].post_published;
    
    // Comment fields (nullable from LEFT JOIN)
    const _commentId: number | null = result[0].comment_id;
    const _commentContent: string | null = result[0].comment_content;
    const _commentUserId: number | null = result[0].comment_user_id;
  }
});

test("ADVANCED: Analytics query with calculated field names", async () => {
  const db = pgvibe<TestDB>();

  const result = await db
    .selectFrom("posts as content")
    .innerJoin("users as creator", "content.user_id", "creator.id")
    .leftJoin("comments as engagement", "content.id", "engagement.post_id")
    .select([
      "content.id as content_id",
      "content.title as content_title",
      "creator.name as creator_name",
      "creator.active as creator_is_active",
      "engagement.content as engagement_text"
    ])
    .execute();

  if (result[0]) {
    const _contentId: number = result[0].content_id;
    const _contentTitle: string = result[0].content_title;
    const _creatorName: string = result[0].creator_name;
    const _creatorActive: boolean = result[0].creator_is_active;
    const _engagementText: string | null = result[0].engagement_text;
  }
});

test("ADVANCED: Cross-table relationship mapping", async () => {
  const db = pgvibe<TestDB>();

  // Simulate a complex many-to-many style query through posts
  const result = await db
    .selectFrom("users as author")
    .innerJoin("posts as authored_content", "author.id", "authored_content.user_id")
    .innerJoin("comments as reader_comments", "authored_content.id", "reader_comments.post_id")
    .innerJoin("users as reader", "reader_comments.user_id", "reader.id")
    .select([
      "author.id as author_id",
      "author.name as author_name",
      "authored_content.title as content_title",
      "reader.id as reader_id", 
      "reader.name as reader_name",
      "reader_comments.content as comment_text"
    ])
    .execute();

  if (result[0]) {
    const _authorId: number = result[0].author_id;
    const _authorName: string = result[0].author_name;
    const _contentTitle: string = result[0].content_title;
    const _readerId: number = result[0].reader_id;
    const _readerName: string = result[0].reader_name;
    const _commentText: string = result[0].comment_text;
  }
});

test("ADVANCED: Mixed selection patterns in complex query", async () => {
  const db = pgvibe<TestDB>();

  const result = await db
    .selectFrom("posts as p")
    .innerJoin("users as u", "p.user_id", "u.id")
    .leftJoin("comments as c", "p.id", "c.post_id")
    .select([
      // Mix of all possible patterns
      "p.id",                    // qualified, no alias
      "title",                   // unqualified, no alias (from posts)
      "u.name",                  // qualified, no alias
      "email",                   // unqualified, no alias (from users)
      "p.published as is_live",  // qualified with alias
      "active as user_active",   // unqualified with alias
      "c.content as feedback",   // qualified with alias from LEFT JOIN
      "content"                  // unqualified, no alias - this should pick up posts.content
    ])
    .execute();

  if (result[0]) {
    const _id: number = result[0].id;
    const _title: string = result[0].title;
    const _name: string = result[0].name;
    const _email: string | null = result[0].email;
    const _isLive: boolean = result[0].is_live;
    const _userActive: boolean = result[0].user_active;
    const _feedback: string | null = result[0].feedback; // LEFT JOIN = nullable
    const _content: string = result[0].content;
  }
});

test("ADVANCED: Stress test with maximum complexity", async () => {
  const db = pgvibe<TestDB>();

  const result = await db
    .selectFrom("users as primary_user")
    .innerJoin("posts as user_posts", "primary_user.id", "user_posts.user_id")
    .leftJoin("comments as post_comments", "user_posts.id", "post_comments.post_id")
    .innerJoin("users as comment_authors", "post_comments.user_id", "comment_authors.id")
    .select([
      "primary_user.id as original_author_id",
      "primary_user.name as original_author_name",
      "primary_user.email as original_author_email",
      "primary_user.active as original_author_active",
      "user_posts.id as post_id",
      "user_posts.title as post_title",
      "user_posts.content as post_content",
      "user_posts.published as post_is_published",
      "post_comments.id as comment_id",
      "post_comments.content as comment_content",
      "comment_authors.id as comment_author_id",
      "comment_authors.name as comment_author_name",
      "comment_authors.email as comment_author_email",
      "comment_authors.active as comment_author_active"
    ])
    .execute();

  if (result[0]) {
    // Original author (base table)
    const _originalAuthorId: number = result[0].original_author_id;
    const _originalAuthorName: string = result[0].original_author_name;
    const _originalAuthorEmail: string | null = result[0].original_author_email;
    const _originalAuthorActive: boolean = result[0].original_author_active;
    
    // Post (INNER JOIN)
    const _postId: number = result[0].post_id;
    const _postTitle: string = result[0].post_title;
    const _postContent: string = result[0].post_content;
    const _postPublished: boolean = result[0].post_is_published;
    
    // Comment (LEFT JOIN - nullable)
    const _commentId: number | null = result[0].comment_id;
    const _commentContent: string | null = result[0].comment_content;
    
    // Comment author (INNER JOIN but depends on LEFT JOIN - complex nullability)
    const _commentAuthorId: number | null = result[0].comment_author_id;
    const _commentAuthorName: string | null = result[0].comment_author_name;
    const _commentAuthorEmail: string | null = result[0].comment_author_email;
    const _commentAuthorActive: boolean | null = result[0].comment_author_active;
  }
});