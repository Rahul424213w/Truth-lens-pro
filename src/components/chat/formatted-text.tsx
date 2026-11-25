import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type Block =
  | { type: "heading"; level: number; text: string }
  | { type: "paragraph"; lines: string[] }
  | { type: "list"; ordered: boolean; items: string[] }
  | { type: "quote"; lines: string[] }
  | { type: "rule" };

const INLINE_PATTERN =
  /(\*\*[^*\n]+\*\*|__[^_\n]+__|`[^`\n]+`|\[[^\]\n]+\]\([^)\s]+\)|https?:\/\/[^\s)]+|\*[^*\n]+\*|_[^_\n]+_)/g;

const HEADING_LINE = /^(#{1,4})\s+(.*)$/;
const BULLET_LINE = /^[-*•]\s+(.*)$/;
const ORDERED_LINE = /^\d+[.)]\s+(.*)$/;
const RULE_LINE = /^(?:-{3,}|\*{3,}|_{3,}|(?:\*\s*){3,})$/;

function safeHref(value: string): string | null {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:" ? url.href : null;
  } catch {
    return null;
  }
}

function renderInline(text: string, keyPrefix: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  let lastIndex = 0;
  let index = 0;
  let match: RegExpExecArray | null;

  while ((match = INLINE_PATTERN.exec(text)) !== null) {
    if (match.index > lastIndex) {
      nodes.push(text.slice(lastIndex, match.index));
    }

    const token = match[0];
    const key = `${keyPrefix}-${index++}`;

    if (token.startsWith("**") || token.startsWith("__")) {
      nodes.push(
        <strong key={key} className="font-semibold text-white">
          {token.slice(2, -2)}
        </strong>
      );
    } else if (token.startsWith("`") && token.endsWith("`")) {
      nodes.push(
        <code
          key={key}
          className="rounded border border-slate-700 bg-slate-950/60 px-1 py-0.5 font-mono text-[11px] text-blue-300"
        >
          {token.slice(1, -1)}
        </code>
      );
    } else if (token.startsWith("[")) {
      const link = token.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
      if (link) {
        const href = safeHref(link[2]);
        nodes.push(
          href ? (
            <a
              key={key}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-300 underline decoration-blue-500/40 underline-offset-2 hover:text-blue-200"
            >
              {link[1]}
            </a>
          ) : (
            link[1]
          )
        );
      }
    } else if (token.startsWith("http")) {
      nodes.push(
        <a
          key={key}
          href={safeHref(token) ?? token}
          target="_blank"
          rel="noopener noreferrer"
          className="break-all text-blue-300 underline decoration-blue-500/40 underline-offset-2 hover:text-blue-200"
        >
          {token}
        </a>
      );
    } else {
      nodes.push(
        <em key={key} className="italic text-slate-100">
          {token.slice(1, -1)}
        </em>
      );
    }

    lastIndex = match.index + token.length;
  }

  if (lastIndex < text.length) {
    nodes.push(text.slice(lastIndex));
  }

  return nodes;
}

function parseBlocks(content: string): Block[] {
  const lines = content.replace(/\r\n/g, "\n").split("\n");
  const blocks: Block[] = [];
  let index = 0;

  const isBlockStart = (line: string) =>
    HEADING_LINE.test(line) ||
    BULLET_LINE.test(line) ||
    ORDERED_LINE.test(line) ||
    RULE_LINE.test(line) ||
    line.startsWith(">");

  while (index < lines.length) {
    const line = lines[index].trim();

    if (!line) {
      index += 1;
      continue;
    }

    if (RULE_LINE.test(line)) {
      blocks.push({ type: "rule" });
      index += 1;
      continue;
    }

    const heading = line.match(HEADING_LINE);
    if (heading) {
      blocks.push({ type: "heading", level: heading[1].length, text: heading[2] });
      index += 1;
      continue;
    }

    const bullet = line.match(BULLET_LINE);
    if (bullet) {
      const items: string[] = [];
      while (index < lines.length) {
        const item = lines[index].trim().match(BULLET_LINE);
        if (!item) break;
        items.push(item[1]);
        index += 1;
      }
      blocks.push({ type: "list", ordered: false, items });
      continue;
    }

    const ordered = line.match(ORDERED_LINE);
    if (ordered) {
      const items: string[] = [];
      while (index < lines.length) {
        const item = lines[index].trim().match(ORDERED_LINE);
        if (!item) break;
        items.push(item[1]);
        index += 1;
      }
      blocks.push({ type: "list", ordered: true, items });
      continue;
    }

    if (line.startsWith(">")) {
      const quoted: string[] = [];
      while (index < lines.length && lines[index].trim().startsWith(">")) {
        quoted.push(lines[index].trim().replace(/^>\s?/, ""));
        index += 1;
      }
      blocks.push({ type: "quote", lines: quoted });
      continue;
    }

    const paragraph: string[] = [];
    while (index < lines.length) {
      const current = lines[index].trim();
      if (!current || isBlockStart(current)) break;
      paragraph.push(current);
      index += 1;
    }
    if (paragraph.length > 0) {
      blocks.push({ type: "paragraph", lines: paragraph });
    }
  }

  return blocks;
}

export function FormattedText({
  text,
  className,
}: {
  text: string;
  className?: string;
}) {
  const blocks = parseBlocks(text);

  return (
    <div className={cn("space-y-3 text-sm leading-6 text-slate-200", className)}>
      {blocks.map((block, blockIndex) => {
        const key = `block-${blockIndex}`;

        if (block.type === "rule") {
          return <hr key={key} className="border-slate-700/60" />;
        }

        if (block.type === "heading") {
          return block.level <= 2 ? (
            <h3 key={key} className="pt-0.5 font-bold tracking-tight text-white">
              {renderInline(block.text, key)}
            </h3>
          ) : (
            <h4 key={key} className="font-mono text-[11px] font-bold uppercase tracking-wider text-blue-300">
              {renderInline(block.text, key)}
            </h4>
          );
        }

        if (block.type === "paragraph") {
          return (
            <p key={key}>
              {renderInline(block.lines.join(" "), key)}
            </p>
          );
        }

        if (block.type === "quote") {
          return (
            <blockquote
              key={key}
              className="border-l-2 border-blue-500/50 pl-3 text-slate-300"
            >
              {block.lines.map((line, lineIndex) => (
                <span key={`${key}-${lineIndex}`} className="block">
                  {renderInline(line, `${key}-${lineIndex}`)}
                </span>
              ))}
            </blockquote>
          );
        }

        const ListTag = block.ordered ? "ol" : "ul";
        return (
          <ListTag key={key} className="ml-0.5 space-y-1.5">
            {block.items.map((item, itemIndex) => (
              <li key={`${key}-${itemIndex}`} className="flex gap-2.5">
                {block.ordered ? (
                  <span className="mt-0.5 shrink-0 font-mono text-[11px] font-bold text-blue-400">
                    {itemIndex + 1}.
                  </span>
                ) : (
                  <span className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-blue-400" />
                )}
                <span>{renderInline(item, `${key}-${itemIndex}`)}</span>
              </li>
            ))}
          </ListTag>
        );
      })}
    </div>
  );
}
