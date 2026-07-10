"use client"

import * as React from "react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { ShimmeringText } from "@/components/animate-ui/primitives/texts/shimmering"
import { cn } from "@/lib/utils"

const PAGE_SIZE = 50

type TableMeta = { name: string; rowCount: number }
type TableData = { columns: string[]; rows: unknown[][]; loading: boolean }

const TAB_LABELS: Record<string, string> = {
  customers: "customers",
  products: "products",
  orders: "orders",
  order_items: "items",
}

function formatCell(cell: unknown): string {
  if (cell == null) return "—"
  const s = String(cell)
  // pg serializes timestamps as ISO strings; trim to a readable form
  return /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(s)
    ? s.replace("T", " ").slice(0, 19)
    : s
}

export function DataExplorer() {
  const [tables, setTables] = React.useState<TableMeta[]>([])
  const [active, setActive] = React.useState("customers")
  const [data, setData] = React.useState<Record<string, TableData>>({})

  React.useEffect(() => {
    fetch("/api/backend/tables")
      .then((r) => r.json())
      .then((d) => setTables(d.tables ?? []))
      .catch(() => setTables([]))
  }, [])

  const loadRows = React.useCallback(async (name: string, offset: number) => {
    setData((prev) => ({
      ...prev,
      [name]: {
        columns: prev[name]?.columns ?? [],
        rows: prev[name]?.rows ?? [],
        loading: true,
      },
    }))
    try {
      const r = await fetch(
        `/api/backend/tables/${name}?limit=${PAGE_SIZE}&offset=${offset}`
      )
      const d = await r.json()
      setData((prev) => ({
        ...prev,
        [name]: {
          columns: d.columns,
          rows:
            offset === 0 ? d.rows : [...(prev[name]?.rows ?? []), ...d.rows],
          loading: false,
        },
      }))
    } catch {
      setData((prev) => ({
        ...prev,
        [name]: {
          ...(prev[name] ?? { columns: [], rows: [] }),
          loading: false,
        },
      }))
    }
  }, [])

  // lazy-load a table's first page when its tab is first opened
  React.useEffect(() => {
    if (!data[active]) void loadRows(active, 0)
  }, [active, data, loadRows])

  const meta = tables.find((t) => t.name === active)
  const current = data[active]

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <p className="px-3 pt-2 text-xs text-muted-foreground">
        Tables in the ecommerce_bi database
      </p>

      <Tabs
        value={active}
        onValueChange={setActive}
        className="flex min-h-0 flex-1 flex-col gap-2 p-3"
      >
        <TabsList className="grid w-full grid-cols-4">
          {(tables.length
            ? tables
            : Object.keys(TAB_LABELS).map((name) => ({ name, rowCount: 0 }))
          ).map((t) => (
            <TabsTrigger key={t.name} value={t.name} className="text-xs">
              {TAB_LABELS[t.name] ?? t.name}
            </TabsTrigger>
          ))}
        </TabsList>

        {Object.keys(TAB_LABELS).map((name) => (
          <TabsContent
            key={name}
            value={name}
            className="flex min-h-0 flex-1 flex-col gap-2 data-[state=inactive]:hidden"
          >
            <div className="flex items-center justify-between">
              <Badge variant="secondary" className="text-xs tabular-nums">
                {meta && name === active
                  ? `${meta.rowCount.toLocaleString()} rows`
                  : "…"}
              </Badge>
              {current && name === active && (
                <span className="text-xs text-muted-foreground tabular-nums">
                  showing {current.rows.length}
                </span>
              )}
            </div>

            {name === active && (
              <>
                <div className="min-h-0 flex-1 overflow-auto rounded-md border">
                  {current && current.columns.length > 0 ? (
                    <Table>
                      <TableHeader className="sticky top-0 bg-background">
                        <TableRow>
                          {current.columns.map((col) => (
                            <TableHead
                              key={col}
                              className="text-xs whitespace-nowrap"
                            >
                              {col}
                            </TableHead>
                          ))}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {current.rows.map((row, ri) => (
                          <TableRow key={ri}>
                            {row.map((cell, ci) => (
                              <TableCell
                                key={ci}
                                className={cn(
                                  "text-xs whitespace-nowrap",
                                  typeof cell === "number" && "tabular-nums"
                                )}
                              >
                                {formatCell(cell)}
                              </TableCell>
                            ))}
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  ) : (
                    <div className="flex h-full items-center justify-center p-6 text-xs">
                      <ShimmeringText text="Loading rows…" duration={1.2} />
                    </div>
                  )}
                </div>

                {current && meta && current.rows.length < meta.rowCount && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full text-xs"
                    disabled={current.loading}
                    onClick={() => loadRows(name, current.rows.length)}
                  >
                    {current.loading
                      ? "Loading…"
                      : `Load ${Math.min(PAGE_SIZE, meta.rowCount - current.rows.length)} more`}
                  </Button>
                )}
              </>
            )}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  )
}
