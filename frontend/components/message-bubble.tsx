"use client"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { AnswerChart } from "@/components/answer-chart"
import { Markdown, hasMarkdown } from "@/components/markdown"
import { CopyButton } from "@/components/animate-ui/components/buttons/copy"
import { CountingNumber } from "@/components/animate-ui/primitives/texts/counting-number"
import { TypingText } from "@/components/animate-ui/primitives/texts/typing"
import type { AnswerPayload, Message } from "@/lib/types"
import { cn } from "@/lib/utils"

const ENTER_ANIMATION = "animate-in fade-in slide-in-from-bottom-2 duration-300"

function ResultTable({
  columns,
  rows,
}: {
  columns: string[]
  rows: unknown[][]
}) {
  return (
    <ScrollArea className="max-h-72 w-full overflow-auto rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            {columns.map((col) => (
              <TableHead key={col} className="whitespace-nowrap">
                {col}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row, ri) => (
            <TableRow key={ri}>
              {row.map((cell, ci) => (
                <TableCell
                  key={ci}
                  className={cn(
                    "whitespace-nowrap",
                    typeof cell === "number" && "tabular-nums"
                  )}
                >
                  {cell == null ? "—" : String(cell)}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <ScrollBar orientation="horizontal" />
    </ScrollArea>
  )
}

function AnswerBlock({ answer }: { answer: AnswerPayload }) {
  const showTable = answer.formats.includes("table")
  const showChart =
    answer.formats.includes("chart") &&
    answer.chart != null &&
    answer.chart.kind != null

  const single =
    answer.rows.length === 1 && answer.rows[0].length === 1
      ? answer.rows[0][0]
      : null
  const kpi = typeof single === "number" ? single : null

  return (
    <div className="flex w-full max-w-[85%] flex-col gap-3">
      {kpi != null && (
        <div className="w-fit rounded-lg border bg-card px-5 py-3 shadow-xs">
          <p className="text-xs text-muted-foreground">{answer.columns[0]}</p>
          <CountingNumber
            number={kpi}
            decimalPlaces={Number.isInteger(kpi) ? 0 : 2}
            className="text-3xl font-semibold tracking-tight tabular-nums"
          />
        </div>
      )}
      <div className="rounded-lg rounded-tl-sm bg-muted px-4 py-3 text-sm leading-relaxed">
        {hasMarkdown(answer.summary) ? (
          <Markdown>{answer.summary}</Markdown>
        ) : (
          <TypingText text={answer.summary} duration={12} />
        )}
      </div>

      {(showTable || showChart) && (
        <Card className="py-4">
          <CardContent className="flex flex-col gap-4 px-4">
            {showChart && answer.chart && (
              <AnswerChart
                columns={answer.columns}
                rows={answer.rows}
                spec={answer.chart}
              />
            )}
            {showTable && (
              <ResultTable columns={answer.columns} rows={answer.rows} />
            )}
          </CardContent>
        </Card>
      )}

      {answer.sql && (
        <details className="group rounded-md border">
          <summary className="cursor-pointer px-3 py-2 text-xs font-medium text-muted-foreground select-none hover:text-foreground">
            View SQL
          </summary>
          <div className="flex flex-col gap-2 border-t px-3 py-3">
            <div className="relative">
              <pre className="overflow-x-auto rounded-md bg-muted p-3 pr-10 font-mono text-xs leading-relaxed">
                <code>{answer.sql}</code>
              </pre>
              <CopyButton
                content={answer.sql}
                variant="ghost"
                size="xs"
                className="absolute top-1.5 right-1.5 text-muted-foreground"
                aria-label="Copy SQL"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              {answer.explanation}
            </p>
          </div>
        </details>
      )}
    </div>
  )
}

export function MessageBubble({ message }: { message: Message }) {
  if (message.role === "user") {
    return (
      <div className={cn("flex justify-end", ENTER_ANIMATION)}>
        <div className="max-w-[85%] rounded-lg rounded-tr-sm bg-primary px-4 py-3 text-sm leading-relaxed text-primary-foreground">
          {message.text}
        </div>
      </div>
    )
  }

  const content = message.content
  if (!content) return null

  if (content.type === "answer") {
    return (
      <div className={cn("flex justify-start", ENTER_ANIMATION)}>
        <AnswerBlock answer={content} />
      </div>
    )
  }

  if (content.type === "clarification") {
    return (
      <div className={cn("flex justify-start", ENTER_ANIMATION)}>
        <div className="flex max-w-[85%] flex-col gap-2">
          <div className="rounded-lg rounded-tl-sm bg-muted px-4 py-3 text-sm leading-relaxed">
            {hasMarkdown(content.question) ? (
              <Markdown>{content.question}</Markdown>
            ) : (
              content.question
            )}
          </div>
          <Badge variant="outline" className="w-fit text-xs">
            needs clarification
          </Badge>
        </div>
      </div>
    )
  }

  // rejected | fallback | error
  return (
    <div className={cn("flex justify-start", ENTER_ANIMATION)}>
      <div
        className={cn(
          "max-w-[85%] rounded-lg rounded-tl-sm px-4 py-3 text-sm leading-relaxed",
          content.type === "error"
            ? "border border-destructive/30 bg-destructive/10 text-destructive"
            : "bg-muted text-muted-foreground"
        )}
      >
        {hasMarkdown(content.message) ? (
          <Markdown>{content.message}</Markdown>
        ) : (
          content.message
        )}
      </div>
    </div>
  )
}
