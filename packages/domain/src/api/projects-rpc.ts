import { HttpApiEndpoint, HttpApiGroup, HttpApiSchema } from "@effect/platform";
import { Schema } from "effect";
import { Project, ProjectId, UpsertProjectPayload } from "./projects/index.js";
import { ProjectV1, UpsertProjectPayloadV1 } from "./projects/v1.js";

export * from "./projects/index.js";

// eslint-disable-next-line no-use-before-define
export class ProjectNotFoundError extends Schema.TaggedError<ProjectNotFoundError>(
  "ProjectNotFoundError",
)(
  "ProjectNotFoundError",
  { id: ProjectId },
  HttpApiSchema.annotations({
    status: 404,
  }),
) {
  get message() {
    return `Project with id ${this.id} not found`;
  }
}

export const projectIdParam = HttpApiSchema.param(
  "id",
  Schema.String.pipe(Schema.brand("ProjectId")),
);

export class ProjectsGroupV1 extends HttpApiGroup.make("projects_v1")
  .add(HttpApiEndpoint.get("list", "/").addSuccess(Schema.Array(ProjectV1)))
  .add(
    HttpApiEndpoint.put("upsert", "/")
      .addSuccess(Project)
      .setPayload(UpsertProjectPayloadV1)
      .addError(ProjectNotFoundError),
  )
  .add(
    HttpApiEndpoint.del("delete", "/")
      .setPayload(
        Schema.Struct({
          id: ProjectId,
        }),
      )
      .addSuccess(Schema.Void)
      .addError(ProjectNotFoundError),
  )
  .prefix("/api/v1/projects") {}

export class ProjectsGroup extends HttpApiGroup.make("projects")
  .add(HttpApiEndpoint.get("list", "/").addSuccess(Schema.Array(Project)))
  .add(
    HttpApiEndpoint.put("upsert", "/")
      .addSuccess(Project)
      .setPayload(UpsertProjectPayload)
      .addError(ProjectNotFoundError),
  )
  .add(
    HttpApiEndpoint.del("delete", "/")
      .setPayload(
        Schema.Struct({
          id: ProjectId,
        }),
      )
      .addSuccess(Schema.Void)
      .addError(ProjectNotFoundError),
  )
  .prefix("/api/v2/projects") {}
