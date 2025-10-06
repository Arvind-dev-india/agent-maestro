"use client";

import React, { useEffect, useRef, useState } from "react";

interface MermaidRendererProps {
  chart: string;
  id?: string;
}

export const MermaidRenderer: React.FC<MermaidRendererProps> = ({
  chart,
  id,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState<string>("Loading...");
  const [error, setError] = useState<string | null>(null);
  const [svgContent, setSvgContent] = useState<string>("");

  useEffect(() => {
    let isMounted = true;

    const renderDiagram = async () => {
      try {
        setStatus("Loading mermaid library...");
        setError(null);
        setSvgContent("");

        // Check if mermaid is already loaded
        if (!(window as any).mermaid) {
          // Load mermaid script if not already loaded
          const existingScript = document.querySelector(
            'script[src*="mermaid"]',
          );
          if (!existingScript) {
            const script = document.createElement("script");
            script.src =
              "https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.min.js";
            script.onload = () => console.log("Mermaid script loaded");
            script.onerror = () => {
              throw new Error("Failed to load mermaid script");
            };
            document.head.appendChild(script);

            // Wait for script to load
            await new Promise((resolve, reject) => {
              script.onload = resolve;
              script.onerror = reject;
            });
          }

          // Wait for mermaid to be available
          let attempts = 0;
          while (!(window as any).mermaid && attempts < 50 && isMounted) {
            await new Promise((resolve) => setTimeout(resolve, 100));
            attempts++;
          }

          if (!(window as any).mermaid) {
            throw new Error("Mermaid library not available");
          }
        }

        if (!isMounted) return;

        setStatus("Initializing mermaid...");
        const mermaid = (window as any).mermaid;

        // Initialize mermaid
        mermaid.initialize({
          startOnLoad: false,
          theme: "default",
          securityLevel: "loose",
        });

        setStatus("Rendering diagram...");

        // Generate unique ID
        const diagramId =
          id ||
          `mermaid-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

        // Render the diagram
        const result = await mermaid.render(diagramId, chart);

        if (!isMounted) return;

        if (result && result.svg) {
          setSvgContent(result.svg);
          setStatus("✅ Successfully rendered!");
        } else {
          throw new Error("No SVG content returned from mermaid");
        }
      } catch (err: any) {
        if (!isMounted) return;
        console.error("MermaidRenderer error:", err);
        setError(err.message);
        setStatus("❌ Failed to render");
      }
    };

    renderDiagram();

    return () => {
      isMounted = false;
    };
  }, [chart, id]);

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
        <div className="text-sm text-red-600 mb-2">
          Error rendering mermaid diagram:
        </div>
        <div className="text-xs text-red-500 mb-2">{error}</div>
        <div className="text-xs text-gray-600 mb-2">Status: {status}</div>
        <details>
          <summary className="text-xs text-gray-500 cursor-pointer">
            Show original code
          </summary>
          <pre className="mt-2 p-2 bg-gray-100 rounded text-xs overflow-auto">
            <code>{chart}</code>
          </pre>
        </details>
      </div>
    );
  }

  return (
    <div className="mermaid-container my-4">
      <div
        ref={containerRef}
        className="border bg-white p-4 min-h-[100px] flex items-center justify-center"
      >
        {svgContent ? (
          <div
            dangerouslySetInnerHTML={{ __html: svgContent }}
            className="mermaid-diagram w-full"
          />
        ) : (
          <div className="text-gray-500 text-sm">{status}</div>
        )}
      </div>
    </div>
  );
};
