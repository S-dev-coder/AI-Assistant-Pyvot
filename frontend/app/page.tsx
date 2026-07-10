"use client"

import * as React from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { SendHorizontal } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { GradientText } from "@/components/animate-ui/primitives/texts/gradient"
import { ShimmeringText } from "@/components/animate-ui/primitives/texts/shimmering"
import { MessageBubble } from "@/components/message-bubble"
import type { BackendResponse, Message } from "@/lib/types"

const EXAMPLE_QUESTIONS = [
  "What was our total revenue last month?",
  "Top 5 products by revenue",
  "Monthly revenue trend for this year",
  "Which category is most profitable?",
]

function LoadingBubble() {
  return (
    <div className="flex justify-start">
      <div className="rounded-lg rounded-tl-sm bg-muted px-4 py-3 text-sm">
        <ShimmeringText
          text="Analyzing your question — generating and running SQL…"
          duration={1.4}
          color="var(--muted-foreground)"
          shimmeringColor="var(--foreground)"
        />
      </div>
    </div>
  )
}

function Home() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const urlConversationId = searchParams.get("c")

  const [sessionId, setSessionId] = React.useState<string | null>(null)
  const [conversationId, setConversationId] = React.useState<string | null>(
    null
  )
  const [messages, setMessages] = React.useState<Message[]>([])
  const [loading, setLoading] = React.useState(false)
  const [input, setInput] = React.useState("")
  const bottomRef = React.useRef<HTMLDivElement>(null)
  const idRef = React.useRef(0)
  const conversationIdRef = React.useRef<string | null>(null)
  conversationIdRef.current = conversationId

  React.useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, loading])

  const nextId = () => `msg-${idRef.current++}`

  // The sidebar navigates via /?c=<id>; this effect keeps chat state in sync.
  React.useEffect(() => {
    if (urlConversationId && urlConversationId !== conversationIdRef.current) {
      void (async () => {
        try {
          const res = await fetch(
            `/api/backend/conversations/${urlConversationId}`
          )
          if (!res.ok) return
          const conv = await res.json()
          setConversationId(conv.id)
          setSessionId(conv.sessionId ?? null)
          setMessages(
            (conv.messages ?? []).map(
              (m: {
                role: "user" | "assistant"
                text?: string
                content?: BackendResponse
              }) => ({
                id: nextId(),
                role: m.role,
                text: m.text,
                content: m.content,
              })
            )
          )
        } catch {
          // keep current view; user can retry from the sidebar
        }
      })()
    }
    if (!urlConversationId && conversationIdRef.current) {
      // "New chat" or deleted conversation → back to a clean slate
      setConversationId(null)
      setSessionId(null)
      setMessages([])
    }
  }, [urlConversationId])

  const send = async (question: string) => {
    const trimmed = question.trim()
    if (!trimmed || loading) return

    setInput("")
    setMessages((prev) => [
      ...prev,
      { id: nextId(), role: "user", text: trimmed },
    ])
    setLoading(true)

    try {
      const res = await fetch("/api/backend/query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, conversationId, question: trimmed }),
      })
      if (!res.ok) {
        throw new Error(`Request failed with status ${res.status}`)
      }
      const data: BackendResponse = await res.json()
      if (data.sessionId) setSessionId(data.sessionId)
      if (data.conversationId) {
        setConversationId(data.conversationId)
        if (!urlConversationId) {
          router.replace(`/?c=${data.conversationId}`, { scroll: false })
        }
      }
      setMessages((prev) => [
        ...prev,
        { id: nextId(), role: "assistant", content: data },
      ])
      window.dispatchEvent(new Event("conversations-updated"))
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          id: nextId(),
          role: "assistant",
          content: {
            type: "error",
            message:
              err instanceof Error && err.message
                ? `Something went wrong: ${err.message}`
                : "Something went wrong. Please try again.",
          },
        },
      ])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex h-dvh flex-col">
      <header className="border-b">
        <div className="mx-auto max-w-3xl px-4 py-5">
          <h1 className="text-xl font-semibold tracking-tight">
            <GradientText text="Conversational BI Assistant" />
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Ask questions about the ecommerce dataset in plain English
          </p>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto">
        <div className="mx-auto flex min-h-full max-w-3xl flex-col px-4 py-6">
          {messages.length === 0 && !loading ? (
            <div className="flex flex-1 items-center justify-center">
              <p className="text-sm text-muted-foreground">
                Ask a question below, or try one of the examples.
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {messages.map((message) => (
                <MessageBubble key={message.id} message={message} />
              ))}
              {loading && <LoadingBubble />}
            </div>
          )}
          <div ref={bottomRef} />
        </div>
      </main>

      <footer className="border-t">
        <div className="mx-auto max-w-3xl px-4 pt-3 pb-5">
          <div className="mb-3 flex flex-wrap gap-2">
            {EXAMPLE_QUESTIONS.map((question) => (
              <Button
                key={question}
                variant="outline"
                size="sm"
                className="h-7 rounded-full text-xs font-normal"
                disabled={loading}
                onClick={() => send(question)}
              >
                {question}
              </Button>
            ))}
          </div>
          <form
            className="flex gap-2"
            onSubmit={(event) => {
              event.preventDefault()
              send(input)
            }}
          >
            <Input
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder="e.g. What were our best-selling products last quarter?"
              disabled={loading}
              autoFocus
            />
            <Button
              type="submit"
              size="icon"
              disabled={loading || !input.trim()}
            >
              <SendHorizontal className="size-4" />
              <span className="sr-only">Send</span>
            </Button>
          </form>
        </div>
      </footer>
    </div>
  )
}

export default function Page() {
  // useSearchParams requires a Suspense boundary during prerender
  return (
    <React.Suspense fallback={null}>
      <Home />
    </React.Suspense>
  )
}
