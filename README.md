# Effect Prisma Generator

A Prisma generator that creates a fully-typed, Effect-based service wrapper for your Prisma Client.

## Features

- 🚀 **Effect Integration**: All Prisma operations are wrapped in `Effect` for robust error handling and composability.
- 🛡️ **Type Safety**: Full TypeScript support with generated types matching your Prisma schema.
- 🧩 **Dependency Injection**: Integrates seamlessly with Effect's `Layer` and `Context` system.
- 🔍 **Error Handling**: Automatically catches and wraps Prisma errors into a typed `PrismaError`.

## Installation

Install the generator as a development dependency:

```bash
npm install -D effect-prisma-generator
# or
pnpm add -D effect-prisma-generator
# or
yarn add -D effect-prisma-generator
```

## Configuration

Add the generator to your `schema.prisma` file:

```prisma
// prisma/schema.prisma
generator client {
  provider        = "prisma-client-js"
  output          = "./generated/client"
}

generator effect {
  provider = "effect-prisma-generator"
  output   = "./generated/effect" // relative to the schema.prisma file, e.g. prisma/generated/effect
  clientImportPath = "../client" // relative to the output path ^here (defaults to "@prisma/client")
}
```

Then run `prisma generate` to generate the client and the Effect service.

### Recommended

Add the following to your `tsconfig.json`:

```json
{
  "compilerOptions": {
    "paths": {
      "@prisma/*": ["./prisma/generated/*"]
    }
  }
}
```

Then you can import the generated types like this:

```typescript
import { PrismaService } from "@prisma/effect";
```

Otherwise, you can import the generated types like this (adjust the path accordingly):

```typescript
import { PrismaService } from "../../prisma/generated/effect";
```

## Usage

### 1. Provide the Layer

First, provide the `LivePrismaLayer` in your application entry point or test setup.

```typescript
import { LivePrismaLayer } from "@prisma/effect";
import { Effect, Layer } from "effect";

// ... in your program
const MainLayer = Layer.mergeAll(
  LivePrismaLayer,
  // ... other layers
);
```

### 2. Use the Service

Access the `PrismaService` in your Effect programs.

```typescript
import { PrismaService } from "./generated/effect";
import { Effect } from "effect";

const program = Effect.gen(function* () {
  const prisma = yield* PrismaService;

  // All standard Prisma operations are available
  const users = yield* prisma.user.findMany({
    where: { active: true },
    select: {
      id: true,
      accounts: {
        select: {
          id: true,
        },
      },
    },
  });
  // users: { id: string, accounts: { id: string }[] }[]

  return users;
});
```

## API

The generated `PrismaService` mirrors your Prisma Client API but returns `Effect<Success, PrismaError, Requirements>` instead of Promises.

### Error Handling

Operations return typed errors that you can handle with Effect's error handling utilities:

```typescript
import {
  PrismaService,
  PrismaUniqueConstraintError,
  PrismaRecordNotFoundError,
  PrismaForeignKeyConstraintError,
} from "@prisma/effect";

const program = Effect.gen(function* () {
  const prisma = yield* PrismaService;

  // Handle specific error types with catchTag
  const user = yield* prisma.user
    .create({ data: { email: "alice@example.com" } })
    .pipe(
      Effect.catchTag("PrismaUniqueConstraintError", (error) => {
        console.log(`Duplicate email: ${error.cause.code}`); // P2002
        return Effect.succeed(null);
      }),
    );

  // OrThrow methods return PrismaRecordNotFoundError
  const found = yield* prisma.user
    .findUniqueOrThrow({ where: { id: 999 } })
    .pipe(
      Effect.catchTag("PrismaRecordNotFoundError", () =>
        Effect.succeed(null),
      ),
    );
});
```

**Available error types:**

| Error Type | Prisma Code | When it occurs |
|------------|-------------|----------------|
| `PrismaUniqueConstraintError` | P2002 | Duplicate unique field |
| `PrismaRecordNotFoundError` | P2025 | `findUniqueOrThrow`, `findFirstOrThrow`, `update`, `delete` on non-existent |
| `PrismaForeignKeyConstraintError` | P2003 | Invalid foreign key reference |
| `PrismaError` | * | All other Prisma errors |

### Transactions

The generated service includes a `$transaction` method that allows you to run multiple operations within a database transaction.

```typescript
const program = Effect.gen(function* () {
  const prisma = yield* PrismaService;

  const result = yield* prisma.$transaction(
    Effect.gen(function* () {
      const user = yield* prisma.user.create({ data: { name: "Alice" } });
      const post = yield* prisma.post.create({
        data: { title: "Hello", authorId: user.id },
      });
      return { user, post };
    }),
  );
});
```

#### Transaction Rollback Behavior

**Any uncaught error in the Effect error channel triggers a rollback:**

```typescript
// Rollback on Effect.fail()
yield* prisma.$transaction(
  Effect.gen(function* () {
    yield* prisma.user.create({ data: { email: "alice@example.com" } });
    yield* Effect.fail("Something went wrong"); // Triggers rollback
  }),
);
// User is NOT created

// Rollback on Prisma errors (e.g., findUniqueOrThrow)
yield* prisma.$transaction(
  Effect.gen(function* () {
    yield* prisma.user.create({ data: { email: "bob@example.com" } });
    yield* prisma.user.findUniqueOrThrow({ where: { id: 999 } }); // Throws!
  }),
);
// User is NOT created
```

**Catching errors prevents rollback:**

```typescript
yield* prisma.$transaction(
  Effect.gen(function* () {
    yield* prisma.user.create({ data: { email: "alice@example.com" } });

    // Catch the error - transaction continues
    yield* prisma.user
      .findUniqueOrThrow({ where: { id: 999 } })
      .pipe(Effect.catchAll(() => Effect.succeed(null)));

    yield* prisma.user.create({ data: { email: "bob@example.com" } });
  }),
);
// Both users ARE created
```

**Custom error types are preserved:**

```typescript
class MyError extends Data.TaggedError("MyError")<{ message: string }> {}

const error = yield* prisma
  .$transaction(Effect.fail(new MyError({ message: "oops" })))
  .pipe(Effect.flip);

expect(error).toBeInstanceOf(MyError); // Type is preserved!
```

### Nested Transactions

Nested `$transaction` calls share the **same underlying database transaction**. There are no savepoints - all operations run in a single transaction that commits or rolls back together.

```typescript
yield* prisma.$transaction(
  Effect.gen(function* () {
    yield* prisma.user.create({ data: { name: "Outer" } });

    yield* prisma.$transaction(
      Effect.gen(function* () {
        yield* prisma.user.create({ data: { name: "Inner" } });
      }),
    );

    yield* Effect.fail("Outer failure");
  }),
);
// BOTH users are rolled back
```

#### Key Behaviors

| Scenario | Result |
|----------|--------|
| Both succeed | All committed |
| Inner fails (uncaught) | All rollback |
| Inner succeeds, outer fails | All rollback |
| Inner fails (caught), outer succeeds | **All committed** (including inner's data!) |

> **Important:** When you catch an inner transaction's error, its writes are NOT rolled back because there are no savepoints. All operations share the same database transaction.

#### Composable Service Functions

Functions that use `$transaction` internally work seamlessly when called from an outer transaction:

```typescript
// Service function with its own transaction
const UserService = {
  createWithProfile: (email: string) =>
    Effect.gen(function* () {
      const prisma = yield* PrismaService;
      return yield* prisma.$transaction(
        Effect.gen(function* () {
          const user = yield* prisma.user.create({ data: { email } });
          yield* prisma.profile.create({ data: { userId: user.id } });
          return user;
        }),
      );
    }),
};

// Called standalone - creates its own transaction
yield* UserService.createWithProfile("alice@example.com");

// Called inside outer transaction - joins it
yield* prisma.$transaction(
  Effect.gen(function* () {
    yield* UserService.createWithProfile("alice@example.com");
    yield* UserService.createWithProfile("bob@example.com");
    // If anything fails, both users are rolled back
  }),
);
```

This pattern allows you to:
1. Write self-contained service functions that are safe to call standalone
2. Compose them in outer transactions for end-to-end atomicity
3. Functions don't need to know if they're inside another transaction
