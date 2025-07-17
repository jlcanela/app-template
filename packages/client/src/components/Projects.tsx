import "@mantine/core/styles.css";
import "@mantine/dates/styles.css"; //if using mantine date picker features
import "mantine-react-table/styles.css"; //make sure MRT styles were imported in your app root (once)

import { type MRT_ColumnDef } from "mantine-react-table";
import { GenericTable } from "./GenericTable";

type Project = {
  id?: string;
  name?: string;
  description?: string;
  goal?: string;
  stakeholders?: string;
  status?: "Draft" | "Active" | "Completed" | "Archived";
};

const projectColumns: MRT_ColumnDef<Project>[] = [
  { accessorKey: "name", header: "Name" },
  { accessorKey: "description", header: "Description" },
  { accessorKey: "goal", header: "Goal" },
  { accessorKey: "stakeholders", header: "Stakeholders" },
  { accessorKey: "status", header: "Status" },
  // add more as needed
];
const Projects = () => <GenericTable<Project> columns={projectColumns} entityType="project" />;

export default Projects;
