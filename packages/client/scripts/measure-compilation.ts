#!/usr/bin/env bun
// Script to measure TypeScript compilation performance

import { spawn } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(spawn);

interface BenchmarkResult {
  name: string;
  timeMs: number;
  success: boolean;
  errors?: string;
}

async function measureCompilation(
  file: string, 
  name: string,
  iterations = 3
): Promise<BenchmarkResult> {
  console.log(`\n📊 Measuring compilation time for ${name}...`);
  
  const times: number[] = [];
  let lastError = '';
  
  for (let i = 0; i < iterations; i++) {
    const start = performance.now();
    
    try {
      const result = spawn('npx', ['tsc', '--noEmit', '--skipLibCheck', file], {
        stdio: 'pipe'
      });
      
      await new Promise((resolve, reject) => {
        let stderr = '';
        
        result.stderr?.on('data', (data) => {
          stderr += data.toString();
        });
        
        result.on('close', (code) => {
          if (code === 0) {
            resolve(void 0);
          } else {
            lastError = stderr;
            reject(new Error(`Compilation failed: ${stderr}`));
          }
        });
      });
      
      const end = performance.now();
      times.push(end - start);
      
    } catch (error) {
      console.error(`❌ Compilation failed on iteration ${i + 1}:`, error);
      return {
        name,
        timeMs: 0,
        success: false,
        errors: lastError
      };
    }
  }
  
  const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
  console.log(`✅ ${name}: ${avgTime.toFixed(2)}ms average (${times.length} iterations)`);
  
  return {
    name,
    timeMs: avgTime,
    success: true
  };
}

async function runBenchmarks() {
  console.log('🚀 Starting TypeScript compilation benchmarks...');
  
  const benchmarks = [
    {
      file: 'tests/benchmarks/type-performance.test-d.ts',
      name: 'Type Performance Tests'
    },
    {
      file: 'tests/benchmarks/compilation-benchmark.ts',
      name: 'Compilation Stress Test'
    },
    {
      file: 'src/query-builder.ts',
      name: 'Core Query Builder'
    },
    {
      file: 'src/types/index.ts',
      name: 'Type Definitions'
    }
  ];
  
  const results: BenchmarkResult[] = [];
  
  for (const benchmark of benchmarks) {
    const result = await measureCompilation(benchmark.file, benchmark.name);
    results.push(result);
  }
  
  // Print summary
  console.log('\n📈 Compilation Performance Summary:');
  console.log('=====================================');
  
  results.forEach(result => {
    if (result.success) {
      const status = result.timeMs < 1000 ? '🟢' : result.timeMs < 3000 ? '🟡' : '🔴';
      console.log(`${status} ${result.name}: ${result.timeMs.toFixed(2)}ms`);
    } else {
      console.log(`❌ ${result.name}: FAILED`);
      if (result.errors) {
        console.log(`   Error: ${result.errors.slice(0, 100)}...`);
      }
    }
  });
  
  // Performance thresholds
  const slowThreshold = 2000; // 2 seconds
  const slowResults = results.filter(r => r.success && r.timeMs > slowThreshold);
  
  if (slowResults.length > 0) {
    console.log('\n⚠️  Slow compilation detected:');
    slowResults.forEach(r => {
      console.log(`   - ${r.name}: ${r.timeMs.toFixed(2)}ms`);
    });
  } else {
    console.log('\n✅ All compilations are performing well!');
  }
  
  // Generate JSON report for CI
  const report = {
    timestamp: new Date().toISOString(),
    results,
    summary: {
      total: results.length,
      passed: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length,
      avgTime: results.filter(r => r.success)
        .reduce((sum, r) => sum + r.timeMs, 0) / results.filter(r => r.success).length
    }
  };
  
  await Bun.write('benchmark-results.json', JSON.stringify(report, null, 2));
  console.log('\n📄 Results saved to benchmark-results.json');
}

// Add package.json script command
async function updatePackageJson() {
  try {
    const packageJson = await Bun.file('package.json').json();
    
    if (!packageJson.scripts['benchmark:compilation']) {
      packageJson.scripts['benchmark:compilation'] = 'bun run scripts/measure-compilation.ts';
      await Bun.write('package.json', JSON.stringify(packageJson, null, 2));
      console.log('✅ Added benchmark:compilation script to package.json');
    }
  } catch (error) {
    console.log('ℹ️  Could not update package.json:', error);
  }
}

if (import.meta.main) {
  await updatePackageJson();
  await runBenchmarks();
}