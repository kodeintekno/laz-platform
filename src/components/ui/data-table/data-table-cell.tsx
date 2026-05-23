import React from "react";

interface DataTableCellProps {
  align?: "left" | "center" | "right";
  width?: string;
  className?: string;
  children: React.ReactNode;
}

export function DataTableCell({
  align = "left",
  width,
  className = "",
  children,
}: DataTableCellProps) {
  const alignClass = {
    left: "text-left",
    center: "text-center",
    right: "text-right",
  }[align];

  return (
    <td
      className={`px-3 py-4 text-sm text-gray-500 whitespace-nowrap ${alignClass} ${className}`}
      style={width ? { width } : undefined}
    >
      {children}
    </td>
  );
}
