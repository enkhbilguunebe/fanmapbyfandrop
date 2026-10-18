import { useState, useRef } from "react";
import { useNavigate, useRouter } from "@tanstack/react-router";
import { useAccount } from "@/lib/account";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "./ui/dialog";
import { toast } from "sonner";
import { User, Upload, Trash2, Download, LogOut, BadgeCheck, ArrowLeft, ChevronRight, Settings, SlidersHorizontal, ShieldCheck, Link as LinkIcon, Award, Sparkles, LockKeyhole } from "lucide-react";
import { useApp } from "@/lib/store";
export function AccountSettings({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { account, user, refresh } = useAccount();
  const router = useRouter();
  const navigate = useNavigate();
  const p = account?.profile;
  const [name, setName] = useState(p?.display_name ?? "");
  const [username, setUsername] = useState(p?.username ?? "");
  const [bio, setBio] = useState(p?.bio ?? "");
  const [links, setLinks] = useState<Record<string, string>>(
    (p?.social_links as Record<string, string>) ?? {},
  );
  const [prefs, setPrefs] = useState<Record<string, boolean>>(
    (p?.preferences as Record<string, boolean>) ?? {},
  );
  const [busy, setBusy] = useState(false);
  const [preview, setPreview] = useState(false);
  const [view, setView] = useState<"home" | "profile" | "social" | "preferences" | "security" | "privacy">("home");
  const stampCount = useApp(s => s.stamps.length);
  const [photo, setPhoto] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState(50);
  const [current, setCurrent] = useState("");
  const [password, setPassword] = useState("");
  const input = useRef<HTMLInputElement>(null);
  async function save() {
    if (!user) return;
    setBusy(true);
    try {
      if (!/^[a-z0-9_]{3,24}$/.test(username))
        throw new Error("Username needs 3–24 lowercase letters, numbers or underscores.");
      for (const [key, value] of Object.entries(links)) {
        if (!value) continue;
        const url = new URL(value);
        if (url.protocol !== "https:") throw new Error("Social links must use https.");
        const hosts: Record<string, string[]> = {
          Instagram: ["instagram.com"],
          TikTok: ["tiktok.com"],
          Facebook: ["facebook.com"],
          YouTube: ["youtube.com", "youtu.be"],
          Spotify: ["spotify.com"],
        };
        if (
          hosts[key] &&
          !hosts[key].some((h) => url.hostname === h || url.hostname.endsWith("." + h))
        )
          throw new Error(`Please use a valid ${key} link.`);
      }
      let avatar_path = p?.avatar_path ?? null;
      if (photo) {
        const image = new window.Image();
        image.src = photo;
        await image.decode();
        const canvas = document.createElement("canvas");
        canvas.width = canvas.height = 512;
        const ctx = canvas.getContext("2d");
        if (!ctx) throw new Error("Image editor unavailable");
        const size = Math.min(image.width, image.height) / zoom;
        const x = ((image.width - size) * offset) / 100;
        const y = (image.height - size) / 2;
        ctx.drawImage(image, x, y, size, size, 0, 0, 512, 512);
        const blob = await new Promise<Blob | null>((resolve) =>
          canvas.toBlob(resolve, "image/jpeg", 0.85),
        );
        if (!blob) throw new Error("Could not crop photo");
        avatar_path = user.id + "/avatar-" + crypto.randomUUID() + ".jpg";
        const { error } = await supabase.storage.from("fanmap-media").upload(avatar_path, blob);
        if (error) throw error;
      }
      const { error } = await supabase
        .from("profiles")
        .update({
          display_name: name.trim(),
          username,
          bio,
          social_links: links,
          preferences: prefs,
          avatar_path,
        })
        .eq("id", user.id);
      if (error) throw error;
      await refresh();
      toast.success("Profile saved");
      onClose();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Unable to save");
    } finally {
      setBusy(false);
    }
  }
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="settings-panel max-h-[90dvh] max-w-lg overflow-y-auto bg-background p-5 sm:rounded-3xl">
        <div className="flex items-center gap-3 pr-8"><Button variant="ghost" size="icon" className="rounded-full bg-secondary" aria-label={view === "home" ? "Close settings" : "Back to profile"} onClick={() => { if (view === "home") onClose(); else { setView("home"); setPreview(false); } }}><ArrowLeft /></Button><DialogTitle className="flex-1 text-center font-medium">{view === "home" ? "Profile" : view === "profile" ? "Edit profile" : view === "security" ? "Account & Security" : view === "privacy" ? "Data & Privacy" : view === "social" ? "Social links" : "Preferences"}</DialogTitle></div>
        <DialogDescription className="sr-only">Your FanMap profile, preferences and privacy.</DialogDescription>
        {view === "home" ? <div className="space-y-5">
          <Button variant="ghost" className="h-auto w-full justify-start rounded-3xl bg-card p-4 text-left" onClick={() => setView("profile")}><span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-accent text-lg font-semibold text-primary">{p?.display_name?.[0] ?? "F"}</span><span className="min-w-0 flex-1"><span className="block font-medium">{p?.display_name}</span><span className="block truncate text-xs font-normal text-muted-foreground">{user?.email}</span></span><ChevronRight className="h-4 w-4 text-muted-foreground" /></Button>
          <div className="flex items-center gap-4 rounded-3xl bg-foreground p-5 text-primary-foreground"><Sparkles className="h-9 w-9 shrink-0 text-gold" /><div className="flex-1"><p className="font-semibold">Your concert passport</p><p className="mt-1 text-xs opacity-75">{stampCount} concert memories · A story worth keeping</p></div><Button size="icon" variant="ghost" aria-label="Open loyalty passport" className="text-primary-foreground hover:bg-primary/30 hover:text-primary-foreground" onClick={() => { onClose(); void navigate({ to: "/loyalty" }); }}><ChevronRight /></Button></div>
          <div className="overflow-hidden rounded-3xl bg-card px-4">
            {([{ label: "Settings", icon: Settings, next: "profile" }, { label: "Account & Security", icon: LockKeyhole, next: "security" }, { label: "Social connections", icon: LinkIcon, next: "social" }] as const).map(({ label, icon: Icon, next }) => <Button key={label} variant="ghost" className="settings-row border-b border-border/50" onClick={() => setView(next)}><Icon className="h-5 w-5" /><span className="flex-1 text-left">{label}</span><ChevronRight className="h-4 w-4" /></Button>)}
            <Button variant="ghost" className="settings-row" onClick={() => { onClose(); void navigate({ to: "/loyalty" }); }}><Award className="h-5 w-5" /><span className="flex-1 text-left">Badges & milestones</span><ChevronRight className="h-4 w-4" /></Button>
          </div>
          <div className="overflow-hidden rounded-3xl bg-card px-4"><Button variant="ghost" className="settings-row border-b border-border/50" onClick={() => setView("preferences")}><SlidersHorizontal className="h-5 w-5" /><span className="flex-1 text-left">Preferences</span><ChevronRight className="h-4 w-4" /></Button><Button variant="ghost" className="settings-row" onClick={() => setView("privacy")}><ShieldCheck className="h-5 w-5" /><span className="flex-1 text-left">Data & Privacy</span><ChevronRight className="h-4 w-4" /></Button></div>
          <Button variant="ghost" className="h-14 w-full justify-start rounded-3xl bg-card px-6 text-destructive" onClick={async () => { await router.options.context?.queryClient.cancelQueries(); router.options.context?.queryClient.clear(); await supabase.auth.signOut(); await refresh(); onClose(); await navigate({ to: "/auth", replace: true }); }}><LogOut className="h-5 w-5" />Sign out</Button>
          <p className="text-center text-[11px] text-muted-foreground">FanMap · Music brings us closer{p?.is_demo ? " · Demo account" : ""}</p>
        </div> : preview ? (
          <section>
            <h2 className="text-xl font-semibold">{name}</h2>
            <p className="text-primary">@{username}</p>
            <p className="mt-3">{bio}</p>
            {Object.entries(links)
              .filter(([, v]) => v)
              .map(([k, v]) => (
                <a
                  key={k}
                  href={v}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-2 block text-primary"
                >
                  {k}
                </a>
              ))}
            <Button className="mt-4" variant="secondary" onClick={() => setPreview(false)}>
              Back to editing
            </Button>
          </section>
        ) : (
          <>
            <section className={view === "profile" ? "space-y-3 rounded-2xl bg-card p-4" : "hidden"}>
              <h2 className="flex items-center gap-2 font-semibold">
                <User />
                My Profile
                {(account?.attendance.length ?? 0) > 0 && <BadgeCheck className="text-success" />}
              </h2>
              <p className="text-xs text-muted-foreground">
                {account?.attendance.length ?? 0} verified concerts
              </p>
              <input
                ref={input}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (!f) return;
                  if (f.size > 10 * 1024 * 1024) {
                    toast.error("Choose a photo under 10 MB");
                    return;
                  }
                  const reader = new FileReader();
                  reader.onload = () => setPhoto(String(reader.result));
                  reader.readAsDataURL(f);
                }}
              />
              {photo && (
                <>
                  <div className="h-32 w-32 overflow-hidden rounded-full">
                    <img
                      src={photo}
                      alt="Avatar crop preview"
                      className="h-full w-full object-cover"
                      style={{ transform: `scale(${zoom})`, objectPosition: `${offset}% 50%` }}
                    />
                  </div>
                  <label className="block text-xs">
                    Zoom
                    <input
                      aria-label="Photo zoom"
                      type="range"
                      min="1"
                      max="3"
                      step=".1"
                      value={zoom}
                      onChange={(e) => setZoom(Number(e.target.value))}
                      className="ml-3"
                    />
                  </label>
                  <label className="block text-xs">
                    Position
                    <input
                      aria-label="Photo position"
                      type="range"
                      min="0"
                      max="100"
                      value={offset}
                      onChange={(e) => setOffset(Number(e.target.value))}
                      className="ml-3"
                    />
                  </label>
                </>
              )}
              <div className="flex flex-wrap gap-2">
                <Button variant="secondary" size="sm" onClick={() => input.current?.click()}>
                  <Upload />
                  Change photo
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={async () => {
                    if (!user) return;
                    const { error } = await supabase
                      .from("profiles")
                      .update({ avatar_path: null })
                      .eq("id", user.id);
                    if (error) toast.error(error.message);
                    else {
                      setPhoto(null);
                      await refresh();
                      toast.success("Photo removed");
                    }
                  }}
                >
                  <Trash2 />
                  Remove
                </Button>
              </div>
              <label className="block text-xs">
                Display name
                <Input
                  aria-label="Display name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  maxLength={60}
                />
              </label>
              <label className="block text-xs">
                Username
                <Input
                  aria-label="Username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value.toLowerCase())}
                />
              </label>
              <label className="block text-xs">
                Bio
                <Textarea
                  aria-label="Bio"
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  maxLength={500}
                />
              </label>
              <Button variant="link" onClick={() => setPreview(true)}>
                Preview public profile
              </Button>
            </section>
            <section className={view === "social" ? "space-y-3 rounded-2xl bg-card p-4" : "hidden"}>
              <h2 className="font-semibold">Social links</h2>
              {["Instagram", "TikTok", "Facebook", "YouTube", "Spotify", "Website"].map((k) => (
                <label key={k} className="block text-xs">
                  {k}
                  <Input
                    aria-label={k}
                    type="url"
                    placeholder="https://"
                    value={links[k] ?? ""}
                    onChange={(e) => setLinks({ ...links, [k]: e.target.value })}
                  />
                </label>
              ))}
              <p className="text-xs text-muted-foreground">
                Social links appear publicly only when profile visibility is enabled.
              </p>
            </section>
            <section className={view === "preferences" ? "space-y-4 rounded-2xl bg-card p-4" : "hidden"}>
              <h2 className="font-semibold">Preferences</h2>
              {(
                [
                  ["notifications", "Notifications"],
                  ["announcements", "Artist announcements"],
                  ["publicProfile", "Public profile"],
                  ["friendRequests", "Allow friend requests"],
                ] as const
              ).map(([k, label]) => (
                <label key={k} className="flex justify-between text-sm">
                  {label}
                  <input
                    type="checkbox"
                    checked={prefs[k] ?? true}
                    onChange={(e) => setPrefs({ ...prefs, [k]: e.target.checked })}
                    className="accent-primary"
                  />
                </label>
              ))}
              <p className="text-xs text-muted-foreground">
                Light appearance · Find friends uses fictional locations for this presentation.
              </p>
            </section>
            <section className={view === "security" ? "space-y-3 rounded-2xl bg-card p-4" : "hidden"}>
              <h2 className="font-semibold">Account & Security</h2>
              <p className="break-all text-sm">{user?.email}</p>
              <p className="text-xs text-muted-foreground">
                {account?.role?.role} · Created {p?.created_at.slice(0, 10)} ·{" "}
                {user?.email_confirmed_at ? "Email verified" : "Email unverified"}
              </p>
              <Input
                type="password"
                aria-label="Current password"
                placeholder="Current password"
                value={current}
                onChange={(e) => setCurrent(e.target.value)}
              />
              <Input
                type="password"
                aria-label="New password"
                placeholder="New password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <Button
                variant="secondary"
                disabled={password.length < 8 || !current}
                onClick={async () => {
                  const { error } = await supabase.auth.updateUser({
                    password,
                    current_password: current,
                  });
                  if (error) toast.error(error.message);
                  else {
                    setCurrent("");
                    setPassword("");
                    toast.success("Password updated");
                  }
                }}
              >
                Change password
              </Button>
            </section>
            <section className={view === "privacy" ? "rounded-2xl bg-card p-4" : "hidden"}>
              <h2 className="mb-3 font-semibold">Data & Privacy</h2>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="secondary"
                  onClick={async () => {
                    const blob = new Blob(
                      [
                        JSON.stringify(
                          {
                            profile: p,
                            attendance: account?.attendance,
                            tickets: account?.tickets,
                          },
                          null,
                          2,
                        ),
                      ],
                      { type: "application/json" },
                    );
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement("a");
                    a.href = url;
                    a.download = "fanmap-data.json";
                    a.click();
                    URL.revokeObjectURL(url);
                  }}
                >
                  <Download />
                  Export my data
                </Button>
                <Button
                  variant="outline"
                  onClick={async () => {
                    if (!user || !confirm("Request deletion of your FanMap account?")) return;
                    const { error } = await supabase
                      .from("deletion_requests")
                      .upsert({ user_id: user.id });
                    if (error) toast.error(error.message);
                    else toast.success("Account deletion requested");
                  }}
                >
                  Request account deletion
                </Button>
              </div>
            </section>
            <Button onClick={save} disabled={busy || !name.trim()} className={view === "security" || view === "privacy" ? "hidden" : "w-full"}>
              {busy ? "Saving…" : "Save changes"}
            </Button>
            <Button
              variant="ghost"
              onClick={async () => {
                await router.options.context?.queryClient.cancelQueries();
                router.options.context?.queryClient.clear();
                await supabase.auth.signOut();
                await refresh();
                onClose();
                await navigate({ to: "/auth", replace: true });
              }}
            >
              <LogOut />
              Sign out
            </Button>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
