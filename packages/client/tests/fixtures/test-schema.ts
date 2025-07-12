// Simple test schema for refactor
// Based on DESIGN.md test schema definition

export interface TestDB {
  users: {
    id: number;
    name: string;
    email: string | null;
    active: boolean;
  };
  posts: {
    id: number;
    user_id: number;
    title: string;
    content: string;
    published: boolean;
  };
  comments: {
    id: number;
    post_id: number;
    user_id: number;
    content: string;
  };
}