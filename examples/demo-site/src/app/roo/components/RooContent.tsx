"use client";

import { RooProviders } from "../providers/RooProviders";
import { RooPageContent } from "./RooPageContent";

export default function RooContent() {
  return (
    <RooProviders>
      <RooPageContent />
    </RooProviders>
  );
}
