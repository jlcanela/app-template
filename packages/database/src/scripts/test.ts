import { NodeContext } from "@effect/platform-node";
import { fromDotEnv } from "@effect/platform/PlatformConfigProvider";
import { Config, Effect, Layer } from "effect";
import * as path from "node:path";

export const layerDotEnv = () =>
  fromDotEnv(path.join(process.cwd(), ".env")).pipe(
    Effect.tap(Effect.log),
    Effect.map(Layer.setConfigProvider),
    Layer.unwrapEffect,
  );

class ServiceOne extends Effect.Service<ServiceOne>()("ServiceOne", {
  dependencies: [layerDotEnv().pipe(Layer.provide(NodeContext.layer))],
  effect: Effect.gen(function* () {
    const redacted = yield* Config.redacted("DATABASE_URL");
    return {
      redacted,
    };
  }),
}) {}

class ServiceTwo extends Effect.Service<ServiceTwo>()("ServiceTwo", {
  dependencies: [layerDotEnv().pipe(Layer.provide(NodeContext.layer))],
  effect: Effect.gen(function* () {
    const redacted = yield* Config.redacted("DATABASE_URL");
    return {
      redacted,
    };
  }),
}) {}

const program = Layer.launch(
  Layer.effectDiscard(
    Effect.gen(function* () {
      yield* ServiceOne;
      yield* ServiceTwo;
    }),
  ).pipe(Layer.provide([ServiceOne.Default, ServiceTwo.Default])),
);

void Effect.runPromise(program);
