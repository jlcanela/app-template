import { HttpApiBuilder } from "@effect/platform";
import { DomainApi } from "@org/domain/domain-api";
import { Effect, Layer } from "effect";
import { SearchRepo } from "./internal/search-repo.js";

export const SearchRpcLive = HttpApiBuilder.group(DomainApi, "search", (handlers) =>
  Effect.gen(function* () {
    const repo = yield* SearchRepo;

    return handlers.handle("search", repo.search);
  }),
).pipe(Layer.provide(SearchRepo.Default));
