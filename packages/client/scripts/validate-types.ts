// This script validates that our TypeScript types actually work
// by testing both successful compilation and compilation failures

import { execSync } from "child_process";
import { writeFileSync, unlinkSync } from "fs";

// Test cases that SHOULD compile
const validTests = `
import { QueryBuilder } from "./src/query-builder";
import { TestDB } from "./tests/__shared__/fixtures/test-schema";

const qb = new QueryBuilder<TestDB>();

// These should all work:
const valid1 = qb.selectFrom("users");
const valid2 = qb.selectFrom("posts");  
const valid3 = qb.selectFrom("comments");
const valid4 = qb.selectFrom("users as u");
const valid5 = qb.selectFrom("posts as p");

const select1 = qb.selectFrom("users").select(["id", "name"]);
const select2 = qb.selectFrom("posts").select(["title"]);
const select3 = qb.selectFrom("users as u").select(["u.id", "u.name"]);

const join1 = qb.selectFrom("users as u").innerJoin("posts as p", "u.id", "p.user_id");
const join2 = qb.selectFrom("users").innerJoin("posts", "users.id", "posts.user_id");
`;

// Test cases that SHOULD fail compilation
const invalidTests = `
import { QueryBuilder } from "./src/query-builder";
import { TestDB } from "./tests/__shared__/fixtures/test-schema";

const qb = new QueryBuilder<TestDB>();

// These should cause compilation errors:
const invalid1 = qb.selectFrom("invalid_table");
const invalid2 = qb.selectFrom("user");
const invalid3 = qb.selectFrom("");
const invalid4 = qb.selectFrom(null);

const selectInvalid1 = qb.selectFrom("users").select(["invalid_column"]);
const selectInvalid2 = qb.selectFrom("users").select(["nam"]); // typo
const selectInvalid3 = qb.selectFrom("users").select(["title"]); // wrong table
const selectInvalid4 = qb.selectFrom("users as u").select(["users.id"]); // alias violation

const joinInvalid1 = qb.selectFrom("users as u").innerJoin("invalid_table as i", "u.id", "i.user_id");
const joinInvalid2 = qb.selectFrom("users as u").innerJoin("posts as p", "u.invalid", "p.user_id");
`;

function testCompilation(code: string, shouldFail: boolean = false): boolean {
  const tempFile = `temp-type-test-${Date.now()}.ts`;
  
  try {
    writeFileSync(tempFile, code);
    execSync(`bunx tsc --noEmit --skipLibCheck ${tempFile}`, { stdio: 'pipe' });
    
    if (shouldFail) {
      console.error(`❌ Expected compilation to fail, but it succeeded`);
      return false;
    } else {
      console.log(`✅ Valid code compiled successfully`);
      return true;
    }
  } catch (error) {
    if (shouldFail) {
      console.log(`✅ Invalid code correctly failed compilation`);
      return true;
    } else {
      console.error(`❌ Expected compilation to succeed, but it failed:`);
      console.error(error.stdout?.toString() || error.message);
      return false;
    }
  } finally {
    try { unlinkSync(tempFile); } catch {}
  }
}

console.log("Testing TypeScript type validation...\n");

console.log("1. Testing valid TypeScript code:");
const validResult = testCompilation(validTests, false);

console.log("\n2. Testing invalid TypeScript code:");  
const invalidResult = testCompilation(invalidTests, true);

console.log(`\nResults: ${validResult && invalidResult ? '✅ All tests passed' : '❌ Some tests failed'}`);

if (!validResult || !invalidResult) {
  process.exit(1);
}