<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.

## What Lovable manages

Rules outside this block are the project's own. Change the pieces below in
Lovable, not by hand. With the [Lovable MCP](https://mcp.lovable.dev)
connected, `send_message` asks Lovable to do it; otherwise ask the user to
use the editor.

- **Database.** Do not add or edit `supabase/migrations/` or `drizzle/`.
  Ask Lovable to change the schema.
- **Generated files.** Do not edit a file whose header says it is automatically
  generated.
- **AI gateway.** Keep model calls on Lovable's gateway, and keep
  `LOVABLE_API_KEY` out of browser code.
- **Connectors.** Lovable provides native connectors. `list_connectors` shows
  which are enabled; `add_connector` only returns the dashboard link. When a
  connector is enabled, calls go through the connector gateway and need
  `LOVABLE_API_KEY`. When Lovable does not provide one, users can bring their
  own key and store it in Secrets.
- **Secrets.** Lovable manages them. Do not put secret values in the repo.
<!-- LOVABLE:END -->

## Project rules
- Wardrobe, plan and profile live in browser IndexedDB (src/lib/db.ts) — the app must work fully offline without an account.
- Stylist AI calls go through one server function with automatic relay between stylists; every suggested item id is checked against the wardrobe (validateIds) and the local rules engine (src/lib/rules.ts) is the offline fallback.
- Service worker is registered only via src/lib/pwa.ts, which refuses preview/dev hosts.

## Data
- IndexedDB schema changes go through a versioned `upgrade` in `src/lib/db.ts` plus an idempotent, single-transaction migration in `src/lib/migrate.ts`; never delete or clear an existing store — users' wardrobes live only on their phone.
- Planning never creates WearRecords; only an explicit "worn" action does — keeps usage stats truthful.
