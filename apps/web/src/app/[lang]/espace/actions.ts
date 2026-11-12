"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function seDeconnecterPublic(formData: FormData) {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect(formData.get("langue") === "ar" ? "/ar" : "/fr");
}
