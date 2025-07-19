import { HttpApiBuilder } from "@effect/platform";
import { DomainApi } from "@org/domain/domain-api";
import { Effect } from "effect";
import { SearchRepo } from "./internal/search-repo.js";

export const SearchRpcLive = HttpApiBuilder.group(DomainApi, "search", (handlers) =>
  Effect.gen(function* () {
    const repo = yield* SearchRepo;

    return handlers.handle("search", (req) => repo.search(req.payload).pipe(Effect.orDie));
  }),
);
