import { createClient } from "@supabase/supabase-js";
import { convertToModelMessages, type UIMessage } from "ai";
import { createResponsesCall } from "./ai/responses.ts";
import { z } from "zod";
export async function handleGuide(request: Request) {
  const url = process.env["SUPABASE_URL"];
  const key = process.env["SUPABASE_PUBLISHABLE_KEY"];
  const aiKey = process.env["LOVABLE_API_KEY"];
  if (!url || !key || !aiKey)
    return Response.json({ error: "AI guide configuration is missing" }, { status: 401 });
  const bearer = request.headers.get("Authorization") ?? "";
  const db = createClient(url, key, {
    auth: { persistSession: false },
    global: { headers: { Authorization: bearer } },
  });
  const {
    data: { user },
    error,
  } = await db.auth.getUser(bearer.replace("Bearer ", ""));
  if (error || !user) return Response.json({ error: "Sign in to use your guide" }, { status: 401 });
  let body;
  try {
    body = z
      .object({
        eventId: z.string(),
        messages: z
          .array(
            z.object({
              id: z.string(),
              role: z.enum(["user", "assistant"]),
              parts: z.array(z.unknown()),
            }),
          )
          .max(200),
      })
      .parse(await request.json());
  } catch {
    return Response.json({ error: "Invalid conversation" }, { status: 400 });
  }
  const { data: event } = await db
    .from("events")
    .select("id,artist_name,venue,city,starts_at,is_demo")
    .eq("id", body.eventId)
    .single();
  if (!event) return Response.json({ error: "Concert unavailable" }, { status: 404 });
  if (Date.parse(event.starts_at) + 4 * 3600000 < Date.now())
    return Response.json(
      { error: "The guide is available for upcoming and active concerts only" },
      { status: 400 },
    );
  const { data: thread } = await db
    .from("guide_threads")
    .select("messages")
    .eq("event_id", event.id)
    .eq("user_id", user.id)
    .maybeSingle();
  const saved = (thread?.messages ?? []) as UIMessage[];
  const last = body.messages.at(-1);
  if (!last || last.role !== "user")
    return Response.json({ error: "A new question is required" }, { status: 400 });
  const messages = [...saved, last] as UIMessage[];
  const { error: saveError } = await db
    .from("guide_threads")
    .upsert(
      { user_id: user.id, event_id: event.id, messages: messages as any },
      { onConflict: "user_id,event_id" },
    );
  if (saveError) return Response.json({ error: "Unable to save your question" }, { status: 500 });
  try {
    const { result } = createResponsesCall(
      request,
      { baseURL: "https://ai.gateway.lovable.dev/v1", apiKey: aiKey, model: "openai/gpt-6-astra" },
      await convertToModelMessages(messages),
      `You are FanMap AI, a concise helpful concert guide. Selected event: ${JSON.stringify(event)}. These event details are fictional demonstration data when is_demo is true. No verified live transit, gates, bag policies, official entrance maps or real ticket details are available. Never invent them or safety instructions. State limitations and suggest an official venue site or Google Maps directions. For friends explain accepted-friend QR connection and temporary consent-based location sharing. Answer using the full conversation, keep guidance practical and use markdown. Do not imply tickets establish attendance.`,
    );
    return result.toUIMessageStreamResponse({
      originalMessages: messages,
      sendReasoning: true,
      onError: (e) => (e instanceof Error ? e.message : "AI guide request failed"),
      onFinish: async ({ messages }) => {
        const { error } = await db
          .from("guide_threads")
          .upsert(
            {
              user_id: user.id,
              event_id: event.id,
              messages: messages as any,
              updated_at: new Date().toISOString(),
            },
            { onConflict: "user_id,event_id" },
          );
        if (error) throw new Error("Unable to save guide response");
      },
    });
  } catch (e) {
    if (request.signal.aborted) return new Response(null, { status: 499 });
    return Response.json(
      { error: e instanceof Error ? e.message : "AI guide unavailable" },
      { status: 500 },
    );
  }
}
