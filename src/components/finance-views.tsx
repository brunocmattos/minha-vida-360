import { Fragment, useState, type ReactNode } from "react";
import { ArrowDownLeft, ArrowUpRight, CalendarDays, ChevronDown, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { formatDue } from "@/lib/recurrence";
import { entryStatus, formatBRL, monthLabel, monthOf, NATURE_LABEL, STATUS_LABEL, sortEntries, summarizeMonth, type Entry, type Recurrence, type Status } from "@/lib/finance";

export function MonthWallet({ entries, month }: { entries: Entry[]; month: string }) {
  const s = summarizeMonth(entries, month);
  return <section aria-label="Carteira do mês" className="wallet-panel rounded-lg border bg-card p-5 md:p-6">
    <h2 className="mb-5 flex items-center gap-2 text-base font-semibold"><Wallet className="size-4 text-primary" />Carteira do mês</h2>
    <div className="grid gap-6 md:grid-cols-2">
      <div><p className="text-sm text-muted-foreground">Movimentação líquida confirmada no mês</p><p className="mt-2 text-3xl font-semibold tabular-nums">{formatBRL(s.cash)}</p><p className="mt-2 text-xs text-muted-foreground">Sem saldo inicial cadastrado. Não representa seu saldo bancário.</p></div>
      <div className="border-t pt-4 md:border-l md:border-t-0 md:pl-6 md:pt-0"><p className="text-sm text-muted-foreground">Resultado projetado no mês</p><p className="mt-2 text-2xl font-semibold tabular-nums text-primary">{formatBRL(Math.round((s.plannedIn - s.plannedOut) * 100) / 100)}</p><p className="mt-2 text-xs text-muted-foreground">Receitas previstas menos despesas previstas por vencimento.</p></div>
    </div>
    <div className="mt-6 grid grid-cols-2 gap-4 border-t pt-4 text-sm lg:grid-cols-4">
      <WalletStat label="Receitas recebidas" value={s.realizedIn} income />
      <WalletStat label="Despesas pagas" value={s.realizedOut} />
      <WalletStat label="Receitas previstas" value={s.plannedIn} income />
      <WalletStat label="Despesas previstas" value={s.plannedOut} />
    </div>
    <p className="mt-4 border-t pt-4 text-xs text-muted-foreground">Benefício Pluxee (carteira separada, fora do caixa bancário): previsto {formatBRL(s.benefitPlanned)} · recebido {formatBRL(s.benefitReceived)}. Consignados já estão descontados do líquido; SPC/Serasa não entra aqui.</p>
  </section>;
}
function WalletStat({ label, value, income }: { label: string; value: number; income?: boolean }) {
  const Icon = income ? ArrowDownLeft : ArrowUpRight;
  return <div><p className="flex items-center gap-1 text-xs text-muted-foreground"><Icon className="size-3 shrink-0" />{label}</p><p className="mt-1 font-semibold tabular-nums">{formatBRL(value)}</p></div>;
}

export function EntryBrowser({ entries, today, categories, categoryView, renderRow, recurrences = [], expenseView = true }: {
  entries: Entry[]; today: string; categories: { id: string; name: string }[]; categoryView: (entries: Entry[]) => ReactNode; renderRow: (entry: Entry) => ReactNode; recurrences?: Recurrence[]; expenseView?: boolean;
}) {
  const [kind, setKind] = useState(""); const [nature, setNature] = useState(""); const [category, setCategory] = useState(""); const [status, setStatus] = useState(""); const [search, setSearch] = useState(""); const [view, setView] = useState("due");
  const filtered = entries.filter(e => (!kind || e.kind === kind) && (!nature || (e.nature ?? "nao_classificada") === nature) && (!category || (e.category_id ?? "none") === category) && (!status || entryStatus(e, today) === status) && e.description.toLocaleLowerCase("pt-BR").includes(search.toLocaleLowerCase("pt-BR")));
  const selectClass = "fin-field min-w-0 border px-4 py-2.5 text-xs text-muted-foreground";
  return <section className="space-y-4">
    <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
      <input className={selectClass} aria-label="Buscar lançamento" placeholder="Buscar lançamento" value={search} onChange={e => setSearch(e.target.value)} />
      <select className={selectClass} aria-label="Filtrar tipo" value={kind} onChange={e => setKind(e.target.value)}><option value="">Receitas e despesas</option><option value="receita">Receitas</option><option value="despesa">Despesas</option></select>
      <select className={selectClass} aria-label="Filtrar natureza" value={nature} onChange={e => setNature(e.target.value)}><option value="">Todas as naturezas</option>{Object.entries(NATURE_LABEL).map(([k,v]) => <option key={k} value={k}>{v}</option>)}</select>
      <select className={selectClass} aria-label="Filtrar categoria" value={category} onChange={e => setCategory(e.target.value)}><option value="">Todas as categorias</option><option value="none">Sem categoria</option>{categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select>
      <select className={selectClass} aria-label="Filtrar status" value={status} onChange={e => setStatus(e.target.value)}><option value="">Todos os status</option>{(["pendente", "parcial", "pago", "vencido"] as Status[]).map(s => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}</select>
    </div>
    <div className="flex flex-wrap items-center gap-2"><Button variant={view === "due" ? "secondary" : "ghost"} onClick={() => setView("due")}>Lista por grupo</Button>{expenseView && <><Button variant={view === "category" ? "secondary" : "ghost"} onClick={() => setView("category")}>Despesas por categoria</Button><Button variant={view === "date" ? "secondary" : "ghost"} onClick={() => setView("date")}>Por vencimento</Button></>}<span className="ml-auto text-xs text-muted-foreground">{filtered.length} lançamentos</span></div>
    {view === "category" ? categoryView(filtered.filter(e => e.kind === "despesa")) : <div className="fin-surface overflow-x-auto p-1 sm:p-3"><table className="finance-table w-full text-left text-sm"><caption className="sr-only">Receitas e despesas do mês, por grupo: fixa, variável, temporária, anual</caption><thead className="text-xs text-muted-foreground"><tr>{["Lançamento", "Categoria", "Natureza", "Previsto", "Realizado", "Vencimento", "Status", "Ações"].map(t => <th key={t} className="px-3 py-3 font-medium">{t}</th>)}</tr></thead><tbody>{filtered.length ? view === "date" ? [...filtered].sort((a,b)=>Number(a.day_known === false)-Number(b.day_known === false)||a.due_date.localeCompare(b.due_date)).map(renderRow) : grouped(sortEntries(filtered), renderRow, recurrences) : <tr><td colSpan={8} className="p-6 text-center text-muted-foreground">Nenhum lançamento encontrado.</td></tr>}</tbody></table></div>}
  </section>;
}

export function CalendarFlow({ entries, month }: { entries: Entry[]; month: string }) {
  const [selected, setSelected] = useState<string | null>(null);
  const days = new Date(Number(month.slice(0,4)), Number(month.slice(5,7)), 0).getDate();
  const offset = new Date(`${month}T12:00:00Z`).getUTCDay();
  const events = entries.flatMap(e => [
    ...(monthOf(e.due_date) === month ? [{ entry: e, date: e.due_date, confirmed: false, amount: e.amount_planned }] : []),
    ...(e.paid_date && e.amount_paid > 0 && monthOf(e.paid_date) === month ? [{ entry: e, date: e.paid_date, confirmed: true, amount: e.amount_paid }] : []),
  ]).sort((a,b) => a.date.localeCompare(b.date) || Number(b.confirmed) - Number(a.confirmed));
  return <section className="space-y-4">
    <h3 className="flex items-center gap-2 font-semibold"><CalendarDays className="size-4 text-primary" />Calendário e fluxo do mês</h3>
    <div className="grid grid-cols-7 gap-1 rounded-lg border bg-card p-2 text-center text-xs">
      {["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"].map(d => <span key={d} className="py-2 text-muted-foreground">{d}</span>)}
      {Array.from({ length: offset }, (_,i) => <span key={`blank-${i}`} />)}
      {Array.from({ length: days }, (_,i) => { const date = `${month.slice(0,7)}-${String(i+1).padStart(2,"0")}`; const count = events.filter(e => e.date === date).length; return <Button key={date} variant={selected === date ? "secondary" : "ghost"} aria-label={`${formatDue(date)}, ${count} eventos`} aria-pressed={selected === date} className="h-14 min-w-0 flex-col gap-0 px-0" onClick={() => setSelected(selected === date ? null : date)}><span>{i+1}</span><span className="h-4 text-xs text-primary">{count ? `${count} ·` : ""}</span></Button>; })}
    </div>
    <p className="text-xs text-muted-foreground">Vencimentos previstos e pagamentos confirmados são eventos distintos, não valores somados.</p>
    {selected && <Button variant="ghost" onClick={() => setSelected(null)}>Mostrar todo o mês</Button>}
    <ul className="divide-y rounded-lg border bg-card">{events.filter(e => !selected || e.date === selected).map((event,i) => <li key={`${event.entry.id}-${i}`} className="flex flex-wrap items-center justify-between gap-2 p-3 text-sm"><div><p className="font-medium">{event.entry.description}</p><p className="text-xs text-muted-foreground">{formatDue(event.date)} · {event.confirmed ? "Confirmado" : "Vencimento previsto"} · {event.entry.kind === "receita" ? "Receita" : "Despesa"}</p></div><span className="tabular-nums">{formatBRL(event.amount)}</span></li>)}{!events.some(e => !selected || e.date === selected) && <li className="p-4 text-sm text-muted-foreground">Nenhum evento neste período.</li>}</ul>
  </section>;
}

/** Agrupadores (ex.: Freelas, Padrasto) mostram a soma dos itens; o total nunca é um lançamento à parte. */
function grouped(es: Entry[], renderRow: (e: Entry) => ReactNode, recurrences: Recurrence[]): ReactNode[] {
  const out: ReactNode[] = []; const seen = new Set<string>();
  let lastHeader = "";
  for (const e of es) {
    const header = `${e.kind === "receita" ? "Receitas" : "Despesas"} · ${NATURE_LABEL[e.nature ?? "nao_classificada"]}`;
    if (header !== lastHeader) { lastHeader = header; out.push(<tr key={`h-${header}`} className="bg-muted/20"><th colSpan={8} className="px-3 py-4 text-xs font-medium text-muted-foreground">{header}</th></tr>); }
    const g = e.group_label;
    if (!g) { out.push(<Fragment key={e.id}>{renderRow(e)}</Fragment>); continue; }
    const k = `${e.kind}-${g}`; if (seen.has(k)) continue; seen.add(k);
    out.push(<GroupBlock key={k} label={g} items={es.filter(x => x.kind === e.kind && x.group_label === g)} renderRow={renderRow} recurrences={recurrences} />);
  }
  return out;
}
function GroupBlock({ label, items, renderRow, recurrences }: { label: string; items: Entry[]; renderRow: (e: Entry) => ReactNode; recurrences: Recurrence[] }) {
  const [open, setOpen] = useState(false);
  const [details, setDetails] = useState(false);
  const tone = items[0]?.kind === "receita" ? "text-income" : "text-expense";
  const planned = Math.round(items.reduce((n, e) => n + e.amount_planned, 0) * 100) / 100;
  const paid = Math.round(items.reduce((n, e) => n + e.amount_paid, 0) * 100) / 100;
  return <>
    <tr className="border-t"><td colSpan={8} className="px-3 py-3">
      <Button variant="ghost" className="h-auto w-full flex-wrap justify-between gap-2 px-0 text-left" aria-expanded={open} onClick={() => setOpen(!open)}>
        <span className="flex items-center gap-2 font-medium text-foreground"><ChevronDown className={`size-4 transition ${open ? "rotate-180" : ""}`} />{label} <span className="text-xs font-normal text-muted-foreground">({items.length} itens)</span></span>
        <span className="tabular-nums text-sm text-muted-foreground">Previsto <span className={tone}>{formatBRL(planned)}</span> · Realizado <span className={tone}>{formatBRL(paid)}</span></span>
      </Button>
      <Button variant="ghost" size="sm" className="mt-1 px-0 text-primary" onClick={()=>setDetails(true)}>Ver detalhes de {label}</Button>
      <Dialog open={details} onOpenChange={setDetails}><DialogContent className="max-h-[85vh] overflow-y-auto"><DialogTitle>{label} · composição</DialogTitle><DialogDescription>{monthLabel(items[0]?.competence ?? monthOf(items[0]?.due_date ?? ""))}</DialogDescription><p className="text-sm text-muted-foreground">Previsto <span className={tone}>{formatBRL(planned)}</span> · Realizado <span className={tone}>{formatBRL(paid)}</span></p><ul className="divide-y">{items.map(e=>{const rec=recurrences.find(r=>r.id===e.recurrence_id);return <li key={e.id} className="space-y-1 py-3"><h3 className="text-sm font-medium text-foreground">{e.description}</h3><p className="text-xs text-muted-foreground">Previsto {formatBRL(e.amount_planned)} · realizado {formatBRL(e.amount_paid)}</p>{e.installment_total&&<><p className="text-xs">Parcela {e.installment_no ?? "A definir"}/{e.installment_total} · fim {rec?.end_month?monthLabel(rec.end_month):"A definir"}</p><progress aria-label={`Progresso ${e.description}`} className="w-full accent-primary" value={e.installment_no??0} max={e.installment_total}/></>}</li>;})}</ul><Button variant="outline" onClick={()=>setDetails(false)}>Fechar</Button></DialogContent></Dialog>
    </td></tr>
    {open && items.map(e => <Fragment key={e.id}>{renderRow(e)}</Fragment>)}
  </>;
}
