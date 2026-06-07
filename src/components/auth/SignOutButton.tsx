"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { NeonButton } from "@/components/ui/NeonButton";

export function SignOutButton({ className }: { className?: string }) {
  const router = useRouter();
  async function out() {
    await createClient().auth.signOut();
    router.push("/login");
    router.refresh();
  }
  return (
    <NeonButton variant="ghost-cyan" size="sm" onClick={out} className={className}>
      Cerrar sesión
    </NeonButton>
  );
}
