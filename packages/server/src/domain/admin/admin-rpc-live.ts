import { Cosmos } from "@/services/CosmosDb.js";
import { MyRequest, type Request } from "@/worker/worker.js";
import { HttpApiBuilder, Worker } from "@effect/platform";
import { NodeWorker } from "@effect/platform-node";
import { ProjectV1 } from "@org/domain/api/projects/v1";
import { ProjectV2 } from "@org/domain/api/projects/v2";
import { DomainApi } from "@org/domain/domain-api";
import { Arbitrary, Effect, FastCheck, Layer, type Schema } from "effect";
import { Worker as NodeWorkerThread } from "node:worker_threads";
import { ProjectsRepo } from "../projects/internal/projects-repo.js";

export const AdminRpcLive = HttpApiBuilder.group(DomainApi, "admin", (handlers) =>
  Effect.gen(function* () {
    const cosmos = yield* Cosmos;
    const repo = yield* ProjectsRepo;

    // const pool = yield* _(Worker.makePoolSerialized<Request>({
    //   size: 4
    // }))

    const req = new MyRequest({
      id: "some-id", // You must provide the required fields for MyRequest
      // ... any other payload fields needed
    });
    const response = Effect.gen(function* (bind) {
      const pool = yield* bind(Worker.makePoolSerialized<Request>({ size: 4 }));
      return yield* bind(pool.executeEffect(req));
    }).pipe(
      Effect.provide(
        NodeWorker.layer(
          () =>
            new NodeWorkerThread(
              new URL("../../../build/esm/worker/workerimpl.js", import.meta.url),
            ), //1 //new globalThis.Worker(new URL("./worker.ts", import.meta.url))
        ),
      ),
    );

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
          const rr = yield* Effect.scoped(response).pipe(Effect.orDie);

          yield* Effect.log(`rr: ${JSON.stringify(rr)}`);

          switch (payload.dbVersion) {
            case "V1":
              return yield* gen(ProjectV1, payload.size);
            case "V2":
              return yield* gen(ProjectV2, payload.size);
          }
        }),
      )
      .handle("migrate-data", () => repo.migrate().pipe(Effect.orDie))
      .handle("validate-data", () => repo.migrate().pipe(Effect.orDie));
  }),
).pipe(Layer.provide(Cosmos.Default));

// import { Worker } from "@effect/platform"
// import { BrowserWorker } from "@effect/platform-browser"
// import { Effect } from "effect"
// import { CropImage, type Request } from "./schemas.js"

// Effect.gen(function*(_) {
//   const pool = yield* _(Worker.makePoolSerialized<Request>({
//     size: 4
//   }))
//   yield* _(pool.executeEffect(new CropImage({ data: new ImageData(1, 1) })))
// }).pipe(
//   Effect.provide(BrowserWorker.layer(
//     () => new globalThis.Worker(new URL("./worker.ts", import.meta.url))
//   ))
// )
