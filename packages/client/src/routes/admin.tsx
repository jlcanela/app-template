import { GenerateFakeProjects } from "@/components/GenerateFakeProjects";
import { MigrateToLatestVersion } from "@/components/MigrateData";
import { ValidateData } from "@/components/ValidateData";
import { Stack, Title } from "@mantine/core";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/admin")({
  component: AdminPage,
});

function AdminPage() {
  return (
    <>
      <Stack mx="auto" my="xl" maw={600}>
        <Title order={1}>Administration Page</Title>
        <GenerateFakeProjects />
        <MigrateToLatestVersion />
        <ValidateData />
      </Stack>
    </>
  );
}
