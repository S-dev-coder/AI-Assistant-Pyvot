"use client"

import * as React from "react"
import { useTheme } from "next-themes"

import { cn } from "@/lib/utils"

let renderSeq = 0

export function MermaidDiagram({
  chart,
  className,
}: {
  chart: string
  className?: string
}) {
  const { resolvedTheme } = useTheme()
  const [svg, setSvg] = React.useState("")

  React.useEffect(() => {
    let cancelled = false
    ;(async () => {
      const mermaid = (await import("mermaid")).default
      mermaid.initialize({
        startOnLoad: false,
        theme: resolvedTheme === "dark" ? "dark" : "neutral",
        // straight-line connectors between nodes
        flowchart: { curve: "linear", useMaxWidth: true },
        sequence: { useMaxWidth: true },
        er: { useMaxWidth: true },
        fontFamily: "ui-sans-serif, system-ui, sans-serif",
      })
      try {
        const { svg } = await mermaid.render(`mmd-${renderSeq++}`, chart)
        if (!cancelled) setSvg(svg)
      } catch {
        if (!cancelled)
          setSvg(
            `<pre style="font-size:12px;color:var(--destructive)">diagram failed to render</pre>`
          )
      }
    })()
    return () => {
      cancelled = true
    }
  }, [chart, resolvedTheme])

  return (
    <div
      className={cn(
        "overflow-x-auto rounded-md border bg-card p-4 [&_svg]:mx-auto",
        className
      )}
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  )
}
