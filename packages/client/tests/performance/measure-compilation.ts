// TypeScript Compilation Time Measurement Script
// Measures compilation performance with large schema vs small schema

import { performance } from "perf_hooks";
import { execSync } from "child_process";
import fs from "fs";
import path from "path";

/**
 * Utility to measure TypeScript compilation time
 */
function measureTypeScriptCompilation(testFile: string): {
  compilationTime: number;
  success: boolean;
  errors?: string;
} {
  const startTime = performance.now();

  try {
    // Run TypeScript compiler with no emit (type checking only)
    const result = execSync(`bunx tsc --noEmit ${testFile}`, {
      cwd: process.cwd(),
      encoding: "utf8",
      stdio: "pipe",
    });

    const endTime = performance.now();

    return {
      compilationTime: endTime - startTime,
      success: true,
    };
  } catch (error: any) {
    const endTime = performance.now();

    return {
      compilationTime: endTime - startTime,
      success: false,
      errors: error.stdout || error.stderr || error.message,
    };
  }
}

/**
 * Create small schema test file for baseline comparison
 */
function createSmallSchemaTest(): string {
  const smallTestContent = `
// Small Schema Baseline Test
import { pgvibe } from "../../src/query-builder";

interface SmallDatabase {
  users: {
    id: number;
    name: string;
    email: string;
    created_at: Date;
  };
  posts: {
    id: number;
    user_id: number;
    title: string;
    content: string;
    created_at: Date;
  };
}

const db = new pgvibe<SmallDatabase>({
  connectionString: "postgresql://test:test@localhost:54322/test"
});

// Simple queries for baseline
async function smallSchemaTest() {
  const users = await db.selectFrom("users").select(["id", "name"]).execute();
  const posts = await db.selectFrom("posts").select(["id", "title"]).execute();
  const joined = await db
    .selectFrom("users")
    .innerJoin("posts", "users.id", "posts.user_id")
    .select(["users.name", "posts.title"])
    .execute();
    
  return { users, posts, joined };
}

export { smallSchemaTest };
`;

  const testFile = path.join(__dirname, "small-schema-baseline.ts");
  fs.writeFileSync(testFile, smallTestContent);
  return testFile;
}

/**
 * Run comprehensive compilation benchmarks
 */
async function runCompilationBenchmarks() {
  console.log("🔄 Starting TypeScript Compilation Performance Benchmarks");
  console.log("=".repeat(60));

  // Create small schema baseline test
  const smallSchemaFile = createSmallSchemaTest();
  const largeSchemaFile = path.join(__dirname, "compilation-benchmark.ts");

  console.log("\n📊 Test Configuration:");
  console.log(`Small Schema: 2 tables, ~5 columns each`);
  console.log(`Large Schema: 33 tables, ~20 columns each`);
  console.log(
    `TypeScript Version: ${execSync("bunx tsc --version", {
      encoding: "utf8",
    }).trim()}`
  );

  // Warm up TypeScript compiler
  console.log("\n🔥 Warming up TypeScript compiler...");
  measureTypeScriptCompilation(smallSchemaFile);

  const results = {
    smallSchema: [] as number[],
    largeSchema: [] as number[],
  };

  const iterations = 5;

  // Benchmark small schema (baseline)
  console.log(
    `\n⏱️  Measuring Small Schema Compilation (${iterations} iterations):`
  );
  for (let i = 1; i <= iterations; i++) {
    const result = measureTypeScriptCompilation(smallSchemaFile);
    results.smallSchema.push(result.compilationTime);
    console.log(
      `  Run ${i}: ${result.compilationTime.toFixed(2)}ms ${
        result.success ? "✅" : "❌"
      }`
    );

    if (!result.success) {
      console.log(`    Errors: ${result.errors?.slice(0, 200)}...`);
    }
  }

  // Benchmark large schema
  console.log(
    `\n⏱️  Measuring Large Schema Compilation (${iterations} iterations):`
  );
  for (let i = 1; i <= iterations; i++) {
    const result = measureTypeScriptCompilation(largeSchemaFile);
    results.largeSchema.push(result.compilationTime);
    console.log(
      `  Run ${i}: ${result.compilationTime.toFixed(2)}ms ${
        result.success ? "✅" : "❌"
      }`
    );

    if (!result.success) {
      console.log(`    Errors: ${result.errors?.slice(0, 200)}...`);
    }
  }

  // Calculate statistics
  const calculateStats = (times: number[]) => {
    const avg = times.reduce((a, b) => a + b, 0) / times.length;
    const sorted = [...times].sort((a, b) => a - b);
    const median = sorted[Math.floor(sorted.length / 2)] || 0;
    const min = Math.min(...times);
    const max = Math.max(...times);
    return { avg, median, min, max };
  };

  const smallStats = calculateStats(results.smallSchema);
  const largeStats = calculateStats(results.largeSchema);

  // Performance analysis
  console.log("\n📈 Performance Analysis:");
  console.log("=".repeat(60));

  console.log("\n🏃‍♂️ Small Schema (Baseline):");
  console.log(`  Average: ${smallStats.avg.toFixed(2)}ms`);
  console.log(`  Median:  ${smallStats.median.toFixed(2)}ms`);
  console.log(`  Min:     ${smallStats.min.toFixed(2)}ms`);
  console.log(`  Max:     ${smallStats.max.toFixed(2)}ms`);

  console.log("\n🐘 Large Schema (33 tables):");
  console.log(`  Average: ${largeStats.avg.toFixed(2)}ms`);
  console.log(`  Median:  ${largeStats.median.toFixed(2)}ms`);
  console.log(`  Min:     ${largeStats.min.toFixed(2)}ms`);
  console.log(`  Max:     ${largeStats.max.toFixed(2)}ms`);

  // Performance comparison
  const performanceRatio = largeStats.avg / smallStats.avg;
  const slowdownMs = largeStats.avg - smallStats.avg;

  console.log("\n🔍 Performance Impact:");
  console.log(`  Performance Ratio: ${performanceRatio.toFixed(2)}x slower`);
  console.log(`  Absolute Slowdown: +${slowdownMs.toFixed(2)}ms`);

  // Performance verdict
  console.log("\n🏆 Performance Verdict:");
  if (performanceRatio < 2.0) {
    console.log(
      "  ✅ EXCELLENT - Large schema has minimal impact on compilation time"
    );
  } else if (performanceRatio < 3.0) {
    console.log(
      "  ⚡ GOOD - Reasonable performance impact for 16x larger schema"
    );
  } else if (performanceRatio < 5.0) {
    console.log(
      "  ⚠️  ACCEPTABLE - Noticeable but manageable performance impact"
    );
  } else {
    console.log("  ❌ CONCERNING - Significant performance degradation");
  }

  // Detailed recommendations
  if (performanceRatio >= 3.0) {
    console.log("\n💡 Recommendations:");
    console.log("  - Consider TypeScript optimization strategies");
    console.log("  - Test with TypeScript's incremental compilation");
    console.log("  - Monitor IDE responsiveness during development");
  }

  // Memory usage (basic estimation)
  const memoryEstimate = process.memoryUsage();
  console.log(`\n💾 Memory Usage (estimated):`);
  console.log(
    `  Heap Used: ${(memoryEstimate.heapUsed / 1024 / 1024).toFixed(2)} MB`
  );
  console.log(
    `  Heap Total: ${(memoryEstimate.heapTotal / 1024 / 1024).toFixed(2)} MB`
  );

  // Cleanup
  try {
    fs.unlinkSync(smallSchemaFile);
  } catch (e) {
    // Ignore cleanup errors
  }

  return {
    smallSchema: smallStats,
    largeSchema: largeStats,
    performanceRatio,
    slowdownMs,
  };
}

// CLI execution
if (require.main === module) {
  runCompilationBenchmarks()
    .then((results) => {
      console.log("\n✅ Benchmark completed successfully!");
      process.exit(0);
    })
    .catch((error) => {
      console.error("\n❌ Benchmark failed:", error.message);
      process.exit(1);
    });
}

export { runCompilationBenchmarks, measureTypeScriptCompilation };
