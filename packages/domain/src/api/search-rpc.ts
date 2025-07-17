import { HttpApiEndpoint, HttpApiGroup } from "@effect/platform";
import { Schema } from "effect";

// EffectTS (@effect/schema) translation for the entity search models

import { Project } from "./projects-rpc.js";

export const SearchParams = Schema.Struct({
  type: Schema.Literal("project"),
  columnFilterFns: Schema.Record({ key: Schema.String, value: Schema.String }), // Record<string, string>
  columnFilters: Schema.Array(
    Schema.Struct({ id: Schema.String, value: Schema.Unknown }), // ColumnFilter[]
  ),
  globalFilter: Schema.String.pipe(Schema.optional),
  sorting: Schema.Array(
    Schema.Struct({ id: Schema.String, desc: Schema.Boolean }), // ColumnSort[]
  ),
  pagination: Schema.Struct({ pageIndex: Schema.Number, pageSize: Schema.Number }),
});

// === ENTITY SEARCH RESPONSE (generic) ===
export const ErrorResponse = Schema.Struct({
  error: Schema.String,
});

export const EntitySearchResponse = <T extends Schema.Schema<any, any>>(TEntity: T) =>
  Schema.Struct({
    items: Schema.Array(TEntity),
    totalCount: Schema.Number.pipe(Schema.optional),
    continuationToken: Schema.String.pipe(Schema.optional),
  });

export const EntitySearchResponseProject = Schema.Union(
  EntitySearchResponse(Project),
  ErrorResponse,
);
export type EntitySearchResponseProject = Schema.Schema.Type<typeof EntitySearchResponseProject>;
// === ERROR RESPONSE ===

export class SearchGroup extends HttpApiGroup.make("search")
  .add(
    HttpApiEndpoint.post("search", "/")
      .addSuccess(EntitySearchResponseProject)
      .setPayload(SearchParams),
  )
  .prefix("/api/search") {}
