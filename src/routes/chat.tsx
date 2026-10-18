import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { BadgeCheck, ChevronLeft } from "lucide-react";
import { Page } from "@/components/AppShell";
import { FRIENDS } from "@/lib/demo-data";
import { useApp } from "@/lib/store";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/chat")({
  head: () => ({
    meta: [
      { title: "Chat — FanMap" },
      { name: "description", content: "Message concert friends and follow official artist channels." },
      { property: "og:title", content: "Chat — FanMap" },
      { property: "og:description", content: "Message concert friends and follow official artist channels." },
    ],
  }),
  component: Chat,
});

const THREADS = [{ id: "artist-nova", name: "Nova Lane", official: true }, ...FRIENDS.map((f) => ({ id: f.id, name: f.name, official: false }))];

function Chat() {
  const messages = useApp((s) => s.messages);
  const send = useApp((s) => s.sendMessage);
  const role = useApp((s) => s.role);
  const [open, setOpen] = useState<string | null>(null);
  const [text, setText] = useState("");
  const thread = THREADS.find((t) => t.id === open);

  if (role === "visitor")
    return <Page title="Chat"><p className="rounded-2xl border border-border bg-card p-6 text-center text-sm text-muted-foreground">Sign in as a verified fan to chat.</p></Page>;

  if (thread) {
    const list = messages.filter((m) => m.thread === thread.id);
    return (
      <Page title={thread.name} subtitle={thread.official ? "Official channel · read-only" : "Friend"}>
        <button onClick={() => setOpen(null)} className="-mt-4 mb-4 flex items-center gap-1 text-sm text-muted-foreground"><ChevronLeft className="h-4 w-4" />All chats</button>
        <div className="space-y-2">
          {list.map((m) => (
            <div key={m.id} className={cn("max-w-[80%] rounded-2xl px-4 py-2.5 text-sm", m.from === "me" ? "ml-auto bg-primary text-primary-foreground" : "bg-card")}>{m.text}</div>
          ))}
        </div>
        {!thread.official && (
          <form className="mt-6 flex gap-2" onSubmit={(e) => { e.preventDefault(); if (text.trim()) { send(thread.id, text.trim()); setText(""); } }}>
            <Input value={text} onChange={(e) => setText(e.target.value)} placeholder="Message" className="bg-secondary" />
            <Button type="submit">Send</Button>
          </form>
        )}
      </Page>
    );
  }

  return (
    <Page title="Chat">
      <div className="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-card">
        {THREADS.map((t) => {
          const last = messages.filter((m) => m.thread === t.id).at(-1);
          return (
            <button key={t.id} onClick={() => setOpen(t.id)} className="flex w-full items-center gap-3 px-4 py-3.5 text-left hover:bg-secondary">
              <div className="grid h-10 w-10 place-items-center rounded-full bg-secondary text-sm font-medium">{t.name[0]}</div>
              <div className="min-w-0 flex-1">
                <p className="flex items-center gap-1 text-sm font-medium">{t.name}{t.official && <BadgeCheck className="h-3.5 w-3.5 text-primary" />}</p>
                <p className="truncate text-xs text-muted-foreground">{last?.text ?? "Say hi"}</p>
              </div>
            </button>
          );
        })}
      </div>
    </Page>
  );
}
