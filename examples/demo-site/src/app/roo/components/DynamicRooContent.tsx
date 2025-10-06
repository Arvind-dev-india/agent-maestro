"use client";

import dynamic from "next/dynamic";

const RooContent = dynamic(() => import("./RooContent"), { ssr: false });

export function DynamicRooContent() {
  return <RooContent />;
}
