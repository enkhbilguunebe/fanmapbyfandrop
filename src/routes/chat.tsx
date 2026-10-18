import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, useRef } from "react";
import { useServerFn } from "@tanstack/react-start";
import { BadgeCheck, ArrowLeft, Send, Search, MapPin, UserRound } from "lucide-react";
import { Page } from "@/components/AppShell";
import { useAccount } from "@/lib/account";
import { friendAction } from "@/lib/fanmap.functions";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { LocationPanel } from "@/components/LocationPanel";
import { cn } from "@/lib/utils";
import { demoFriendRows, demoChatRows, DEMO_DELIVERIES, usePresentationDemo } from "@/lib/presentation-demo";
import { FindFriendsIcon } from "@/components/FindFriendsIcon";
export const Route = createFileRoute("/chat")({
  head: () => ({
    meta: [
      { title: "Friends & Artists — FanMap" },
      { name: "description", content: "Your concert friends and exclusive artist messages." },
      { property: "og:title", content: "Friends & Artists — FanMap" },
      {
        property: "og:description",
        content: "Connected concert conversations and authorized artist content.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Chat,
});
function Chat() {
  const { user, account } = useAccount();
  const isDemo = !!account?.profile.is_demo && account.profile.username === "olivia";
  const demoChat = usePresentationDemo(s => s.chat);
  const action = useServerFn(friendAction);
  const [segment, setSegment] = useState<"friends" | "artists">("friends");
  const [search, setSearch] = useState({ friends: "", artists: "" });
  const [friends, setFriends] = useState<any[]>([]);
  const [deliveries, setDeliveries] = useState<any[]>([]);
  const [messages, setMessages] = useState<any[]>([]);
  const [open, setOpen] = useState<string | null>(null);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [location, setLocation] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  async function load() {
    try {
      const r = await action({ data: { action: "list" } });
      if ("friends" in r) setFriends(r.friends ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to load friends");
    }
    const { data } = await supabase.from("deliveries").select("*").order("created_at");
    setDeliveries(data ?? []);
    const { data: m } = await supabase.from("friend_messages").select("*").order("created_at");
    setMessages(m ?? []);
  }
  useEffect(() => {
    if (!user) return;
    void load();
    const channel = supabase
      .channel("chat-" + user.id)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "friend_messages" },
        () => void load(),
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "friendships" },
        () => void load(),
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "deliveries" },
        () => void load(),
      )
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [user?.id]);
  useEffect(() => {
    input.current?.focus();
  }, [open, busy]);
  const visibleFriends = [...friends, ...(isDemo && user ? demoFriendRows(user.id) : [])];
  const visibleMessages = [...(isDemo && user ? demoChatRows(user.id) : []), ...messages, ...(isDemo ? demoChat : [])];
  const visibleDeliveries = [...(isDemo ? DEMO_DELIVERIES : []), ...deliveries];
  const accepted = visibleFriends.filter((f) => f.status === "accepted");
  const selected = accepted.find((f) => f.id === open);
  const artist = open === "artist-nova";
  if (open && (selected || artist))
    return (
      <Page
        title={artist ? "Jasper Vale" : (selected.person?.display_name ?? "Friend")}
        subtitle={artist ? "Verified artist · official announcements" : "Connected concert friend"}
      >
        <div className="mb-5 flex justify-between">
          <Button variant="ghost" onClick={() => setOpen(null)}>
            <ArrowLeft />
            All chats
          </Button>
          {!artist && (
            <Button variant="secondary" size="sm" onClick={() => setLocation(true)}>
              <FindFriendsIcon className="h-5 w-5" />
              Find friends
            </Button>
          )}
        </div>
        <div className="min-h-64 space-y-4">
          {isDemo && <p className="text-xs text-gold">Fictional demo conversations · New demo replies stay in this session.</p>}
          {(artist ? visibleDeliveries : visibleMessages.filter((m) => m.friendship_id === open)).map((m) => (
            <div
              key={m.id}
              className={cn(
                "max-w-[85%] rounded-lg p-3 text-sm",
                m.sender_id === user?.id ? "ml-auto bg-primary text-primary-foreground" : "bg-card",
              )}
            >
              <p className="whitespace-pre-wrap">{m.text}</p>
              {m.media_path && <AuthorizedMedia path={m.media_path} type={m.media_type} />}
              <p className="mt-2 text-[10px] opacity-70">
                {new Date(m.created_at).toLocaleTimeString(undefined, {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            </div>
          ))}
        </div>
        {!artist && (
          <form
            className="mt-6 flex gap-2"
            onSubmit={async (e) => {
              e.preventDefault();
              if (!text.trim() || !user) return;
              if (open?.startsWith("demo-")) { usePresentationDemo.getState().send(open, user.id, text.trim()); setText(""); return; }
              setBusy(true);
              const { error } = await supabase
                .from("friend_messages")
                .insert({ friendship_id: open, sender_id: user.id, text: text.trim() });
              if (error) setError(error.message);
              else {
                setText("");
                await load();
              }
              setBusy(false);
            }}
          >
            <Input
              ref={input}
              aria-label="Message"
              placeholder="Message your friend"
              value={text}
              onChange={(e) => setText(e.target.value)}
            />
            <Button
              size="icon"
              type="submit"
              aria-label="Send message"
              disabled={busy || !text.trim()}
            >
              <Send />
            </Button>
          </form>
        )}
        {error && (
          <p role="alert" className="mt-3 text-sm text-destructive">
            {error}
          </p>
        )}
        {selected && (
          <LocationPanel
            open={location}
            onClose={() => setLocation(false)}
            friendId={selected.sender_id === user?.id ? selected.receiver_id : selected.sender_id}
          />
        )}
      </Page>
    );
  return (
    <Page title="Chat" subtitle="The crowd becomes your people.">
      <div className="mb-5 grid grid-cols-2 rounded-lg border border-border bg-secondary p-1">
        {(["friends", "artists"] as const).map((s) => (
          <Button
            key={s}
            variant="ghost"
            className={cn(
              "h-11 capitalize",
              segment === s
                ? "bg-primary text-primary-foreground hover:bg-primary"
                : "text-muted-foreground",
            )}
            onClick={() => {
              setSegment(s);
              setOpen(null);
            }}
          >
            {s === "friends" ? <UserRound /> : <BadgeCheck />}
            {s}
          </Button>
        ))}
      </div>
      <div className="mb-5 flex items-center gap-2">
        <Search className="h-4 w-4 text-muted-foreground" />
        <Input
          aria-label="Search conversations"
          value={search[segment]}
          onChange={(e) => setSearch({ ...search, [segment]: e.target.value })}
          placeholder={`Search ${segment}`}
        />
      </div>
      {segment === "friends" ? (
        <>
          {friends
            .filter((f) => f.status === "pending" && f.receiver_id === user?.id)
            .map((f) => (
              <div key={f.id} className="mb-4 border-b border-border pb-4">
                <p>{f.person?.display_name} wants to connect</p>
                <div className="mt-2 flex gap-2">
                  {(["accept", "decline"] as const).map((a) => (
                    <Button
                      key={a}
                      variant={a === "accept" ? "default" : "secondary"}
                      onClick={async () => {
                        await action({ data: { action: a, value: f.id } });
                        await load();
                      }}
                    >
                      {a === "accept" ? "Accept" : "Decline"}
                    </Button>
                  ))}
                </div>
              </div>
            ))}
          {accepted
            .filter((f) =>
              f.person?.display_name.toLowerCase().includes(search.friends.toLowerCase()),
            )
            .map((f) => {
              const last = visibleMessages.filter((m) => m.friendship_id === f.id).at(-1);
              return (
                <Button
                  variant="ghost"
                  key={f.id}
                  className="h-auto w-full justify-start border-b border-border py-4 text-left"
                  onClick={() => setOpen(f.id)}
                >
                  <div className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-primary/10 text-primary">
                    {f.person?.display_name[0]}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p>{f.person?.display_name}</p>
                    <p className="truncate text-xs font-normal text-muted-foreground">
                      {last?.text ?? "Your next concert starts here."}
                    </p>
                  </div>
                  {last && (
                    <span className="text-[10px] text-muted-foreground">
                      {last.created_at.slice(11, 16)}
                    </span>
                  )}
                </Button>
              );
            })}
          {!accepted.length && (
            <div className="py-10 text-center">
              <UserRound className="mx-auto h-10 w-10 text-primary" />
              <h2 className="mt-4 font-semibold">Find your concert people</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                No accepted friends yet. Your personal QR is in the top-left corner.
              </p>
              {error && <p className="mt-3 text-xs text-gold">{error}</p>}
            </div>
          )}
        </>
      ) : visibleDeliveries.length && "jasper vale".includes(search.artists.toLowerCase()) ? (
        <Button
          variant="ghost"
          className="h-auto w-full justify-start border-b border-border py-4"
          onClick={() => setOpen("artist-nova")}
        >
          <div className="grid h-12 w-12 place-items-center rounded-full bg-gold/10 text-gold">
            JV
          </div>
          <div className="min-w-0 flex-1 text-left">
            <p className="flex items-center gap-2">
              Jasper Vale
              <BadgeCheck className="text-success" />
            </p>
            <p className="truncate text-xs text-muted-foreground">{visibleDeliveries.at(-1)?.text}</p>
          </div>
        </Button>
      ) : (
        <div className="py-10 text-center">
          <BadgeCheck className="mx-auto h-10 w-10 text-success" />
          <h2 className="mt-4 font-semibold">Closer to the artist</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Eligible artist announcements and exclusive content will appear here.
          </p>
        </div>
      )}
    </Page>
  );
}
export function AuthorizedMedia({ path, type }: { path: string; type: string }) {
  const [url, setUrl] = useState("");
  useEffect(() => {
    void supabase.storage
      .from("fanmap-media")
      .createSignedUrl(path, 60)
      .then(({ data }) => setUrl(data?.signedUrl ?? ""));
  }, [path]);
  return url ? (
    type?.startsWith("audio") ? (
      <audio controls src={url} className="mt-3 w-full" />
    ) : type?.startsWith("video") ? (
      <video controls src={url} className="mt-3 w-full rounded-lg" />
    ) : (
      <a href={url} className="mt-3 block underline" target="_blank" rel="noreferrer">
        Open attachment
      </a>
    )
  ) : (
    <p className="mt-2 text-xs">Media unavailable or access expired.</p>
  );
}
