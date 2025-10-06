import MarkdownIt from "markdown-it";

// Initialize markdown-it with configuration for safe HTML rendering
export const createMarkdownRenderer = (): MarkdownIt => {
  return new MarkdownIt({
    html: true,
    linkify: true,
    typographer: true,
    breaks: true,
  });
};

// Default markdown renderer instance
export const md = createMarkdownRenderer();

// Utility function to render markdown to HTML
export const renderMarkdown = (content: string): string => {
  return md.render(content);
};

// Interface for parsed content sections
export interface ContentSection {
  type: "markdown" | "mermaid";
  content: string;
}

// Parse content and separate mermaid blocks from regular markdown
export const parseMermaidBlocks = (
  content: string,
): { sections: ContentSection[] } => {
  const sections: ContentSection[] = [];

  // Regex to match mermaid code blocks (including potential whitespace and different syntax)
  const mermaidRegex = /```\s*mermaid\s*\n([\s\S]*?)\n```/gi;

  let lastIndex = 0;
  let match;

  // Find all mermaid blocks
  while ((match = mermaidRegex.exec(content)) !== null) {
    // Add any content before the mermaid block as markdown
    if (match.index > lastIndex) {
      const markdownContent = content.slice(lastIndex, match.index).trim();
      if (markdownContent) {
        sections.push({
          type: "markdown",
          content: markdownContent,
        });
      }
    }

    // Add the mermaid content
    const mermaidContent = match[1].trim();
    if (mermaidContent) {
      sections.push({
        type: "mermaid",
        content: mermaidContent,
      });
    }

    lastIndex = match.index + match[0].length;
  }

  // Add any remaining content after the last mermaid block as markdown
  if (lastIndex < content.length) {
    const markdownContent = content.slice(lastIndex).trim();
    if (markdownContent) {
      sections.push({
        type: "markdown",
        content: markdownContent,
      });
    }
  }

  // If no mermaid blocks were found, return the entire content as markdown
  if (sections.length === 0) {
    sections.push({
      type: "markdown",
      content: content,
    });
  }

  return { sections };
};
