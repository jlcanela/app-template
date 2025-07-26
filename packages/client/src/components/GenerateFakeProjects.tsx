import {
  Button,
  Card,
  Group,
  Loader,
  Notification,
  Select,
  Slider,
  Text,
  Title,
} from "@mantine/core";
import { DomainApi } from "@org/domain/domain-api";
import React from "react";

import { FetchHttpClient, HttpApiClient } from "@effect/platform";
import { useMutation } from "@tanstack/react-query";
import { Effect } from "effect";

import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ErrorIcon from "@mui/icons-material/Error";
import { type DBVersionType, dbVersionValues, type GenSampleType } from "@org/domain/api/admin-rpc";

const genSample = (param: GenSampleType) =>
  Effect.gen(function* () {
    const client = yield* HttpApiClient.make(DomainApi, {
      baseUrl: window.location.origin,
    });
    return yield* client.admin["generate-sample"]({ payload: param });
  }).pipe(Effect.provide(FetchHttpClient.layer));

//  TData = unknown, TError = DefaultError, TVariables = void, TContext = unknown
const useGenerateSample = () =>
  useMutation({
    mutationFn: async (param: GenSampleType) => {
      try {
        return await Effect.runPromise(genSample(param));
      } catch (error) {
        // Normalize error to a standard error
        throw new Error(error instanceof Error ? error.message : "Unknown error");
      }
    },
  });

export const GenerateFakeProjects = () => {
  const [dbVersion, setDbVersion] = React.useState<DBVersionType>("V1");
  const [size, setSize] = React.useState(10);
  const [notification, setNotification] = React.useState<{
    message: string;
    color: "green" | "red";
    icon: React.ReactNode;
  } | null>(null);

  // React Query v4: isLoading; v5: isPending
  const { mutate, status } = useGenerateSample();

  const handleGenerate = () => {
    mutate(
      { size, dbVersion },
      {
        onSuccess: (data: number) => {
          setNotification({
            message: `Successfully generated ${data} fake project(s)!`,
            color: "green",
            icon: <CheckCircleIcon fontSize="large" />,
          });
        },
        onError: (error: any) => {
          setNotification({
            message: error?.message || "An error occurred while generating fake projects.",
            color: "red",
            icon: <ErrorIcon fontSize="large" color="error" />,
          });
        },
      },
    );
  };

  return (
    <Card shadow="sm" padding="lg" radius="md" withBorder>
      <Title order={3} mb="md">
        Generate Fake Projects V1
      </Title>
      <Select
        label="Database Version"
        value={dbVersion}
        onChange={(value) => {
          if (value !== null) {
            setDbVersion(value as DBVersionType);
          }
        }}
        data={dbVersionValues.map((v) => ({ value: v, label: v }))}
        mb="md"
      />
      <Text mb="xs">Use the slider to select how many fake projects to generate (0–100).</Text>
      <Group align="flex-end">
        <Slider
          min={0}
          max={10000}
          value={size}
          onChange={setSize}
          marks={[
            { value: 0, label: "0" },
            { value: 1000, label: "1000" },
            { value: 5000, label: "5000" },
            { value: 10000, label: "10000" },
          ]}
          style={{ flex: 1, marginBottom: 20 }}
        />
        <Text size="lg" fw={700} style={{ width: 40, textAlign: "center" }}>
          {size}
        </Text>
      </Group>
      <Button
        mt="md"
        onClick={handleGenerate}
        disabled={status === "pending" || size === 0}
        leftSection={status === "pending" ? <Loader size={16} /> : undefined}
      >
        {status === "pending" ? "Generating..." : "Generate"}
      </Button>
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
