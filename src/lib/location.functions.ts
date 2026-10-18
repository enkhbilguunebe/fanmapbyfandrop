import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";
export const locationAction = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    z.object({
      action: z.enum(["list", "request", "reciprocal", "position", "meet", "acceptMeeting"]),
      friend: z.string().uuid().optional(),
      session: z.string().uuid().optional(),
      password: z.string().optional(),
      lat: z.number().min(-90).max(90).optional(),
      lng: z.number().min(-180).max(180).optional(),
      accuracy: z.number().min(0).optional(),
    }),
  )
  .handler(async ({ context, data }) => {
    const { supabase, userId } = context;
    const { data: verified } = await supabase.rpc("fanmap_verified");
    if (!verified) throw new Error("Only verified fans can share locations");
    const { data: role } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .single();
    if (role?.role !== "fan") throw new Error("Artists cannot access friend locations");
    const { supabaseAdmin: admin } = await import("@/integrations/supabase/client.server");
    await admin.rpc("fanmap_location_cleanup");
    if (data.action === "request" || data.action === "reciprocal") {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user?.email || !data.password)
        throw new Error("Enter your account password to reverify");
      const { createClient } = await import("@supabase/supabase-js");
      const auth = createClient(
        process.env["SUPABASE_URL"] ?? "",
        process.env["SUPABASE_PUBLISHABLE_KEY"] ?? "",
        { auth: { persistSession: false, autoRefreshToken: false } },
      );
      const { error } = await auth.auth.signInWithPassword({
        email: user.email,
        password: data.password,
      });
      if (error) throw new Error("Account verification failed");
    }
    if (data.action === "request") {
      if (!data.friend) throw new Error("Select a friend");
      const { data: friend } = await supabase.rpc("fanmap_friends", { a: userId, b: data.friend });
      const { data: r } = await admin
        .from("user_roles")
        .select("role")
        .eq("user_id", data.friend)
        .single();
      if (!friend || r?.role !== "fan") throw new Error("An accepted fan friend is required");
      const { data: s, error } = await admin
        .from("location_sessions")
        .insert({ sender_id: userId, receiver_id: data.friend })
        .select()
        .single();
      if (error) throw error;
      return { session: s };
    }
    if (data.action === "list") {
      const { data: sessions, error } = await supabase
        .from("location_sessions")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      const { data: positions } = await supabase.from("location_positions").select("*");
      return { sessions: sessions ?? [], positions: positions ?? [] };
    }
    const { data: s } = await supabase
      .from("location_sessions")
      .select("*")
      .eq("id", data.session ?? "")
      .single();
    if (!s || s.status !== "active" || !s.expires_at || new Date(s.expires_at) <= new Date())
      throw new Error("Sharing is stopped or expired");
    const { error } = await admin.rpc("fanmap_location_write", {
      sid: s.id, uid: userId, act: data.action,
      latitude: data.lat ?? null, longitude: data.lng ?? null, precision_m: data.accuracy ?? null,
    });
    if (error) throw new Error("Sharing stopped or permission denied");
    return { ok: true };
  });
