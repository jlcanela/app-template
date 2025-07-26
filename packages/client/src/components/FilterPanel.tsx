import {
  Button,
  Chip,
  Collapse,
  Divider,
  Group,
  MultiSelect,
  Paper,
  Select,
  Stack,
  Text,
  TextInput,
  Title,
} from "@mantine/core";
import React from "react";

import type { SearchableFieldInfo } from "@/hooks/swagger-hooks";

export const DynamicFilterPanel = ({
  fields,
  onApply,
}: {
  fields: Array<SearchableFieldInfo>;
  onApply: (filterState: { [field: string]: any }) => void;
}) => {
  const [open, setOpen] = React.useState(false);
  // For string fields: array of values; for enum: array of selected enums
  const [filterState, setFilterState] = React.useState<{ [field: string]: Array<string> }>({});
  const [selectedField, setSelectedField] = React.useState<string | null>(null);
  const [inputValue, setInputValue] = React.useState<string>("");

  // Partition fields
  const stringFields = fields.filter((f) => f.type === "string" && Boolean(f.enum));
  const enumFields = fields.filter((f) => Boolean(f.enum));

  // Call onApply whenever filterState changes
  React.useEffect(() => {
    onApply(filterState);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterState]);

  // Add a filter value for string fields
  const handleAddStringFilter = () => {
    if (selectedField === null) return;
    const prev = filterState[selectedField] ?? [];
    if (!prev.includes(inputValue)) {
      setFilterState((prevState) => ({
        ...prevState,
        [selectedField]: [...prev, inputValue],
      }));
    }
    setInputValue("");
  };

  // Remove a single value for a string field
  const handleRemoveStringValue = (field: string, value: string) => {
    setFilterState((prev) => {
      const arr = prev[field] ?? [];
      const next = arr.filter((v: string) => v !== value);
      if (next.length === 0) {
        const { [field]: _, ...rest } = prev;
        return rest;
      }
      return { ...prev, [field]: next };
    });
  };

  // Update enum field values
  const handleEnumChange = (field: string, values: Array<string>) => {
    setFilterState((prev) => ({
      ...prev,
      [field]: values,
    }));
  };

  const handleClearAll = () => {
    setFilterState({});
  };

  return (
    <React.Fragment>
      <Group mb="md">
        <Button
          leftSection={
            <span role="img" aria-label="filter">
              🔍
            </span>
          }
          variant={open ? "filled" : "outline"}
          onClick={() => {
            setOpen((v) => !v);
            onApply(filterState); // Apply current filters when toggling
          }}
        >
          {open ? "Hide Filters" : "Show Filters"}
        </Button>
        {Object.keys(filterState).length > 0 && (
          <Button size="xs" variant="light" color="gray" onClick={handleClearAll}>
            Clear all
          </Button>
        )}
      </Group>
      <Collapse in={open}>
        <Paper withBorder shadow="xs" p="md" mb="md">
          <Stack gap="md">
            {/* TEXT FIELDS */}
            <Title order={5}>Filters</Title>
            <Group align="end">
              <Select
                label="Select field"
                placeholder="Select field"
                data={stringFields.map((f) => ({
                  value: f.name,
                  label: capitalize(f.name),
                }))}
                value={selectedField}
                onChange={(value) => {
                  setSelectedField(value);
                  setInputValue("");
                }}
                searchable
                allowDeselect
                style={{ minWidth: 180 }}
              />
              <TextInput
                label={selectedField === null ? "Filter value" : `Filter by ${selectedField}`}
                value={inputValue}
                onChange={(e) => {
                  setInputValue(e.target.value);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleAddStringFilter();
                }}
                disabled={selectedField === null}
                style={{ minWidth: 200 }}
              />
              <Button
                disabled={
                  selectedField === null ||
                  inputValue.length === 0 ||
                  (filterState[selectedField]?.includes(inputValue) ?? false)
                }
                onClick={handleAddStringFilter}
              >
                Add filter
              </Button>
            </Group>
            {/* Chips for string fields */}
            <Group>
              {stringFields.flatMap((field) =>
                (filterState[field.name] ?? []).map((val) => (
                  <Chip
                    key={field.name + val}
                    checked
                    onChange={() => {
                      handleRemoveStringValue(field.name, val);
                    }}
                    color="blue"
                    variant="filled"
                  >
                    {capitalize(field.name)}: {val}
                  </Chip>
                )),
              )}
            </Group>

            <Divider my="sm" />

            {/* ENUM FIELDS */}
            {enumFields.map((field) => (
              <div key={field.name}>
                <Group align="center">
                  <Text>{capitalize(field.name)}</Text>
                  <MultiSelect
                    data={field.enum!.map((v: string) => ({
                      value: v,
                      label: v,
                    }))}
                    value={filterState[field.name] ?? []}
                    onChange={(values) => {
                      handleEnumChange(field.name, values);
                    }}
                    placeholder={`Select ${field.name}`}
                    clearable
                    searchable
                    style={{ minWidth: 200 }}
                  />
                </Group>
              </div>
            ))}
          </Stack>
        </Paper>
      </Collapse>
    </React.Fragment>
  );
};

function capitalize(str: string) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}
