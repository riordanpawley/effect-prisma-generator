# Changelog

## [0.6.7] (2025-12-05)

### Performance Improvements

* **types:** Add explicit return type annotations to all generated static methods - All `PrismaClient.layer`, `PrismaClient.layerEffect`, `Prisma.Default`, `Prisma.layer`, and `Prisma.layerEffect` methods now have explicit `Layer.Layer<...>` return types. This significantly improves TypeScript compilation performance by allowing the compiler to reuse pre-computed types instead of re-inferring complex Layer compositions on every usage. Variable declarations within generator functions also now have explicit type annotations.

## [0.6.6] (2025-12-05)

### Bug Fixes

* **transactions:** Prevent server crashes on transaction errors - Fixed transaction error handling to properly catch and surface rollback/commit errors in the error channel instead of allowing them to become defects that crash the server. Transaction operations now use `acquireUseReleaseWithErrors` which ensures cleanup errors are properly handled.

## [0.6.5] (2025-12-01)

### Features

* **api:** Add `client` property to `IPrismaService` - The Prisma service now exposes the underlying `PrismaClient` instance directly via a `client` property. This provides convenient access to the raw Prisma client for advanced use cases or when you need to access client-level methods that aren't wrapped by the Effect service.

## [0.6.4] (2025-12-01)

### Bug Fixes

* **layers:** Use `Layer.provideMerge` instead of `Layer.provide` in `layer` and `layerEffect` methods - `provideMerge` is the correct API for merging the Prisma service layer with the PrismaClient layer, ensuring proper layer composition semantics. This fix ensures layers are combined correctly rather than just providing one to the other.

## [0.6.3] (2025-12-01)

### Features

* **api:** Add `Prisma.Default` static property - A base layer created from `Layer.effect(Prisma, Prisma.make)` that serves as the foundation for `layer` and `layerEffect` methods. This refactoring reduces code duplication and provides a convenient default layer for users who want to provide their own `PrismaClient` separately.

## [0.6.2] (2025-12-01)

### Features

* **types:** Improve `$transaction` type signature to exclude `PrismaTransactionClientService` from requirements - The transaction method now returns `Effect<A, E, Exclude<R, PrismaTransactionClientService>>` instead of `Effect<A, E, R>`, ensuring that the internal transaction service doesn't leak into the caller's requirements. This provides cleaner type signatures for effects using prisma operations inside transactions.

### Testing

* **types:** Add comprehensive type tests for `$transaction` - Added tests verifying that transactions correctly handle effects with no requirements, satisfy the `PrismaTransactionClientService` requirement internally, preserve other requirements while excluding the transaction service, and ensure operations inside transactions don't leak internal service types.

## [0.6.1] (2025-12-01)

### Testing

* **types:** Add type tests to verify PrismaClient doesn't leak in operation requirements - Operations now correctly return `Effect<A, E, never>` instead of `Effect<A, E, PrismaClient>`, ensuring cleaner type signatures

## [0.6.0] (2025-12-01)

### BREAKING CHANGES

* **architecture:** Replaced `Effect.Service` with `Context.Tag` pattern - The service is now defined using an explicit `IPrismaService` interface with a `Context.Tag` class. The generated code structure has changed but the public API remains compatible.
* **layers:** Removed `Prisma.Live` static property - This was incompatible with Prisma 7 which requires an adapter. Use `Prisma.layer({ adapter })` instead.
* **client:** `PrismaClient` service structure changed - Previously `yield* PrismaClient` returned `{ tx, client }`, now it returns the client directly: `const client = yield* PrismaClient` instead of `const { client } = yield* PrismaClient`.

### Features

* **telemetry:** Add `enableTelemetry` schema config option - Set to `"true"` to wrap all operations with `Effect.fn("operationName")` for traced execution, or `"false"` (default) for `Effect.fnUntraced`
* **types:** Interface-first approach with explicit `IPrismaService` - All operation signatures are now defined upfront in the interface, improving TypeScript compilation performance and preventing implementation drift
* **types:** Explicit type parameters on all `Effect.tryPromise` calls - Each operation now has `Effect.tryPromise<any, SpecificErrorType>({...})` for better type inference and error channel narrowing
* **errors:** Fixed `*OrThrow` operations to use `PrismaFindOrThrowError` - `findUniqueOrThrow` and `findFirstOrThrow` now correctly use `PrismaFindOrThrowError` which includes `PrismaRecordNotFoundError`, distinct from regular find operations that use `PrismaFindError`

### Performance Improvements

* **types:** Removed type inference complexity - By providing explicit interface types, TypeScript no longer needs to infer complex return types from `Effect.Service`, resulting in faster compilation

## [0.5.1] (2025-11-27)

### Performance Improvements

* **types:** Optimize TypeScript compilation with type aliases - Pre-compute Args types for each model operation at the top of the file instead of inline, reducing type computation from O(operations * 2) to O(operations + 1) per model. This significantly improves tsc performance on large schemas (60+ models).
* **types:** Remove `PrismaNamespace.Exact` wrapper which was forcing TypeScript to compute Args types twice per function. The extends constraint alone provides sufficient type safety.

### Bug Fixes

* **tests:** Explicitly run `prisma generate` in Prisma 7 tests - Prisma 7 with `prisma.config.ts` doesn't auto-run generators during `db push`, unlike Prisma 6. Added explicit generate step to ensure CI passes.

### Testing

* **benchmark:** Add benchmark test package with large schema (60+ models) to measure TypeScript compilation performance improvements

## [0.5.0] (2025-11-26)

### BREAKING CHANGES

* **transactions:** Transactions now run in the same fiber as the parent effect instead of spawning a new fiber via `Runtime.runPromiseExit`. This fixes issues where `FiberRef` modifications (like `HttpApiBuilder.securitySetCookie`) inside transactions were lost. If you relied on fiber isolation in transactions, this is a breaking change.

### Features

* **transactions:** Callback-free transaction implementation using `Effect.acquireUseRelease` - modifications to `FiberRef`, `Ref`, and service state inside transactions are now visible to the parent effect
* **transactions:** Add `transactionOptions` to layer config for default isolation level
* **config:** Add `importFileExtension` option for ESM compatibility (e.g., `.js` extensions in imports)
* **config:** Add `errorImportPath` for custom error class mapping
* **api:** Add `Prisma.layer`, `Prisma.layerEffect`, and `Prisma.Live` for improved ergonomics
* **types:** Add comprehensive type tests for select/include narrowing

### Bug Fixes

* **config:** Make `errorImportPath` relative to schema.prisma location, not output directory
* **layers:** Fix layer composition in nested transaction tests using `Layer.provideMerge`
* **compat:** Improve Prisma 6/7 compatibility (no version config needed)

## [0.4.0](https://github.com/m9tdev/effect-prisma-generator/compare/v0.3.3...v0.4.0) (2025-11-20)


### Features

* add operation specific errors ([3704f08](https://github.com/m9tdev/effect-prisma-generator/commit/3704f08409e42c5c607832e901d2c29dac61032b))

## [0.3.3](https://github.com/m9tdev/effect-prisma-generator/compare/v0.3.2...v0.3.3) (2025-11-20)


### Bug Fixes

* preserve error types in transactions ([79f0ed4](https://github.com/m9tdev/effect-prisma-generator/commit/79f0ed48bb086eb1c0b8cf6d74e0b347f2f974f2))

## [0.3.2](https://github.com/m9tdev/effect-prisma-generator/compare/v0.3.1...v0.3.2) (2025-11-20)


### Bug Fixes

* add missing tx in transaction ([fbd0071](https://github.com/m9tdev/effect-prisma-generator/commit/fbd00716b1b31ef5f273f211ec4e817adda5ee4a))

## [0.3.1](https://github.com/m9tdev/effect-prisma-generator/compare/v0.3.0...v0.3.1) (2025-11-20)


### Bug Fixes

* reuse parent transaction for nested transactions ([753b917](https://github.com/m9tdev/effect-prisma-generator/commit/753b91777ce3a87387dba555e26318e3f3863215))

## [0.3.0](https://github.com/m9tdev/effect-prisma-generator/compare/v0.2.1...v0.3.0) (2025-11-20)


### Features

* add transaction support ([ff08249](https://github.com/m9tdev/effect-prisma-generator/commit/ff082498c4fd1b1a352e6ebec19b21beb7abe06d))

## [0.2.1](https://github.com/m9tdev/effect-prisma-generator/compare/v0.2.0...v0.2.1) (2025-11-20)


### Bug Fixes

* use PrismaClient arg and return types ([06202aa](https://github.com/m9tdev/effect-prisma-generator/commit/06202aa0442fde759c897504fa94876fb260e6d7))

## [0.2.0](https://github.com/m9tdev/effect-prisma-generator/compare/v0.1.0...v0.2.0) (2025-11-20)


### Features

* add clientImportPath option ([767961e](https://github.com/m9tdev/effect-prisma-generator/commit/767961ef5c70a4f1a50c5c87e20cac5f5e88e618))

## 0.1.0 (2025-11-19)


### Features

* initial version ([088d63b](https://github.com/m9tdev/effect-prisma-generator/commit/088d63bb1d79078796cfa9477328ea3fea8ec3e6))


### Miscellaneous Chores

* release 0.1.0 ([1812b48](https://github.com/m9tdev/effect-prisma-generator/commit/1812b48ce6852155f82d0940284e7bc936544236))
