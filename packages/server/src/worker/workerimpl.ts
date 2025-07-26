import { NodeRuntime, NodeWorkerRunner } from "@effect/platform-node";
import { Layer } from "effect";
import { WorkerRunnerLive } from "./worker.js";

const MainLive = WorkerRunnerLive.pipe(Layer.provide(NodeWorkerRunner.layer));

NodeRuntime.runMain(Layer.launch(MainLive));
