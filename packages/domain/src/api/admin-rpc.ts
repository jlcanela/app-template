import { HttpApiEndpoint, HttpApiGroup } from "@effect/platform";
import { Schema } from "effect";

export const dbVersionValues = ["V1", "V2"] as const;

export const DBVersion = Schema.Literal(...dbVersionValues);
export type DBVersionType = typeof DBVersion.Type;

export const GenSample = Schema.Struct({
  size: Schema.Number,
  dbVersion: DBVersion,
});
export type GenSampleType = typeof GenSample.Type;

export class AdminGroup extends HttpApiGroup.make("admin")
  .add(
    HttpApiEndpoint.post("generate-sample", "/generate-sample")
      .addSuccess(Schema.Number)
      .setPayload(GenSample),
  )
  .add(HttpApiEndpoint.post("migrate-data", "/migrate-data").addSuccess(Schema.Void))
  .add(HttpApiEndpoint.post("validate-data", "/validate-data").addSuccess(Schema.Void))
  .prefix("/api/admin") {}
