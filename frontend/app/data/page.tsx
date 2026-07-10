"use client"

import { GradientText } from "@/components/animate-ui/primitives/texts/gradient"
import { DataExplorer } from "@/components/data-sidebar"

export default function DataPage() {
  return (
    <div className="mx-auto flex h-dvh max-w-5xl flex-col px-4">
      <header className="border-b py-5">
        <h1 className="text-xl font-semibold tracking-tight">
          <GradientText text="Data Explorer" />
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Browse the raw tables the assistant queries
        </p>
      </header>

      <main className="flex min-h-0 flex-1 flex-col py-3">
        <DataExplorer />
      </main>
    </div>
  )
}
