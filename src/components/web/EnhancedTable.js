import React, { useState, useMemo } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Platform } from 'react-native';
import { Text, DataTable, Button, IconButton, TextInput } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';

/**
 * Enhanced table component with sorting, filtering, and pagination (web-optimized)
 */
export default function EnhancedTable({
  data = [],
  columns = [],
  sortable = true,
  filterable = false,
  pagination = true,
  pageSize = 10,
  onExport,
  style,
  ...props
}) {
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  const [filterText, setFilterText] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  // Filter data
  const filteredData = useMemo(() => {
    if (!filterable || !filterText) return data;
    
    return data.filter((row) => {
      return columns.some((col) => {
        const value = row[col.key];
        return value?.toString().toLowerCase().includes(filterText.toLowerCase());
      });
    });
  }, [data, filterText, filterable, columns]);

  // Sort data
  const sortedData = useMemo(() => {
    if (!sortConfig.key || !sortable) return filteredData;

    return [...filteredData].sort((a, b) => {
      const aValue = a[sortConfig.key];
      const bValue = b[sortConfig.key];

      if (aValue === null || aValue === undefined) return 1;
      if (bValue === null || bValue === undefined) return -1;

      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return sortConfig.direction === 'asc' ? aValue - bValue : bValue - aValue;
      }

      const aStr = aValue.toString().toLowerCase();
      const bStr = bValue.toString().toLowerCase();

      if (sortConfig.direction === 'asc') {
        return aStr.localeCompare(bStr);
      } else {
        return bStr.localeCompare(aStr);
      }
    });
  }, [filteredData, sortConfig, sortable]);

  // Paginate data
  const paginatedData = useMemo(() => {
    if (!pagination) return sortedData;
    
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    return sortedData.slice(startIndex, endIndex);
  }, [sortedData, currentPage, pageSize, pagination]);

  const totalPages = Math.ceil(sortedData.length / pageSize);

  const handleSort = (key) => {
    if (!sortable) return;

    setSortConfig((prev) => {
      if (prev.key === key) {
        return {
          key,
          direction: prev.direction === 'asc' ? 'desc' : 'asc',
        };
      }
      return { key, direction: 'asc' };
    });
  };

  const handleExport = () => {
    if (!onExport) return;

    // Convert to CSV
    const headers = columns.map((col) => col.label || col.key).join(',');
    const rows = sortedData.map((row) =>
      columns.map((col) => {
        const value = row[col.key];
        // Escape commas and quotes in CSV
        if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return value ?? '';
      }).join(',')
    );

    const csv = [headers, ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'table-export.csv';
    link.click();
    URL.revokeObjectURL(url);
  };

  const renderHeader = () => (
    <DataTable.Header style={styles.header}>
      {columns.map((column) => (
        <DataTable.Title
          key={column.key}
          style={[styles.headerCell, column.style]}
          sortDirection={
            sortConfig.key === column.key
              ? sortConfig.direction === 'asc'
                ? 'ascending'
                : 'descending'
              : null
          }
          onPress={sortable && column.sortable !== false ? () => handleSort(column.key) : undefined}
        >
          {column.label || column.key}
          {sortable && column.sortable !== false && sortConfig.key === column.key && (
            <Ionicons
              name={sortConfig.direction === 'asc' ? 'chevron-up' : 'chevron-down'}
              size={16}
              color="#4CAF50"
              style={{ marginLeft: 4 }}
            />
          )}
        </DataTable.Title>
      ))}
    </DataTable.Header>
  );

  const renderRow = (row, index) => (
    <DataTable.Row key={index} style={styles.row}>
      {columns.map((column) => (
        <DataTable.Cell key={column.key} style={[styles.cell, column.style]}>
          {column.render ? column.render(row[column.key], row) : String(row[column.key] ?? '')}
        </DataTable.Cell>
      ))}
    </DataTable.Row>
  );

  if (Platform.OS !== 'web') {
    // Fallback for mobile - use simple DataTable
    return (
      <DataTable style={style}>
        {renderHeader()}
        {paginatedData.map((row, index) => renderRow(row, index))}
      </DataTable>
    );
  }

  return (
    <View style={[styles.container, style]}>
      {/* Toolbar */}
      <View style={styles.toolbar}>
        {filterable && (
          <View style={styles.filterContainer}>
            <TextInput
              placeholder="Filter..."
              value={filterText}
              onChangeText={setFilterText}
              style={styles.filterInput}
              right={<TextInput.Icon icon="magnify" />}
            />
          </View>
        )}
        {onExport && (
          <Button
            mode="outlined"
            onPress={handleExport}
            icon="download"
            style={styles.exportButton}
          >
            Export CSV
          </Button>
        )}
      </View>

      {/* Table */}
      <ScrollView horizontal style={styles.scrollView}>
        <DataTable style={styles.table}>
          {renderHeader()}
          {paginatedData.length > 0 ? (
            paginatedData.map((row, index) => renderRow(row, index))
          ) : (
            <DataTable.Row>
              <DataTable.Cell style={styles.emptyCell}>
                <Text style={styles.emptyText}>No data available</Text>
              </DataTable.Cell>
            </DataTable.Row>
          )}
        </DataTable>
      </ScrollView>

      {/* Pagination */}
      {pagination && totalPages > 1 && (
        <View style={styles.pagination}>
          <Button
            mode="outlined"
            onPress={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
            icon="chevron-left"
          >
            Previous
          </Button>
          <Text style={styles.pageInfo}>
            Page {currentPage} of {totalPages} ({sortedData.length} total)
          </Text>
          <Button
            mode="outlined"
            onPress={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
            disabled={currentPage === totalPages}
            icon="chevron-right"
          >
            Next
          </Button>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a2e',
  },
  toolbar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#0f0f1e',
    borderBottomWidth: 1,
    borderBottomColor: '#2a2a3e',
  },
  filterContainer: {
    flex: 1,
    maxWidth: 300,
  },
  filterInput: {
    backgroundColor: '#1a1a2e',
  },
  exportButton: {
    marginLeft: 16,
  },
  scrollView: {
    flex: 1,
  },
  table: {
    backgroundColor: '#1a1a2e',
  },
  header: {
    backgroundColor: '#0f0f1e',
  },
  headerCell: {
    padding: 12,
  },
  row: {
    borderBottomWidth: 1,
    borderBottomColor: '#2a2a3e',
  },
  cell: {
    padding: 12,
  },
  emptyCell: {
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    color: '#888',
    fontSize: 14,
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#0f0f1e',
    borderTopWidth: 1,
    borderTopColor: '#2a2a3e',
  },
  pageInfo: {
    color: '#fff',
    fontSize: 14,
  },
});

