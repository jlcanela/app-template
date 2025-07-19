import { Cosmos } from "@/services/CosmosDb.js";
import { Project, ProjectId, ProjectNotFoundError } from "@org/domain/api/projects-rpc";
import { SearchParams } from "@org/domain/api/search-rpc";
import { Effect, Schema } from "effect";

const CreateProjectInput = Project.pipe(Schema.omit("id"));
type CreateProjectInput = typeof CreateProjectInput.Type;

const UpdateProjectInput = Project; //.pipe(Schema.pick("id", "name", "rule"));
type UpdateProjectInput = typeof UpdateProjectInput.Type;

export class ProjectsRepo extends Effect.Service<ProjectsRepo>()("ProjectsRepo", {
  dependencies: [Cosmos.Default],
  effect: Effect.gen(function* () {
    const cosmos = yield* Cosmos;

    const search = (searchParams: typeof SearchParams.Type) =>
      Effect.gen(function* () {
        yield* Effect.log(`Searching projects with params: ${JSON.stringify(searchParams)}`);
        const projects = (yield* cosmos.search(searchParams)).items as Project[]; //<Project>("projects");
        yield* Effect.log(`Found ${projects.length} projects`);
        return projects;
      });

    return {
      search,
      findAll: Effect.gen(function* () {
        const projects = (yield* cosmos.query()) as Project[]; //<Project>("projects");
        yield* Effect.log(`Found ${projects.length} projects`);
        //Effect.succeed(new Array<Project>()),
        return projects;
      }),
      del: Effect.void,
      update: (request: UpdateProjectInput) =>
        Effect.fail(new ProjectNotFoundError({ id: request.id })),
      create: (request: CreateProjectInput) =>
        Effect.gen(function* () {
          return Effect.succeed({ ...request, id: ProjectId.make("oops") });
        }),
    } as const;
  }),
}) {}
