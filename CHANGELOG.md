# Changelog

## 0.1.0 (2025-11-27)


### ⚠ BREAKING CHANGES

* transactionOptions is now part of the options object (matching Prisma's native API) rather than a separate parameter.
* `layer()` and `layerEffect()` now take transactionOptions as a separate second parameter instead of nested in the options object.
* Old names still work but show deprecation warnings. Users should migrate to new API before next major version.

### Features

* add $isolatedTransaction for independent nested transactions ([368c82d](https://github.com/riordanpawley/effect-prisma-generator/commit/368c82d765b559463696335d76b6455b9f954582))
* add clientImportPath option ([081e4a0](https://github.com/riordanpawley/effect-prisma-generator/commit/081e4a02dc30c1c94ff8388c2c454b15214adde5))
* add custom error mapping via errorImportPath config ([448968d](https://github.com/riordanpawley/effect-prisma-generator/commit/448968dc49d2ce21086861a0a4881e533c100f7d))
* add importFileExtension config for ESM compatibility ([1308d18](https://github.com/riordanpawley/effect-prisma-generator/commit/1308d188ae3a6f93123a7697cf1c968bcd15077e))
* add operation specific errors ([447eb80](https://github.com/riordanpawley/effect-prisma-generator/commit/447eb80e03dc8d076e62d77e11f24bc7380091ff))
* add prismaVersion config for Prisma 6/7 compatibility ([70e82b1](https://github.com/riordanpawley/effect-prisma-generator/commit/70e82b1bbdd2387aab1825d628f51faf93016c7c))
* add transaction support ([68c73df](https://github.com/riordanpawley/effect-prisma-generator/commit/68c73df404a2232f8939a35a0c650835a4d33b5f))
* add type generics for select/include narrowing ([9ced713](https://github.com/riordanpawley/effect-prisma-generator/commit/9ced71309538eb859ce2be97770db4efba8c32e5))
* add type tests, scoped layer with disconnect, and service composition docs ([030349f](https://github.com/riordanpawley/effect-prisma-generator/commit/030349fc7f6603fa4e1594eaf06057691387bbbf))
* callback-free transactions with same-fiber execution ([fee6377](https://github.com/riordanpawley/effect-prisma-generator/commit/fee6377221d858dc19b976cd4ad53f7ad46c3a49))
* improved API with Prisma.layer, Prisma.layerEffect, and Prisma.Live ([923dd62](https://github.com/riordanpawley/effect-prisma-generator/commit/923dd626eb21be5bb6f3704f09388634ba0a20d9))
* initial version ([cf23604](https://github.com/riordanpawley/effect-prisma-generator/commit/cf2360433c143982ddf91d274b89b8b32c6bc8e8))


### Bug Fixes

* add .npmignore to exclude tests from git dependency installs ([d514533](https://github.com/riordanpawley/effect-prisma-generator/commit/d514533ac2bd994d0cbe63d514b8993c7af4ca7e))
* add missing tx in transaction ([3473335](https://github.com/riordanpawley/effect-prisma-generator/commit/34733355f8923984bc1d70f970756005fde34bb9))
* add Promise cast for Prisma 7 GlobalOmitConfig compatibility ([5b4874a](https://github.com/riordanpawley/effect-prisma-generator/commit/5b4874a95d14b3759134edb9e512de15add31221))
* correct type annotation in benchmark script ([f7bbcc1](https://github.com/riordanpawley/effect-prisma-generator/commit/f7bbcc118d4ac3c6f51221c61543de63bb655a34))
* explicitly run prisma generate in Prisma 7 tests ([a251906](https://github.com/riordanpawley/effect-prisma-generator/commit/a2519063e1d3d636438daf131c42587bf4579369))
* fully support exactOptionalPropertyTypes ([b94062c](https://github.com/riordanpawley/effect-prisma-generator/commit/b94062c9b25f27f8ecc801be65ea49c0d7ef92df))
* improve Prisma 7 compatibility ([d287cf1](https://github.com/riordanpawley/effect-prisma-generator/commit/d287cf176d8a1d759dfca07346f40b31d143eaee))
* layer composition in nested transaction test ([5f49d5f](https://github.com/riordanpawley/effect-prisma-generator/commit/5f49d5fe8cdf9fad8be05415bf805f0296580a58))
* make errorImportPath relative to schema.prisma, not output dir ([e5dd3a4](https://github.com/riordanpawley/effect-prisma-generator/commit/e5dd3a42e55c47a4c654e6461ca5225b7ea03ee0))
* preserve error types in transactions ([51746db](https://github.com/riordanpawley/effect-prisma-generator/commit/51746dbd289a1fe3af3d6ed2a8d0045b5e2eecc7))
* proper type narrowing for exactOptionalPropertyTypes ([a13850b](https://github.com/riordanpawley/effect-prisma-generator/commit/a13850bb40a9c0c356ad0016196ed04523cac785))
* remove deprecated Prisma.Live and LivePrismaLayer exports ([7616783](https://github.com/riordanpawley/effect-prisma-generator/commit/761678308e34dfaa12cf9770128de64221c13001))
* remove queryEngine requirement for Prisma 7 compatibility ([88102a7](https://github.com/riordanpawley/effect-prisma-generator/commit/88102a732f1aec4c8cb5f5a6567e69b47b375fd1))
* reuse parent transaction for nested transactions ([a85f0bc](https://github.com/riordanpawley/effect-prisma-generator/commit/a85f0bce05d8360098802259fea06165ad424697))
* separate transactionOptions into distinct parameter ([8eb60a2](https://github.com/riordanpawley/effect-prisma-generator/commit/8eb60a21974a1905cb85e93aa62241772ad5b3bd))
* use PrismaClient arg and return types ([f765f48](https://github.com/riordanpawley/effect-prisma-generator/commit/f765f48b5c1ac9b3f05c4b88d1777a6cba2bab78))
* use rest args to pass through PrismaClient constructor signature ([a55e596](https://github.com/riordanpawley/effect-prisma-generator/commit/a55e59675b2df2d0bed80623d51a17795769dff3))


### Performance Improvements

* optimize TypeScript compilation with type aliases ([01922b7](https://github.com/riordanpawley/effect-prisma-generator/commit/01922b74678d0636964f1bb0ff46e6ca45dad5ee))


### Miscellaneous Chores

* release 0.1.0 ([7c73f97](https://github.com/riordanpawley/effect-prisma-generator/commit/7c73f976f5bcd6d9328ceb07e33c8e1e4e9b1db4))

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
