"use client"

import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"

import { cn } from "@/lib/utils"

/* Renders LLM-generated text as markdown (GFM). react-markdown never injects
   raw HTML, so model output is safe to render. Styles are scoped inline so the
   bubbles don't need the typography plugin. */
export function Markdown({
  children,
  className,
}: {
  children: string
  className?: string
}) {
  return (
    <div
      className={cn(
        "flex flex-col gap-2 [&_a]:underline [&_code]:rounded [&_code]:bg-background/60 [&_code]:px-1 [&_code]:py-0.5 [&_code]:font-mono [&_code]:text-xs [&_em]:italic [&_h1]:text-base [&_h1]:font-semibold [&_h2]:text-sm [&_h2]:font-semibold [&_h3]:text-sm [&_h3]:font-medium [&_hr]:border-border [&_li]:my-0.5 [&_ol]:list-decimal [&_ol]:pl-5 [&_pre]:overflow-x-auto [&_pre]:rounded-md [&_pre]:bg-background/60 [&_pre]:p-2 [&_strong]:font-semibold [&_table]:text-xs [&_td]:border [&_td]:px-2 [&_td]:py-1 [&_th]:border [&_th]:bg-background/40 [&_th]:px-2 [&_th]:py-1 [&_ul]:list-disc [&_ul]:pl-5",
        className
      )}
    >
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{children}</ReactMarkdown>
    </div>
  )
}

/* Quick check: does this text actually use markdown? Lets callers keep the
   typing animation for plain sentences and switch to parsed rendering only
   when formatting is present. */
export function hasMarkdown(text: string): boolean {
  return /(\*\*|__|`|~~|^#{1,6}\s|^\s*[-*+]\s|^\s*\d+\.\s|\[.+\]\(.+\)|^>\s|\|.+\|)/m.test(
    text
  )
}
