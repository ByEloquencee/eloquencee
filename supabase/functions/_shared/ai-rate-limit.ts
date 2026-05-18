import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const DAILY_LIMIT = 30;

export interface RateLimitResult {
  ok: boolean;
  response?: Response;
  userId?: string;
  count?: number;
  limit?: number;
}

/**
 * Checks daily AI usage limit for the authenticated caller and increments it.
 * Returns ok=false with a ready Response if blocked or unauthenticated.
 *
 * Usage in an edge function:
 *   const rl = await enforceAiLimit(req, corsHeaders);
 *   if (!rl.ok) return rl.response!;
 */
export async function enforceAiLimit(
  req: Request,
  corsHeaders: Record<string, string>,
  limit: number = DAILY_LIMIT,
): Promise<RateLimitResult> {
  const authHeader = req.headers.get("Authorization") || "";
  const token = authHeader.replace(/^Bearer\s+/i, "").trim();

  const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
  const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;

  if (!token) {
    return {
      ok: false,
      response: new Response(
        JSON.stringify({ error: "Musisz być zalogowany, aby korzystać z funkcji AI." }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      ),
    };
  }

  // Resolve user id from JWT using service role (validates token directly)
  const admin = createClient(SUPABASE_URL, SERVICE_ROLE);
  const { data: userData, error: userErr } = await admin.auth.getUser(token);
  if (userErr || !userData?.user) {
    console.error("ai-rate-limit getUser error", userErr);
    return {
      ok: false,
      response: new Response(
        JSON.stringify({ error: "Sesja wygasła, zaloguj się ponownie." }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      ),
    };
  }
  const userId = userData.user.id;
  void ANON_KEY;

  // Increment using service role to bypass RLS
  // admin client already created above
  const { data, error } = await admin.rpc("check_and_increment_ai_usage", {
    _user_id: userId,
    _limit: limit,
  });

  if (error) {
    console.error("ai-rate-limit rpc error", error);
    // Fail-open to avoid breaking AI if RPC has a hiccup
    return { ok: true, userId, count: 0, limit };
  }

  const row = Array.isArray(data) ? data[0] : data;
  if (!row?.allowed) {
    return {
      ok: false,
      response: new Response(
        JSON.stringify({
          error: `Osiągnięto dzienny limit zapytań AI (${limit}/dzień). Spróbuj ponownie jutro.`,
          limit_reached: true,
          daily_limit: limit,
        }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      ),
    };
  }

  return { ok: true, userId, count: row.current_count, limit: row.daily_limit };
}
