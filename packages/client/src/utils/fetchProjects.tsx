import { FetchHttpClient, HttpApiClient } from "@effect/platform";
import { Project, ProjectId } from "@org/domain/api/projects-rpc";
import { SearchParams, SearchParamsType } from "@org/domain/api/search-rpc";
import { DomainApi } from "@org/domain/domain-api";
import { queryOptions } from "@tanstack/react-query";
import { Effect } from "effect";

const client = HttpApiClient.make(DomainApi, {
  baseUrl: window.location.origin,
});

export type SearchApiResponse<T> = {
  items: Array<T>;
  totalCount: number;
  continuationToken?: string;
};

export function search<T>(searchParams: typeof SearchParams.Type) {
  return Effect.gen(function* () {
    const c = yield* client;
    return (yield* c.search.search({ payload: searchParams })) as SearchApiResponse<T>;
  }).pipe(Effect.provide(FetchHttpClient.layer));
}

export const findProject = async (id: ProjectId) => {
  const params: SearchParamsType = {
    type: "project",
    columnFilterFns: {
      name: "contains",
      description: "contains",
      goal: "contains",
      stakeholders: "contains",
      status: "contains",
    },
    columnFilters: [{ id: "id", value: id }],
    pagination: { pageIndex: 0, pageSize: 1 },
    sorting: [],
  };

  const projects: Project[] = (await Effect.runPromise(search<Project>(params))).items;

  if (!projects[0]) {
    throw new Error("Project not found");
  }

  return projects[0];
};

export function findProjectQueryOption(id: ProjectId) {
  return queryOptions({
    queryKey: ["projets", id],
    queryFn: () => findProject(id),
  });
}

export function searchQueryOption<T>(searchParams: SearchParamsType) {
  if (searchParams.pagination.pageIndex > 0) {
    // previousSearchParams = searchParams.clone();
    // previousSearchParams.pagination.pageIndex -= 1;
    // check if results cached with previousSearchParams
    // fetch and set continuation token if available
    // function search<T>(searchParams: typeof SearchParams.Type): Effect.Effect<SearchApiResponse<T>, HttpApiDecodeError | HttpClientError | ParseError, never>
  }
  const body = {
    ...searchParams,
    globalFilter: searchParams.globalFilter || "",
  };

  return {
    queryKey: ["projets", body],
    queryFn: () => search<T>(body).pipe(Effect.runPromise),
  };
}
