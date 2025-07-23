import { faker } from "@faker-js/faker";
import { FastCheck, Schema } from "effect";
import { LazyArbitrary } from "effect/Arbitrary";

type F<A> = (f: typeof faker) => A;

function g<A>(f: F<A>): () => LazyArbitrary<A> {
  return () => (fc: typeof FastCheck) => fc.constant(null).map(() => f(faker));
}

export const ProjectId_V1 = Schema.UUID.pipe(Schema.brand("ProjectId_V1"));
export type ProjectId_V1 = typeof ProjectId_V1.Type;

export const ProjectStatus_V1 = Schema.Union(
  Schema.Literal("Draft"),
  Schema.Literal("Active"),
  Schema.Literal("Completed"),
  Schema.Literal("Archived"),
);
export type ProjectStatus_V1 = Schema.Schema.Type<typeof ProjectStatus_V1>;

export const projectV1Fields = Schema.Struct({
  id: ProjectId_V1.annotations({
    title: "Project ID",
    arbitrary: g((faker) => ProjectId_V1.make(faker.string.uuid())),
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
  status: ProjectStatus_V1,
});

export class Project_V1 extends Schema.Class<Project_V1>("Project_V1")(projectV1Fields) {}

export type ProjectType_V1 = Schema.Schema.Type<typeof Project_V1>;

export const upsertProjectV1Fields = Schema.Struct({
  id: Schema.optional(ProjectId_V1),
  name: Schema.Trim.pipe(
    Schema.nonEmptyString({ message: () => "Name is required" }),
    Schema.maxLength(100, { message: () => "Name must be at most 100 characters long" }),
  ),
  description: Schema.Trim.pipe(
    Schema.nonEmptyString({ message: () => "Description is required" }),
    Schema.maxLength(1_000, { message: () => "Description must be at most 1,000 characters long" }),
  ),
  goal: Schema.Trim.pipe(
    Schema.nonEmptyString({ message: () => "Goal is required" }),
    Schema.maxLength(1_000, { message: () => "Goal must be at most 1,000 characters long" }),
  ),
  stakeholders: Schema.Trim.pipe(
    Schema.nonEmptyString({ message: () => "Stakeholders is required" }),
    Schema.maxLength(1_000, {
      message: () => "Stakeholders must be at most 1,000 characters long",
    }),
  ),
  status: ProjectStatus_V1.pipe(Schema.optional),
});

export class UpsertProjectPayload_V1 extends Schema.Class<UpsertProjectPayload_V1>(
  "UpsertProjectPayload_V1",
)(upsertProjectV1Fields) {}
