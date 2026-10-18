import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useRouter } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { getAccount } from "./fanmap.functions";
import { syncCloud, clearCloudState } from "./cloud-sync";
import type { User } from "@supabase/supabase-js";
import { DEMO_LETTERS, usePresentationDemo } from "./presentation-demo";
type Account = Awaited<ReturnType<typeof getAccount>>;
const Context = createContext<{
  user: User | null;
  account: Account | null;
  refresh: () => Promise<void>;
  loading: boolean;
}>({ user: null, account: null, refresh: async () => {}, loading: true });
export function AccountProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [account, setAccount] = useState<Account | null>(null);
  const [loading, setLoading] = useState(true);
  const fetchAccount = useServerFn(getAccount);
  const router = useRouter();
  async function refresh() {
    const { data } = await supabase.auth.getUser();
    setUser(data.user);
    if (data.user) {
      try {
        setAccount(await fetchAccount());
      } catch {
        setAccount(null);
      }
    } else setAccount(null);
    await syncCloud();
    setLoading(false);
  }
  useEffect(() => {
    void refresh();
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (["SIGNED_IN", "SIGNED_OUT", "USER_UPDATED"].includes(event)) {
        if (event !== "USER_UPDATED") {
          clearCloudState();
          usePresentationDemo.setState({ letters: DEMO_LETTERS, liked: [], chat: [] });
          setAccount(null);
          setLoading(true);
        }
        setTimeout(() => {
          void refresh();
          void router.invalidate();
        }, 0);
      }
    });
    return () => subscription.unsubscribe();
  }, []);
  return (
    <Context.Provider value={{ user, account, refresh, loading }}>{children}</Context.Provider>
  );
}
export const useAccount = () => useContext(Context);
