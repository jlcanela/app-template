import { findProjectQueryOption } from "@/utils/fetchProjects";
import {
  Alert,
  Badge,
  Button,
  Card,
  Center,
  Container,
  Group,
  Stack,
  Text,
  Title,
} from "@mantine/core";
import ErrorIcon from "@mui/icons-material/Error";
import { ProjectId } from "@org/domain/api/projects-rpc";
import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/projects/$id")({
  loader: ({ context: { queryClient }, params: { id } }) =>
    queryClient.ensureQueryData(findProjectQueryOption(ProjectId.make(id))),
  component: ProjectDetailsPage,
  errorComponent: ProjectErrorPage,
});

export function ProjectErrorPage({ error }: { error: Error }) {
  return (
    <Container size="sm" py="xl">
      <Card
        withBorder
        shadow="sm"
        padding="xl"
        radius="md"
        w={{ base: "100%", sm: "90%", md: "70%" }}
        mx="auto"
      >
        <Stack gap="lg">
          <Alert
            icon={<ErrorIcon fontSize="large" color="error" />}
            title="Project not found"
            color="red"
            radius="md"
          >
            {error.message || "We could not find this project."}
          </Alert>

          <Center>
            <Button component={Link} to="/" variant="light">
              Back to Projects
            </Button>
          </Center>
        </Stack>
      </Card>
    </Container>
  );
}

function ProjectDetailsPage() {
  const { id } = Route.useParams();
  const project = useSuspenseQuery(findProjectQueryOption(ProjectId.make(id))).data!;

  return (
    <Card
      shadow="sm"
      padding="lg"
      radius="md"
      withBorder
      w={{ base: "100%", md: "80%", lg: "50%" }} // Responsive width
      mx="auto"
    >
      <Group justify="space-between" align="center" mb="md">
        <Title order={3}>{project.name}</Title>
        <Badge variant="light" color={project.status === "Active" ? "green" : "blue"}>
          {project.status}
        </Badge>
      </Group>

      <Stack gap="xs">
        <Text size="sm" c="dimmed">
          {project.description}
        </Text>

        <Text>
          <strong>Goal:</strong> {project.goal}
        </Text>

        <Text>
          <strong>Stakeholders:</strong> {project.stakeholders}
        </Text>

        <Text size="xs" c="gray.6" mt="sm">
          <strong>Project ID:</strong> {project.id}
        </Text>
      </Stack>
    </Card>
  );
}
