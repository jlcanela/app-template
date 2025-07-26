import { search, searchQueryOption } from "@/utils/fetchProjects";
import { keepPreviousData, useInfiniteQuery, useQuery } from "@tanstack/react-query";
import {
  type MRT_ColumnFilterFnsState,
  type MRT_ColumnFiltersState,
  type MRT_PaginationState,
  type MRT_SortingState,
} from "mantine-react-table";

import { type SearchApiResponse } from "@/utils/fetchProjects"; // Adjust the import path as necessary
import { type EntityTypes, type SearchParamsType } from "@org/domain/api/search-rpc";
import { Effect } from "effect";

interface Params {
  columnFilterFns: MRT_ColumnFilterFnsState;
  columnFilters: MRT_ColumnFiltersState;
  globalFilter: string;
  sorting: MRT_SortingState;
  pagination: MRT_PaginationState;
}

export function useSearch<T>(type: EntityTypes, params: Params) {
  const body: SearchParamsType = {
    type,
    ...params,
  };

  const query = searchQueryOption<T>(body);

  return useQuery<SearchApiResponse<T>>({
    ...query,
    placeholderData: keepPreviousData,
  });
}

// Fetch projects with a continuation token
export function useInfiniteSearch<T>(type: EntityTypes, params: Params) {
  const baseParams: SearchParamsType = {
    type,
    ...params,
  };

  return useInfiniteQuery({
    queryKey: ["projects", type, params],
    queryFn: async ({ pageParam }: { pageParam?: string | null }) => {
      console.log("Fetching page with params:", { ...baseParams, continuationToken: pageParam });
      const effectiveParams: SearchParamsType = {
        ...baseParams,
        continuationToken: pageParam ?? undefined,
      };

      return search<T>(effectiveParams).pipe(Effect.runPromise);
    },
    initialPageParam: null,
    getNextPageParam: (lastPage: SearchApiResponse<T>) => lastPage.continuationToken ?? undefined,
    refetchOnMount: false,
    refetchOnReconnect: false,
    refetchOnWindowFocus: true,
    //keepPreviousData: true, // optional, for UI smoothness
  });
}
