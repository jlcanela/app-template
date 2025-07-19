import { Effect } from "effect";

export function timed<A, E, R>(
  name: string,
  effect: Effect.Effect<A, E, R>,
): Effect.Effect<A, E, R> {
  return Effect.gen(function* () {
    const clock = yield* Effect.clock;
    const start = yield* clock.currentTimeMillis;
    const result = yield* effect;
    const end = yield* clock.currentTimeMillis;
    const duration = end - start;
    yield* Effect.log(`${name} - Execution time: ${duration} ms`);
    return result;
  });
}
