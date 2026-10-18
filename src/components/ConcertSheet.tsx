import { useMemo, useRef, useState } from "react";
import { X, CircleHelp, BadgeCheck, Lock, Heart, Trash2, Ticket, QrCode, Star, Upload, ChevronUp, ChevronDown } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { syncCloud } from "@/lib/cloud-sync";
import { useAccount } from "@/lib/account";
import { toast } from "sonner";
import { CONCERTS, artistOf, concertStatus, FRIENDS, OUTCOMES, PREDICTION_QUESTIONS, type Concert } from "@/lib/demo-data";
import { useApp } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { canParticipate, validReelDuration } from "@/lib/eligibility";

type Tab = "overview" | "reels" | "predict" | "letters" | "guide";

export function ConcertSheet({ concert, onClose }: { concert: Concert; onClose: () => void }) {
  const navigate=useNavigate();
  const [tab, setTab] = useState<Tab>("overview");
  const [expanded, setExpanded] = useState(false);
  const artist = artistOf(concert);
  const status = concertStatus(concert);
  const tickets = useApp((s) => s.tickets);
  const stamps = useApp((s) => s.stamps);
  const hasTicket = tickets.includes(concert.id);
  const stamp = stamps.find((s) => s.concertId === concert.id);
  const verified = canParticipate(status === "past", hasTicket, !!stamp);
  const date = new Date(concert.date);

  const tabs: { id: Tab; label: string }[] = [
    { id: "overview", label: "Overview" },
    { id: "reels", label: "Reel Battle" },
    { id: "predict", label: "Predict" },
    { id: "letters", label: "Letters" },
    ...(status !== "past" ? [{ id: "guide" as Tab, label: "Guide" }] : []),
  ];

  return (
    <div className={cn("animate-sheet shadow-sheet fixed inset-x-0 bottom-0 z-30 mx-auto flex max-w-xl flex-col overflow-hidden rounded-t-3xl border border-b-0 border-border bg-secondary transition-[height] duration-300", expanded ? "h-[92vh]" : "h-[62vh]")}>
      <button onClick={() => setExpanded(!expanded)} className="flex justify-center py-2 text-muted-foreground" aria-label="Resize">
        {expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
      </button>
      <div className="flex-1 overflow-y-auto px-5 pb-32">
        <div className="relative overflow-hidden rounded-2xl">
          <img src={concert.cover} alt={concert.venue} width={1024} height={640} className="h-36 w-full object-cover" />
          <button onClick={onClose} aria-label="Close" className="glass absolute right-2 top-2 rounded-full p-1.5"><X className="h-4 w-4" /></button>
          <span className="glass absolute left-2 top-2 rounded-full px-2.5 py-1 text-[11px] font-medium uppercase tracking-wider">
            {status === "today" ? "Tonight" : status === "past" ? "Past" : "Upcoming"}
          </span>
        </div>
        <div className="mt-4 flex items-start justify-between gap-3">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight">{artist.name}</h2>
            <p className="text-sm text-muted-foreground">{concert.tour} · {concert.venue}, {concert.city}</p>
            <p className="text-sm text-muted-foreground">{date.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric", year: "numeric" })}</p>
          </div>
          <StatusPill stamp={!!stamp} ticket={hasTicket} />
        </div>

        <div className="-mx-5 mt-5 flex gap-1 overflow-x-auto border-b border-border px-5">
          {tabs.map((t) => (
            <button key={t.id} onClick={() => setTab(t.id)} className={cn("whitespace-nowrap border-b-2 px-3 pb-2.5 text-sm transition-colors", tab === t.id ? "border-primary text-foreground" : "border-transparent text-muted-foreground")}>
              {t.label}
            </button>
          ))}
        </div>

        <div className="pt-5">
          {tab === "overview" && <Overview concert={concert} stampId={stamp?.id} hasTicket={hasTicket} />}
          {tab !== "overview" && !verified && <Locked />}
          {tab === "reels" && verified && <Reels concert={concert} />}
          {tab === "predict" && verified && <Predict concert={concert} />}
          {tab === "letters" && verified && <Letters concert={concert} />}
          {tab === "guide" && verified && <Guide concert={concert} />}
        </div>
      </div>
      {status!=="past"&&<Button size="icon" aria-label="Open AI concert guide" className="absolute bottom-28 right-5 h-11 w-11 rounded-full shadow-float" onClick={()=>navigate({to:"/guide/$eventId",params:{eventId:concert.id}})}><CircleHelp/></Button>}
    </div>
  );
}

function StatusPill({ stamp, ticket }: { stamp: boolean; ticket: boolean }) {
  if (stamp) return <span className="flex items-center gap-1 rounded-full bg-primary/15 px-2.5 py-1 text-xs text-primary"><BadgeCheck className="h-3.5 w-3.5" />Attended</span>;
  if (ticket) return <span className="flex items-center gap-1 rounded-full bg-gold/15 px-2.5 py-1 text-xs text-gold"><Ticket className="h-3.5 w-3.5" />Ticket</span>;
  return <span className="rounded-full border border-border px-2.5 py-1 text-xs text-muted-foreground">Public</span>;
}

function Locked() {
  return (
    <div className="rounded-2xl border border-border bg-card p-6 text-center">
      <Lock className="mx-auto h-5 w-5 text-muted-foreground" />
      <p className="mt-3 font-medium">Verified fans only</p>
      <p className="mt-1 text-sm text-muted-foreground">Link your ticket in Overview to unlock this experience.</p>
    </div>
  );
}

function Overview({ concert, stampId, hasTicket }: { concert: Concert; stampId?: string | undefined; hasTicket: boolean }) {
  const verifyTicket = useApp((s) => s.verifyTicket);
  const checkIn = useApp((s) => s.checkIn);
  const role = useApp((s) => s.role);
  const [code, setCode] = useState("");
  const status = concertStatus(concert);
  const friends = FRIENDS.filter((f) => f.concerts.includes(concert.id));

  const run = async (fn: (c: string) => Promise<string | null>, ok: string) => {
    const err = await fn(code);
    if (err) toast.error(err);
    else { toast.success(ok); setCode(""); }
  };

  return (
    <div className="space-y-5">
      {stampId ? (
        <div className="flex items-center gap-4 rounded-2xl border border-primary/30 bg-card p-4">
          <div className="grid h-14 w-14 place-items-center rounded-full border-2 border-dashed border-primary text-primary"><BadgeCheck className="h-6 w-6" /></div>
          <div><p className="font-medium">Passport stamp</p><p className="text-xs text-muted-foreground">Attendance record {stampId}</p></div>
        </div>
      ) : (
        <div className="rounded-2xl border border-border bg-card p-4">
          <p className="text-sm font-medium">{hasTicket ? "Check in at the venue" : status === "past" ? "Concert passed" : "Verify your ticket"}</p>
          <p className="mt-1 text-xs text-muted-foreground">
            {hasTicket ? "Scan the venue QR on concert day to earn your stamp. A ticket screenshot doesn't count." : status === "past" ? "Stamps can only be earned by checking in on the night." : "Link a ticket to unlock pre-show experiences."}
          </p>
          {role !== "visitor" && status !== "past" && (
            <>
              <div className="mt-3 flex gap-2">
                <Input value={code} onChange={(e) => setCode(e.target.value)} placeholder={hasTicket ? concert.checkinCode : concert.ticketCode} className="bg-secondary" />
                <Button onClick={() => (hasTicket ? run(checkIn, "Checked in. Stamp added to your passport.") : run(verifyTicket, "Ticket verified."))}>
                  {hasTicket ? <QrCode className="h-4 w-4" /> : <Ticket className="h-4 w-4" />}
                  {hasTicket ? "Check in" : "Verify"}
                </Button>
              </div>
              <p className="mt-2 text-[11px] text-gold">Demo code: {hasTicket ? concert.checkinCode : concert.ticketCode}</p>
            </>
          )}
          {role === "visitor" && <p className="mt-3 text-xs text-gold">Switch to a demo fan above to try verification.</p>}
        </div>
      )}
      {friends.length > 0 && (
        <div>
            <p className="mb-2 text-xs uppercase tracking-wider text-muted-foreground">Fictional demo fans here</p>
          <div className="flex gap-2">{friends.map((f) => <span key={f.id} className="rounded-full bg-card px-3 py-1 text-xs">{f.name}</span>)}</div>
        </div>
      )}
    </div>
  );
}

function Reels({ concert }: { concert: Concert }) {
  const reels = useApp((s) => s.reels.filter((r) => r.concertId === concert.id));
  const votes = useApp((s) => s.votes);
  const vote = useApp((s) => s.vote);
  const submit = useApp((s) => s.submitReel);
  const fileRef = useRef<HTMLInputElement>(null);
  const [i, setI] = useState(0);
  const approved = reels.filter((r) => r.status === "approved");
  const mine = reels.filter((r) => r.author === "You");
  const voted = votes[concert.id];
  const r = approved[i];

  const {user}=useAccount();
  const [preview,setPreview]=useState<string|null>(null);
  const [file,setFile]=useState<File|null>(null);
  const [duration,setDuration]=useState(0);
  const [busy,setBusy]=useState(false);
  const closed=concertStatus(concert)==="past";
  const onFile = (f?: File) => {
    if (!f) return;
    if (!f.type.startsWith("video/")) { toast.error("Please choose a video file."); return; }
    const url=URL.createObjectURL(f);const v=document.createElement("video");v.preload="metadata";
    v.onloadedmetadata=()=>{if(!validReelDuration(v.duration)){URL.revokeObjectURL(url);toast.error("Reels must be 10 seconds or less.");return;}setFile(f);setDuration(v.duration);setPreview(url);};
    v.onerror=()=>{URL.revokeObjectURL(url);toast.error("Unable to read this video.")};v.src=url;
  };
  const upload=async()=>{if(!file||!user)return;setBusy(true);const path=user.id+"/reels/"+crypto.randomUUID()+"."+(file.name.split(".").at(-1)??"mp4");const {error}=await supabase.storage.from("fanmap-media").upload(path,file);if(error){toast.error(error.message);setBusy(false);return;}const {error:e}=await supabase.from("reels").insert({user_id:user.id,event_id:concert.id,path,caption:file.name,duration});if(e)toast.error(e.message);else{toast.success("Submitted for artist moderation.");await syncCloud();if(preview)URL.revokeObjectURL(preview);setPreview(null);setFile(null);}setBusy(false);};

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">Submit a 10-second clip. Votes stay hidden until voting closes; winners are approved by the tour team.</p>
      <input ref={fileRef} type="file" accept="video/*" capture="environment" className="hidden" onChange={(e) => onFile(e.target.files?.[0])} />
      <Button variant="secondary" className="w-full" disabled={closed} onClick={() => fileRef.current?.click()}><Upload className="h-4 w-4" />Record or upload</Button>
      {preview&&<><video controls src={preview} className="w-full rounded-lg"/><Button disabled={busy} onClick={upload}>{busy?"Uploading…":"Submit reel"}</Button></>}
      {closed&&<p className="text-xs text-muted-foreground">Submission window closed. Historical reels remain available.</p>}
      {mine.length > 0 && <p className="text-xs text-muted-foreground">Your submissions: {mine.map((m) => `${m.caption} (${m.status})`).join(", ")}</p>}
      {r ? (
        <div className="relative overflow-hidden rounded-2xl">
          {r.video?<video controls src={r.video} className="aspect-[4/5] w-full object-contain"/>:<img src={r.poster||concert.cover} alt={r.caption} className="aspect-[4/5] w-full object-cover"/>}
          <div className="absolute inset-x-0 bottom-0 bg-background/90 p-4">
            <p className="font-medium">{r.caption}</p>
            <p className="text-xs text-muted-foreground">{r.author} · {i + 1}/{approved.length}</p>
            <div className="mt-3 flex gap-2">
              <Button variant="secondary" size="sm" onClick={() => setI((i - 1 + approved.length) % approved.length)}>Prev</Button>
              <Button size="sm" className="flex-1" disabled={!!voted || closed} onClick={() => { vote(concert.id, r.id); toast.success("Vote recorded."); }}>
                {voted === r.id ? "Your vote" : voted ? "Already voted" : "Vote"}
              </Button>
              <Button variant="secondary" size="sm" onClick={() => setI((i + 1) % approved.length)}>Next</Button>
            </div>
          </div>
        </div>
      ) : (
        <p className="rounded-2xl border border-border p-6 text-center text-sm text-muted-foreground">No approved reels yet.</p>
      )}
    </div>
  );
}

function Predict({ concert }: { concert: Concert }) {
  const preds = useApp((s) => s.predictions[concert.id] ?? {});
  const locked = useApp((s) => !!s.locked[concert.id]);
  const set = useApp((s) => s.setPrediction);
  const lock = useApp((s) => s.lockPredictions);
  const status = concertStatus(concert);
  const outcome = OUTCOMES[concert.id];
  const closed = locked || new Date(concert.date)<=new Date();
  const score = outcome ? PREDICTION_QUESTIONS.filter((q) => preds[q.id] === outcome[q.id]).length * 10 : null;

  return (
    <div className="space-y-4">
      {outcome && <div className="rounded-2xl border border-primary/30 bg-card p-4 text-sm">Results confirmed by organizer. Your score: <span className="font-semibold text-primary">{score} pts</span></div>}
      {!outcome && status === "past" && <p className="text-sm text-muted-foreground">Results haven't been confirmed for this show.</p>}
      {PREDICTION_QUESTIONS.map((q) => (
        <div key={q.id}>
          <p className="mb-2 text-sm font-medium">{q.q}</p>
          <div className="flex flex-wrap gap-2">
            {q.options.map((o) => {
              const sel = preds[q.id] === o;
              const right = outcome?.[q.id] === o;
              return (
                <button key={o} disabled={closed} onClick={() => set(concert.id, q.id, o)} className={cn("rounded-full border px-3 py-1.5 text-sm transition-colors", sel ? "border-primary bg-primary/15 text-primary" : "border-border text-muted-foreground", right && "ring-1 ring-gold", closed && "cursor-default")}>
                  {o}
                </button>
              );
            })}
          </div>
        </div>
      ))}
      {status !== "past" && (
        <Button className="w-full" disabled={locked || Object.keys(preds).length < PREDICTION_QUESTIONS.length} onClick={() => { lock(concert.id); toast.success("Predictions locked."); }}>
          {locked ? "Locked — no edits after lock" : "Lock predictions"}
        </Button>
      )}
    </div>
  );
}

function Letters({ concert }: { concert: Concert }) {
  const all = useApp((s) => s.letters);
  const liked = useApp((s) => s.likedLetters);
  const stamps = useApp((s) => s.stamps);
  const { addLetter, deleteLetter, toggleLike } = useApp.getState();
  const [sort, setSort] = useState<"liked" | "new" | "featured" | "discover">("featured");
  const [text, setText] = useState("");
  const [showCount, setShowCount] = useState(true);
  const myCount = stamps.filter((s) => concertArtist(s.concertId) === concert.artistId).length;

  const letters = useMemo(() => {
    const l = all.filter((x) => x.concertId === concert.id);
    if (sort === "liked") return [...l].sort((a, b) => b.likes - a.likes);
    if (sort === "new") return [...l].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    if (sort === "discover") return [...l].sort((a, b) => a.likes - b.likes);
    return [...l].sort((a, b) => Number(!!b.featured) - Number(!!a.featured) || b.likes - a.likes);
  }, [all, concert.id, sort]);

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-border bg-card p-3">
        <Textarea value={text} onChange={(e) => setText(e.target.value)} placeholder={`Write to ${artistOf(concert).name}…`} className="min-h-20 border-0 bg-transparent p-1 focus-visible:ring-0" maxLength={1000} />
        <div className="mt-2 flex items-center justify-between">
          <label className="flex items-center gap-2 text-xs text-muted-foreground"><input type="checkbox" checked={showCount} onChange={(e) => setShowCount(e.target.checked)} className="accent-primary" />Show my concert count</label>
          <Button size="sm" disabled={!text.trim()} onClick={() => { addLetter(concert.id, text.trim(), showCount); setText(""); }}>Post</Button>
        </div>
      </div>
      <div className="flex gap-1 text-xs">
        {(["featured", "liked", "new", "discover"] as const).map((s) => (
          <button key={s} onClick={() => setSort(s)} className={cn("rounded-full px-3 py-1", sort === s ? "bg-card text-foreground" : "text-muted-foreground")}>
            {s === "liked" ? "Most liked" : s === "new" ? "Newest" : s === "featured" ? "Featured" : "Undiscovered"}
          </button>
        ))}
      </div>
      {letters.map((l) => (
        <article key={l.id} className="border-b border-border pb-4">
          <div className="flex items-center gap-2 text-sm">
            <span className="font-medium">{l.author}</span>
            <BadgeCheck className="h-3.5 w-3.5 text-primary" />
            {l.mine && l.showCount && <span className="text-xs text-muted-foreground">{myCount}× with {artistOf(concert).name}</span>}
            {l.featured && <span className="flex items-center gap-1 text-xs text-gold"><Star className="h-3 w-3" />Featured</span>}
          </div>
          <p className="mt-1.5 text-sm leading-relaxed">{l.text}</p>
          {l.artistReply && <p className="mt-2 rounded-xl bg-card p-3 text-sm text-primary">{l.artistReply}</p>}
          <div className="mt-2 flex items-center gap-4 text-xs text-muted-foreground">
            <button onClick={() => toggleLike(l.id)} className={cn("flex items-center gap-1", liked.includes(l.id) && "text-primary")}><Heart className="h-3.5 w-3.5" fill={liked.includes(l.id) ? "currentColor" : "none"} />{l.likes}</button>
            <span>{new Date(l.createdAt).toLocaleDateString()}</span>
            {l.mine&&<Button variant="ghost" size="sm" onClick={async()=>{const text=prompt("Edit your letter",l.text);if(!text)return;const {error}=await supabase.rpc("fanmap_edit_letter",{l:l.id,body:text});if(error)toast.error(error.message);else await syncCloud();}}>Edit</Button>}
            {l.mine ? <button onClick={() => deleteLetter(l.id)} className="flex items-center gap-1"><Trash2 className="h-3.5 w-3.5" />Delete</button> : <button onClick={async () => {const {data:{user}}=await supabase.auth.getUser();if(!user)return;const {error}=await supabase.from("reports").insert({user_id:user.id,letter_id:l.id,reason:"Fan report"});if(error)toast.error(error.message);else toast.success("Report sent to moderators.");}}>Report</button>}
          </div>
        </article>
      ))}
    </div>
  );
}

const concertArtist = (id: string) => CONCERTS.find((c) => c.id === id)?.artistId;

function Guide({ concert }: { concert: Concert }) {
  const tips = [
    ["Doors", "Door times and entrances are not verified. Check your ticket and the official venue information."],
    ["Getting there", `Check current directions to ${concert.venue}; live transit and pickup locations are not available here.`],
    ["Bag policy", "Check the venue's official site for its current bag policy. No verified policy is available in this demo."],
  ];
  return (
    <div className="space-y-3">
      <p className="text-xs text-gold">Demo guide — general tips, not live venue data.</p>
      {tips.map(([t, d]) => (
        <div key={t} className="rounded-2xl border border-border bg-card p-4"><p className="text-sm font-medium">{t}</p><p className="mt-1 text-sm text-muted-foreground">{d}</p></div>
      ))}
      <a className="block text-center text-sm text-primary" target="_blank" rel="noreferrer" href={`https://www.google.com/maps/dir/?api=1&destination=${concert.lat},${concert.lng}`}>Open directions</a>
    </div>
  );
}
