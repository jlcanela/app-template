import { faker } from "@faker-js/faker";
import { type FastCheck, Schema } from "effect";
import { type LazyArbitrary } from "effect/Arbitrary";

type F<A> = (f: typeof faker) => A;

function g<A>(f: F<A>): () => LazyArbitrary<A> {
  return () => (fc: typeof FastCheck) => fc.constant(null).map(() => f(faker));
}

export const ProjectIdV1 = Schema.UUID.pipe(Schema.brand("ProjectId_V1"));
export type ProjectIdV1 = typeof ProjectIdV1.Type;

export const ProjectStatusV1 = Schema.Literal("Draft", "Active", "Completed", "Archived");

export type ProjectStatusV1 = Schema.Schema.Type<typeof ProjectStatusV1>;

export const projectV1Fields = Schema.Struct({
  _tag: Schema.Literal("Project"),
  version: Schema.Literal(1),
  id: ProjectIdV1.annotations({
    title: "Project ID",
    arbitrary: g((_faker) => ProjectIdV1.make(faker.string.uuid())),
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
  status: ProjectStatusV1,
});

// eslint-disable-next-line no-use-before-define
export class ProjectV1 extends Schema.Class<ProjectV1>("ProjectV1")(projectV1Fields) {}

export type ProjectTypeV1 = Schema.Schema.Type<typeof ProjectV1>;

export const upsertProjectV1Fields = Schema.Struct({
  id: Schema.optional(ProjectIdV1),
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
  status: ProjectStatusV1.pipe(Schema.optional),
});

// eslint-disable-next-line no-use-before-define
export class UpsertProjectPayloadV1 extends Schema.Class<UpsertProjectPayloadV1>(
  "UpsertProjectPayload_V1",
)(upsertProjectV1Fields) {}
