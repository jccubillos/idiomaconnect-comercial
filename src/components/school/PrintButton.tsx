"use client";

import { NeonButton } from "@/components/ui/NeonButton";

export function PrintButton() {
  return (
    <NeonButton variant="primary" size="lg" onClick={() => window.print()}>
      🖨 Imprimir certificado
    </NeonButton>
  );
}
