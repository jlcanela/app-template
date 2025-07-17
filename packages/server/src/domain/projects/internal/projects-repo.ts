import { Project, ProjectId, ProjectNotFoundError } from "@org/domain/api/projects-rpc";
import { Effect, Schema } from "effect";

const CreateProjectInput = Project.pipe(Schema.omit("id"));
type CreateProjectInput = typeof CreateProjectInput.Type;

const UpdateProjectInput = Project; //Style.pipe(Schema.pick("id", "name", "rule"));
type UpdateProjectInput = typeof UpdateProjectInput.Type;

// export class StylesRepo extends Effect.Service<StylesRepo>()("StylesRepo", {
//   dependencies: [PgLive],
//   effect: Effect.gen(function* () {
//     const sql = yield* SqlClient.SqlClient;

//     const findAll = SqlSchema.findAll({
//       Result: Style,
//       Request: Schema.Void,
//       execute: () => sql`
//         SELECT
//           *
//         FROM
//           styles
//       `,
//     });

//     const create = SqlSchema.single({
//       Result: Style,
//       Request: CreateStyleInput,
//       execute: (request) => sql`
//         INSERT INTO
//           styles ${sql.insert(request)}
//         RETURNING
//           *
//       `,
//     });

//     const update = SqlSchema.single({
//       Result: Style,
//       Request: UpdateStyleInput,
//       execute: (request) => sql`
//         UPDATE styles
//         SET
//           ${sql.update(request)}
//         WHERE
//           id = ${request.id}
//         RETURNING
//           *
//       `,
//     });

//     const del = SqlSchema.single({
//       Request: StyleId,
//       Result: Schema.Unknown,
//       execute: (id) => sql`
//         DELETE FROM styles
//         WHERE
//           id = ${id}
//         RETURNING
//           id
//       `,
//     });

//     return {
//       findAll: flow(findAll, Effect.orDie),
//       del: (id: StyleId) =>
//         del(id).pipe(
//           Effect.asVoid,
//           Effect.catchTags({
//             NoSuchElementException: () => new StyleNotFoundError({ id }),
//             ParseError: Effect.die,
//             SqlError: Effect.die,
//           }),
//         ),
//       update: (request: UpdateStyleInput) =>
//         update(request).pipe(
//           Effect.catchTags({
//             NoSuchElementException: () => new StyleNotFoundError({ id: request.id }),
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
    //   Result: Style,
    //   Request: Schema.Void,
    //   execute: () => sql`
    //     SELECT
    //       *
    //     FROM
    //       styles
    //   `,
    // });

    // const create = SqlSchema.single({
    //   Result: Style,
    //   Request: CreateStyleInput,
    //   execute: (request) => sql`
    //     INSERT INTO
    //       styles ${sql.insert(request)}
    //     RETURNING
    //       *
    //   `,
    // });

    // const update = SqlSchema.single({
    //   Result: Style,
    //   Request: UpdateStyleInput,
    //   execute: (request) => sql`
    //     UPDATE styles
    //     SET
    //       ${sql.update(request)}
    //     WHERE
    //       id = ${request.id}
    //     RETURNING
    //       *
    //   `,
    // });

    // const del = SqlSchema.single({
    //   Request: StyleId,
    //   Result: Schema.Unknown,
    //   execute: (id) => sql`
    //     DELETE FROM styles
    //     WHERE
    //       id = ${id}
    //     RETURNING
    //       id
    //   `,
    // });

    return {
      findAll: () => Effect.succeed(new Array<Project>()),
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
