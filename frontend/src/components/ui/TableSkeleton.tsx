import React from "react";
import { Skeleton } from "./Skeleton";

interface TableSkeletonProps {
  headers: string[];
  rowCount?: number;
  columnTypes?: ("text" | "avatar" | "image" | "action")[];
}

export function TableSkeleton({
  headers,
  rowCount = 3,
  columnTypes,
}: TableSkeletonProps) {
  return (
    <div className="space-y-4 w-full">
      <div className="overflow-hidden rounded-2xl bg-surface shadow-sm w-full">
        <table className="min-w-full divide-y divide-border/40 align-middle">
          <thead className="bg-surface-soft">
            <tr>
              {headers.map((header, idx) => (
                <th
                  key={idx}
                  scope="col"
                  className={`px-3 py-3.5 text-sm font-semibold text-primary text-left ${
                    idx === headers.length - 1 ? "text-right font-mono" : ""
                  }`}
                >
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border/40 bg-surface">
            {Array.from({ length: rowCount }).map((_, rIdx) => (
              <tr key={rIdx}>
                {headers.map((_, cIdx) => {
                  const type = columnTypes?.[cIdx] ?? (cIdx === headers.length - 1 ? "action" : "text");

                  return (
                    <td
                      key={cIdx}
                      className={`px-3 py-4 ${
                        cIdx === headers.length - 1 ? "text-right" : ""
                      }`}
                    >
                      {type === "avatar" && (
                        <div className="flex items-center gap-3">
                          <Skeleton className="h-8 w-8 rounded-full" />
                          <Skeleton className="h-5 w-32" />
                        </div>
                      )}
                      {type === "image" && (
                        <Skeleton className="h-10 w-10 rounded-lg" />
                      )}
                      {type === "text" && (
                        <Skeleton
                          className={`h-5 ${
                            cIdx % 2 === 0 ? "w-28" : cIdx % 3 === 0 ? "w-36" : "w-48"
                          }`}
                        />
                      )}
                      {type === "action" && (
                        <Skeleton className="h-5 w-8 ml-auto" />
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
