import { ProjectsRepo } from "@/domain/projects/internal/projects-repo.js";
import { Cosmos } from "@/services/CosmosDb.js";
import { Project } from "@org/domain/api/projects-rpc";
import { SearchParams } from "@org/domain/api/search-rpc";
import { Effect } from "effect";

export class SearchRepo extends Effect.Service<SearchRepo>()("SearchRepo", {
  dependencies: [ProjectsRepo.Default],
  effect: Effect.gen(function* () {
    const cosmos = yield* Cosmos;
    const search = (searchParams: typeof SearchParams.Type) =>
      Effect.gen(function* () {
        return yield* cosmos.search<Project>(searchParams);
      });
    return {
      search,
    } as const;
  }),
}) {}
