import { HttpApiEndpoint, HttpApiGroup } from "@effect/platform";
import { Schema } from "effect";

export class AdminGroup extends HttpApiGroup.make("admin")
  .add(
    HttpApiEndpoint.post("generate-sample", "/")
      .addSuccess(Schema.Number)
      .setPayload(Schema.Struct({ size: Schema.Number })),
  )
  .prefix("/api/admin") {}
