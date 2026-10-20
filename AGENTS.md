Read CLAUDE.md first (project overview, how to run, rules for changes requested by the owner).
The notes below are standing design decisions — keep them true when changing code.

- Express the global dark identity through semantic tokens and shared design controls, keeping feature logic independent of theme changes.
- Pet vaccine overdue dates are separate from application and next-dose dates; shared care groups aggregate private per-pet records only for display, preserving individual CRUD.
- Pet illustrations are bundled assets; optional uploaded profile images are resized client-side and stored in the private profile record, never a public bucket.
- Keep the finance chart presentation in a dedicated component consuming the existing month summary, so charts and wallets share calculations without duplicating financial logic.
- Finance views reuse existing payments and month summaries; estimated account balances require an explicit private opening and confirmed movement, never planned transactions.
- Finance nature is independent of category and recurrence frequency; propagate it through the recurrence template and generated entries to preserve per-occurrence edits.
- Finance recurrences carry a unique per-owner slug so authorized seeds are idempotent; grouped items (group_label) are summed only for display, never stored as a separate total.
- Formula-driven housing forecasts use the persisted recurrence validity for both generation and recalculation; the shared finance helper excludes confirmed entries to preserve history. Entries whose planned amount was edited by hand (`amount_manual`) are never recalculated.
- Payslip deductions and SPC/Serasa records live in their own tables and never feed the cash flow or projection; benefit wallets are excluded from bank movement.
- Finance has a fixed nested route layout with month search state shared across its dashboard and four screens; reuse the existing module by page rather than duplicate CRUD logic.
- Openings and their audit history, reversible bank/savings transfers, and savings goals are private independent records; balance helpers isolate them from income/expense summaries to prevent double counting.
- List queries that can grow use `fetchAllRows` (src/lib/fetch-all.ts) with a stable order: Supabase silently truncates at 1000 rows.
- Luísa chat: conversations/messages persist in luisa_conversations/luisa_messages (RLS by owner); the LLM call and confirmed writes live only in src/lib/luisa.functions.ts (requireSupabaseAuth + any OpenAI-compatible chat-completions provider via LLM_BASE_URL/LLM_MODEL/LLM_API_KEY, default DeepSeek, JSON mode validated by parseLuisaContent). Writes happen only after user confirmation via the action card, claimed atomically on `action->>status = 'pendente'`; only criar_despesa and registrar_diario are writable — new actions extend the same confirm-first pattern.
- The /casa home uses one responsive inline SVG cross-section, arranging rooms in two columns on mobile and four on desktop without horizontal scrolling, plus accessible room links; this keeps every room reachable without changing internal module themes.
