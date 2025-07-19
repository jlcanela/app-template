import { EntityTypes } from "@org/domain/api/search-rpc";
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
import { useCallback, useEffect, useMemo, useRef, useState, type UIEvent } from "react";
import { useInfiniteSearch } from "../hooks/useSearch"; // adjust path!

type GenericTableProps<T extends MRT_RowData> = {
  columns: MRT_ColumnDef<T>[];
  entityType: EntityTypes;
};

export function GenericInfiniteTable<T extends MRT_RowData>({
  columns,
  entityType,
}: GenericTableProps<T>) {
  const tableContainerRef = useRef<HTMLDivElement>(null); //we can get access to the underlying TableContainer element and react to its scroll events
  const rowVirtualizerInstanceRef =
    useRef<MRT_RowVirtualizer<HTMLDivElement, HTMLTableRowElement>>(null); //we can get access to the underlying Virtualizer instance and call its scrollToIndex method

  const [columnFilters, setColumnFilters] = useState<MRT_ColumnFiltersState>([]);
  const [columnFilterFns, setColumnFilterFns] = useState<MRT_ColumnFilterFnsState>(
    Object.fromEntries(columns.map(({ accessorKey }) => [accessorKey as string, "contains"])),
  );
  const [globalFilter, setGlobalFilter] = useState("");
  const [sorting, setSorting] = useState<MRT_SortingState>([]);
  const [pagination, setPagination] = useState<MRT_PaginationState>({
    pageIndex: 0,
    pageSize: 30,
  });

  const stableParams = useMemo(
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

  const items = useMemo(() => data?.pages.flatMap((page) => page.items) ?? [], [data]);

  const totalDBRowCount = data?.pages?.[0]?.totalCount ?? 0;
  console.log("Total DB Row Count:", totalDBRowCount);
  const totalFetched = items.length;

  const fetchMoreOnBottomReached = useCallback(
    (containerRefElement?: HTMLDivElement | null) => {
      console.log("Checking if more data should be fetched...");
      if (containerRefElement) {
        const { scrollHeight, scrollTop, clientHeight } = containerRefElement;
        console.log("scrollok:", scrollHeight - scrollTop - clientHeight < 400);
        //once the user has scrolled within 400px of the bottom of the table, fetch more data if we can
        if (
          scrollHeight - scrollTop - clientHeight < 400 &&
          !isFetching &&
          totalFetched < totalDBRowCount
        ) {
          console.log("Fetching more data...");
          fetchNextPage();
        }
      }
    },
    [fetchNextPage, isFetching, totalFetched, totalDBRowCount],
  );

  //scroll to top of table when sorting or filters change
  useEffect(() => {
    if (rowVirtualizerInstanceRef.current) {
      try {
        rowVirtualizerInstanceRef.current.scrollToIndex(0);
      } catch (e) {
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
        event: UIEvent<HTMLDivElement>, //add an event listener to the table container element
      ) => fetchMoreOnBottomReached(event.target as HTMLDivElement),
    },
    rowCount: totalDBRowCount,
    state: {
      columnFilterFns,
      columnFilters,
      globalFilter,
      isLoading,
      pagination,
      showAlertBanner: !!isError,
      showProgressBars: isFetching,
      sorting,
    },
    rowVirtualizerInstanceRef,
    // rowVirtualizerProps: { overscan: 10 },
  });

  return <MantineReactTable table={table} />;
}
