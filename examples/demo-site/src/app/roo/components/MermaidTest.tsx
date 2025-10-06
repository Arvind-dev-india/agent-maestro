"use client";

import React, { useEffect, useRef, useState } from "react";

export const MermaidTest: React.FC = () => {
  const mermaidRef = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState<string>("Starting...");
  const [error, setError] = useState<string | null>(null);

  const simpleChart = `
graph LR
A[Start] --> B[Process]
B --> C[End]
`;

  useEffect(() => {
    let isMounted = true;

    const testMermaid = async () => {
      try {
        setStatus("Loading mermaid library...");

        // Try to load mermaid from CDN
        if (!(window as any).mermaid) {
          const script = document.createElement("script");
          script.src =
            "https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.min.js";

          const loadPromise = new Promise((resolve, reject) => {
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
          });

          await loadPromise;
          setStatus("Script loaded, waiting for mermaid...");

          // Wait for mermaid to be available
          let attempts = 0;
          while (!(window as any).mermaid && attempts < 100) {
            await new Promise((resolve) => setTimeout(resolve, 50));
            attempts++;
          }

          if (!(window as any).mermaid) {
            throw new Error("Mermaid not available after loading");
          }
        }

        const mermaid = (window as any).mermaid;
        setStatus("Mermaid available, initializing...");

        // Initialize mermaid
        mermaid.initialize({
          startOnLoad: false,
          theme: "default",
          securityLevel: "loose",
        });

        setStatus("Initialized, rendering diagram...");

        if (mermaidRef.current && isMounted) {
          try {
            const diagramId = "test-mermaid-" + Date.now();

            // Clear the container
            mermaidRef.current.innerHTML = "";

            setStatus("Calling mermaid.render...");

            // Try different rendering approaches
            const result = await mermaid.render(diagramId, simpleChart);

            if (result && result.svg) {
              mermaidRef.current.innerHTML = result.svg;
              setStatus("✅ Successfully rendered!");
            } else {
              throw new Error("No SVG returned from mermaid.render");
            }
          } catch (renderError: any) {
            console.error("Render error:", renderError);
            setError(`Render error: ${renderError.message}`);
            setStatus("❌ Render failed");
          }
        }
      } catch (loadError: any) {
        console.error("Load error:", loadError);
        setError(`Load error: ${loadError.message}`);
        setStatus("❌ Load failed");
      }
    };

    testMermaid();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div className="p-4 border rounded-lg bg-gray-50">
      <h3 className="font-bold mb-2">Mermaid Test</h3>
      <div className="mb-2">
        <strong>Status:</strong> {status}
      </div>
      {error && (
        <div className="mb-2 text-red-600">
          <strong>Error:</strong> {error}
        </div>
      )}
      <div className="mb-2">
        <strong>Input:</strong>
        <pre className="text-xs bg-gray-200 p-2 rounded">{simpleChart}</pre>
      </div>
      <div className="mb-2">
        <strong>Output:</strong>
      </div>
      <div
        ref={mermaidRef}
        className="border bg-white p-4 min-h-[100px] flex items-center justify-center"
        style={{ minHeight: "100px" }}
      >
        {!error && status.includes("Rendering") && (
          <div className="text-gray-500">Loading...</div>
        )}
      </div>
      <div className="mt-2 text-xs text-gray-600">
        <strong>Debug info:</strong>
        <br />
        Mermaid available:{" "}
        {typeof window !== "undefined" && (window as any).mermaid
          ? "Yes"
          : "No"}
        <br />
        Scripts in head:{" "}
        {typeof document !== "undefined"
          ? document.querySelectorAll('script[src*="mermaid"]').length
          : 0}
      </div>
    </div>
  );
};
