<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{
  columns?: string[] | any[];
  rows?: number | any[][];
  border?: boolean;
  headerColor?: string;
}>();

// Parse columns if they're provided as a string
const tableColumns = computed(() => {
  if (!props.columns) return ['Column 1', 'Column 2', 'Column 3'];

  if (typeof props.columns === 'string') {
    try {
      // Try to parse as JSON if it's a string
      return JSON.parse(props.columns);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      return ['Column 1', 'Column 2', 'Column 3'];
    }
  }

  return props.columns;
});

// Generate rows data
const tableRows = computed(() => {
  // If rows is an array of arrays, use it directly
  if (Array.isArray(props.rows) && props.rows.length > 0 && Array.isArray(props.rows[0])) {
    return props.rows;
  }

  // Otherwise, generate empty rows based on the number specified
  const rowCount = typeof props.rows === 'number' ? props.rows : 3;
  const columnCount = tableColumns.value.length;

  return Array.from({ length: rowCount }, (_, rowIndex) =>
    Array.from({ length: columnCount }, (_, colIndex) =>
      `Row ${rowIndex + 1}, Col ${colIndex + 1}`
    )
  );
});
</script>

<template>
  <div class="table-flutter">
    <table :class="{ 'with-border': props.border !== false }">
      <thead>
        <tr>
          <th
            v-for="(column, index) in tableColumns"
            :key="index"
            :style="{ backgroundColor: props.headerColor || '#E0E0E0' }"
          >
            {{ column }}
          </th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(row, rowIndex) in tableRows" :key="rowIndex">
          <td v-for="(cell, cellIndex) in row" :key="cellIndex">
            {{ cell }}
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<style scoped>
.table-flutter {
  font-family: 'Roboto', sans-serif;
  padding: 8px;
  overflow-x: auto;
  max-width: 100%;
}

table {
  width: 100%;
  border-collapse: collapse;
}

th, td {
  padding: 12px 16px;
  text-align: left;
}

th {
  font-weight: 500;
  color: rgba(0, 0, 0, 0.87);
}

td {
  color: rgba(0, 0, 0, 0.6);
}

.with-border th, .with-border td {
  border: 1px solid #E0E0E0;
}

tbody tr:nth-child(even) {
  background-color: rgba(0, 0, 0, 0.02);
}

tbody tr:hover {
  background-color: rgba(0, 0, 0, 0.04);
}
</style>
