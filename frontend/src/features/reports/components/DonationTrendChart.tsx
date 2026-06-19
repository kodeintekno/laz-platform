"use client";

import React, { useMemo } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from "recharts";

interface TrendData {
  date: string;
  displayDate: string;
  amount: number;
}

const formatRupiahK = (amount: number) => {
  if (amount >= 1e9) {
    return `${(amount / 1e9).toFixed(1)}M`;
  }
  if (amount >= 1e6) {
    return `${(amount / 1e6).toFixed(1)}Jt`;
  }
  if (amount >= 1e3) {
    return `${(amount / 1e3).toFixed(1)}k`;
  }
  return amount.toString();
};

export function DonationTrendChart({ data }: { data: TrendData[] }) {
  const totalAmount = useMemo(() => data.reduce((acc, curr) => acc + curr.amount, 0), [data]);

  return (
    <div className="bg-surface rounded-2xl p-6 border border-border shadow-sm col-span-1 lg:col-span-2 flex flex-col">
      <div className="mb-6">
        <h3 className="text-lg font-bold text-primary">Tren Donasi (30 Hari Terakhir)</h3>
        <p className="text-sm text-secondary">
          Total donasi terkumpul dalam 30 hari: <span className="font-semibold text-brand-primary">
            Rp {new Intl.NumberFormat("id-ID").format(totalAmount)}
          </span>
        </p>
      </div>

      <div className="w-full mt-4">
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart
            data={data}
            margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
          >
            <defs>
              <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#0EA5E9" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#0EA5E9" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
            <XAxis 
              dataKey="displayDate" 
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 12, fill: "#4B5563" }}
              dy={10}
            />
            <YAxis 
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 12, fill: "#4B5563" }}
              tickFormatter={formatRupiahK}
            />
            <Tooltip 
              contentStyle={{ borderRadius: "12px", border: "none", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)" }}
              formatter={(value: any) => [`Rp ${new Intl.NumberFormat("id-ID").format(value)}`, "Donasi"]}
              labelStyle={{ color: "#0F172A", fontWeight: 600, marginBottom: "4px" }}
            />
            <Area 
              type="monotone" 
              dataKey="amount" 
              stroke="#0EA5E9" 
              strokeWidth={3}
              fillOpacity={1} 
              fill="url(#colorAmount)" 
              activeDot={{ r: 6, strokeWidth: 0 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
