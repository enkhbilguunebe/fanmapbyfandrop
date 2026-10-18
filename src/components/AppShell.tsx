import { Link, useLocation } from "@tanstack/react-router";
import { Map, Image, MessageCircle, Award } from "lucide-react";
import type { ReactNode } from "react";
import { useApp, type Role } from "@/lib/store";
import { cn } from "@/lib/utils";

const TABS = [
  { to: "/", label: "Map", icon: Map },
  { to: "/photos", label: "Photos", icon: Image },
  { to: "/chat", label: "Chat", icon: MessageCircle },
  { to: "/loyalty", label: "Loyalty", icon: Award },
] as const;

export function BottomNav() {
  const { pathname } = useLocation();
  return (
    <nav className="pointer-events-none fixed inset-x-0 bottom-0 z-40 flex justify-center px-4 pb-safe">
      <div className="glass shadow-float pointer-events-auto flex w-full max-w-sm items-center justify-around rounded-2xl border border-border px-2 py-1.5">
        {TABS.map(({ to, label, icon: Icon }) => {
          const active = pathname === to;
          return (
            <Link key={to} to={to} className={cn("flex min-w-16 flex-col items-center gap-0.5 rounded-xl px-3 py-1.5 text-[11px] transition-colors", active ? "text-primary" : "text-muted-foreground hover:text-foreground")}>
              <Icon className="h-5 w-5" strokeWidth={active ? 2.2 : 1.7} />
              {label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

const ROLES: { id: Role; label: string }[] = [
  { id: "visitor", label: "Visitor" },
  { id: "fan", label: "New fan" },
  { id: "returning", label: "Returning" },
  { id: "artist", label: "Artist" },
];

export function DemoSwitcher({ className }: { className?: string }) {
  const role = useApp((s) => s.role);
  const setRole = useApp((s) => s.setRole);
  return (
    <div className={cn("glass flex items-center gap-1 rounded-full border border-border p-1 text-[11px]", className)}>
      <span className="px-2 font-medium uppercase tracking-wider text-gold">Demo</span>
      {ROLES.map((r) =>
        r.id === "artist" ? (
          <Link key={r.id} to="/artist" onClick={() => setRole("artist")} className={cn("rounded-full px-2.5 py-1", role === "artist" ? "bg-primary text-primary-foreground" : "text-muted-foreground")}>
            {r.label}
          </Link>
        ) : (
          <button key={r.id} onClick={() => setRole(r.id)} className={cn("rounded-full px-2.5 py-1", role === r.id ? "bg-primary text-primary-foreground" : "text-muted-foreground")}>
            {r.label}
          </button>
        ),
      )}
    </div>
  );
}

export function Page({ title, subtitle, children }: { title: string; subtitle?: string; children: ReactNode }) {
  return (
    <div className="mx-auto min-h-screen max-w-xl px-5 pb-32 pt-[max(env(safe-area-inset-top),1.5rem)]">
      <DemoSwitcher className="mb-6 w-fit" />
      <h1 className="text-3xl font-semibold tracking-tight">{title}</h1>
      {subtitle && <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>}
      <div className="mt-6">{children}</div>
      <BottomNav />
    </div>
  );
}
