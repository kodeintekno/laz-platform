import React from "react";

export interface ColumnDef<TData> {
  /** Label for table column header */
  header: string | React.ReactNode;
  
  /** Object accessor path (supports nested paths like 'donation.program.title') */
  accessorKey?: string;
  
  /** Custom render cell template function */
  cell?: (item: TData) => React.ReactNode;
  
  /** Boolean toggle to define if the column header has sort click actions */
  sortable?: boolean;
  
  /** Key to pass to the sort query if different from accessorKey */
  sortKey?: string;
  
  /** Alignment of content inside column cells */
  align?: "left" | "center" | "right";
  
  /** Custom CSS width limit for cells */
  width?: string;
}

export { DataTable } from "./data-table";
export { DataTableHeader } from "./data-table-header";
export { DataTableBody } from "./data-table-body";
export { DataTableCell } from "./data-table-cell";
export { DataTableToolbar } from "./data-table-toolbar";
export { DataTablePagination } from "./data-table-pagination";
export { DataTableEmpty } from "./data-table-empty";
