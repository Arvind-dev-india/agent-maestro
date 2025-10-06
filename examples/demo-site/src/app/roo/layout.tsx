"use client";

import { RooProviders } from "./providers/RooProviders";

export default function RooLayout({ children }: { children: React.ReactNode }) {
  return <RooProviders>{children}</RooProviders>;
}
