import * as HttpApiEndpoint from "@effect/platform/HttpApiEndpoint";
import * as HttpApiGroup from "@effect/platform/HttpApiGroup";
import * as Schema from "effect/Schema";
import { UserAuthMiddleware } from "../Policy.js";

export const UserId = Schema.String.pipe(Schema.brand("UserId"));
export type UserId = typeof UserId.Type;

export class TestEvent extends Schema.TaggedClass<TestEvent>("TestEvent")("TestEvent", {
  message: Schema.String,
}) {}

// export namespace Todos {
//   export class UpsertedTodo extends Schema.TaggedClass<UpsertedTodo>("UpsertedTodo")(
//     "UpsertedTodo",
//     {
//       todo: Todo,
//       optimisticId: Schema.optional(Schema.String),
//     },
//   ) {}

//   export class DeletedTodo extends Schema.TaggedClass<DeletedTodo>("DeletedTodo")("DeletedTodo", {
//     id: TodoId,
//   }) {}

//   export const is = (event: Events): event is UpsertedTodo | DeletedTodo =>
//     event._tag === "UpsertedTodo" || event._tag === "DeletedTodo";
// }

export const Events = Schema.Union(TestEvent); //, Todos.UpsertedTodo, Todos.DeletedTodo);
export type Events = typeof Events.Type;

export class SseGroup extends HttpApiGroup.make("sse")
  .middleware(UserAuthMiddleware)
  .add(HttpApiEndpoint.get("connect", "/connect").addSuccess(Schema.Unknown))
  .add(HttpApiEndpoint.post("notify", "/notify").addSuccess(Schema.Void))
  .prefix("/sse") {}
