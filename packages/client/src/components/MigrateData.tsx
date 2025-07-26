import { FetchHttpClient, HttpApiClient } from "@effect/platform";
import { Button, Card, Loader, Notification, Textarea, Title } from "@mantine/core";
import { DomainApi } from "@org/domain/domain-api";
import { useMutation } from "@tanstack/react-query";
import { Effect } from "effect";
import React from "react";

import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ErrorIcon from "@mui/icons-material/Error";

// Define the Effectful API call for migration
const migrateEffect = Effect.gen(function* () {
  const client = yield* HttpApiClient.make(DomainApi, {
    baseUrl: window.location.origin,
  });
  return yield* client.admin["migrate-data"](); // Assumes migrate API requires no params
}).pipe(Effect.provide(FetchHttpClient.layer));

// React Query mutation hook
const useMigrate = () =>
  useMutation({
    mutationFn: async () => {
      try {
        await Effect.runPromise(migrateEffect);
        return;
      } catch (error) {
        throw new Error(error instanceof Error ? error.message : "Unknown error");
      }
    },
  });

// React Component
export const MigrateToLatestVersion = () => {
  const [logs, setLogs] = React.useState("");
  const [notification, setNotification] = React.useState<{
    message: string;
    color: "green" | "red";
    icon: React.ReactNode;
  } | null>(null);

  const { mutate, status } = useMigrate();

  const handleMigrate = () => {
    setLogs(""); // Clear previous logs
    mutate(undefined, {
      onSuccess: () => {
        setNotification({
          message: "Migration completed successfully",
          color: "green",
          icon: <CheckCircleIcon fontSize="large" />,
        });
        setLogs("Migration complete."); // assume data is log string
      },
      onError: (error: any) => {
        setNotification({
          message: error?.message || "Migration failed.",
          color: "red",
          icon: <ErrorIcon fontSize="large" />,
        });
        setLogs(`❌ Error: ${error?.message}`);
      },
    });
  };

  return (
    <Card shadow="sm" padding="lg" radius="md" withBorder>
      <Title order={3} mb="md">
        Migrate to Latest Version
      </Title>

      <Button
        onClick={handleMigrate}
        disabled={status === "pending"}
        leftSection={status === "pending" ? <Loader size={16} /> : undefined}
        mb="md"
      >
        {status === "pending" ? "Migrating..." : "Migrate"}
      </Button>

      <Textarea
        value={logs}
        onChange={() => {}}
        placeholder="Migration logs will appear here..."
        minRows={8}
        autosize
        readOnly
      />

      {notification !== null && (
        <Notification
          color={notification.color}
          icon={notification.icon}
          mt="md"
          onClose={() => {
            setNotification(null);
          }}
          withCloseButton
        >
          {notification.message}
        </Notification>
      )}
    </Card>
  );
};
