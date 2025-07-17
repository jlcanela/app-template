import { HttpApiBuilder } from "@effect/platform";
import { DomainApi } from "@org/domain/domain-api";
import { Effect, Layer } from "effect";
import { StylesRepo2 } from "./internal/styles-repo.js";

export const StylesRpcLive = HttpApiBuilder.group(DomainApi, "styles", (handlers) =>
  Effect.gen(function* () {
    const repo = yield* StylesRepo2;

    return handlers
      .handle("list", () => repo.findAll)
      .handle("upsert", ({ payload }) =>
        Effect.gen(function* () {
          yield* Effect.log(payload);
          if (payload.id !== undefined) {
            return yield* repo.update({
              id: payload.id,
              name: payload.name,
              rule: payload.rule,
            });
          }
          return yield* repo.create({
            name: payload.name,
            rule: payload.rule,
          });
        }),
      )
      .handle("delete", ({ payload }) => repo.del(payload.id));
  }),
).pipe(Layer.provide(StylesRepo2.Default));
