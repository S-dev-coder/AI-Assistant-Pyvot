"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import {
  Database,
  FileText,
  MessageSquarePlus,
  MessageSquareText,
  PanelLeftClose,
  Trash2,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

type ConversationMeta = {
  id: string
  title: string
  updatedAt: string
  messageCount: number
}

const NAV = [
  { href: "/", label: "Chat", icon: MessageSquareText },
  { href: "/data", label: "Data explorer", icon: Database },
  { href: "/design", label: "Design doc", icon: FileText },
]

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60_000)
  if (mins < 1) return "just now"
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  return `${Math.floor(hours / 24)}d ago`
}

export function AppSidebar({ onClose }: { onClose: () => void }) {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const router = useRouter()
  const activeId = pathname === "/" ? searchParams.get("c") : null
  const [conversations, setConversations] = React.useState<ConversationMeta[]>(
    []
  )

  const refresh = React.useCallback(() => {
    fetch("/api/backend/conversations")
      .then((r) => r.json())
      .then((d) => setConversations(d.conversations ?? []))
      .catch(() => {})
  }, [])

  React.useEffect(() => {
    refresh()
  }, [refresh, pathname, activeId])

  // Home dispatches this after every answered question
  React.useEffect(() => {
    window.addEventListener("conversations-updated", refresh)
    return () => window.removeEventListener("conversations-updated", refresh)
  }, [refresh])

  const deleteConversation = async (id: string, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    await fetch(`/api/backend/conversations/${id}`, { method: "DELETE" }).catch(
      () => {}
    )
    setConversations((prev) => prev.filter((c) => c.id !== id))
    if (id === activeId) router.push("/")
  }

  return (
    <aside className="flex h-dvh w-full shrink-0 animate-in flex-col border-r bg-background duration-300 slide-in-from-left sm:w-[300px]">
      <div className="flex items-center justify-between border-b px-4 py-3">
        <h2 className="text-sm font-semibold">Conversational BI</h2>
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          aria-label="Close sidebar"
        >
          <PanelLeftClose className="size-4" />
        </Button>
      </div>

      {/* pages */}
      <nav className="flex flex-col gap-0.5 p-3">
        {NAV.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex items-center gap-2.5 rounded-md px-3 py-2 text-sm transition-colors hover:bg-accent",
              pathname === href
                ? "bg-accent font-medium"
                : "text-muted-foreground"
            )}
          >
            <Icon className="size-4" />
            {label}
          </Link>
        ))}
      </nav>

      <div className="mx-3 border-t" />

      {/* history */}
      <div className="flex min-h-0 flex-1 flex-col p-3">
        <div className="mb-2 flex items-center justify-between px-1">
          <span className="text-xs font-medium text-muted-foreground">
            Recents
          </span>
          <Button
            variant="ghost"
            size="icon"
            className="size-7"
            asChild
            aria-label="New chat"
          >
            <Link href="/">
              <MessageSquarePlus className="size-4" />
            </Link>
          </Button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto">
          {conversations.length === 0 ? (
            <p className="px-2 py-6 text-center text-xs text-muted-foreground">
              No conversations yet — ask your first question.
            </p>
          ) : (
            <div className="flex flex-col gap-1">
              {conversations.map((c) => (
                <Link
                  key={c.id}
                  href={`/?c=${c.id}`}
                  className={cn(
                    "group flex w-full items-center justify-between gap-2 rounded-md px-3 py-2 text-left transition-colors hover:bg-accent",
                    c.id === activeId && "bg-accent"
                  )}
                >
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-xs font-medium">
                      {c.title}
                    </span>
                    <span className="block text-[11px] text-muted-foreground">
                      {relativeTime(c.updatedAt)} · {c.messageCount} messages
                    </span>
                  </span>
                  <span
                    role="button"
                    aria-label="Delete conversation"
                    onClick={(e) => deleteConversation(c.id, e)}
                    className="rounded p-1 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 hover:text-destructive"
                  >
                    <Trash2 className="size-3.5" />
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </aside>
  )
}
