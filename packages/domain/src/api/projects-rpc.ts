import { HttpApiEndpoint, HttpApiGroup, HttpApiSchema } from "@effect/platform";
import { faker } from "@faker-js/faker";
import { FastCheck, Schema } from "effect";
import { LazyArbitrary } from "effect/Arbitrary";

export const ProjectId = Schema.UUID.pipe(Schema.brand("ProjectId"));
export type ProjectId = typeof ProjectId.Type;

export const ProjectStatus = Schema.Union(
  Schema.Literal("Draft"),
  Schema.Literal("Active"),
  Schema.Literal("Completed"),
  Schema.Literal("Archived"),
);

type F<A> = (f: typeof faker) => A;

function g<A>(f: F<A>): () => LazyArbitrary<A> {
  return () => (fc: typeof FastCheck) => fc.constant(null).map(() => f(faker));
}

export class Project extends Schema.Class<Project>("Project")({
  id: ProjectId.annotations({
    title: "Project ID",
    arbitrary: g((faker) => ProjectId.make(faker.string.uuid())),
  }),
  name: Schema.String.annotations({
    title: "Project Name",
    description: "The title or name of the project",
    arbitrary: g((faker) => faker.lorem.words(2)),
  }),
  description: Schema.String.annotations({
    title: "Project Description",
    description: "A detailed description of what the project is about",
    arbitrary: g((faker) => faker.lorem.sentences(2)),
  }),
  goal: Schema.String.annotations({
    title: "Project Goal",
    description: "What the project aims to achieve",
    arbitrary: g((faker) => faker.lorem.sentence()),
  }),
  stakeholders: Schema.String.annotations({
    title: "Project Stakeholders",
    description: "Key individuals or organizations involved or impacted by the project",
    arbitrary: g((faker) => `${faker.person.fullName()}, ${faker.person.fullName()}`),
  }),
  status: ProjectStatus, // you can add .annotations({ ... }) here if needed
}) {}

// export class Project extends Schema.Class<Project>("Project")({
//   id: ProjectId,
//   name: Schema.String,
//   description: Schema.String,
//   goal: Schema.String,
//   stakeholders: Schema.String,
//   status: ProjectStatus,
// }) {}
export type ProjectType = Schema.Schema.Type<typeof Project>;

export class UpsertProjectPayload extends Schema.Class<UpsertProjectPayload>(
  "UpsertProjectPayload",
)({
  id: Schema.optional(ProjectId),
  name: Schema.Trim.pipe(
    Schema.nonEmptyString({
      message: () => "Name is required",
    }),
    Schema.maxLength(100, {
      message: () => "Name must be at most 100 characters long",
    }),
  ),
  description: Schema.Trim.pipe(
    Schema.nonEmptyString({
      message: () => "Description is required",
    }),
    Schema.maxLength(1_000, {
      message: () => "Description must be at most 1,000 characters long",
    }),
  ),
  goal: Schema.Trim.pipe(
    Schema.nonEmptyString({
      message: () => "Goal is required",
    }),
    Schema.maxLength(1_000, {
      message: () => "Goal must be at most 1,000 characters long",
    }),
  ),
  stakeholders: Schema.Trim.pipe(
    Schema.nonEmptyString({
      message: () => "Stakeholders is required",
    }),
    Schema.maxLength(1_000, {
      message: () => "Stakeholders must be at most 1,000 characters long",
    }),
  ),
  status: ProjectStatus.pipe(Schema.optional),
}) {}

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
