import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

export interface ModeratorGuardResult {
  ok: boolean;
  response?: Response;
  userId?: string;
  admin?: ReturnType<typeof createClient>;
}

export async function requireModerator(
  req: Request,
  corsHeaders: Record<string, string>,
): Promise<ModeratorGuardResult> {
  const authHeader = req.headers.get("Authorization") || "";
  const token = authHeader.replace(/^Bearer\s+/i, "").trim();
  const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
  const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

  if (!token) {
    return {
      ok: false,
      response: new Response(JSON.stringify({ error: "Musisz być zalogowany." }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }),
    };
  }

  const admin = createClient(SUPABASE_URL, SERVICE_ROLE);
  const { data: userData, error: userErr } = await admin.auth.getUser(token);
  if (userErr || !userData?.user) {
    return {
      ok: false,
      response: new Response(JSON.stringify({ error: "Sesja wygasła." }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }),
    };
  }

  const userId = userData.user.id;
  const { data: roleRow } = await admin
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .eq("role", "moderator")
    .maybeSingle();

  if (!roleRow) {
    return {
      ok: false,
      response: new Response(JSON.stringify({ error: "Brak uprawnień moderatora." }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }),
    };
  }

  return { ok: true, userId, admin };
}
