import { redirect } from "next/navigation";
import type { NextRequest } from "next/server";

import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  const supabase = await createClient();

  await supabase.auth.signOut();

  redirect(new URL("/?login_status=signed_out", request.url).toString());
}
