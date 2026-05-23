import { marked } from "marked";
import DOMPurify from "isomorphic-dompurify";

export interface MarkdownContentProps {
  markdown: string | null | undefined;
  className?: string;
}

/**
 * Renders markdown as sanitized HTML for long-form editorial content
 * (descripcion_editorial_{es,en}_md from Supabase). Returns null when empty.
 */
export function MarkdownContent({ markdown, className }: MarkdownContentProps) {
  if (!markdown || !markdown.trim()) return null;
  const rawHtml = marked.parse(markdown, { async: false }) as string;
  const clean = DOMPurify.sanitize(rawHtml);
  return (
    <div
      className={
        className ??
        "prose prose-lg max-w-none prose-headings:text-[#2C2C2C] prose-h2:text-xl prose-h2:font-bold prose-h2:mt-6 prose-h2:mb-3 prose-h3:text-lg prose-h3:font-semibold prose-p:text-gray-600 prose-p:leading-relaxed prose-strong:text-[#2C2C2C] prose-a:text-[#0D9488]"
      }
      dangerouslySetInnerHTML={{ __html: clean }}
    />
  );
}
