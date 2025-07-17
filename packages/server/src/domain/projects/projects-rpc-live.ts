import { HttpApiBuilder } from "@effect/platform";
import { DomainApi } from "@org/domain/domain-api";
import { Effect, Layer } from "effect";
import { ProjectsRepo } from "./internal/projects-repo.js";

export const ProjectsRpcLive = HttpApiBuilder.group(DomainApi, "projects", (handlers) =>
  Effect.gen(function* () {
    const repo = yield* ProjectsRepo;

    return handlers
      .handle("list", repo.findAll)
      .handle("upsert", (req) =>
        Effect.gen(function* () {
          yield* Effect.log(req);
          const payload = req.payload;
          if (payload.id !== undefined) {
            return yield* repo.update({
              id: payload.id,
              name: payload.name,
              description: payload.description,
              goal: payload.goal,
              stakeholders: payload.stakeholders,
            });
          }
          return yield* repo.create({
            name: payload.name,
            description: payload.description,
            goal: payload.goal,
            stakeholders: payload.stakeholders,
          });
        }),
      )
      .handle("delete", ({ payload }) => repo.del(payload.id));
  }),
).pipe(Layer.provide(ProjectsRepo.Default));
