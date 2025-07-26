import { FetchHttpClient, HttpApiClient } from "@effect/platform";
import { Button, Card, Loader, Notification, Textarea, Title } from "@mantine/core";
import { DomainApi } from "@org/domain/domain-api";
import { useMutation } from "@tanstack/react-query";
import { Effect } from "effect";
import React from "react";

import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ErrorIcon from "@mui/icons-material/Error";

// Define the Effectful API call for migration
const validateEffect = Effect.gen(function* () {
  const client = yield* HttpApiClient.make(DomainApi, {
    baseUrl: window.location.origin,
  });
  return yield* client.admin["validate-data"](); // Assumes validate API requires no params
}).pipe(Effect.provide(FetchHttpClient.layer));

// React Query mutation hook
const useValidate = () =>
  useMutation({
    mutationFn: async () => {
      try {
        await Effect.runPromise(validateEffect);
        return;
      } catch (error) {
        throw new Error(error instanceof Error ? error.message : "Unknown error");
      }
    },
  });

// React Component
export const ValidateData = () => {
  const [logs, setLogs] = React.useState("");
  const [notification, setNotification] = React.useState<{
    message: string;
    color: "green" | "red";
    icon: React.ReactNode;
  } | null>(null);

  const { mutate, status } = useValidate();

  const handleValidate = () => {
    setLogs(""); // Clear previous logs
    mutate(undefined, {
      onSuccess: () => {
        setNotification({
          message: "Validation completed successfully",
          color: "green",
          icon: <CheckCircleIcon fontSize="large" />,
        });
        setLogs("Validation complete."); // assume data is log string
      },
      onError: (error: any) => {
        setNotification({
          message: error?.message ?? "Validation failed.",
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
        Validate all Data
      </Title>

      <Button
        onClick={handleValidate}
        disabled={status === "pending"}
        leftSection={status === "pending" ? <Loader size={16} /> : undefined}
        mb="md"
      >
        {status === "pending" ? "Validating..." : "Validate"}
      </Button>

      <Textarea
        value={logs}
        onChange={() => {}}
        placeholder="Validation logs will appear here..."
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
