import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useNavigate } from "@tanstack/react-router";
import { Music2, ArrowRight, LoaderCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { demoLogin } from "@/lib/fanmap.functions";
import { useAccount } from "@/lib/account";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import cover from "@/assets/c1.jpg";
export function AuthScreen() {
  const [mode, setMode] = useState<"login" | "signup" | "forgot">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const loginDemo = useServerFn(demoLogin);
  const { refresh } = useAccount();
  const navigate = useNavigate();
  async function demo(account: "alex" | "olivia" | "jasper") {
    setBusy(true);
    setError("");
    try {
      const s = await loginDemo({ data: { account } });
      const { error } = await supabase.auth.setSession(s);
      if (error) throw error;
      await navigate({ to: account === "jasper" ? "/artist" : "/" });
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Sign-in failed");
    } finally {
      setBusy(false);
    }
  }
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background p-6">
      <img
        src={cover}
        alt="Concert stage"
        className="absolute inset-0 h-full w-full object-cover opacity-20"
      />
      <div className="auth-scrim absolute inset-0" />
      <div className="relative w-full max-w-sm">
        <div className="mb-10 flex items-center gap-3">
          <Music2 className="h-9 w-9 text-primary" />
          <span className="text-3xl font-semibold">FanMap</span>
        </div>
        <h1 className="text-2xl font-semibold">
          {mode === "login"
            ? "Your next unforgettable night."
            : mode === "signup"
              ? "Join the crowd."
              : "Reset your password."}
        </h1>
        <p className="mb-7 mt-2 text-sm text-muted-foreground">
          {mode === "login"
            ? "Sign in to your concert passport."
            : mode === "signup"
              ? "Create your personal FanMap account."
              : "We’ll send a secure recovery link."}
        </p>
        <form
          className="space-y-3"
          onSubmit={async (e) => {
            e.preventDefault();
            setBusy(true);
            setError("");
            setNotice("");
            try {
              if (mode === "forgot") {
                const { error } = await supabase.auth.resetPasswordForEmail(email, {
                  redirectTo: window.location.origin + "/reset-password",
                });
                if (error) throw error;
                setNotice("Check your inbox for a recovery link.");
              } else if (mode === "signup") {
                const { error } = await supabase.auth.signUp({
                  email,
                  password,
                  options: {
                    data: { display_name: name },
                    emailRedirectTo: window.location.origin,
                  },
                });
                if (error) throw error;
                setNotice("Check your email to confirm your account.");
              } else {
                const { error } = await supabase.auth.signInWithPassword({ email, password });
                if (error) throw error;
                await navigate({ to: "/" });
                await refresh();
              }
            } catch (e) {
              setError(e instanceof Error ? e.message : "Please try again");
            } finally {
              setBusy(false);
            }
          }}
        >
          {mode === "signup" && (
            <Input
              aria-label="Display name"
              placeholder="Display name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          )}
          <Input
            type="email"
            aria-label="Email"
            placeholder="Email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          {mode !== "forgot" && (
            <Input
              type="password"
              aria-label="Password"
              placeholder="Password"
              autoComplete={mode === "login" ? "current-password" : "new-password"}
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          )}
          <Button className="h-11 w-full" disabled={busy}>
            {busy ? (
              <LoaderCircle className="animate-spin" />
            ) : (
              <>
                {" "}
                {mode === "login"
                  ? "Sign in"
                  : mode === "signup"
                    ? "Create account"
                    : "Send reset link"}
                <ArrowRight />
              </>
            )}
          </Button>
        </form>
        {error && (
          <p role="alert" className="mt-3 text-sm text-destructive">
            {error}
          </p>
        )}
        {notice && <p className="mt-3 text-sm text-success">{notice}</p>}
        <div className="mt-3 flex justify-between">
          <Button variant="link" onClick={() => setMode(mode === "signup" ? "login" : "signup")}>
            {mode === "signup" ? "Sign in" : "Create account"}
          </Button>
          <Button variant="link" onClick={() => setMode(mode === "forgot" ? "login" : "forgot")}>
            {mode === "forgot" ? "Back" : "Forgot password?"}
          </Button>
        </div>
        <div className="mt-8 border-t border-border pt-5">
          <p className="mb-3 text-xs uppercase text-gold">
            Demonstration accounts · fictional data
          </p>
          <div className="grid gap-2">
            {(
              [
                ["alex", "Alex Morgan", "New fan · empty passport"],
                ["olivia", "Olivia Chen", "Returning fan · 7 concerts"],
                ["jasper", "Jasper Vale", "Artist / manager"],
              ] as const
            ).map(([id, name, desc]) => (
              <Button
                key={id}
                variant="secondary"
                disabled={busy}
                className="h-auto justify-between py-3"
                onClick={() => demo(id)}
              >
                <span className="text-left">
                  {name}
                  <span className="block text-xs font-normal text-muted-foreground">{desc}</span>
                </span>
                <ArrowRight />
              </Button>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
