<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- Map uses maplibre-gl v4 (v6 worker breaks under Vite prebundling) with OpenFreeMap/Esri keyless styles; MapView is lazy + ClientOnly because it touches window.
- Persist only presentation state in Zustand; hydrate personal/shared data from authenticated Cloud reads and discard stale account generations to prevent cross-account leakage.
- Lovable Cloud is connected; migrate personal and shared features to authenticated Cloud data, never treat the legacy demo store as an authorization boundary, because browser state is user-editable.
- Use separate non-persisting auth clients for demo session minting, never authenticate the shared privileged client, to preserve its authorization identity.
- Friend transitions and location writes use locked SQL functions; session expiry is enforced in read policies and physical coordinate cleanup runs each minute to prevent races and retention.
- Store AI guide conversations per account and concert, use a server-validated streaming endpoint and retain the model's verified-information limitations.
- Friend map overlays read only RLS-scoped active sessions and positions, react to session changes and clear at the server expiry to prevent displaying ended sharing.
