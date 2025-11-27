/**
 * Benchmark script to measure TypeScript compilation time for generated Effect types
 *
 * This measures the time it takes `tsc --noEmit` to type-check the generated code,
 * which is the key metric we're trying to optimize.
 */

import { spawn } from "child_process";
import { readFileSync, statSync, existsSync } from "fs";
import { join } from "path";

const BENCHMARK_DIR = import.meta.dirname;
const EFFECT_FILE = join(BENCHMARK_DIR, "generated/effect/index.ts");
const CLIENT_DIR = join(BENCHMARK_DIR, "generated/client");

interface BenchmarkResult {
  tscTimeMs: number;
  effectFileLines: number;
  effectFileSize: number;
  modelCount: number;
  success: boolean;
  error?: string;
}

function countModels(): number {
  const schemaPath = join(BENCHMARK_DIR, "schema.prisma");
  const schema = readFileSync(schemaPath, "utf-8");
  const matches = schema.match(/^model\s+\w+/gm);
  return matches?.length ?? 0;
}

function getFileStats(filePath: string): { lines: number; size: number } {
  if (!existsSync(filePath)) {
    return { lines: 0, size: 0 };
  }
  const content = readFileSync(filePath, "utf-8");
  const lines = content.split("\n").length;
  const size = statSync(filePath).size;
  return { lines, size };
}

async function runTsc(): Promise<{ timeMs: number; success: boolean; error?: string }> {
  return new Promise((resolve) => {
    const startTime = performance.now();

    const tsc = spawn("npx", ["tsc", "--noEmit"], {
      cwd: BENCHMARK_DIR,
      stdio: ["ignore", "pipe", "pipe"],
      shell: true,
    });

    let stderr = "";
    tsc.stderr.on("data", (data) => {
      stderr += data.toString();
    });

    tsc.on("close", (code) => {
      const endTime = performance.now();
      const timeMs = endTime - startTime;

      resolve({
        timeMs,
        success: code === 0,
        error: code !== 0 ? stderr : undefined,
      });
    });

    tsc.on("error", (err) => {
      const endTime = performance.now();
      resolve({
        timeMs: endTime - startTime,
        success: false,
        error: err.message,
      });
    });
  });
}

async function runBenchmark(): Promise<BenchmarkResult> {
  // Check if generated files exist
  if (!existsSync(EFFECT_FILE)) {
    console.error("Error: Generated effect file not found. Run 'npm run generate' first.");
    return {
      tscTimeMs: 0,
      effectFileLines: 0,
      effectFileSize: 0,
      modelCount: 0,
      success: false,
      error: "Generated files not found",
    };
  }

  if (!existsSync(CLIENT_DIR)) {
    console.error("Error: Generated client directory not found. Run 'npm run generate' first.");
    return {
      tscTimeMs: 0,
      effectFileLines: 0,
      effectFileSize: 0,
      modelCount: 0,
      success: false,
      error: "Generated client not found",
    };
  }

  const modelCount = countModels();
  const { lines: effectFileLines, size: effectFileSize } = getFileStats(EFFECT_FILE);

  console.log("=".repeat(60));
  console.log("EFFECT-PRISMA GENERATOR BENCHMARK");
  console.log("=".repeat(60));
  console.log(`Models in schema: ${modelCount}`);
  console.log(`Generated effect file: ${effectFileLines.toLocaleString()} lines (${(effectFileSize / 1024).toFixed(1)} KB)`);
  console.log("-".repeat(60));
  console.log("Running TypeScript type-check (tsc --noEmit)...");
  console.log();

  // Run tsc multiple times and take the average
  const runs = 3;
  const times: number[] = [];
  let lastResult = { success: true, error: undefined as string | undefined };

  for (let i = 0; i < runs; i++) {
    process.stdout.write(`  Run ${i + 1}/${runs}: `);
    const result = await runTsc();
    times.push(result.timeMs);
    lastResult = result;
    console.log(`${(result.timeMs / 1000).toFixed(2)}s ${result.success ? "✓" : "✗"}`);
  }

  const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
  const minTime = Math.min(...times);
  const maxTime = Math.max(...times);

  console.log();
  console.log("-".repeat(60));
  console.log("RESULTS");
  console.log("-".repeat(60));
  console.log(`Average tsc time: ${(avgTime / 1000).toFixed(2)}s`);
  console.log(`Min time:         ${(minTime / 1000).toFixed(2)}s`);
  console.log(`Max time:         ${(maxTime / 1000).toFixed(2)}s`);
  console.log(`Lines per second: ${Math.round(effectFileLines / (avgTime / 1000)).toLocaleString()}`);
  console.log("=".repeat(60));

  if (!lastResult.success && lastResult.error) {
    console.log("\nType errors detected:");
    console.log(lastResult.error);
  }

  return {
    tscTimeMs: avgTime,
    effectFileLines,
    effectFileSize,
    modelCount,
    success: lastResult.success,
    error: lastResult.error,
  };
}

// Run the benchmark
runBenchmark()
  .then((result) => {
    // Output JSON result for CI/automation
    if (process.env.JSON_OUTPUT) {
      console.log("\n" + JSON.stringify(result, null, 2));
    }
    process.exit(result.success ? 0 : 1);
  })
  .catch((err) => {
    console.error("Benchmark failed:", err);
    process.exit(1);
  });
