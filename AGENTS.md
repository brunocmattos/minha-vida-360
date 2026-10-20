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

- Express the global dark identity through semantic tokens and shared design controls, keeping feature logic independent of theme changes.
- Pet vaccine overdue dates are separate from application and next-dose dates; shared care groups aggregate private per-pet records only for display, preserving individual CRUD.
- Pet illustrations are bundled assets; optional uploaded profile images are resized client-side and stored in the private profile record, never a public bucket.
- Keep the finance chart presentation in a dedicated component consuming the existing month summary, so charts and wallets share calculations without duplicating financial logic.
- Finance views reuse existing payments and month summaries; estimated account balances require an explicit private opening and confirmed movement, never planned transactions.
- Finance nature is independent of category and recurrence frequency; propagate it through the recurrence template and generated entries to preserve per-occurrence edits.
- Finance recurrences carry a unique per-owner slug so authorized seeds are idempotent; grouped items (group_label) are summed only for display, never stored as a separate total.
- Formula-driven housing forecasts use the persisted recurrence validity for both generation and recalculation; the shared finance helper excludes confirmed entries to preserve history.
- Payslip deductions and SPC/Serasa records live in their own tables and never feed the cash flow or projection; benefit wallets are excluded from bank movement.
- Finance has a fixed nested route layout with month search state shared across its dashboard and four screens; reuse the existing module by page rather than duplicate CRUD logic.
- Openings and their audit history, reversible bank/savings transfers, and savings goals are private independent records; balance helpers isolate them from income/expense summaries to prevent double counting.
- Luísa chat: conversations/messages persist in luisa_conversations/luisa_messages (RLS by owner); the LLM call and confirmed writes live only in src/lib/luisa.functions.ts (requireSupabaseAuth + Lovable AI Gateway, openai/gpt-6-astra, strict JSON schema with nullable optionals). Writes happen only after user confirmation via the action card; only criar_despesa and registrar_diario are writable — new actions extend the same confirm-first pattern.
- The /casa home uses one responsive inline SVG cross-section, arranging rooms in two columns on mobile and four on desktop without horizontal scrolling, plus accessible room links; this keeps every room reachable without changing internal module themes.
