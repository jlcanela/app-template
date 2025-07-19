import { Cosmos } from "@/services/CosmosDb.js";
import { HttpApiBuilder } from "@effect/platform";
import { Project } from "@org/domain/api/projects-rpc";
import { DomainApi } from "@org/domain/domain-api";
import { Arbitrary, Effect, FastCheck, Layer } from "effect";
// import { ProjectsRepo } from "./internal/projects-repo.js";

export const AdminRpcLive = HttpApiBuilder.group(DomainApi, "admin", (handlers) =>
  Effect.gen(function* () {
    const cosmos = yield* Cosmos;

    return handlers.handle("generate-sample", ({ payload }) =>
      Effect.gen(function* () {
        const ProjectArbitrary = Arbitrary.make(Project);
        const sampleProjects = FastCheck.sample(ProjectArbitrary, payload.size || 1);
        yield* cosmos.bulkUpsertDocuments(sampleProjects).pipe(Effect.orDie);
        return yield* Effect.succeed(sampleProjects.length);
      }),
    );
  }),
).pipe(Layer.provide(Cosmos.Default));
