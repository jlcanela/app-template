import { Project, ProjectId, ProjectNotFoundError } from "@org/domain/api/projects-rpc";
import { Effect, Schema } from "effect";
import { ProjectsRepo } from "./projects-repo.js";

const CreateProjectInput = Project.pipe(Schema.omit("id"));
type CreateProjectInput = typeof CreateProjectInput.Type;

const UpdateProjectInput = Project;
type UpdateProjectInput = typeof UpdateProjectInput.Type;

export class ProjectsService extends Effect.Service<ProjectsService>()("ProjectService", {
  dependencies: [ProjectsRepo.Default],
  effect: Effect.gen(function* () {
    const repo = yield* ProjectsRepo;

    return {
      findAll: () => repo.findAll, // Effect.succeed(new Array<Project>()),
      del: (id: ProjectId) => Effect.succeed(true).pipe(Effect.asVoid),
      update: (request: UpdateProjectInput) =>
        Effect.fail(new ProjectNotFoundError({ id: request.id })) as Effect.Effect<
          Project,
          ProjectNotFoundError,
          never
        >,
      create: (request: CreateProjectInput) =>
        Effect.succeed({ ...request, id: ProjectId.make("oops") }),
    } as const;
  }),
}) {}
