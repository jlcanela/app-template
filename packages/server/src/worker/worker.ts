import { WorkerRunner } from "@effect/platform";
import { Effect, Schema } from "effect";

export class CropImageError
  // eslint-disable-next-line no-use-before-define
  extends Schema.TaggedError<CropImageError>()("CropImageError", {}) {}

//
// Input schema: could be expanded to accept time intervals, etc.
export const TriggerWorkerInput = Schema.Struct({
  nb: Schema.Number,
});
export type TriggerWorkerInput = typeof TriggerWorkerInput.Type;
//export type TriggerWorkerInput = Schema.TypeOf<typeof TriggerWorkerInput>;
// Output schema: logs produced could be returned as an array
export const TriggerWorkerOutput = Schema.Struct({
  logs: Schema.Array(Schema.String),
});
export type TriggerWorkerOutput = typeof TriggerWorkerOutput.Type;

// eslint-disable-next-line no-use-before-define
export class MyRequest extends Schema.TaggedRequest<MyRequest>("MyRequest")("MyRequest", {
  failure: Schema.String,
  success: TriggerWorkerOutput, // <---- change
  payload: { id: Schema.String },
}) {}

export const Request = Schema.Union(MyRequest);
export type Request = typeof Request.Type;

//declare const process: (data: Request) => Effect.Effect<TriggerWorkerOutput>

const process = (request: Request) =>
  Effect.gen(function* () {
    yield* Effect.log(`running worker '${request.id}'`);
    return yield* Effect.succeed({ logs: ["oops"] });
  });

export const WorkerRunnerLive = WorkerRunner.layerSerialized(Request, {
  MyRequest: (request) => process(request),
});

// export const WorkerRunnerLive: Layer.Layer<
//     never,
//     WorkerError.WorkerError,
//     WorkerRunner.PlatformRunner
// > = WorkerRunner.layerSerialized(Request, {
//     MyRequest: (request: Request) => process(request)
// })
