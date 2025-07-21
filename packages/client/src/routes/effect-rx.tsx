import { Result, Rx, useRx, useRxSet, useRxSetPromise, useRxValue } from "@effect-rx/rx-react";
import { createFileRoute } from "@tanstack/react-router";
import { Cause, Chunk, Effect, Exit, Option, Schedule, Schema, Stream } from "effect";
import { useState } from "react";

import { BrowserKeyValueStore } from "@effect/platform-browser";

export const Route = createFileRoute("/effect-rx")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <>
      <QueryParamDemo />
      <hr />
      <ScrollYComponent />
      <hr />
      <CounterDemo />
      <hr />
      <DisplayUsers />
      <hr />
      <DisplayScheduledCount />
      <hr />
      <CountPullRxComponent />
      <hr />
      <DisplayGroup />
      <hr />
      <CreateProjectComponent />
      <hr />
      <FlagToggleDemo />
    </>
  );
}

// CounterDemo is a component that demonstrates the use of Rx in a React component.
const countRx = Rx.make(0).pipe(
  // By default, the Rx will be reset when no longer used.
  // This is useful for cleaning up resources when the component unmounts.
  //
  // If you want to keep the value, you can use `Rx.keepAlive`.
  //
  Rx.keepAlive,
);

const doubleCountRx = Rx.make((get) => get(countRx) * 2);

// You can also use the `Rx.map` function to create a derived Rx.
const tripleCountRx = Rx.map(countRx, (count) => count * 3);

const resultRx: Rx.Rx<Result.Result<number, never>> = Rx.make(() => Effect.succeed(0));

const resultRxFinal = Rx.make(
  Effect.gen(function* () {
    // Add a finalizer to the `Scope` for this Rx
    // It will run when the Rx is rebuilt or no longer needed
    yield* Effect.addFinalizer(() => Effect.log("finalizer"));
    return "hello";
  }),
);

const resultWithContextRx = Rx.make(
  Effect.fnUntraced(function* (get: Rx.Context) {
    //yield* Effect.log("resultWithContextRx", get)
    const count = get(countRx); // Get the current value of countRx
    //const count = yield* get.result(countRx)
    return count + 1;
  }),
);

function CounterDemo() {
  const [show, setShow] = useState(true);
  return (
    <div>
      <button onClick={() => setShow((s) => !s)}>Toggle Counter</button>
      {show ? (
        <>
          <Counter />
          <br />
          <CounterButton />
        </>
      ) : (
        <>
          <p>Counter unmounted.</p>
        </>
      )}
    </div>
  );
}

function Counter() {
  const count = useRxValue(countRx);
  const count2 = useRxValue(doubleCountRx);
  const count3 = useRxValue(tripleCountRx);
  const count4 = useRxValue(resultRx).pipe(Result.getOrElse(() => 0));
  const count5 = useRxValue(resultWithContextRx).pipe(Result.getOrElse(() => 0));
  const st = useRxValue(resultRxFinal).pipe(Result.getOrThrow);

  return (
    <>
      <h1>
        {count}-{count2}-{count3}-{count4}-{count5}
      </h1>
      <p>{st}</p>
    </>
  );
}

function CounterButton() {
  const setCount = useRxSet(countRx);
  return <button onClick={() => setCount((count) => count + 1)}>Increment</button>;
}

// User demo

class Users extends Effect.Service<Users>()("app/Users", {
  effect: Effect.gen(function* () {
    const getAll = Effect.succeed([
      { id: "1", name: "Alice" },
      { id: "2", name: "Bob" },
      { id: "3", name: "Charlie" },
    ]);
    return { getAll } as const;
  }),
}) {}

// Create a RxRuntime from a Layer
const runtimeRx: Rx.RxRuntime<Users, never> = Rx.runtime(Users.Default);

// You can then use the RxRuntime to make Rx's that use the services from the Layer
const usersRx = runtimeRx.rx(
  Effect.gen(function* () {
    const users = yield* Users;
    return yield* users.getAll;
  }),
);

function DisplayUsers() {
  const users = useRxValue(usersRx).pipe(Result.getOrThrow);

  return (
    <>
      <h1>Users</h1>
      <pre>{JSON.stringify(users, null, 2)}</pre>
    </>
  );
}

// Stream Demo

export const scheduledCount: Rx.Rx<Result.Result<number>> = Rx.make(
  Stream.fromSchedule(Schedule.spaced(1000)),
);

function DisplayScheduledCount() {
  const count = useRxValue(scheduledCount).pipe(Result.getOrElse(() => 0));
  return (
    <div>
      <h2>Scheduled Count</h2>
      <p>{count}</p>
    </div>
  );
}

export const countPullRx: Rx.Writable<Rx.PullResult<number>, void> = Rx.pull(
  Stream.fromChunks(
    Chunk.make(1, 2), // first chunk
    Chunk.make(3, 4, 5), // second chunk
  ),
);

export function CountPullRxComponent() {
  const [result, pull] = useRx(countPullRx);

  return Result.match(result, {
    onInitial: () => <div>Loading...</div>,
    onFailure: (error) => <div>Error: {Cause.pretty(error.cause)}</div>,
    onSuccess: (success) => (
      <div>
        <ul>
          {success.value.items.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
        <button onClick={() => pull()}>Load more</button>
        {success.waiting ? <p>Loading more...</p> : <p>Loaded chunk</p>}
      </div>
    ),
  });
}

// Working with Sets of Rx's

class Groups extends Effect.Service<Groups>()("app/Groups", {
  effect: Effect.gen(function* () {
    const findById = (id: string) => Effect.succeed({ id, name: "John Doe" });
    return { findById } as const;
  }),
}) {}

// Create a RxRuntime from a Layer
const runtimeRx2: Rx.RxRuntime<Groups, never> = Rx.runtime(Groups.Default);

// Rx's work by reference, so we need to use Rx.family to dynamically create a
// set of Rx's from a key.
//
// Rx.family will ensure that we get a stable reference to the Rx for each key.
//
export const groupsRx = Rx.family((id: string) =>
  runtimeRx2.rx(
    Effect.gen(function* () {
      const groups = yield* Groups;
      return yield* groups.findById(id);
    }),
  ),
);

function DisplayGroup() {
  const [groupId, setGroupId] = useState("default-group");
  const groupResult = useRxValue(groupsRx(groupId));
  const group = groupResult.pipe(Result.getOrElse(() => null));

  return (
    <section>
      <h2>Group Fetcher</h2>
      <input
        type="text"
        value={groupId}
        placeholder="Enter Group ID"
        onChange={(e) => setGroupId(e.target.value)}
      />
      {group ? <pre>{JSON.stringify(group, null, 2)}</pre> : <p>Loading or not found...</p>}
    </section>
  );
}

// Functions

// Create a simple Rx.fn that logs a number
const logRx = Rx.fn(
  Effect.fnUntraced(function* (arg: number) {
    yield* Effect.log("got arg", arg);
  }),
);

export function LogComponent() {
  // To call the Rx.fn, we need to use the useRxSet hook
  const logNumber = useRxSet(logRx);
  return <button onClick={() => logNumber(42)}>Log 42</button>;
}

// You can also use it with Rx.runtime
class Projects extends Effect.Service<Projects>()("app/Projects", {
  succeed: {
    create: (name: string) => Effect.succeed({ id: 1, name }),
  } as const,
}) {}

const runtimeRx3 = Rx.runtime(Projects.Default);

// Here we are using runtimeRx.fn to create a function from the Users.create
// method.
export const createProjectRx = runtimeRx3.fn(
  Effect.fnUntraced(function* (name: string) {
    const projects = yield* Projects;
    return yield* projects.create(name);
  }),
);

export function CreateProjectComponent() {
  // If your function returns a Result, you can use the useRxSetPromise hook
  const createProject = useRxSetPromise(createProjectRx);
  return (
    <button
      onClick={async () => {
        const exit = await createProject("Awesome Project");
        if (Exit.isSuccess(exit)) {
          console.log(exit.value);
        }
      }}
    >
      Log 42
    </button>
  );
}

// Event Listener

export const scrollYRx: Rx.Rx<number> = Rx.make((get) => {
  // The handler will use `get.setSelf` to update the value of itself
  const onScroll = () => {
    get.setSelf(window.scrollY);
  };
  // We need to use `get.addFinalizer` to remove the event listener when the
  // Rx is no longer used.
  window.addEventListener("scroll", onScroll);
  get.addFinalizer(() => window.removeEventListener("scroll", onScroll));

  // Return the current scroll position
  return window.scrollY;
});
export function ScrollYComponent() {
  const scrollY = useRxValue(scrollYRx);

  return (
    <div>
      <h2>Scroll Y Position</h2>
      <p>{scrollY}</p>
    </div>
  );
}

// Search Params

// Create an Rx that reads and writes to the URL search parameters
export const simpleParamRx: Rx.Writable<string> = Rx.searchParam("simple");

// You can also use a schema to further parse the value
export const numberParamRx: Rx.Writable<Option.Option<number>> = Rx.searchParam("number", {
  schema: Schema.NumberFromString,
});

export function QueryParamDemo() {
  const simpleValue = useRxValue(simpleParamRx);
  const numberValue = useRxValue(numberParamRx);

  const setSimple = useRxSet(simpleParamRx);
  const setNumber = useRxSet(numberParamRx);

  return (
    <div>
      <h2>Query Param Demo</h2>

      <div>
        <label>
          Simple Param:
          <input type="text" value={simpleValue} onChange={(e) => setSimple(e.target.value)} />
        </label>
        <p>
          Current: <code>{simpleValue}</code>
        </p>
      </div>

      <div>
        <label>
          Number Param:
          <input
            type="number"
            value={Option.getOrElse(() => "")(numberValue)}
            onChange={(e) => {
              const val = e.target.value;
              setNumber(val === "" ? Option.none() : Option.some(Number(val)));
            }}
          />
        </label>
        <p>
          Parsed Number:{" "}
          <code>
            {
              Option.match({
                onNone: () => "None",
                onSome: (n) => n,
              })(numberValue) as React.ReactNode
            }
          </code>
        </p>
      </div>
    </div>
  );
}

// Local storage

export const flagRx = Rx.kvs({
  runtime: Rx.runtime(BrowserKeyValueStore.layerLocalStorage),
  key: "flag",
  schema: Schema.Boolean,
  defaultValue: () => false,
});

export function FlagToggleDemo() {
  const flag = useRxValue(flagRx); // ✅ subscribe to changes
  const setFlag = useRxSet(flagRx); // ✅ updater function

  return (
    <div>
      <h2>LocalStorage Rx Flag</h2>
      <p>
        Current flag value: <strong>{flag ? "✅ Enabled" : "❌ Disabled"}</strong>
      </p>
      <button onClick={() => setFlag((prev) => !prev)}>Toggle Flag</button>
    </div>
  );
}

// Rx.runtime.addGlobalLayer(
//   Layer.setConfigProvider(ConfigProvider.fromJson(import.meta.env)),
// )

// const allConfig = Effect.gen(function* () {
//    console.log(import.meta.env) // check what keys exist
//   // Retrieve the current config provider
//   const configProvider = yield* ConfigProvider.ConfigProvider // ✅ get from environment
//   const config = yield* configProvider.load(Config.all({
//   Env: Config.string("VITE_ENV"),
//   ApiUrl: Config.string("VITE_API_URL"),
//   })).pipe(Effect.mapError((e) => new Error(`Failed to load config: ${e.message}`)));
//   return config;
// })

// const allConfigRx =  Rx.make(allConfig)

// function DisplayConfig() {
//   const cfg = useRx(allConfigRx)//.pipe(Result.getOrThrow);

//   return (
//     <section>
//       <h2>App Config2 (Loaded from ConfigProvider)</h2>
//       <pre>{JSON.stringify(cfg, null, 2)}</pre>
//     </section>
//   )
// }
