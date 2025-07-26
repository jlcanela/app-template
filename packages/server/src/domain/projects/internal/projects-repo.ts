import { Cosmos, type SearchResult } from "@/services/CosmosDb.js";
import { Project, ProjectId, ProjectNotFoundError } from "@org/domain/api/projects-rpc";
import { type SearchParams, type SearchParamsType } from "@org/domain/api/search-rpc";
import { Effect, Schema } from "effect";

const CreateProjectInput = Project.pipe(Schema.omit("id"));
type CreateProjectInput = typeof CreateProjectInput.Type;

const UpdateProjectInput = Project; //.pipe(Schema.pick("id", "name", "rule"));
type UpdateProjectInput = typeof UpdateProjectInput.Type;

// eslint-disable-next-line no-use-before-define
export class ProjectsRepo extends Effect.Service<ProjectsRepo>()("ProjectsRepo", {
  dependencies: [Cosmos.Default],
  effect: Effect.gen(function* () {
    const cosmos = yield* Cosmos;

    const search = (searchParams: typeof SearchParams.Type) =>
      Effect.gen(function* () {
        yield* Effect.log(`Searching projects with params: ${JSON.stringify(searchParams)}`);
        const projects = (yield* cosmos.search(searchParams)).items as Array<Project>; //<Project>("projects");
        yield* Effect.log(`Found ${projects.length} projects`);
        return projects;
      });

    return {
      search,
      findAll: Effect.gen(function* () {
        const projects = (yield* cosmos.query()) as Array<Project>; //<Project>("projects");
        yield* Effect.log(`Found ${projects.length} projects`);
        //Effect.succeed(new Array<Project>()),
        return projects;
      }),
      del: Effect.void,
      update: (request: UpdateProjectInput) =>
        Effect.fail(new ProjectNotFoundError({ id: request.id })),
      create: (request: CreateProjectInput) =>
        Effect.succeed({ ...request, id: ProjectId.make("oops") }),
      migrate: () =>
        Effect.gen(function* () {
          let continuationToken: string | undefined = undefined;
          const searchParams: SearchParamsType = {
            type: "Project",
            columnFilterFns: { version: "lower" },
            columnFilters: [{ id: "version", value: "2" }],
            sorting: [],
            pagination: { pageIndex: 0, pageSize: 30 },
          };

          do {
            const result: SearchResult<Project> = yield* cosmos.search<Project>({
              ...searchParams,
              continuationToken,
            });
            yield* cosmos.bulkUpsertDocuments(result.items);

            continuationToken = result.continuationToken;
          } while (continuationToken !== undefined);

          yield* Effect.log("Data Migrated");
        }),
      validate: () =>
        Effect.gen(function* () {
          let continuationToken: string | undefined = undefined;
          const searchParams: SearchParamsType = {
            type: "Project",
            columnFilterFns: { version: "lower" },
            columnFilters: [{ id: "version", value: "2" }],
            sorting: [],
            pagination: { pageIndex: 0, pageSize: 30 },
          };

          do {
            const result: SearchResult<Project> = yield* cosmos.search<Project>({
              ...searchParams,
              continuationToken,
            });
            continuationToken = result.continuationToken;
          } while (continuationToken !== undefined);

          yield* Effect.log("Data Migrated");
        }),
    };
  }),
}) {}
