"use client";

import React from "react";

import { MermaidDebug } from "../components/MermaidDebug";
import { MermaidRenderer } from "../components/MermaidRenderer";
import { MermaidTest } from "../components/MermaidTest";

export default function MermaidTestPage() {
  const testChart = `graph TD
    A[Start] --> B{Is it?}
    B -->|Yes| C[OK]
    B -->|No| D[End]
    C --> D`;

  return (
    <div className="container mx-auto p-8 space-y-6">
      <h1 className="text-3xl font-bold mb-6">Mermaid Test Page</h1>

      <MermaidTest />

      <div className="p-4 border rounded-lg">
        <h3 className="font-bold mb-2">Direct MermaidRenderer Test</h3>
        <p>Testing MermaidRenderer component directly:</p>
        <MermaidRenderer chart={testChart} id="direct-test" />
      </div>

      <MermaidDebug />

      <div className="p-4 border rounded-lg">
        <h3 className="font-bold mb-2">Direct Test</h3>
        <p>Test markdown with mermaid:</p>
        <div className="mt-4 p-4 bg-white border rounded">
          <pre>{`\`\`\`mermaid
graph TD
    A[Start] --> B{Is it?}
    B -->|Yes| C[OK]
    B -->|No| D[End]
    C --> D
\`\`\``}</pre>
        </div>
      </div>
    </div>
  );
}
