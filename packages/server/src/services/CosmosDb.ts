import { CosmosClient, type ItemDefinition, JSONValue, PartitionKeyKind } from "@azure/cosmos";
import { Project_V1_to_V2, Project_V2 } from "@org/domain/api/projects/v2";
import { SearchParamsType } from "@org/domain/api/search-rpc";
import "dotenv/config";
import { Console, Data, Effect, pipe, Schedule, Schema } from "effect";
import { Agent } from "node:https";
import { timed } from "./timed.js";

export class DatabaseError extends Data.TaggedError("DatabaseError")<{
  error: unknown;
}> {
  toString() {
    return `Database read failed: ${this.error}`;
  }
}

function connectionParam(name: string): Effect.Effect<{ endpoint: string; key: string }, string> {
  const connectionStringName = `ConnectionStrings__${name}`;
  const connectionString = process.env[connectionStringName];
  const cosmosEndpoint = process.env.COSMOS_ENDPOINT;
  const cosmosKey = process.env.COSMOS_KEY;

  if (connectionString) {
    const parts = connectionString.split(";").filter(Boolean);
    const map: Record<string, string> = {};
    for (const part of parts) {
      const [key, ...rest] = part.split("=");
      if (key) {
        map[key] = rest.join("=");
      }
    }
    const endpoint = map["AccountEndpoint"];
    const key = map["AccountKey"];
    if (endpoint && key) {
      return Effect.succeed({ endpoint, key });
    }
  } else if (cosmosEndpoint && cosmosKey) {
    return Effect.succeed({ endpoint: cosmosEndpoint, key: cosmosKey });
  }
  return Effect.fail("INVALID_COSMOSDB_CONFIG");
}

export class Cosmos extends Effect.Service<Cosmos>()("app/CosmosDb", {
  effect: timed(
    "Creating CosmosDb Service",
    Effect.gen(function* () {
      const { endpoint, key } = yield* pipe(
        connectionParam("cosmos"),
        Effect.tapError((err) => Effect.log(err)),
      );

      const connectionParams = {
        endpoint,
        key,
        agent: new Agent({ rejectUnauthorized: false }),
        connectionPolicy: {
          enableEndpointDiscovery: false,
        },
      };

      const client = new CosmosClient(connectionParams);

      function readAllDatabases() {
        return Effect.gen(function* () {
          const response = yield* Effect.tryPromise({
            try: () => client.databases.readAll().fetchAll(),
            catch: (error) => new DatabaseError({ error }),
          });
          return response.resources;
        }).pipe(Effect.withSpan("readAllDatabases"));
      }

      function readContainers(databaseId: string) {
        return Effect.gen(function* () {
          const database = client.database(databaseId);
          const { resources: containers } = yield* Effect.tryPromise({
            try: () => database.containers.readAll().fetchAll(),
            catch: (error) => new DatabaseError({ error }),
          });

          return containers.map((c) => ({
            id: c.id,
            partitionKey: c.partitionKey?.paths[0],
            indexingPolicy: c.indexingPolicy,
          }));
        }).pipe(Effect.withSpan("readContainers"));
      }
      // Add this function to your Cosmos service class
      function initializeProjectDB() {
        return Effect.gen(function* () {
          // Create database if not exists
          const { database } = yield* Effect.tryPromise({
            try: () => client.databases.createIfNotExists({ id: "cosmosdb" }),
            catch: (error) => new DatabaseError({ error }),
          }).pipe(Effect.withSpan("createDatabase"));

          yield* Effect.log("init databases").pipe(Effect.withSpan("init"));
          // Create container if not exists
          const { container } = yield* Effect.tryPromise({
            try: () =>
              database.containers.createIfNotExists({
                id: "projects",
                partitionKey: {
                  paths: ["/projectid"],
                  kind: PartitionKeyKind.Hash,
                },
              }),
            catch: (error) => new DatabaseError({ error }),
          }).pipe(Effect.withSpan("createContainer"));

          return container;
        });
      }

      const projectContainer = yield* initializeProjectDB().pipe(
        Effect.tapError((e) => Console.log(e)),
      );

      function search<T>(searchParams: SearchParamsType) {
        return Effect.gen(function* () {
          const filters = searchParams.columnFilters
            .filter((f) => typeof f.value === "string" && f.value.length > 0)
            .map((f, idx) => {
              const filterFn = searchParams.columnFilterFns[f.id] || "contains";

              let clause = "";
              let paramValue = f.value as JSONValue;

              if (filterFn === "contains") {
                clause = `CONTAINS(c.${f.id}, @param${idx})`;
              } else if (filterFn === "startsWith") {
                clause = `STARTSWITH(c.${f.id}, @param${idx})`;
              } else if (filterFn === "endsWith") {
                clause = `ENDSWITH(c.${f.id}, @param${idx})`;
              } else if (filterFn === "lower") {
                clause = `c.${f.id} < StringToNumber(@param${idx})`;
              } else {
                throw new Error(`Unknown filterFn: ${filterFn}`);
              }

              return {
                clause,
                param: {
                  name: `@param${idx}`,
                  value: paramValue,
                },
              };
            });

          filters.push({
            clause: "c._tag = @paramtype",
            param: {
              name: `@paramtype`,
              value: searchParams.type,
            },
          });

          const whereClause =
            filters.length > 0 ? "WHERE " + filters.map((f) => f.clause).join(" AND ") : "";

          // Build ORDER BY clause from sorting
          const sorting = searchParams.sorting;
          const orderClause =
            sorting.length > 0
              ? "ORDER BY " + sorting.map((s) => `c.${s.id} ${s.desc ? "DESC" : "ASC"}`).join(", ")
              : "";

          const query = `SELECT * FROM c ${whereClause} ${orderClause}`;

          const querySpec = {
            query,
            parameters: filters.map((f) => f.param),
          };

          // Get the total number of items matching the query/filter
          const countQuery = `SELECT VALUE COUNT(1) FROM c ${whereClause}`;
          yield* Effect.log(
            `Executing query: ${countQuery} with params: ${JSON.stringify(querySpec.parameters)}`,
          );

          const {
            resources: [totalRowCount],
          } = yield* Effect.tryPromise({
            try: () =>
              projectContainer.items
                .query({
                  query: countQuery,
                  parameters: filters.map((f) => f.param),
                })
                .fetchNext(),
            catch: (error) => new DatabaseError({ error }),
          }).pipe(Effect.withSpan("count"));

          const iterator = projectContainer.items.query(querySpec, {
            maxItemCount: searchParams.pagination.pageSize,
            //continuationToken: searchParams.continuationToken ?? undefined,
          });

          const page = yield* Effect.tryPromise({
            try: () => iterator.fetchNext(), // fetches only 1 page of results
            catch: (error) => new DatabaseError({ error }),
          }).pipe(Effect.withSpan("fetchNextPage"));

          if (!page?.resources || page.resources.length === 0) {
            return {
              items: Array<T>(),
              continuationToken: undefined,
              totalCount: totalRowCount, // optional
            };
          }
          yield* Effect.logDebug(JSON.stringify(page, null, 2));
          return {
            items: migrateArrOnRead(
              page.resources as Array<{ _tag: string; version: number }>,
            ) as T[],
            continuationToken: page.continuationToken,
            totalCount: totalRowCount, // optional
          };
        }).pipe(Effect.withSpan("queryProjects"));
      }

      type MigrationKey = "Project_V1" | "Project_V2";

      const transforms: Record<MigrationKey, (u: unknown) => unknown> = {
        Project_V1: Schema.decodeUnknownSync(Project_V1_to_V2),
        Project_V2: Schema.decodeUnknownSync(Project_V2),
      };

      function migrateOnRead<T>(item: { _tag: string; version: number }): T {
        const key = `${item._tag}_V${item.version}` as MigrationKey;
        const decode = transforms[key];
        return decode(item) as T;
      }

      function migrateArrOnRead<K extends { _tag: string; version: number }, T>(items: K[]): T[] {
        return items.map(migrateOnRead) as unknown[] as T[];
      }

      function query() {
        const querySpec = {
          query: "SELECT * FROM c",
          parameters: [],
        };
        return Effect.gen(function* () {
          const response = yield* Effect.tryPromise({
            try: () => projectContainer.items.query(querySpec).fetchAll(),
            catch: (error) => new DatabaseError({ error }),
          });
          return response.resources;
        }).pipe(Effect.withSpan("readAllDatabases"));
      }

      function readDocument(id: string) {
        return Effect.gen(function* () {
          const item = yield* Effect.tryPromise({
            try: () => projectContainer.item(id, id).read(),
            catch: (error) => new DatabaseError({ error }),
          });
          return item;
        }).pipe(Effect.withSpan("readDocument"));
      }

      function writeDocument<T extends ItemDefinition>(t: T) {
        return Effect.gen(function* () {
          const itemResponse = yield* Effect.tryPromise({
            try: () => projectContainer.items.create(t),
            catch: (error) => {
              new DatabaseError({ error });
            },
          });
          return itemResponse;
        }).pipe(Effect.withSpan("writeDocument"));
      }

      // Helpers
      const chunkItems = <T>(items: Array<T>, size: number): Array<Array<T>> =>
        Array.from({ length: Math.ceil(items.length / size) }, (_, i) =>
          items.slice(i * size, i * size + size),
        );

      const MAX_BATCH_SIZE = 100; // Cosmos DB's maximum per batch

      function upsertChunk<T extends { id: string }>(chunk: Array<T>) {
        return Effect.tryPromise({
          try: () => {
            const operations = chunk.map((item) => ({
              operationType: "Upsert" as const,
              resourceBody: item,
            }));

            return projectContainer.items.bulk(operations, { continueOnError: true });
          },
          catch: (error) => {
            console.error("Bulk upsert failed:", error);
            return new DatabaseError({ error });
          },
        }).pipe(Effect.withSpan("upsertChunk"));
      }

      function bulkUpsertDocuments<T extends { id: string }>(items: Array<T>, concurrency = 25) {
        return Effect.gen(function* () {
          const chunks = chunkItems(items, MAX_BATCH_SIZE);

          const results = yield* Effect.forEach(chunks, upsertChunk, { concurrency });

          return results.flatMap((batchResult) =>
            batchResult.map((item) => (item.statusCode === 201 ? "Inserted" : "Updated")),
          );
        }).pipe(Effect.withSpan("bulkUpsertDocuments"));
      }

      function upsertDocument<T>(t: T) {
        return Effect.gen(function* () {
          const itemResponse = yield* Effect.tryPromise({
            try: () => projectContainer.items.upsert(t),
            catch: (error) => {
              new DatabaseError({ error });
            },
          });
          return itemResponse;
        }).pipe(Effect.withSpan("upsertDocument"));
      }

      function concurrentUpserts<T>(documents: Array<T>, concurrency = 100) {
        return pipe(
          Effect.forEach(documents, (doc) => upsertDocument(doc), { concurrency }).pipe(
            Effect.retry(Schedule.exponential(100, 1.2)),
          ),
          Effect.withSpan("concurrentUpserts"),
        );
      }

      return {
        search,
        readAllDatabases,
        readContainers,
        readDocument,
        writeDocument,
        upsertDocument,
        concurrentUpserts,
        bulkUpsertDocuments,
        initializeProjectDB,
        query,
      } as const;
    }),
  ),
  dependencies: [],
}) {}
