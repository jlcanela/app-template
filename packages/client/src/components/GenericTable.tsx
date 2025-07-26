import { type EntityTypes } from "@org/domain/api/search-rpc";
import {
  MantineReactTable,
  useMantineReactTable,
  type MRT_ColumnDef,
  type MRT_ColumnFilterFnsState,
  type MRT_ColumnFiltersState,
  type MRT_PaginationState,
  type MRT_RowData,
  type MRT_SortingState,
} from "mantine-react-table";
import React from "react";
import { useSearch } from "../hooks/useSearch"; // adjust path!

type GenericTableProps<T extends MRT_RowData> = {
  columns: MRT_ColumnDef<T>[];
  entityType: EntityTypes;
};

export function GenericTable<T extends MRT_RowData>({ columns, entityType }: GenericTableProps<T>) {
  const [columnFilters, setColumnFilters] = React.useState<MRT_ColumnFiltersState>([]);
  const [columnFilterFns, setColumnFilterFns] = React.useState<MRT_ColumnFilterFnsState>(
    Object.fromEntries(columns.map(({ accessorKey }) => [accessorKey as string, "contains"])),
  );
  const [globalFilter, setGlobalFilter] = React.useState("");
  const [sorting, setSorting] = React.useState<MRT_SortingState>([]);
  const [pagination, setPagination] = React.useState<MRT_PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });

  const { data, isError, isFetching, isLoading } = useSearch<T>(entityType, {
    columnFilterFns,
    columnFilters,
    globalFilter,
    pagination,
    sorting,
  });

  const items = data?.items ?? [];
  const totalRowCount = data?.totalCount ?? 0;

  const table = useMantineReactTable<T>({
    columns,
    data: items,
    enableColumnFilterModes: true,
    columnFilterModeOptions: ["contains", "startsWith", "endsWith"],
    initialState: { showColumnFilters: true },
    manualFiltering: true,
    manualPagination: true,
    manualSorting: true,
    // Fix types here
    // mantineToolbarAlertBannerProps: isError
    //   ? {
    //       color: "red",
    //       children: "Error loading data",
    //     }
    //   : undefined,

    onColumnFilterFnsChange: setColumnFilterFns,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    onPaginationChange: setPagination,
    onSortingChange: setSorting,
    // renderTopToolbarCustomActions: () => (
    //   <Tooltip label="Refresh Data">
    //     <ActionIcon onClick={() => refetch()} variant="light" size="lg">
    //       <IconRefresh />
    //     </ActionIcon>
    //   </Tooltip>
    // ),
    rowCount: totalRowCount,
    state: {
      columnFilterFns,
      columnFilters,
      globalFilter,
      isLoading,
      pagination,
      showAlertBanner: Boolean(isError),
      showProgressBars: isFetching,
      sorting,
    },
  });

  return <MantineReactTable table={table} />;
}
