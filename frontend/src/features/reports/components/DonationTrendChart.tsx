"use client";

import React, { useState, useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { BarChart2, TrendingUp } from "lucide-react";

interface ProgramOption {
  id: string;
  title: string;
}

interface DonationTrendChartProps {
  lembagaId?: string;
  programs: ProgramOption[];
}

type Period = "monthly" | "yearly";

const formatRupiahAxis = (amount: number) => {
  if (amount >= 1e9) return `${(amount / 1e9).toFixed(1)}M`;
  if (amount >= 1e6) return `${(amount / 1e6).toFixed(1)}Jt`;
  if (amount >= 1e3) return `${(amount / 1e3).toFixed(0)}k`;
  return amount.toString();
};

const formatRupiahFull = (amount: number) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(amount);

export function DonationTrendChart({ lembagaId, programs }: DonationTrendChartProps) {
  const [period, setPeriod] = useState<Period>("monthly");
  const [programId, setProgramId] = useState<string>("");

  const { data: trendResult, isLoading } = useQuery({
    queryKey: ["reports", "trend", lembagaId, period, programId],
    queryFn: () =>
      api.get<Array<{ date: string; displayDate: string; amount: number }>>("/reports/donation-trend", {
        lembagaId,
        period,
        programId: programId || undefined,
      }),
  });

  const chartData = trendResult?.data ?? [];

  const totalAmount = useMemo(
    () => chartData.reduce((acc, curr) => acc + curr.amount, 0),
    [chartData],
  );

  const selectedProgramName = programs.find((p) => p.id === programId)?.title ?? "Semua Program";

  const periodLabel = period === "monthly" ? "12 Bulan Terakhir" : "6 Tahun Terakhir";

  return (
    <div className="bg-surface rounded-2xl p-6 border border-border shadow-sm col-span-1 lg:col-span-2 flex flex-col">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-5">
        <div>
          <h3 className="text-lg font-bold text-primary flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-brand-primary" />
            Tren Donasi
          </h3>
          <p className="text-sm text-secondary mt-0.5">
            {periodLabel}
            {programId ? ` · ${selectedProgramName}` : " · Semua Program"}
          </p>
        </div>

        {/* Filter Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Period toggle */}
          <div className="flex items-center bg-surface-muted rounded-xl p-1 border border-border gap-1">
            <button
              id="trend-period-monthly"
              onClick={() => setPeriod("monthly")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 ${
                period === "monthly"
                  ? "bg-brand-primary text-white shadow-sm"
                  : "text-secondary hover:text-primary hover:bg-surface"
              }`}
            >
              <BarChart2 className="w-3.5 h-3.5" />
              Bulanan
            </button>
            <button
              id="trend-period-yearly"
              onClick={() => setPeriod("yearly")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 ${
                period === "yearly"
                  ? "bg-brand-primary text-white shadow-sm"
                  : "text-secondary hover:text-primary hover:bg-surface"
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5" />
              Tahunan
            </button>
          </div>

          {/* Program filter */}
          <select
            id="trend-program-filter"
            value={programId}
            onChange={(e) => setProgramId(e.target.value)}
            className="text-xs font-medium px-3 py-2 rounded-xl border border-border bg-surface text-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/30 cursor-pointer transition-colors hover:border-brand-primary/50"
          >
            <option value="">Semua Program</option>
            {programs.map((p) => (
              <option key={p.id} value={p.id}>
                {p.title}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Total badge */}
      <div className="mb-4 flex items-center gap-2">
        <span className="text-xs font-medium text-secondary">Total:</span>
        <span className="text-base font-bold text-brand-primary">{formatRupiahFull(totalAmount)}</span>
      </div>

      {/* Chart */}
      <div className="w-full flex-1">
        {isLoading ? (
          <div className="flex items-center justify-center h-[300px]">
            <LoadingSpinner />
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart
              data={chartData}
              margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              barCategoryGap="30%"
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
              <XAxis
                dataKey="displayDate"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 11, fill: "#4B5563" }}
                dy={10}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 11, fill: "#4B5563" }}
                tickFormatter={formatRupiahAxis}
              />
              <Tooltip
                contentStyle={{
                  borderRadius: "12px",
                  border: "none",
                  boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)",
                  fontSize: "13px",
                }}
                formatter={(value: any) => [formatRupiahFull(value), "Donasi"]}
                labelStyle={{ color: "#0F172A", fontWeight: 600, marginBottom: "4px" }}
                cursor={{ fill: "rgba(14, 165, 233, 0.08)" }}
              />
              <Bar dataKey="amount" radius={[6, 6, 0, 0]} animationDuration={600}>
                {chartData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={entry.amount === Math.max(...chartData.map((d) => d.amount)) && entry.amount > 0
                      ? "#0EA5E9"
                      : "#BAE6FD"}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
