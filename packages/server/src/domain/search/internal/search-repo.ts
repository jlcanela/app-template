import { Project, ProjectId } from "@org/domain/api/projects-rpc";
import { EntitySearchResponseProject } from "@org/domain/api/search-rpc";
import { randomUUID } from "crypto";
import { Effect } from "effect";

export class SearchRepo extends Effect.Service<SearchRepo>()("SearchRepo", {
  effect: Effect.gen(function* () {
    return {
      search: () =>
        Effect.succeed({
          items: [
            Project.make({
              id: ProjectId.make(randomUUID()),
              name: "name",
              description: "description",
              goal: "goal",
              stakeholders: "stakeholders",
              status: "Draft",
            }),
          ],
        } as EntitySearchResponseProject),
    } as const;
  }),
}) {}
