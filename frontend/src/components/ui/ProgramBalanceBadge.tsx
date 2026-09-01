import React from "react";

interface ProgramBalanceBadgeProps {
  programTitle: string;
  availableBalance: number;
  children?: React.ReactNode;
}

function formatRupiah(amount: number): string {
  return `Rp ${amount.toLocaleString("id-ID")}`;
}

export function ProgramBalanceBadge({ programTitle, availableBalance, children }: ProgramBalanceBadgeProps) {
  const isLow = availableBalance < 500_000;
  const isEmpty = availableBalance <= 0;

  const balanceColor = isEmpty
    ? { bg: "#fef2f2", border: "#fca5a5", text: "#dc2626", dot: "#ef4444" }
    : isLow
    ? { bg: "#fffbeb", border: "#fcd34d", text: "#b45309", dot: "#f59e0b" }
    : { bg: "#f0fdf4", border: "#86efac", text: "#15803d", dot: "#22c55e" };

  return (
    <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap", marginTop: "4px" }}>
      {/* Program Badge */}
      <div
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "6px",
          backgroundColor: "#f0f9ff",
          border: "1px solid #bae6fd",
          borderRadius: "999px",
          padding: "4px 12px 4px 8px",
          fontSize: "13px",
          fontWeight: 500,
          color: "#0369a1",
        }}
      >
        {/* Folder/Program Icon */}
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M3 7a2 2 0 0 1 2-2h3.93a2 2 0 0 1 1.66.9l.82 1.2A2 2 0 0 0 13.07 8H19a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
        </svg>
        <span>{programTitle}</span>
      </div>

      {/* Divider arrow */}
      <svg
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        stroke="#94a3b8"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{ flexShrink: 0 }}
      >
        <polyline points="9 18 15 12 9 6" />
      </svg>

      {/* Balance Badge */}
      <div
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "6px",
          backgroundColor: balanceColor.bg,
          border: `1px solid ${balanceColor.border}`,
          borderRadius: "999px",
          padding: "4px 12px 4px 8px",
          fontSize: "13px",
          fontWeight: 600,
          color: balanceColor.text,
        }}
      >
        {/* Pulsing dot */}
        <span
          style={{
            display: "inline-block",
            width: "8px",
            height: "8px",
            borderRadius: "50%",
            backgroundColor: balanceColor.dot,
            flexShrink: 0,
          }}
        />

        {/* Wallet Icon */}
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{ flexShrink: 0 }}
        >
          <path d="M21 12V7H5a2 2 0 0 1 0-4h14v4" />
          <path d="M3 5v14a2 2 0 0 0 2 2h16v-5" />
          <path d="M18 12a2 2 0 0 0 0 4h4v-4z" />
        </svg>

        <span>
          Sisa Saldo Utama / Mustahiq:{" "}
          <span style={{ letterSpacing: "0.01em" }}>
            {isEmpty ? "Habis" : formatRupiah(availableBalance)}
          </span>
        </span>
      </div>

      {children}
    </div>
  );
}
