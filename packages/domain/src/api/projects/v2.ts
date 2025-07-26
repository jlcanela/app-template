import { Effect, Schema } from "effect";
import { Forbidden } from "effect/ParseResult";
import { ProjectId } from "./index.js";
import { ProjectStatusV1, type ProjectTypeV1, projectV1Fields } from "./v1.js";

// Remove "Archived" and map "Archived" to "Completed"
export const ProjectStatusV2 = Schema.Literal("Draft", "Active", "Completed");
export type ProjectStatusV2 = Schema.Schema.Type<typeof ProjectStatusV2>;

function mapStatusV1toV2(value: ProjectStatus_V1): ProjectStatusV2 {
  if (value === "Archived") {
    return "Completed";
  }
  return value;
}

export const ProjectStatusV1toV2 = Schema.transformOrFail(ProjectStatusV1, ProjectStatusV2, {
  strict: true,
  decode: (status, _options, _ast, _fromI) => Effect.succeed(mapStatusV1toV2(status)),
  encode: (status, _options, _ast, _toA) => Effect.succeed(status), // Always encode to "Completed" even if it was mapped from "Archived"
});

export const projectV2Fields = Schema.Struct({
  ...projectV1Fields.fields,
  version: Schema.Literal(2),
  status: ProjectStatusV2,
});

// eslint-disable-next-line no-use-before-define
export class ProjectV2 extends Schema.Class<ProjectV2>("ProjectV2")(projectV2Fields) {}
export type ProjectTypeV2 = Schema.Schema.Type<typeof ProjectV2>;

export const ProjectV1toV2 = Schema.transformOrFail(projectV1Fields, projectV2Fields, {
  strict: true,

  decode: (input, _options, ast, _from) =>
    Effect.gen(function* () {
      const status = yield* Schema.decode(ProjectStatusV1toV2)(input.status).pipe(
        Effect.mapError((error) => new Forbidden(ast, input.status, error.message)),
      );
      return { ...input, status, version: 2 } as ProjectTypeV2;
    }),

  encode: (input, _options, _ast, _from) =>
    Effect.succeed({ ...input, version: 1 } as ProjectTypeV1),
});

export const upsertProjectV2Fields = Schema.Struct({
  ...projectV2Fields.fields,
  id: ProjectId.pipe(Schema.optional),
  status: ProjectStatusV2,
});

// eslint-disable-next-line no-use-before-define
export class UpsertProjectPayloadV2 extends Schema.Class<UpsertProjectPayloadV2>(
  "UpsertProjectPayloadV2",
)(upsertProjectV2Fields) {}
