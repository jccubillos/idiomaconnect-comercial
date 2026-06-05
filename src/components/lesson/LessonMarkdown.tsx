"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { cn } from "@/lib/utils";

/**
 * Renders the lesson body with our HUD typography.
 * Headings (### Parte A) get glowing colors; lists get neon bullets;
 * inline `code` is treated as IPA / pronunciation hint.
 */
export function LessonMarkdown({ children, className }: { children: string; className?: string }) {
  return (
    <div className={cn("lesson-md text-sm leading-relaxed", className)}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ children }) => (
            <h1 className="text-2xl font-extrabold mt-6 mb-3 text-glow-cyan text-neon-cyan">{children}</h1>
          ),
          h2: ({ children }) => (
            <h2 className="text-xl font-extrabold mt-5 mb-3 text-glow-purple text-neon-purple">{children}</h2>
          ),
          h3: ({ children }) => (
            <h3 className="text-lg font-bold mt-5 mb-2 flex items-center gap-2 text-ink">{children}</h3>
          ),
          p: ({ children }) => <p className="mb-3 text-ink/95">{children}</p>,
          ul: ({ children }) => <ul className="mb-3 space-y-1.5 pl-1">{children}</ul>,
          ol: ({ children }) => <ol className="mb-3 space-y-1.5 pl-5 list-decimal">{children}</ol>,
          li: ({ children }) => (
            <li className="flex gap-2 items-start before:content-['▸'] before:text-neon-cyan before:mt-0.5 before:flex-shrink-0">
              <span>{children}</span>
            </li>
          ),
          strong: ({ children }) => (
            <strong className="font-bold text-neon-cyan">{children}</strong>
          ),
          em: ({ children }) => <em className="italic text-ink-dim">{children}</em>,
          code: ({ children }) => (
            <code className="px-1.5 py-0.5 rounded bg-surface-high text-neon-purple text-xs font-mono">
              {children}
            </code>
          ),
          blockquote: ({ children }) => (
            <blockquote className="border-l-2 border-neon-cyan/50 pl-3 my-3 italic text-ink-dim">
              {children}
            </blockquote>
          ),
          hr: () => <hr className="my-5 border-white/10" />,
        }}
      >
        {children}
      </ReactMarkdown>
    </div>
  );
}
