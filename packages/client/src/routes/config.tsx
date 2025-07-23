import { Result, Rx, useRxValue } from "@effect-rx/rx-react";
import { createFileRoute } from "@tanstack/react-router";
import { Effect } from "effect";

class Config extends Effect.Service<Config>()("app/Config", {
  effect: Effect.gen(function* () {
    const config = import.meta.env;
    return { config } as const;
  }),
}) {}

// Create a RxRuntime from a Layer
const runtimeRx: Rx.RxRuntime<Config, never> = Rx.runtime(Config.Default);

export const Route = createFileRoute("/config")({
  component: RouteComponent,
});

// You can then use the RxRuntime to make Rx's that use the services from the Layer
const allConfigRx = runtimeRx.rx(
  Effect.gen(function* () {
    const config = yield* Config;
    return config.config;
  }),
);

function RouteComponent() {
  const result = useRxValue(allConfigRx);
  const value = Result.match({
    onInitial: () => ({ status: "loading" }),
    onSuccess: (v) => v.value,
    onFailure: (err) => ({ error: "Failed to load config", cause: err }),
  })(result);
  console.log("value:", value);
  return (
    <>
      <h1>Configuration</h1>
      <pre>{JSON.stringify(value, null, 2)}</pre>
    </>
  );
}
