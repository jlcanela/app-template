import { type EntityTypes } from "@org/domain/api/search-rpc";
import {
  MantineReactTable,
  useMantineReactTable,
  type MRT_ColumnDef,
  type MRT_ColumnFilterFnsState,
  type MRT_ColumnFiltersState,
  type MRT_PaginationState,
  type MRT_RowData,
  type MRT_RowVirtualizer,
  type MRT_SortingState,
} from "mantine-react-table";
import React from "react";
import { useInfiniteSearch } from "../hooks/useSearch"; // adjust path!

type GenericTableProps<T extends MRT_RowData> = {
  columns: Array<MRT_ColumnDef<T>>;
  entityType: EntityTypes;
};

export const GenericInfiniteTable = <T extends MRT_RowData>({
  columns,
  entityType,
}: GenericTableProps<T>) => {
  const tableContainerRef = React.useRef<HTMLDivElement>(null); //we can get access to the underlying TableContainer element and react to its scroll events
  const rowVirtualizerInstanceRef =
    React.useRef<MRT_RowVirtualizer<HTMLDivElement, HTMLTableRowElement>>(null); //we can get access to the underlying Virtualizer instance and call its scrollToIndex method

  const [columnFilters, setColumnFilters] = React.useState<MRT_ColumnFiltersState>([]);
  const [columnFilterFns, setColumnFilterFns] = React.useState<MRT_ColumnFilterFnsState>(
    Object.fromEntries(columns.map(({ accessorKey }) => [accessorKey as string, "contains"])),
  );
  const [globalFilter, setGlobalFilter] = React.useState("");
  const [sorting, setSorting] = React.useState<MRT_SortingState>([]);
  const [pagination, setPagination] = React.useState<MRT_PaginationState>({
    pageIndex: 0,
    pageSize: 30,
  });

  const stableParams = React.useMemo(
    () => ({
      columnFilterFns,
      columnFilters,
      globalFilter,
      pagination,
      sorting,
    }),
    [columnFilterFns, columnFilters, globalFilter, pagination, sorting],
  );

  const { data, fetchNextPage, isError, isFetching, isLoading } = useInfiniteSearch<T>(
    entityType,
    stableParams,
  );

  const items = React.useMemo(() => data?.pages.flatMap((page) => page.items) ?? [], [data]);

  const totalDBRowCount = data?.pages[0]?.totalCount ?? 0;
  const totalFetched = items.length;

  const fetchMoreOnBottomReached = React.useCallback(
    (containerRefElement?: HTMLDivElement | null) => {
      if (containerRefElement) {
        const { clientHeight, scrollHeight, scrollTop } = containerRefElement;
        //once the user has scrolled within 400px of the bottom of the table, fetch more data if we can
        if (
          scrollHeight - scrollTop - clientHeight < 400 &&
          !isFetching &&
          totalFetched < totalDBRowCount
        ) {
          fetchNextPage();
        }
      }
    },
    [fetchNextPage, isFetching, totalFetched, totalDBRowCount],
  );

  //scroll to top of table when sorting or filters change
  React.useEffect(() => {
    if (rowVirtualizerInstanceRef.current) {
      try {
        rowVirtualizerInstanceRef.current.scrollToIndex(0);
      } catch (e) {
        // eslint-disable-next-line no-console
        console.error(e);
      }
    }
  }, [sorting, columnFilters, globalFilter]);

  const table = useMantineReactTable<T>({
    columns,
    data: items,
    enableColumnFilterModes: true,
    columnFilterModeOptions: ["contains", "startsWith", "endsWith"],
    initialState: { showColumnFilters: true },
    enablePagination: false,
    enableRowNumbers: true,
    enableRowVirtualization: true,
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
    mantineTableContainerProps: {
      ref: tableContainerRef, //get access to the table container element
      //sx: { maxHeight: '600px' }, //give the table a max height
      onScroll: (
        event: React.UIEvent<HTMLDivElement>, //add an event listener to the table container element
      ) => {
        fetchMoreOnBottomReached(event.target as HTMLDivElement);
      },
    },
    rowCount: totalDBRowCount,
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
    rowVirtualizerInstanceRef,
    // rowVirtualizerProps: { overscan: 10 },
  });

  return <MantineReactTable table={table} />;
};
