import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { EditKidForm } from "@/components/profile/EditKidForm";

export default async function EditKidPage({ params }: { params: { kidId: string } }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: kid } = await supabase
    .from("kid_profiles")
    .select("id, name, emoji, color_hex, hobbies, grade, birth_date, tone, avatar_url")
    .eq("id", params.kidId).single();
  if (!kid) redirect("/profiles");

  return <EditKidForm kid={kid} />;
}
