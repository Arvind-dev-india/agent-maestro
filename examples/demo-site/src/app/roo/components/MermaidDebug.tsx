"use client";

import React from "react";

import { MarkdownContent } from "./MarkdownContent";

export const MermaidDebug: React.FC = () => {
  const testContent = `Here's a mermaid flowchart:

\`\`\`mermaid
graph TD
    A[Start] --> B{Decision}
    B -->|Yes| C[Process A]
    B -->|No| D[Process B]
    C --> E[End]
    D --> E[End]
\`\`\`

And here's another diagram:

\`\`\`mermaid
sequenceDiagram
    participant U as User
    participant S as System
    U->>S: Request
    S-->>U: Response
\`\`\`

This demonstrates mermaid rendering in markdown content!`;

  return (
    <div className="p-4 border rounded-lg bg-green-50 border-green-200">
      <h3 className="font-bold mb-2 text-green-800">
        ✅ Mermaid Integration Test
      </h3>
      <p className="text-sm text-green-700 mb-4">
        Testing mermaid diagrams in markdown content:
      </p>
      <div className="bg-white p-4 rounded border space-y-4">
        <MarkdownContent content={testContent} />
      </div>
    </div>
  );
};
