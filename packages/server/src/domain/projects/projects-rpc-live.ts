import { HttpApiBuilder } from "@effect/platform";
import { DomainApi } from "@org/domain/domain-api";
import { Effect } from "effect";
import { ProjectsService } from "./internal/projects-service.js";

export const ProjectsRpcLive = HttpApiBuilder.group(DomainApi, "projects", (handlers) =>
  Effect.gen(function* () {
    const service = yield* ProjectsService;

    return handlers
      .handle("list", () => service.findAll().pipe(Effect.orDie))
      .handle("upsert", (req) =>
        Effect.gen(function* () {
          yield* Effect.log(req);
          const payload = req.payload;
          if (payload.id !== undefined) {
            return yield* service.update({
              id: payload.id,
              name: payload.name,
              description: payload.description,
              goal: payload.goal,
              stakeholders: payload.stakeholders,
              status: payload.status || "Draft",
            });
          }
          return yield* service.create({
            name: payload.name,
            description: payload.description,
            goal: payload.goal,
            stakeholders: payload.stakeholders,
            status: payload.status || "Draft",
          });
        }),
      )
      .handle("delete", ({ payload }) => service.del(payload.id));
  }),
);
