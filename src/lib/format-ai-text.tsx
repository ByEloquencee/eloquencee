import React from "react";

/**
 * Converts simple markdown-like AI text (bold, bullets, numbered lists)
 * into React elements with proper typography.
 */
export function formatAIText(text: string): React.ReactNode {
  const lines = text.split("\n");
  const elements: React.ReactNode[] = [];
  let listItems: React.ReactNode[] = [];
  let listType: "ul" | "ol" | null = null;

  const flushList = () => {
    if (listItems.length > 0 && listType) {
      const Tag = listType;
      elements.push(
        <Tag key={`list-${elements.length}`} className={`pl-4 space-y-1 ${listType === "ul" ? "list-disc" : "list-decimal"}`}>
          {listItems.map((item, i) => (
            <li key={i} className="text-[13px] leading-relaxed">{item}</li>
          ))}
        </Tag>
      );
      listItems = [];
      listType = null;
    }
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();
    if (!trimmed) {
      flushList();
      continue;
    }

    // Bullet list: "- item", "• item", "* item" (but not **bold**)
    const bulletMatch = trimmed.match(/^[-•]\s+(.+)$/) || trimmed.match(/^\*\s+([^*].*)$/);
    if (bulletMatch) {
      if (listType !== "ul") flushList();
      listType = "ul";
      listItems.push(formatInline(bulletMatch[1]));
      continue;
    }

    // Numbered list: "1. item", "2) item"
    const numMatch = trimmed.match(/^\d+[.)]\s+(.+)$/);
    if (numMatch) {
      if (listType !== "ol") flushList();
      listType = "ol";
      listItems.push(formatInline(numMatch[1]));
      continue;
    }

    flushList();

    // Heading-like lines: "## heading" or "**heading**" on its own
    const headingMatch = trimmed.match(/^#{1,3}\s+(.+)$/) || (trimmed.match(/^\*\*(.+)\*\*$/) && trimmed.match(/^\*\*(.+)\*\*$/));
    if (headingMatch) {
      elements.push(
        <p key={`h-${i}`} className="font-semibold text-[13px] text-foreground mt-2 first:mt-0">
          {formatInline(headingMatch[1])}
        </p>
      );
      continue;
    }

    // Regular paragraph
    elements.push(
      <p key={`p-${i}`} className="text-[13px] leading-relaxed">
        {formatInline(trimmed)}
      </p>
    );
  }

  flushList();

  return <div className="space-y-2">{elements}</div>;
}

/** Formats inline markdown: **bold**, *italic*, „quotes" */
function formatInline(text: string): React.ReactNode {
  // Replace **bold** and *italic*
  const parts: React.ReactNode[] = [];
  const regex = /\*\*(.+?)\*\*|\*(.+?)\*/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(cleanText(text.slice(lastIndex, match.index)));
    }
    if (match[1]) {
      parts.push(<strong key={match.index} className="font-semibold text-foreground">{cleanText(match[1])}</strong>);
    } else if (match[2]) {
      parts.push(<em key={match.index} className="italic">{cleanText(match[2])}</em>);
    }
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < text.length) {
    parts.push(cleanText(text.slice(lastIndex)));
  }

  return parts.length === 1 ? parts[0] : <>{parts}</>;
}

/** Clean up leftover markdown artifacts */
function cleanText(text: string): string {
  return text
    .replace(/^#+\s*/, "")
    .replace(/\*\*/g, "")
    .replace(/(\s)\*(\s)/g, "$1•$2"); // lone asterisks to bullets
}
