import { keepPreviousData, useQuery } from "@tanstack/react-query";
import {
  MRT_ColumnFilterFnsState,
  MRT_ColumnFiltersState,
  MRT_PaginationState,
  MRT_SortingState,
} from "mantine-react-table";

type SearchApiResponse<T> = {
  items: Array<T>;
  meta: {
    totalRowCount: number;
  };
};

interface Params {
  columnFilterFns: MRT_ColumnFilterFnsState;
  columnFilters: MRT_ColumnFiltersState;
  globalFilter: string;
  sorting: MRT_SortingState;
  pagination: MRT_PaginationState;
}

export function useSearch<T>(type: string, params: Params) {
  const body = {
    type, // pass the entity type as a param!
    ...params,
  };

  const fetchURL = new URL("/api/search", window.location.origin);

  return useQuery<SearchApiResponse<T>>({
    queryKey: [type, body],
    queryFn: async () => {
      const response = await fetch(fetchURL.href, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      return await response.json();
    },
    placeholderData: keepPreviousData,
    staleTime: 30_000,
  });
}
