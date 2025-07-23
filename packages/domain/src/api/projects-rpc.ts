import { HttpApiEndpoint, HttpApiGroup, HttpApiSchema } from "@effect/platform";
import { Schema } from "effect";
import { Project, ProjectId, UpsertProjectPayload } from "./projects/index.js";
export * from "./projects/index.js";

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
  .prefix("/api/projects") {}
