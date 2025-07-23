import { Effect, Schema } from "effect";
import { Forbidden } from "effect/ParseResult";
import { ProjectStatus_V1, ProjectType_V1, projectV1Fields } from "./v1.js";

// Remove "Archived" and map "Archived" to "Completed"
export const ProjectStatus_V2 = Schema.Literal("Draft", "Active", "Completed");
export type ProjectStatus_V2 = Schema.Schema.Type<typeof ProjectStatus_V2>;

function mapStatusV1toV2(value: ProjectStatus_V1): ProjectStatus_V2 {
  switch (value) {
    case "Draft":
    case "Active":
    case "Completed":
      return value;
    case "Archived":
      return "Completed";
  }
}

export const ProjectStatus_V1_to_V2 = Schema.transformOrFail(ProjectStatus_V1, ProjectStatus_V2, {
  strict: true,
  decode: (status, _options, ast, _fromI) => Effect.succeed(mapStatusV1toV2(status)),
  encode: (status, _options, _ast, _toA) => Effect.succeed(status), // Always encode to "Completed" even if it was mapped from "Archived"
});

export const projectV2Fields = Schema.Struct({
  ...projectV1Fields.fields,
  status: ProjectStatus_V2,
});

export class Project_V2 extends Schema.Class<Project_V2>("Project_V2")(projectV2Fields) {}

export const Project_V1_to_V2 = Schema.transformOrFail(projectV1Fields, projectV2Fields, {
  strict: true,

  decode: (input, options, ast, from) =>
    Effect.gen(function* () {
      const status = yield* Schema.decode(ProjectStatus_V1_to_V2)(input.status).pipe(
        Effect.mapError((error) => new Forbidden(ast, input.status, error.message)),
      );
      return { ...input, status } as ProjectType_V2;
    }),

  encode: (input, options, ast, from) => Effect.succeed(input as ProjectType_V1),
});

export type ProjectType_V2 = Schema.Schema.Type<typeof Project_V2>;

export const upsertProjectV2Fields = Schema.Struct({
  ...projectV2Fields.fields,
  status: ProjectStatus_V2,
});

export class UpsertProjectPayload_V2 extends Schema.Class<UpsertProjectPayload_V2>(
  "UpsertProjectPayload_V2",
)(upsertProjectV2Fields) {}
