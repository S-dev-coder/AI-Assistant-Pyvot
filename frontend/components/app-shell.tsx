"use client"

import * as React from "react"
import { PanelLeft } from "lucide-react"

import { Button } from "@/components/ui/button"
import { AppSidebar } from "@/components/app-sidebar"

export function AppShell({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = React.useState(true)

  return (
    <div className="flex h-dvh">
      {open && (
        // useSearchParams inside the sidebar needs a Suspense boundary
        <React.Suspense fallback={null}>
          <AppSidebar onClose={() => setOpen(false)} />
        </React.Suspense>
      )}
      {!open && (
        <Button
          variant="outline"
          size="icon"
          className="fixed top-4 left-3 z-50 shadow-sm"
          onClick={() => setOpen(true)}
          aria-label="Open sidebar"
        >
          <PanelLeft className="size-4" />
        </Button>
      )}
      <div
        className={open ? "hidden min-w-0 flex-1 sm:block" : "min-w-0 flex-1"}
      >
        {children}
      </div>
    </div>
  )
}
