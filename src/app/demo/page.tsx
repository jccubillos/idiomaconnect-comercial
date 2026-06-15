import type { Metadata } from "next";
import { DemoEntry } from "@/components/demo/DemoEntry";

export const metadata: Metadata = {
  title: "Demo para afiliados — IdiomaConnect",
  description: "Acceso de demostración de IdiomaConnect para afiliados.",
  // NO indexada: se comparte por el kit de afiliados, no debe salir en buscadores.
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default function DemoPage() {
  return <DemoEntry />;
}
