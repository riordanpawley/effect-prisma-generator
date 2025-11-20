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

const program = Effect.gen(function* () {
  const fs = yield* FileSystem.FileSystem;
  const clean = process.argv.includes("--clean");

  const distExists = yield* fs.exists("dist/");
  if (clean || !distExists) {
    yield* run("npm", "run", "build");
  }
  if (clean) {
    yield* run("tsc", "--noEmit", "--project", "tsconfig.test.json");
  }
  const dbExists = yield* fs.exists("tests/dev.db");
  if (clean || !dbExists) {
    yield* run("prisma", "db", "push", "--schema=tests/schema.prisma");
  }
  yield* run("vitest", "run");
}).pipe(
  Effect.ensuring(
    process.argv.includes("--keep-db")
      ? Effect.void
      : Effect.ignore(run("rm", "-r", "tests/dev.db")),
  ),
);

NodeRuntime.runMain(
  Effect.scoped(program.pipe(Effect.provide(NodeContext.layer))),
);
