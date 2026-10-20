import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CalendarDays, ChevronRight, Heart, Leaf, Loader2, PawPrint, Pencil, Pill, Plus, ShieldCheck, Stethoscope, Syringe, Trash2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import gardenScene from "@/assets/pets/jardim-garden.jpg.asset.json";
import dobbyPortrait from "@/assets/pets/jardim-dobby.jpg.asset.json";
import zaraPortrait from "@/assets/pets/jardim-zara.jpg.asset.json";
import pacoPortrait from "@/assets/pets/jardim-paco.jpg.asset.json";

const portraits: Record<string, string> = { dobby: dobbyPortrait.url, zara: zaraPortrait.url, paco: pacoPortrait.url };
const SIZE: Record<string, string> = { dobby: "Pequeno", paco: "Pequeno", zara: "Médio" };
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { SoftCard, EmptyNote } from "@/components/cards";
import { confirmDiscard } from "@/components/back-button";
import { formatBRL } from "@/lib/finance";
import { careStatus, careScheduleDate } from "@/lib/pet-care";
import dobbyIllustration from "@/assets/pets/dobby.png";
import pacoIllustration from "@/assets/pets/paco.png";
import zaraIllustration from "@/assets/pets/zara.png";

const inputCls = "w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring";
const TZ = "America/Sao_Paulo";
const fmtDate = (d: string | null) =>
  d ? new Intl.DateTimeFormat("pt-BR", { timeZone: TZ, day: "2-digit", month: "2-digit", year: "numeric" }).format(new Date(`${d}T12:00:00`)) : "A definir";
const todayISO = () => new Intl.DateTimeFormat("en-CA", { timeZone: TZ }).format(new Date());

const CARE_KINDS = ["vacina", "consulta", "vermifugo", "antiparasitario", "banho", "passeio", "outro"] as const;
const KIND_LABEL: Record<string, string> = {
  vacina: "Vacina", consulta: "Consulta", vermifugo: "Vermífugo", antiparasitario: "Antiparasitário",
  banho: "Banho", passeio: "Passeio", outro: "Outro",
};

type Pet = { id: string; slug: string; name: string; photo_url: string | null; birth_date: string | null; weight_kg: number | null; notes: string | null };
type Care = { id: string; pet_id: string; kind: string; title: string; done_date: string | null; next_date: string | null; overdue_since: string | null; shared_group: string | null; notes: string | null };
type Contact = { id: string; name: string; role: string | null; phone: string | null; address: string | null; notes: string | null };

const illustrations: Record<string, string> = { dobby: dobbyIllustration, paco: pacoIllustration, zara: zaraIllustration };
function Mascot({ slug }: { slug: string }) {
  return <img src={illustrations[slug]} alt={`Ilustração de ${slug}`} width={80} height={80} className="pet-mascot size-20 shrink-0 object-contain" />;
}

function CareState({ c }: { c: Care }) {
  const status = careStatus(c, todayISO());
  const late = status === "regularizar" || status === "atrasado";
  return <span className={`block text-xs ${late ? "font-medium text-expense" : "text-muted-foreground"}`}>
    {status === "regularizar" ? `Regularização pendente · vencida desde ${fmtDate(c.overdue_since)}` :
      status === "atrasado" ? `Atrasado · previsto para ${fmtDate(c.next_date)}` :
      status === "previsto" ? `Previsto para ${fmtDate(c.next_date)}` :
      status === "realizado" ? "Realizado" : "Data a definir"}
  </span>;
}

export function PetsModule() {
  const qc = useQueryClient();
  const [careOpen, setCareOpen] = useState(false);
  const [openPetId, setOpenPetId] = useState<string | null>(null);
  const pets = useQuery({ queryKey: ["pets"], queryFn: async () => {
    const { data, error } = await supabase.from("pet_profiles").select("*").order("slug");
    if (error) throw error;
    return (data ?? []) as Pet[];
  } });
  const care = useQuery({ queryKey: ["pet-care"], queryFn: async () => {
    const { data, error } = await supabase.from("pet_care_records").select("*").order("next_date", { ascending: true, nullsFirst: false });
    if (error) throw error;
    return (data ?? []) as Care[];
  } });
  const contacts = useQuery({ queryKey: ["pet-contacts"], queryFn: async () => {
    const { data, error } = await supabase.from("pet_contacts").select("*").order("name");
    if (error) throw error;
    return (data ?? []) as Contact[];
  } });
  const petFin = useQuery({ queryKey: ["pet-finance"], queryFn: async () => {
    const { data, error } = await supabase.from("fin_recurrences").select("description, amount_planned, frequency, active").ilike("description", "%filhos%");
    if (error) throw error;
    return data ?? [];
  } });

  const upcoming = useMemo(() => {
    const rows = (care.data ?? []).filter((c) => careScheduleDate(c));
    const groups = new Map<string, { c: Care; petIds: string[] }>();
    for (const c of rows) {
      const key = c.shared_group ? `${c.shared_group}:${c.title}:${c.next_date ?? ""}:${c.overdue_since ?? ""}` : c.id;
      const item = groups.get(key);
      if (item) item.petIds.push(c.pet_id);
      else groups.set(key, { c, petIds: [c.pet_id] });
    }
    return [...groups.values()].sort((a, b) => (careScheduleDate(a.c) ?? "").localeCompare(careScheduleDate(b.c) ?? ""));
  }, [care.data]);

  if (pets.isLoading) return <SoftCard><Loader2 className="mx-auto size-5 animate-spin" aria-label="Carregando" /></SoftCard>;
  if (pets.error) return <SoftCard><p role="alert" className="text-sm">Não foi possível carregar os perfis.</p></SoftCard>;

  const list = pets.data ?? [];
  const order = ["dobby", "zara", "paco"];
  const sorted = [...list].sort((a, b) => order.indexOf(a.slug) - order.indexOf(b.slug));
  const byKind = (k: string) => upcoming.filter(({ c }) => c.kind === k || (k === "antiparasitario" && /bravecto/i.test(c.title)));
  const verm = byKind("vermifugo");
  const vac = byKind("vacina");
  const brav = upcoming.filter(({ c }) => /bravecto/i.test(c.title));
  const lastVerm = (care.data ?? []).filter((c) => c.kind === "vermifugo" && c.done_date).map((c) => c.done_date!).sort().at(-1) ?? null;
  const nextVerm = verm.map(({ c }) => c.next_date).filter(Boolean).sort()[0] ?? null;
  const nextBrav = brav.map(({ c }) => c.next_date).filter(Boolean).sort()[0] ?? null;
  const onChanged = () => { qc.invalidateQueries({ queryKey: ["pets"] }); qc.invalidateQueries({ queryKey: ["pet-care"] }); };
  const openPet = sorted.find((p) => p.id === openPetId);

  return (
    <div className="garden-module space-y-5">
      <div className="garden-hero relative overflow-hidden rounded-[28px]">
        <img src={gardenScene.url} alt="Jardim ilustrado com Paco, Dobby e Zara deitados na grama" className="block h-auto w-full" width={1448} height={385} />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-4 px-1">
        <div className="flex items-center gap-4">
          <span className="grid size-16 shrink-0 place-items-center rounded-full bg-[var(--garden-paw-bg)]"><PawPrint className="size-8 text-[var(--garden-paw)]" /></span>
          <div>
            <h1 className="font-display text-4xl font-bold text-[var(--garden-ink)] md:text-5xl">Meus Filhos</h1>
            <p className="text-lg text-[var(--garden-muted)]">Jardim do Dobby, da Zara e do Paco</p>
          </div>
        </div>
        <p className="flex items-center gap-2 rounded-full bg-[var(--garden-leaf-bg)] px-5 py-3 text-sm text-[var(--garden-ink)]"><Leaf className="size-5 text-[var(--garden-leaf)]" /> Três personalidades, infinitos momentos especiais <Heart className="size-4 fill-current text-[var(--garden-heart)]" /></p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {sorted.map((p) => (
          <button key={p.id} type="button" onClick={() => setOpenPetId(p.id)} className={`garden-card garden-card-${p.slug} flex items-center gap-4 rounded-3xl p-4 text-left transition hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--garden-leaf)]`}>
            <img src={p.photo_url ?? portraits[p.slug]} alt={`Retrato de ${p.name}`} className="size-24 shrink-0 rounded-full object-cover" />
            <span className="min-w-0 flex-1">
              <span className="block font-display text-2xl font-bold text-[var(--garden-ink)]">{p.name}</span>
              <span className="mt-1 flex flex-wrap gap-2 text-sm">
                <span className="garden-chip">{p.weight_kg != null ? `${new Intl.NumberFormat("pt-BR").format(p.weight_kg)} kg` : "Peso a definir"}</span>
                <span className="garden-chip">{SIZE[p.slug] ?? "Porte a definir"}</span>
              </span>
              <span className="mt-2 block text-sm text-[var(--garden-muted)]">Ver ficha e cuidados</span>
            </span>
            <ChevronRight className="size-5 text-[var(--garden-muted)]" />
          </button>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-[2fr_1fr]">
        <button type="button" onClick={() => setCareOpen(true)} className="garden-panel rounded-3xl p-5 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--garden-leaf)]">
          <span className="mb-4 flex items-center gap-3">
            <span className="grid size-12 place-items-center rounded-full bg-[var(--garden-leaf-bg)]"><CalendarDays className="size-6 text-[var(--garden-leaf)]" /></span>
            <span><span className="block font-display text-xl font-bold text-[var(--garden-ink)]">Próximos cuidados</span><span className="text-sm text-[var(--garden-leaf)]">Toque para ver os detalhes</span></span>
          </span>
          {care.error && <span role="alert" className="block text-sm text-destructive">Não foi possível carregar os cuidados.</span>}
          <span className="block divide-y divide-[var(--garden-line)] rounded-2xl bg-[var(--garden-surface)]">
            <CareRow icon={<Pill className="size-5" />} title="Vermífugo – Endogard" sub="Para Dobby, Zara e Paco" a={lastVerm ? `Última dose ${fmtDate(lastVerm)}` : "Última dose não registrada"} b={nextVerm ? `Próxima dose ${fmtDate(nextVerm)}` : null} />
            <CareRow icon={<Syringe className="size-5" />} title="Vacinas" sub={vac.length ? `${vac.length} pendência(s) de regularização` : "Consultar datas cadastradas"} a={null} b={null} />
            <CareRow icon={<ShieldCheck className="size-5" />} title="Bravecto" sub="Compartilhado" a={null} b={nextBrav ? `Próxima dose ${fmtDate(nextBrav)}` : "Data a definir"} />
          </span>
        </button>

        <div className="garden-panel garden-panel-blue rounded-3xl p-5">
          <h2 className="mb-3 flex items-center gap-2 font-display text-xl font-bold text-[var(--garden-ink)]"><Stethoscope className="size-5" /> Contatos veterinários</h2>
          <ContactsBlock contacts={contacts.data ?? []} error={contacts.error} onChanged={() => qc.invalidateQueries({ queryKey: ["pet-contacts"] })} />
        </div>
      </div>

      <div className="garden-panel rounded-3xl p-5">
        <h2 className="mb-1 font-display text-lg font-bold text-[var(--garden-ink)]">Despesas dos filhos em Finanças</h2>
        <p className="mb-3 text-xs text-[var(--garden-muted)]">Somente leitura; os lançamentos continuam na área Finanças.</p>
        {!petFin.data?.length ? <EmptyNote>Nenhuma despesa dos filhos encontrada.</EmptyNote> : (
          <ul className="divide-y divide-[var(--garden-line)] text-sm text-[var(--garden-ink)]">
            {petFin.data.map((r) => (
              <li key={r.description} className="flex justify-between py-2"><span>{r.description}</span><span className="tabular-nums">{formatBRL(Number(r.amount_planned))}</span></li>
            ))}
          </ul>
        )}
      </div>

      <Dialog open={careOpen} onOpenChange={setCareOpen}>
        <DialogContent className="max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Próximos cuidados</DialogTitle></DialogHeader>
          {[["Vermífugo", verm], ["Vacinas", vac], ["Bravecto", brav]].map(([label, rows]) => (
            <section key={label as string} className="space-y-2">
              <h3 className="text-sm font-semibold">{label as string}</h3>
              {!(rows as typeof upcoming).length ? <p className="text-sm text-muted-foreground">Nenhum registro com data.</p> : (
                <ul className="divide-y text-sm">
                  {(rows as typeof upcoming).map(({ c, petIds }) => (
                    <li key={c.id} className="py-2">
                      <span className="font-medium">{c.title}</span> <span className="text-muted-foreground">· {list.filter((p) => petIds.includes(p.id)).map((p) => p.name).join(", ")}</span>
                      {c.done_date && <span className="block text-xs text-muted-foreground">Realizado em {fmtDate(c.done_date)}</span>}
                      <CareState c={c} />
                    </li>
                  ))}
                </ul>
              )}
            </section>
          ))}
        </DialogContent>
      </Dialog>

      <Dialog open={!!openPet} onOpenChange={(o) => !o && setOpenPetId(null)}>
        <DialogContent className="max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Ficha de {openPet?.name}</DialogTitle></DialogHeader>
          {openPet && <PetCard pet={openPet} care={(care.data ?? []).filter((c) => c.pet_id === openPet.id)} onChanged={onChanged} />}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function CareRow({ icon, title, sub, a, b }: { icon: React.ReactNode; title: string; sub: string; a: string | null; b: string | null }) {
  return (
    <span className="flex flex-wrap items-center gap-3 px-4 py-3">
      <span className="grid size-10 place-items-center rounded-full bg-[var(--garden-paw-bg)] text-[var(--garden-paw)]">{icon}</span>
      <span className="min-w-0 flex-1"><span className="block font-semibold text-[var(--garden-ink)]">{title}</span><span className="text-sm text-[var(--garden-muted)]">{sub}</span></span>
      {a && <span className="text-sm text-[var(--garden-ink)]">{a}</span>}
      {b && <span className="text-sm font-semibold text-[var(--garden-ink)]">{b}</span>}
      <ChevronRight className="size-4 text-[var(--garden-muted)]" />
    </span>
  );
}

function PetCard({ pet, care, onChanged }: { pet: Pet; care: Care[]; onChanged: () => void }) {
  const [editProfile, setEditProfile] = useState(false);
  const [careForm, setCareForm] = useState<null | { c?: Care }>(null);
  const delCare = useMutation({ mutationFn: async (id: string) => {
    const { error } = await supabase.from("pet_care_records").delete().eq("id", id);
    if (error) throw error;
  }, onSuccess: onChanged });

  return (
    <SoftCard className="min-w-0 rounded-3xl">
      <div className="mb-3 flex items-start justify-between gap-2">
        <div className="flex min-w-0 items-center gap-3">
          {pet.photo_url ? <img src={pet.photo_url} alt={`Foto de ${pet.name}`} className="size-16 rounded-full object-cover" /> : <Mascot slug={pet.slug} />}
          <div>
            <h3 className="text-lg font-semibold">{pet.name}</h3>
            <p className="text-xs text-muted-foreground">Nascimento: {fmtDate(pet.birth_date)}</p>
            <p className="mt-1 text-xs text-muted-foreground">Peso: {pet.weight_kg != null ? `${new Intl.NumberFormat("pt-BR").format(pet.weight_kg)} kg` : "A definir"}</p>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={() => setEditProfile(true)} aria-label={`Editar perfil de ${pet.name}`}><Pencil /></Button>
      </div>
      {pet.notes && <p className="mb-3 text-sm text-muted-foreground">{pet.notes}</p>}

      <h4 className="mb-2 text-xs font-semibold uppercase text-muted-foreground">Cuidados e saúde</h4>
      {!care.length ? <p className="mb-2 text-sm text-muted-foreground">Nenhum registro ainda.</p> : (
        <ul className="mb-2 divide-y text-sm">
          {care.map((c) => (
            <li key={c.id} className="flex items-center justify-between gap-2 py-2">
              <span className="min-w-0"><span className="font-medium">{c.title}</span><span className="block text-xs text-muted-foreground">{KIND_LABEL[c.kind] ?? c.kind}{c.done_date ? ` · Realizado em ${fmtDate(c.done_date)}` : " · Aplicação não registrada"}</span><CareState c={c} />{c.notes && <span className="mt-1 block text-xs text-muted-foreground">{c.notes}</span>}</span>
              <span className="flex shrink-0 gap-1">
                <Button variant="ghost" size="sm" aria-label={`Editar ${c.title}`} onClick={() => setCareForm({ c })}><Pencil /></Button>
                <Button variant="ghost" size="sm" aria-label={`Excluir ${c.title}`} onClick={() => { if (confirmDiscard(true)) delCare.mutate(c.id); }}><Trash2 /></Button>
              </span>
            </li>
          ))}
        </ul>
      )}
      {delCare.error && <p role="alert" className="mb-2 text-sm text-destructive">Não foi possível excluir o cuidado.</p>}
      <Button variant="outline" size="sm" onClick={() => setCareForm({})}><Plus />Adicionar cuidado</Button>

      {editProfile && <ProfileForm pet={pet} onClose={() => setEditProfile(false)} onSaved={() => { setEditProfile(false); onChanged(); }} />}
      {careForm && <CareForm pet={pet} c={careForm.c} onClose={() => setCareForm(null)} onSaved={() => { setCareForm(null); onChanged(); }} />}
    </SoftCard>
  );
}

function ProfileForm({ pet, onClose, onSaved }: { pet: Pet; onClose: () => void; onSaved: () => void }) {
  const [name, setName] = useState(pet.name);
  const [photo, setPhoto] = useState(pet.photo_url ?? "");
  const [birth, setBirth] = useState(pet.birth_date ?? "");
  const [weight, setWeight] = useState(pet.weight_kg != null ? String(pet.weight_kg).replace(".", ",") : "");
  const [notes, setNotes] = useState(pet.notes ?? "");
  const [err, setErr] = useState<string | null>(null);
  const dirty = name !== pet.name || photo !== (pet.photo_url ?? "") || birth !== (pet.birth_date ?? "") || notes !== (pet.notes ?? "") || weight !== (pet.weight_kg != null ? String(pet.weight_kg).replace(".", ",") : "");
  const save = useMutation({ mutationFn: async () => {
    if (!name.trim()) throw new Error("Informe o nome.");
    const w = weight.trim() ? Number(weight.replace(",", ".")) : null;
    if (weight.trim() && (w == null || !Number.isFinite(w) || w < 0)) throw new Error("Peso inválido.");
    const { error } = await supabase.from("pet_profiles").update({ name: name.trim(), photo_url: photo.trim() || null, birth_date: birth || null, weight_kg: w, notes: notes.trim() || null }).eq("id", pet.id);
    if (error) throw error;
  }, onSuccess: onSaved, onError: (e) => setErr(e.message || "Não foi possível salvar.") });

  const uploadPhoto = async (file: File | undefined) => {
    if (!file) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type) || file.size > 5 * 1024 * 1024) {
      setErr("Escolha uma imagem JPG, PNG ou WebP de até 5 MB."); return;
    }
    const url = URL.createObjectURL(file);
    try {
      const image = new Image(); image.src = url; await image.decode();
      const canvas = document.createElement("canvas");
      const scale = Math.min(1, 512 / Math.max(image.width, image.height));
      canvas.width = Math.round(image.width * scale); canvas.height = Math.round(image.height * scale);
      const context = canvas.getContext("2d");
      if (!context) throw new Error("Imagem indisponível.");
      context.drawImage(image, 0, 0, canvas.width, canvas.height);
      setPhoto(canvas.toDataURL("image/webp", 0.85)); setErr(null);
    } catch { setErr("Não foi possível abrir a imagem."); }
    finally { URL.revokeObjectURL(url); }
  };

  return (
    <div className="mt-4 space-y-3 rounded-md bg-muted/60 p-3">
      <label className="block text-sm">Nome<input className={inputCls} value={name} onChange={(e) => setName(e.target.value)} /></label>
      <label className="block text-sm">Foto do arquivo<input type="file" accept="image/jpeg,image/png,image/webp" className={inputCls} onChange={(e) => void uploadPhoto(e.target.files?.[0])} /></label>
      {photo && <img src={photo} alt={`Foto escolhida de ${name}`} width={64} height={64} className="size-16 rounded-full object-cover" />}
      <label className="block text-sm">Foto (link, opcional)<input className={inputCls} value={photo.startsWith("data:") ? "" : photo} onChange={(e) => setPhoto(e.target.value)} placeholder="https://…" /></label>
      <div className="grid grid-cols-2 gap-2">
        <label className="block text-sm">Nascimento<input type="date" className={inputCls} value={birth} onChange={(e) => setBirth(e.target.value)} /></label>
        <label className="block text-sm">Peso (kg)<input className={inputCls} inputMode="decimal" value={weight} onChange={(e) => setWeight(e.target.value)} /></label>
      </div>
      <label className="block text-sm">Observações e histórico de saúde<textarea className={inputCls} rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} /></label>
      {err && <p role="alert" className="text-sm text-destructive">{err}</p>}
      <div className="flex gap-2">
        <Button variant="outline" size="sm" onClick={() => { if (!dirty || confirmDiscard(true)) onClose(); }}>Cancelar</Button>
        <Button size="sm" disabled={save.isPending} onClick={() => save.mutate()}>{save.isPending ? "Salvando…" : "Salvar"}</Button>
      </div>
    </div>
  );
}

function CareForm({ pet, c, onClose, onSaved }: { pet: Pet; c?: Care | undefined; onClose: () => void; onSaved: () => void }) {
  const [kind, setKind] = useState(c?.kind ?? "vacina");
  const [title, setTitle] = useState(c?.title ?? "");
  const [done, setDone] = useState(c?.done_date ?? "");
  const [next, setNext] = useState(c?.next_date ?? "");
  const [overdue, setOverdue] = useState(c?.overdue_since ?? "");
  const [notes, setNotes] = useState(c?.notes ?? "");
  const [err, setErr] = useState<string | null>(null);
  const dirty = kind !== (c?.kind ?? "vacina") || title !== (c?.title ?? "") || done !== (c?.done_date ?? "") || next !== (c?.next_date ?? "") || overdue !== (c?.overdue_since ?? "") || notes !== (c?.notes ?? "");
  const save = useMutation({ mutationFn: async () => {
    if (!title.trim()) throw new Error("Informe um título.");
    const row = { pet_id: pet.id, kind, title: title.trim(), done_date: done || null, next_date: next || null, overdue_since: kind === "vacina" ? overdue || null : null, shared_group: c?.shared_group ?? null, notes: notes.trim() || null };
    const { error } = c ? await supabase.from("pet_care_records").update(row).eq("id", c.id) : await supabase.from("pet_care_records").insert(row);
    if (error) throw error;
  }, onSuccess: onSaved, onError: (e) => setErr(e.message || "Não foi possível salvar.") });

  return (
    <div className="mt-4 space-y-3 rounded-md bg-muted/60 p-3">
      <label className="block text-sm">Tipo
        <select className={inputCls} value={kind} onChange={(e) => setKind(e.target.value)}>
          {CARE_KINDS.map((k) => <option key={k} value={k}>{KIND_LABEL[k]}</option>)}
        </select>
      </label>
      <label className="block text-sm">Título<input className={inputCls} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ex.: Vacina V10" /></label>
      <div className="grid grid-cols-2 gap-2">
        <label className="block text-sm">Data de realização<input type="date" className={inputCls} value={done} onChange={(e) => setDone(e.target.value)} /></label>
        <label className="block text-sm">Próxima data prevista<input type="date" className={inputCls} value={next} onChange={(e) => setNext(e.target.value)} /></label>
      </div>
      {kind === "vacina" && <label className="block text-sm">Vencida desde<input type="date" className={inputCls} value={overdue} onChange={(e) => setOverdue(e.target.value)} /></label>}
      <label className="block text-sm">Observações<textarea className={inputCls} rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} /></label>
      {err && <p role="alert" className="text-sm text-destructive">{err}</p>}
      <div className="flex gap-2">
        <Button variant="outline" size="sm" onClick={() => { if (!dirty || confirmDiscard(true)) onClose(); }}>Cancelar</Button>
        <Button size="sm" disabled={save.isPending} onClick={() => save.mutate()}>{save.isPending ? "Salvando…" : "Salvar"}</Button>
      </div>
    </div>
  );
}

function ContactsBlock({ contacts, error, onChanged }: { contacts: Contact[]; error: unknown; onChanged: () => void }) {
  const [form, setForm] = useState<null | { c?: Contact }>(null);
  const del = useMutation({ mutationFn: async (id: string) => {
    const { error } = await supabase.from("pet_contacts").delete().eq("id", id);
    if (error) throw error;
  }, onSuccess: onChanged });
  if (error) return <p role="alert" className="text-sm">Não foi possível carregar os contatos.</p>;
  return (
    <div>
      {!contacts.length ? <EmptyNote>Nenhum veterinário ou contato cadastrado.</EmptyNote> : (
        <ul className="mb-3 divide-y text-sm">
          {contacts.map((c) => (
            <li key={c.id} className="flex items-center justify-between gap-2 py-2">
              <span><span className="font-medium">{c.name}</span>{c.role && <span className="text-muted-foreground"> · {c.role}</span>}
                <span className="block text-xs text-muted-foreground">{[c.phone, c.address].filter(Boolean).join(" · ") || "Sem telefone/endereço"}{c.notes ? ` · ${c.notes}` : ""}</span></span>
              <span className="flex shrink-0 gap-1">
                <Button variant="ghost" size="sm" aria-label={`Editar ${c.name}`} onClick={() => setForm({ c })}><Pencil /></Button>
                <Button variant="ghost" size="sm" aria-label={`Excluir ${c.name}`} onClick={() => { if (confirmDiscard(true)) del.mutate(c.id); }}><Trash2 /></Button>
              </span>
            </li>
          ))}
        </ul>
      )}
      {del.error && <p role="alert" className="mb-2 text-sm text-destructive">Não foi possível excluir o contato.</p>}
      <Button variant="outline" size="sm" onClick={() => setForm({})}><Plus />Adicionar contato</Button>
      {form && <ContactForm c={form.c} onClose={() => setForm(null)} onSaved={() => { setForm(null); onChanged(); }} />}
    </div>
  );
}

function ContactForm({ c, onClose, onSaved }: { c?: Contact | undefined; onClose: () => void; onSaved: () => void }) {
  const [name, setName] = useState(c?.name ?? "");
  const [role, setRole] = useState(c?.role ?? "");
  const [phone, setPhone] = useState(c?.phone ?? "");
  const [address, setAddress] = useState(c?.address ?? "");
  const [notes, setNotes] = useState(c?.notes ?? "");
  const [err, setErr] = useState<string | null>(null);
  const dirty = name !== (c?.name ?? "") || role !== (c?.role ?? "") || phone !== (c?.phone ?? "") || address !== (c?.address ?? "") || notes !== (c?.notes ?? "");
  const save = useMutation({ mutationFn: async () => {
    if (!name.trim()) throw new Error("Informe o nome.");
    const row = { name: name.trim(), role: role.trim() || null, phone: phone.trim() || null, address: address.trim() || null, notes: notes.trim() || null };
    const { error } = c ? await supabase.from("pet_contacts").update(row).eq("id", c.id) : await supabase.from("pet_contacts").insert(row);
    if (error) throw error;
  }, onSuccess: onSaved, onError: (e) => setErr(e.message || "Não foi possível salvar.") });

  return (
    <div className="mt-4 space-y-3 rounded-md bg-muted/60 p-3">
      <label className="block text-sm">Nome<input className={inputCls} value={name} onChange={(e) => setName(e.target.value)} /></label>
      <div className="grid grid-cols-2 gap-2">
        <label className="block text-sm">Função (ex.: veterinário)<input className={inputCls} value={role} onChange={(e) => setRole(e.target.value)} /></label>
        <label className="block text-sm">Telefone<input className={inputCls} value={phone} onChange={(e) => setPhone(e.target.value)} /></label>
      </div>
      <label className="block text-sm">Endereço<input className={inputCls} value={address} onChange={(e) => setAddress(e.target.value)} /></label>
      <label className="block text-sm">Observações<textarea className={inputCls} rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} /></label>
      {err && <p role="alert" className="text-sm text-destructive">{err}</p>}
      <div className="flex gap-2">
        <Button variant="outline" size="sm" onClick={() => { if (!dirty || confirmDiscard(true)) onClose(); }}>Cancelar</Button>
        <Button size="sm" disabled={save.isPending} onClick={() => save.mutate()}>{save.isPending ? "Salvando…" : "Salvar"}</Button>
      </div>
    </div>
  );
}
