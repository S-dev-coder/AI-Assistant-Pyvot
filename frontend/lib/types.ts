export type ChartKind = "bar" | "line" | "pie"

export interface ChartSpec {
  kind: ChartKind | null
  x: string
  y: string
}

export interface AnswerPayload {
  type: "answer"
  summary: string
  sql: string
  explanation: string
  columns: string[]
  rows: unknown[][]
  chart: ChartSpec | null
  formats: string[]
}

export interface ClarificationPayload {
  type: "clarification"
  question: string
  remaining: number
}

export interface MessagePayload {
  type: "rejected" | "fallback" | "error"
  message: string
}

export type BackendResponse = (
  AnswerPayload | ClarificationPayload | MessagePayload
) & {
  sessionId: string
  conversationId?: string
}

export type AssistantContent =
  AnswerPayload | ClarificationPayload | MessagePayload

export interface Message {
  id: string
  role: "user" | "assistant"
  text?: string
  content?: AssistantContent
}
