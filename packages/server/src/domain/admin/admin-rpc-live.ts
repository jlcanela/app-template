import { Cosmos } from "@/services/CosmosDb.js";
import { HttpApiBuilder } from "@effect/platform";
import { Project_V1 } from "@org/domain/api/projects/v1";
import { Project_V2 } from "@org/domain/api/projects/v2";
import { DomainApi } from "@org/domain/domain-api";
import { Arbitrary, Effect, FastCheck, Layer, Schema } from "effect";
import { ProjectsRepo } from "../projects/internal/projects-repo.js";

export const AdminRpcLive = HttpApiBuilder.group(DomainApi, "admin", (handlers) =>
  Effect.gen(function* () {
    const cosmos = yield* Cosmos;
    const repo = yield* ProjectsRepo;

    function gen<T extends Schema.Schema<any, any, { id: string }>>(t: T, size: number) {
      return Effect.gen(function* () {
        const arbitrary = Arbitrary.make(t);
        const values = FastCheck.sample(arbitrary, size) as Array<
          T extends Schema.Schema<any, any, infer A> ? A : never
        >;
        yield* cosmos.bulkUpsertDocuments(values).pipe(Effect.orDie);
        return values.length;
      });
    }

    return handlers
      .handle("generate-sample", ({ payload }) =>
        Effect.gen(function* () {
          switch (payload.dbVersion) {
            case "V1":
              return yield* gen(Project_V1, payload.size);
            case "V2":
              return yield* gen(Project_V2, payload.size);
          }
        }),
      )
      .handle("migrate-data", () => repo.migrate().pipe(Effect.orDie))
      .handle("validate-data", () => repo.migrate().pipe(Effect.orDie));
  }),
).pipe(Layer.provide(Cosmos.Default));
