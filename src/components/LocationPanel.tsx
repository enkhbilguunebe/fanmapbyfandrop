import { useState } from "react";
import { BadgeCheck, MapPin, Navigation, Footprints, Check, ArrowLeft } from "lucide-react";
import { DEMO_FRIENDS, DEMO_PASSWORD } from "@/lib/presentation-demo";
import { FindFriendsIcon } from "./FindFriendsIcon";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";

export function LocationPanel({ open, onClose, friendId }: { open: boolean; onClose: () => void; friendId?: string }) {
  const [password, setPassword] = useState("");
  const [unlocked, setUnlocked] = useState(false);
  const [selected, setSelected] = useState(DEMO_FRIENDS.find(f => f.id === friendId)?.id ?? "demo-aiko");
  const [error, setError] = useState("");
  const [proposal, setProposal] = useState(false);
  const [meeting, setMeeting] = useState("");
  const [directions, setDirections] = useState(false);
  const friend = DEMO_FRIENDS.find(f => f.id === selected) ?? DEMO_FRIENDS[0];
  if (!friend) return null;
  return <Dialog open={open} onOpenChange={value => { if (!value) onClose(); }}>
    <DialogContent className="max-h-[90dvh] max-w-md overflow-y-auto">
      <div className="flex items-center gap-3"><FindFriendsIcon className="h-12 w-12 text-primary" /><div><DialogTitle>Find your people</DialogTitle><DialogDescription>Good music. Great company.</DialogDescription></div></div>
      <p className="rounded-lg bg-gold/10 px-3 py-2 text-xs text-foreground">Presentation demo · Fictional locations and consent. No device location is used.</p>
      {!unlocked ? <form className="space-y-4" onSubmit={e => { e.preventDefault(); if (password !== DEMO_PASSWORD) { setError("Use the presentation password: fanmap"); return; } setPassword(""); setError(""); setUnlocked(true); }}>
        <label className="block text-sm font-medium">Demo password<Input className="mt-2" aria-label="Demo password" type="password" value={password} autoComplete="off" onChange={e => setPassword(e.target.value)} placeholder="Presentation password" /></label>
        <p className="text-xs text-muted-foreground">Demo password: <span className="font-semibold">fanmap</span> · Not your account password.</p>
        {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
        <Button className="w-full" disabled={!password}><FindFriendsIcon className="h-5 w-5" />Find friends</Button>
      </form> : <>
        <div role="status" className="flex items-start gap-3 rounded-lg border border-primary/20 bg-primary/10 p-3"><BadgeCheck className="h-6 w-6 shrink-0 text-primary" /><div><p className="text-sm font-semibold">Your friend allowed to share location with you</p><p className="mt-1 text-xs text-muted-foreground">Simulated consent · {friend.name}</p></div></div>
        <div className="flex gap-3 overflow-x-auto pb-2">{DEMO_FRIENDS.map(f => <Button key={f.id} variant="ghost" onClick={() => { setSelected(f.id); setMeeting(""); setProposal(false); setDirections(false); }} className={`h-auto min-w-16 flex-col gap-2 px-1 ${f.id === selected ? "text-primary" : "text-muted-foreground"}`}><span className={`grid h-11 w-11 place-items-center rounded-full ${f.id === selected ? "bg-primary text-primary-foreground" : "bg-secondary"}`}>{f.initials}</span><span className="text-[11px]">{f.name.split(" ")[0]}</span></Button>)}</div>
        <div className="demo-friend-map relative h-44 overflow-hidden rounded-lg border border-border" aria-label={`Simulated map: ${friend.name} near ${friend.place}`}>
          <span className="absolute left-3 top-3 rounded-md bg-card px-2 py-1 text-[10px] text-muted-foreground">TORONTO · DEMO MAP</span>
          <span className="absolute bottom-3 left-3 text-[11px] text-muted-foreground">Bremner Blvd</span>
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-center"><span className="mx-auto grid h-12 w-12 place-items-center rounded-full border-4 border-card bg-primary font-semibold text-primary-foreground shadow-float">{friend.initials}</span><span className="mt-2 block rounded-md bg-card px-3 py-1 text-xs font-medium">{friend.name}</span></div>
        </div>
        <div><p className="font-semibold">{friend.name}</p><p className="flex items-center gap-1 text-sm text-muted-foreground"><MapPin className="h-4 w-4" />{friend.place}</p><p className="mt-1 text-xs text-primary">Demo position · Near tonight's concert</p></div>
        <div className="grid grid-cols-2 gap-2"><Button variant="secondary" onClick={() => setProposal(!proposal)}><MapPin />Propose a spot</Button><Button onClick={() => setDirections(!directions)}><Navigation />Get directions</Button></div>
        {proposal && <div className="space-y-2 border-t border-border pt-3"><p className="text-sm font-semibold">Where shall we meet?</p>{["Union Station plaza", "Scotiabank Arena entrance", "Roundhouse Park"].map(spot => <Button key={spot} variant="outline" className="w-full justify-start" onClick={() => { setMeeting(spot); setProposal(false); }}><MapPin />{spot}</Button>)}</div>}
        {meeting && <p role="status" className="flex items-start gap-2 rounded-lg bg-primary/10 p-3 text-sm"><Check className="h-5 w-5 shrink-0 text-primary" /><span>{friend.name.split(" ")[0]} accepted your meeting spot: <strong>{meeting}</strong><span className="mt-1 block text-xs text-muted-foreground">Demo response</span></span></p>}
        {directions && <div className="space-y-2 border-t border-border pt-3"><p className="flex items-center gap-2 text-sm font-semibold"><Footprints />Walking to {meeting || friend.place}</p><p className="text-xs text-muted-foreground">Illustrative route: follow Bremner Boulevard toward the plaza, then meet at the selected spot. Not live navigation.</p><a className="flex items-center gap-2 text-sm font-medium text-primary" href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent((meeting || friend.place) + ", Toronto")}&travelmode=walking`} target="_blank" rel="noreferrer"><Navigation className="h-4 w-4" />Open destination in Google Maps</a></div>}
        <Button variant="ghost" onClick={() => { setUnlocked(false); setMeeting(""); setDirections(false); }}><ArrowLeft />Reset demo</Button>
      </>}
    </DialogContent>
  </Dialog>;
}