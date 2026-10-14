import type { NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/proxy";

export async function proxy(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  // Pour l'instant, seul le back-office a besoin de la session.
  matcher: ["/admin/:path*"],
};
