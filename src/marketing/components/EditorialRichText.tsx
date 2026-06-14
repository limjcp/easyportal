import type { ReactNode } from "react";

type EditorialRichTextProps = {
  text: string;
  className?: string;
};

const EMPHASIS_PATTERN = /\*\*(.+?)\*\*/g;

export function parseEditorialRichText(text: string): ReactNode[] {
  const parts: ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let key = 0;

  while ((match = EMPHASIS_PATTERN.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }
    parts.push(
      <strong key={`em-${key++}`} className="font-medium text-foreground">
        {match[1]}
      </strong>
    );
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return parts.length > 0 ? parts : [text];
}

export function EditorialRichText({ text, className }: EditorialRichTextProps) {
  return <span className={className}>{parseEditorialRichText(text)}</span>;
}
