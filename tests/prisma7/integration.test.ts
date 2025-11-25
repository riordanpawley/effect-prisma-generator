import { describe, expect, expectTypeOf, it } from "@effect/vitest";
import { Effect, Layer } from "effect";
import { PrismaLibSql } from "@prisma/adapter-libsql";
import {
  makePrismaLayer,
  PrismaService,
  PrismaUniqueConstraintError,
} from "./generated/effect/index.js";

// Create libSQL adapter for Prisma 7 - new API takes url directly
const adapter = new PrismaLibSql({ url: "file:./dev.db" });

// PrismaService.Default depends on PrismaClientService, so merge them
const PrismaClientLayer = makePrismaLayer({ adapter });
const MainLayer = Layer.merge(PrismaClientLayer, PrismaService.Default);

describe("Prisma 7 Effect Generator", () => {
  it.effect("should create and find a user", () =>
    Effect.gen(function* () {
      const prisma = yield* PrismaService;
      const email = `test-${Date.now()}@example.com`;

      // Create user
      const user = yield* prisma.user.create({
        data: { email, name: "Test User" },
      });

      expect(user.email).toBe(email);
      expect(user.name).toBe("Test User");

      // Find user
      const found = yield* prisma.user.findUnique({
        where: { id: user.id },
      });

      expect(found?.email).toBe(email);

      // Cleanup
      yield* prisma.user.delete({ where: { id: user.id } });
    }).pipe(Effect.provide(MainLayer)),
  );

  it.effect("should handle transactions", () =>
    Effect.gen(function* () {
      const prisma = yield* PrismaService;
      const email = `tx-${Date.now()}@example.com`;

      const user = yield* prisma.$transaction(
        Effect.gen(function* () {
          const created = yield* prisma.user.create({
            data: { email, name: "TX User" },
          });
          return created;
        }),
      );

      expect(user.email).toBe(email);

      // Cleanup
      yield* prisma.user.delete({ where: { id: user.id } });
    }).pipe(Effect.provide(MainLayer)),
  );

  it.effect("should narrow types with select clause", () =>
    Effect.gen(function* () {
      const prisma = yield* PrismaService;
      const email = `type-test-${Date.now()}@example.com`;

      const user = yield* prisma.user.create({
        data: { email, name: "Type Test User" },
      });

      // Test type narrowing with select
      const narrowed = yield* prisma.user.findUnique({
        where: { id: user.id },
        select: { id: true },
      });

      // Type-level assertion: narrowed should only have 'id' property
      expectTypeOf(narrowed).toEqualTypeOf<{ id: number } | null>();

      expect(narrowed).not.toBeNull();
      expect(narrowed?.id).toBe(user.id);

      // Cleanup
      yield* prisma.user.delete({ where: { id: user.id } });
    }).pipe(Effect.provide(MainLayer)),
  );

  it.effect("should narrow types with include clause", () =>
    Effect.gen(function* () {
      const prisma = yield* PrismaService;
      const email = `include-${Date.now()}@example.com`;

      // Create user with a post
      const user = yield* prisma.user.create({
        data: {
          email,
          name: "Include Test",
          posts: {
            create: { title: "Test Post", content: "Hello" },
          },
        },
        include: { posts: true },
      });

      // Type should include posts array
      expectTypeOf(user.posts).toEqualTypeOf<
        Array<{
          id: number;
          title: string;
          content: string | null;
          published: boolean;
          authorId: number;
        }>
      >();

      expect(user.posts).toHaveLength(1);
      expect(user.posts[0].title).toBe("Test Post");

      // Cleanup
      yield* prisma.post.deleteMany({ where: { authorId: user.id } });
      yield* prisma.user.delete({ where: { id: user.id } });
    }).pipe(Effect.provide(MainLayer)),
  );

  it.effect("should handle unique constraint errors", () =>
    Effect.gen(function* () {
      const prisma = yield* PrismaService;
      const email = `unique-${Date.now()}@example.com`;

      // Create first user
      const user = yield* prisma.user.create({
        data: { email, name: "First" },
      });

      // Try to create duplicate - should fail
      const result = yield* prisma.user
        .create({
          data: { email, name: "Duplicate" },
        })
        .pipe(Effect.flip);

      expect(result).toBeInstanceOf(PrismaUniqueConstraintError);

      // Cleanup
      yield* prisma.user.delete({ where: { id: user.id } });
    }).pipe(Effect.provide(MainLayer)),
  );

  it.effect("should return full model when no select", () =>
    Effect.gen(function* () {
      const prisma = yield* PrismaService;
      const email = `full-model-${Date.now()}@example.com`;

      const user = yield* prisma.user.create({
        data: { email, name: "Full Model User" },
      });

      const found = yield* prisma.user.findUnique({
        where: { id: user.id },
      });

      // Type-level assertion: should have all User fields
      expectTypeOf(found).toEqualTypeOf<{
        id: number;
        email: string;
        name: string | null;
      } | null>();

      // Cleanup
      yield* prisma.user.delete({ where: { id: user.id } });
    }).pipe(Effect.provide(MainLayer)),
  );
});
