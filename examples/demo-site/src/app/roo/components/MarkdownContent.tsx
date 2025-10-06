import React, { useMemo } from "react";

import { parseMermaidBlocks, renderMarkdown } from "../utils/markdown";
import { MermaidRenderer } from "./MermaidRenderer";

interface MarkdownContentProps {
  content: string;
  className?: string;
}

export const MarkdownContent: React.FC<MarkdownContentProps> = ({
  content,
  className = "",
}) => {
  // Parse the content to separate mermaid blocks from regular markdown
  // Use useMemo to prevent unnecessary re-parsing
  const sections = useMemo(() => {
    return parseMermaidBlocks(content).sections;
  }, [content]);

  return (
    <div className={`markdown-content ${className}`}>
      {sections.map((section, index) => {
        if (section.type === "mermaid") {
          // Create a stable key that includes content hash to avoid unnecessary re-renders
          const contentHash = btoa(section.content).slice(0, 8);
          const stableKey = `mermaid-${index}-${contentHash}`;

          return (
            <MermaidRenderer
              key={stableKey}
              chart={section.content}
              id={`diagram-${index}`}
            />
          );
        } else {
          // Regular markdown content
          const htmlContent = renderMarkdown(section.content);
          return (
            <div
              key={`markdown-${index}`}
              dangerouslySetInnerHTML={{ __html: htmlContent }}
            />
          );
        }
      })}
    </div>
  );
};
