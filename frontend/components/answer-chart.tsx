"use client"

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"

import type { ChartSpec } from "@/lib/types"

const SERIES_COLORS = [
  "var(--viz-1)",
  "var(--viz-2)",
  "var(--viz-3)",
  "var(--viz-4)",
  "var(--viz-5)",
  "var(--viz-6)",
  "var(--viz-7)",
  "var(--viz-8)",
]

const MAX_PIE_SLICES = 8

interface Datum {
  x: string
  y: number
}

function toData(
  columns: string[],
  rows: unknown[][],
  spec: ChartSpec
): Datum[] {
  const xi = columns.indexOf(spec.x)
  const yi = columns.indexOf(spec.y)
  if (xi === -1 || yi === -1) return []
  return rows
    .map((row) => ({ x: String(row[xi]), y: Number(row[yi]) }))
    .filter((d) => Number.isFinite(d.y))
}

/** Fold slices beyond the palette into a single "Other" bucket — never cycle hues. */
function foldForPie(data: Datum[]): Datum[] {
  if (data.length <= MAX_PIE_SLICES) return data
  const kept = data.slice(0, MAX_PIE_SLICES - 1)
  const rest = data.slice(MAX_PIE_SLICES - 1)
  return [...kept, { x: "Other", y: rest.reduce((sum, d) => sum + d.y, 0) }]
}

const numberFormat = new Intl.NumberFormat("en-US", {
  maximumFractionDigits: 2,
})

const tooltipContentStyle: React.CSSProperties = {
  backgroundColor: "var(--popover)",
  border: "1px solid var(--border)",
  borderRadius: "var(--radius-md)",
  color: "var(--popover-foreground)",
  fontSize: 12,
}

const axisTick = { fill: "var(--viz-axis)", fontSize: 11 }

export function AnswerChart({
  columns,
  rows,
  spec,
}: {
  columns: string[]
  rows: unknown[][]
  spec: ChartSpec
}) {
  const data = toData(columns, rows, spec)
  if (!spec.kind || data.length === 0) return null

  const yFormatter = (value: unknown) => numberFormat.format(Number(value))

  let chart: React.ReactElement

  if (spec.kind === "pie") {
    const pieData = foldForPie(data)
    chart = (
      <PieChart>
        <Tooltip contentStyle={tooltipContentStyle} formatter={yFormatter} />
        <Legend
          wrapperStyle={{ fontSize: 12, color: "var(--muted-foreground)" }}
        />
        <Pie
          data={pieData}
          dataKey="y"
          nameKey="x"
          stroke="var(--card)"
          strokeWidth={2}
          label={({ percent }) =>
            percent != null ? `${(percent * 100).toFixed(0)}%` : ""
          }
        >
          {pieData.map((entry, index) => (
            <Cell
              key={entry.x}
              fill={SERIES_COLORS[index % SERIES_COLORS.length]}
            />
          ))}
        </Pie>
      </PieChart>
    )
  } else if (spec.kind === "line") {
    chart = (
      <LineChart data={data} margin={{ top: 8, right: 16, bottom: 4, left: 8 }}>
        <CartesianGrid stroke="var(--viz-grid)" vertical={false} />
        <XAxis
          dataKey="x"
          tick={axisTick}
          tickLine={false}
          axisLine={{ stroke: "var(--viz-grid)" }}
        />
        <YAxis
          tick={axisTick}
          tickLine={false}
          axisLine={false}
          tickFormatter={yFormatter}
          width={70}
        />
        <Tooltip contentStyle={tooltipContentStyle} formatter={yFormatter} />
        <Line
          type="monotone"
          dataKey="y"
          name={spec.y}
          stroke="var(--viz-1)"
          strokeWidth={2}
          dot={{ r: 3, fill: "var(--viz-1)", strokeWidth: 0 }}
          activeDot={{ r: 5 }}
        />
      </LineChart>
    )
  } else {
    chart = (
      <BarChart data={data} margin={{ top: 8, right: 16, bottom: 4, left: 8 }}>
        <CartesianGrid stroke="var(--viz-grid)" vertical={false} />
        <XAxis
          dataKey="x"
          tick={axisTick}
          tickLine={false}
          axisLine={{ stroke: "var(--viz-grid)" }}
        />
        <YAxis
          tick={axisTick}
          tickLine={false}
          axisLine={false}
          tickFormatter={yFormatter}
          width={70}
        />
        <Tooltip
          contentStyle={tooltipContentStyle}
          formatter={yFormatter}
          cursor={{ fill: "var(--muted)", opacity: 0.4 }}
        />
        <Bar
          dataKey="y"
          name={spec.y}
          fill="var(--viz-1)"
          radius={[4, 4, 0, 0]}
          maxBarSize={48}
        />
      </BarChart>
    )
  }

  return (
    <div
      className="h-72 w-full"
      role="img"
      aria-label={`${spec.kind} chart of ${spec.y} by ${spec.x}`}
    >
      <ResponsiveContainer width="100%" height="100%">
        {chart}
      </ResponsiveContainer>
    </div>
  )
}
