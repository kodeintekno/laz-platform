import React from "react";

interface AmilBalanceBadgeProps {
  availableBalance: number;
}

function formatRupiah(amount: number): string {
  return `Rp ${amount.toLocaleString("id-ID")}`;
}

export function AmilBalanceBadge({ availableBalance }: AmilBalanceBadgeProps) {
  const isEmpty = availableBalance <= 0;
  const color = isEmpty
    ? { bg: "#fef2f2", border: "#fca5a5", text: "#dc2626", dot: "#ef4444" }
    : { bg: "#f5f3ff", border: "#c4b5fd", text: "#6d28d9", dot: "#8b5cf6" };

  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "6px",
        backgroundColor: color.bg,
        border: `1px solid ${color.border}`,
        borderRadius: "999px",
        padding: "4px 12px 4px 8px",
        fontSize: "13px",
        fontWeight: 600,
        color: color.text,
      }}
    >
      <span
        style={{
          display: "inline-block",
          width: "8px",
          height: "8px",
          borderRadius: "50%",
          backgroundColor: color.dot,
          flexShrink: 0,
        }}
      />

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
        aria-hidden="true"
      >
        <path d="M3 10h18" />
        <path d="M5 6h14l2 4H3z" />
        <path d="M5 10v8" />
        <path d="M9 10v8" />
        <path d="M15 10v8" />
        <path d="M19 10v8" />
        <path d="M3 18h18" />
      </svg>

      <span>
        Sisa Saldo Amil Lembaga:{" "}
        <span style={{ letterSpacing: "0.01em" }}>
          {isEmpty ? "Habis" : formatRupiah(availableBalance)}
        </span>
      </span>
    </div>
  );
}
