import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export function ChatMessageContent({ content, isAssistant }: { content: string; isAssistant: boolean }) {
  if (!isAssistant) return <p className="whitespace-pre-wrap break-words text-[15px] leading-7">{content}</p>;

  return (
    <div className="chat-markdown break-words text-[15px] leading-7">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          a: ({ children, href }) => (
            <a href={href} target="_blank" rel="noreferrer" className="font-medium text-indigo-300 underline decoration-indigo-300/40 underline-offset-4 hover:text-indigo-200">
              {children}
            </a>
          ),
          h1: ({ children }) => <h1 className="mb-3 mt-6 text-2xl font-bold leading-tight first:mt-0">{children}</h1>,
          h2: ({ children }) => <h2 className="mb-3 mt-5 text-xl font-bold leading-tight first:mt-0">{children}</h2>,
          h3: ({ children }) => <h3 className="mb-2 mt-4 text-lg font-semibold leading-tight first:mt-0">{children}</h3>,
          p: ({ children }) => <p className="my-3 first:mt-0 last:mb-0">{children}</p>,
          ul: ({ children }) => <ul className="my-3 list-disc space-y-1 pl-6 marker:text-indigo-300">{children}</ul>,
          ol: ({ children }) => <ol className="my-3 list-decimal space-y-1 pl-6 marker:text-indigo-300">{children}</ol>,
          li: ({ children }) => <li className="pl-1">{children}</li>,
          blockquote: ({ children }) => <blockquote className="my-4 border-l-2 border-indigo-400/60 pl-4 text-zinc-300">{children}</blockquote>,
          hr: () => <hr className="my-5 border-white/10" />,
          strong: ({ children }) => <strong className="font-semibold text-white">{children}</strong>,
          code: ({ children, className }) => (
            <code className={`${className ? "block px-4 py-3 text-[13px] leading-6" : "rounded-md border border-white/10 bg-black/25 px-1.5 py-0.5 text-[.88em]"} overflow-x-auto font-mono text-indigo-200`}>
              {children}
            </code>
          ),
          pre: ({ children }) => <pre className="my-4 overflow-x-auto rounded-xl border border-white/10 bg-black/35">{children}</pre>,
          table: ({ children }) => <div className="my-4 overflow-x-auto rounded-xl border border-white/10"><table className="w-full border-collapse text-left text-sm">{children}</table></div>,
          th: ({ children }) => <th className="border-b border-white/10 bg-white/[.04] px-3 py-2 font-semibold">{children}</th>,
          td: ({ children }) => <td className="border-b border-white/[.06] px-3 py-2 align-top">{children}</td>,
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
