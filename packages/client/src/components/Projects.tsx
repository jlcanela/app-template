import { Text } from "@mantine/core";
import "@mantine/core/styles.css";
import "@mantine/dates/styles.css"; //if using mantine date picker features
import type { ProjectType } from "@org/domain/api/projects-rpc";
import { Link } from "@tanstack/react-router";
import { type MRT_ColumnDef } from "mantine-react-table";
import "mantine-react-table/styles.css"; //make sure MRT styles were imported in your app root (once)
import { GenericInfiniteTable } from "./GenericInfiniteTable";

const projectColumns: MRT_ColumnDef<ProjectType>[] = [
  {
    accessorKey: "name",
    header: "Name",
    Cell: ({ row }) => {
      const projectId = `${row.original.id}`;
      return (
        <Link
          to="/projects/$id"
          params={{ id: projectId }}
          style={{ color: "var(--mantine-primary-color)", textDecoration: "none" }}
        >
          <Text component="span" fw={500}>
            {row.original.name}
          </Text>
        </Link>
      );
    },
  },
  { accessorKey: "description", header: "Description" },
  { accessorKey: "goal", header: "Goal" },
  { accessorKey: "stakeholders", header: "Stakeholders" },
  { accessorKey: "status", header: "Status" },
  // add more as needed
];
const Projects = () => (
  <div style={{ height: "100%", display: "flex", flexDirection: "column" }}>
    <GenericInfiniteTable<ProjectType> columns={projectColumns} entityType="project" />
  </div>
);

export default Projects;
