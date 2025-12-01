# Migration Guide: v0.5 → v0.6

This guide will help you migrate from `@riordanpawley/effect-prisma-generator` v0.5.x to v0.6.0.

## Overview

Version 0.6.0 introduces an interface-first architecture with explicit types and optional telemetry support. While there are breaking changes to the generated code structure, **most user code remains compatible** with minimal changes needed.

## Quick Start

1. Update your dependency: `pnpm add -D @riordanpawley/effect-prisma-generator@0.6.0`
2. Regenerate your Prisma client: `pnpm prisma generate`
3. Fix breaking changes (see below)
4. Run your tests

---

## Breaking Changes

### 1. Removed `Prisma.Live`

**Reason:** `Prisma.Live` was incompatible with Prisma 7 which requires an adapter to be passed.

**Migration:**

```typescript
// ❌ Before (v0.5)
import { Prisma } from "./generated/effect"

const layer = Prisma.Live

// ✅ After (v0.6) - For SQLite with Prisma 7
import { Prisma } from "./generated/effect"
import { PrismaLibSQL } from "@prisma/adapter-libsql"
import { createClient } from "@libsql/client"

const libsql = createClient({
  url: process.env.DATABASE_URL!,
  authToken: process.env.DATABASE_AUTH_TOKEN
})

const layer = Prisma.layer({ adapter: new PrismaLibSQL(libsql) })

// ✅ After (v0.6) - For Prisma 6 (no adapter needed)
const layer = Prisma.layer()
```

**Action Required:** Replace all uses of `Prisma.Live` with `Prisma.layer()` or `Prisma.layer({ adapter })`.

---

### 2. `PrismaClient` Service Structure Changed

**Reason:** Simplified API - the client is now returned directly instead of wrapped in an object.

**Migration:**

```typescript
// ❌ Before (v0.5)
const { client } = yield* PrismaClient
const result = await client.user.findMany()

// ✅ After (v0.6)
const client = yield* PrismaClient
const result = await client.user.findMany()
```

**Action Required:** Search your codebase for `const { client } = yield* PrismaClient` and replace with `const client = yield* PrismaClient`.

**Search command:**
```bash
rg "const \{ client \} = yield\* PrismaClient" --type ts
# or
grep -r "const { client } = yield\* PrismaClient" . --include="*.ts"
```

---

### 3. Generated Code Architecture Changed

**What changed:** The generated code now uses `Context.Tag` with an explicit `IPrismaService` interface instead of `Effect.Service`.

**Impact:** This is an internal change. If you're only using the public API (`Prisma.layer()`, `yield* Prisma`, operations), **no changes needed**.

**Affected if you:**
- Directly imported internal types from generated code
- Extended or modified the generated service
- Used reflection/introspection on the service class

**Before (v0.5):**
```typescript
export class Prisma extends Service<Prisma>()(/* ... */) {
  static layer = /* ... */
}
```

**After (v0.6):**
```typescript
export interface IPrismaService {
  // All operation signatures
}

export class Prisma extends Context.Tag("Prisma")<Prisma, IPrismaService>() {
  static make: Effect.Effect<IPrismaService, never, PrismaClient> = /* ... */
  static layer = /* ... */
}
```

**Action Required:** Review any code that directly references generated internals.

---

## New Features (Optional)

### Enable Telemetry for Tracing

Add `enableTelemetry = "true"` to your Prisma schema to wrap all operations with `Effect.fn()` for traced execution:

```prisma
generator effect {
  provider         = "effect-prisma-generator"
  output           = "./generated/effect"
  clientImportPath = "@prisma/client"
  enableTelemetry  = "true"  // ✨ NEW
}
```

**What this does:**
- `enableTelemetry = "true"` → Operations use `Effect.fn("Prisma.user.findMany")(function* () {...})`
- `enableTelemetry = "false"` (default) → Operations use `Effect.fnUntraced(function* () {...})`

**Benefits:**
- Named operations in traces (`"Prisma.user.findMany"`)
- Better debugging with Effect's tracing tools
- Stack traces show operation names instead of anonymous functions

**Trade-off:**
- Slight performance overhead for tracing metadata

---

## Improved Type Safety

### Explicit Type Parameters

All operations now have explicit type parameters for better error inference:

```typescript
// Generated code now includes:
Effect.tryPromise<any, PrismaFindError>({
  try: () => actualClient.user.findUnique(args),
  catch: (error) => mapFindError(error, "findUnique", "User")
})
```

**Benefit:** Better type narrowing in error channels, improved IDE autocomplete.

**Action Required:** None - this is automatic.

---

### Fixed `*OrThrow` Error Types

`findUniqueOrThrow` and `findFirstOrThrow` now correctly use `PrismaFindOrThrowError` instead of `PrismaFindError`:

```typescript
// Before (v0.5) - Incorrect error type
const user: Effect<User, PrismaFindError> = prisma.user.findUniqueOrThrow(/*...*/)

// After (v0.6) - Correct error type includes PrismaRecordNotFoundError
const user: Effect<User, PrismaFindOrThrowError> = prisma.user.findUniqueOrThrow(/*...*/)
```

**Benefit:** Proper error type differentiation - `*OrThrow` operations can fail with `PrismaRecordNotFoundError`, regular finds return `null`.

**Action Required:** If you have explicit type annotations for `*OrThrow` operations, update them to use `PrismaFindOrThrowError`.

---

## Step-by-Step Migration

### 1. Update Dependency

```bash
pnpm add -D @riordanpawley/effect-prisma-generator@0.6.0
# or
npm install --save-dev @riordanpawley/effect-prisma-generator@0.6.0
# or
yarn add -D @riordanpawley/effect-prisma-generator@0.6.0
```

### 2. Regenerate Prisma Client

```bash
pnpm prisma generate
```

### 3. Fix `Prisma.Live` Usage

Search for `Prisma.Live` in your codebase:

```bash
rg "Prisma\.Live" --type ts
```

Replace with:
- `Prisma.layer()` for Prisma 6 or default config
- `Prisma.layer({ adapter })` for Prisma 7

### 4. Fix `PrismaClient` Destructuring

Search for destructuring pattern:

```bash
rg "const \{ client \} = yield\* PrismaClient" --type ts
```

Replace with:
```typescript
const client = yield* PrismaClient
```

### 5. Run TypeScript Compiler

```bash
tsc --noEmit
```

Fix any type errors related to:
- `PrismaFindOrThrowError` vs `PrismaFindError`
- Missing `Prisma.Live`
- `PrismaClient` destructuring

### 6. Run Your Tests

```bash
pnpm test
```

Ensure all integration tests pass, especially:
- Layer construction
- Transaction behavior
- Error handling for `*OrThrow` operations

---

## Testing Your Migration

Create a simple test to verify the migration:

```typescript
import { Effect, Layer } from "effect"
import { Prisma } from "./generated/effect"
import { describe, it, expect } from "vitest"

describe("Migration to v0.6", () => {
  it("should create layer without Prisma.Live", () => {
    // ✅ This should work
    const layer = Prisma.layer()
    expect(layer).toBeDefined()
  })

  it("should access PrismaClient directly", async () => {
    const program = Effect.gen(function* () {
      const client = yield* PrismaClient // Not destructured
      expect(client).toBeDefined()
      expect(client.user).toBeDefined()
    })

    await Effect.runPromise(program.pipe(
      Effect.provide(Prisma.layer())
    ))
  })

  it("should handle findUniqueOrThrow errors correctly", async () => {
    const program = Effect.gen(function* () {
      const prisma = yield* Prisma
      // This will fail with PrismaFindOrThrowError, not PrismaFindError
      return yield* prisma.user.findUniqueOrThrow({
        where: { id: "nonexistent" }
      })
    })

    const result = await Effect.runPromise(
      program.pipe(
        Effect.provide(Prisma.layer()),
        Effect.either
      )
    )

    expect(result._tag).toBe("Left")
    // Error is PrismaFindOrThrowError type
  })
})
```

---

## Common Issues

### Issue: "Property 'Live' does not exist on type 'Prisma'"

**Cause:** You're using the removed `Prisma.Live` property.

**Fix:** Replace with `Prisma.layer()` or `Prisma.layer({ adapter })`.

---

### Issue: "Property 'client' does not exist on type 'BasePrismaClient'"

**Cause:** You're destructuring `{ client }` from `yield* PrismaClient`.

**Fix:** Use direct assignment: `const client = yield* PrismaClient`.

---

### Issue: Type error on `findUniqueOrThrow` error handling

**Cause:** Error type changed from `PrismaFindError` to `PrismaFindOrThrowError`.

**Fix:** Update type annotations:
```typescript
// Before
const handleError = (e: PrismaFindError) => /* ... */

// After
const handleError = (e: PrismaFindOrThrowError) => /* ... */
```

---

## Performance Improvements

Version 0.6.0 provides faster TypeScript compilation due to:

1. **Explicit interface types** - No more complex type inference from `Effect.Service`
2. **Pre-computed operation signatures** - TypeScript doesn't need to infer return types
3. **Direct type parameters** - `Effect.tryPromise<any, ErrorType>` instead of inferred types

**Expected improvements:**
- Faster `tsc` compilation (especially on large schemas)
- Better IDE responsiveness
- More accurate autocomplete

---

## Rollback Plan

If you encounter issues, you can rollback to v0.5.2:

```bash
pnpm add -D @riordanpawley/effect-prisma-generator@0.5.2
pnpm prisma generate
```

Then revert your code changes via git:
```bash
git checkout -- .
```

**Note:** Please report any migration issues on GitHub: https://github.com/riordanpawley/effect-prisma-generator/issues

---

## Questions?

- **GitHub Issues:** https://github.com/riordanpawley/effect-prisma-generator/issues
- **Changelog:** See [CHANGELOG.md](./CHANGELOG.md) for detailed changes
- **Examples:** Check the `tests/` directory for working examples

---

## Summary Checklist

- [ ] Updated dependency to v0.6.0
- [ ] Regenerated Prisma client
- [ ] Replaced `Prisma.Live` with `Prisma.layer()`
- [ ] Fixed `PrismaClient` destructuring (`const client = yield* PrismaClient`)
- [ ] Updated error type annotations for `*OrThrow` operations (if any)
- [ ] Ran TypeScript compiler (`tsc --noEmit`)
- [ ] Ran test suite
- [ ] (Optional) Added `enableTelemetry = "true"` for tracing
- [ ] Verified production build works

---

**Happy migrating! 🚀**
