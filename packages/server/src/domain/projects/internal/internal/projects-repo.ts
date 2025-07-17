import { Project, ProjectId, ProjectNotFoundError } from "@org/domain/api/project-rpc";
import { Effect, Schema } from "effect";
// import { PgLive } from "../../../../../database/src/database.js";

const CreateProjectInput = Project.pipe(Schema.pick("name", "rule"));
type CreateProjectInput = typeof CreateProjectInput.Type;

const UpdateProjectInput = Project.pipe(Schema.pick("id", "name", "rule"));
type UpdateProjectInput = typeof UpdateProjectInput.Type;

// export class ProjectsRepo extends Effect.Service<ProjectsRepo>()("ProjectsRepo", {
//   dependencies: [PgLive],
//   effect: Effect.gen(function* () {
//     const sql = yield* SqlClient.SqlClient;

//     const findAll = SqlSchema.findAll({
//       Result: Project,
//       Request: Schema.Void,
//       execute: () => sql`
//         SELECT
//           *
//         FROM
//           Projects
//       `,
//     });

//     const create = SqlSchema.single({
//       Result: Project,
//       Request: CreateProjectInput,
//       execute: (request) => sql`
//         INSERT INTO
//           Projects ${sql.insert(request)}
//         RETURNING
//           *
//       `,
//     });

//     const update = SqlSchema.single({
//       Result: Project,
//       Request: UpdateProjectInput,
//       execute: (request) => sql`
//         UPDATE Projects
//         SET
//           ${sql.update(request)}
//         WHERE
//           id = ${request.id}
//         RETURNING
//           *
//       `,
//     });

//     const del = SqlSchema.single({
//       Request: ProjectId,
//       Result: Schema.Unknown,
//       execute: (id) => sql`
//         DELETE FROM Projects
//         WHERE
//           id = ${id}
//         RETURNING
//           id
//       `,
//     });

//     return {
//       findAll: flow(findAll, Effect.orDie),
//       del: (id: ProjectId) =>
//         del(id).pipe(
//           Effect.asVoid,
//           Effect.catchTags({
//             NoSuchElementException: () => new ProjectNotFoundError({ id }),
//             ParseError: Effect.die,
//             SqlError: Effect.die,
//           }),
//         ),
//       update: (request: UpdateProjectInput) =>
//         update(request).pipe(
//           Effect.catchTags({
//             NoSuchElementException: () => new ProjectNotFoundError({ id: request.id }),
//             ParseError: Effect.die,
//             SqlError: Effect.die,
//           }),
//         ),
//       create: flow(create, Effect.orDie),
//     } as const;
//   }),
// }) {}

export class ProjectsRepo extends Effect.Service<ProjectsRepo>()("ProjectsRepo", {
  effect: Effect.gen(function* () {
    // const sql = yield* SqlClient.SqlClient;

    // const findAll = SqlSchema.findAll({
    //   Result: Project,
    //   Request: Schema.Void,
    //   execute: () => sql`
    //     SELECT
    //       *
    //     FROM
    //       Projects
    //   `,
    // });

    // const create = SqlSchema.single({
    //   Result: Project,
    //   Request: CreateProjectInput,
    //   execute: (request) => sql`
    //     INSERT INTO
    //       Projects ${sql.insert(request)}
    //     RETURNING
    //       *
    //   `,
    // });

    // const update = SqlSchema.single({
    //   Result: Project,
    //   Request: UpdateProjectInput,
    //   execute: (request) => sql`
    //     UPDATE Projects
    //     SET
    //       ${sql.update(request)}
    //     WHERE
    //       id = ${request.id}
    //     RETURNING
    //       *
    //   `,
    // });

    // const del = SqlSchema.single({
    //   Request: ProjectId,
    //   Result: Schema.Unknown,
    //   execute: (id) => sql`
    //     DELETE FROM Projects
    //     WHERE
    //       id = ${id}
    //     RETURNING
    //       id
    //   `,
    // });

    return {
      findAll: Effect.succeed(new Array<Project>()),
      del: Effect.void,
      update: (request: UpdateProjectInput) =>
        Effect.fail(new ProjectNotFoundError({ id: request.id })),
      create: (request: CreateProjectInput) =>
        Effect.succeed({ ...request, id: ProjectId.make("oops") }),
    } as const;
  }),
}) {}
