import { Command, FileSystem } from "@effect/platform";
import { NodeContext, NodeRuntime } from "@effect/platform-node";
import { Console, Effect } from "effect";

const run = (cmd: string, ...args: string[]) =>
  Effect.gen(function* () {
    yield* Console.log(cmd, ...args);
    const exitCode = yield* Command.make(cmd, ...args).pipe(
      Command.stdout("inherit"),
      Command.stderr("inherit"),
      Command.exitCode,
    );
    if (exitCode !== 0) {
      yield* Effect.fail(
        new Error(`Command failed with exit code ${exitCode}`),
      );
    }
  });

const runInDir = (dir: string, cmd: string, ...args: string[]) =>
  Effect.gen(function* () {
    yield* Console.log(`[${dir}]`, cmd, ...args);
    const exitCode = yield* Command.make(cmd, ...args).pipe(
      Command.workingDirectory(dir),
      Command.stdout("inherit"),
      Command.stderr("inherit"),
      Command.exitCode,
    );
    if (exitCode !== 0) {
      yield* Effect.fail(
        new Error(`Command failed with exit code ${exitCode}`),
      );
    }
  });

const runPrisma6Tests = Effect.gen(function* () {
  yield* Console.log("\n=== Running Prisma 6 Tests ===\n");
  const fs = yield* FileSystem.FileSystem;
  const clean = process.argv.includes("--clean");

  // Install deps if needed
  const nodeModulesExists = yield* fs.exists("tests/prisma6/node_modules");
  if (!nodeModulesExists) {
    yield* runInDir("tests/prisma6", "npm", "install");
  }

  // Push DB schema
  const dbExists = yield* fs.exists("tests/prisma6/dev.db");
  if (clean || !dbExists) {
    yield* runInDir("tests/prisma6", "npx", "prisma", "db", "push");
  }

  // Generate Prisma client and Effect wrapper
  yield* runInDir("tests/prisma6", "npx", "prisma", "generate");

  // Run tests
  yield* runInDir("tests/prisma6", "npx", "vitest", "run");
}).pipe(
  Effect.ensuring(
    process.argv.includes("--keep-db")
      ? Effect.void
      : Effect.ignore(run("rm", "-rf", "tests/prisma6/dev.db")),
  ),
);

const runPrisma7Tests = Effect.gen(function* () {
  yield* Console.log("\n=== Running Prisma 7 Tests ===\n");
  const fs = yield* FileSystem.FileSystem;
  const clean = process.argv.includes("--clean");

  // Install deps if needed
  const nodeModulesExists = yield* fs.exists("tests/prisma7/node_modules");
  if (!nodeModulesExists) {
    yield* runInDir("tests/prisma7", "npm", "install");
  }

  // Push DB schema
  const dbExists = yield* fs.exists("tests/prisma7/dev.db");
  if (clean || !dbExists) {
    yield* runInDir("tests/prisma7", "npx", "prisma", "db", "push");
  }

  // Generate Prisma client and Effect wrapper
  yield* runInDir("tests/prisma7", "npx", "prisma", "generate");

  // Run tests
  yield* runInDir("tests/prisma7", "npx", "vitest", "run");
}).pipe(
  Effect.ensuring(
    process.argv.includes("--keep-db")
      ? Effect.void
      : Effect.ignore(run("rm", "-rf", "tests/prisma7/dev.db")),
  ),
);

const program = Effect.gen(function* () {
  const fs = yield* FileSystem.FileSystem;
  const clean = process.argv.includes("--clean");
  const prisma7Only = process.argv.includes("--prisma7");
  const prisma6Only = process.argv.includes("--prisma6");

  // Build generator
  const distExists = yield* fs.exists("dist/");
  if (clean || !distExists) {
    yield* run("npm", "run", "build");
  }
  if (clean) {
    yield* run("tsc", "--noEmit", "--project", "tsconfig.test.json");
  }

  // Run tests based on flags
  if (prisma7Only) {
    yield* runPrisma7Tests;
  } else if (prisma6Only) {
    yield* runPrisma6Tests;
  } else {
    // Run both
    yield* runPrisma6Tests;
    yield* runPrisma7Tests;
  }
});

NodeRuntime.runMain(
  Effect.scoped(program.pipe(Effect.provide(NodeContext.layer))),
);
