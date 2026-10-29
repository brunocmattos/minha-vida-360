import { createServerFn } from "@tanstack/react-start";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Json } from "@/integrations/supabase/types";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import {
  expensePayment,
  parseLuisaContent,
  todaySP,
  validateLuisaAction,
  type LuisaAction,
} from "@/lib/luisa";
import { summarizeMonth, monthOf, addMonths, type Entry } from "@/lib/finance";
import { APP_NAME } from "@/lib/brand";
import { nextDueDate, type Recurrence } from "@/lib/recurrence";
import { withoutMissing } from "@/lib/casa";

const DAILY_LIMIT = 150;
const LLM_UNAVAILABLE = "A Luísa não conseguiu responder agora. Tente de novo em instantes.";

async function buildContext(supabase: SupabaseClient<Database>): Promise<string> {
  const today = todaySP();
  const month = monthOf(today);
  const next = addMonths(month, 1);
  // summarizeMonth usa só lançamentos com vencimento OU pagamento dentro do mês.
  const { data: entries, error: entriesErr } = await supabase
    .from("fin_entries")
    .select("kind, amount_planned, amount_paid, due_date, paid_date, wallet")
    .or(
      `and(due_date.gte.${month},due_date.lt.${next}),and(paid_date.gte.${month},paid_date.lt.${next})`,
    );
  const { data: care, error: careErr } = await supabase
    .from("pet_care_records")
    .select("title, next_date, overdue_since, pet_id, pet_profiles(name)")
    .or(`overdue_since.not.is.null,next_date.gte.${today}`)
    .order("next_date", { ascending: true })
    .limit(10);

  let finLine: string;
  if (entriesErr) {
    finLine =
      "Resumo financeiro do mês: INDISPONÍVEL agora (erro ao consultar). Não invente valores; diga que não conseguiu consultar.";
  } else {
    const s = summarizeMonth((entries ?? []) as Entry[], month);
    finLine = `Resumo financeiro do mês (dados reais): receitas previstas R$ ${s.plannedIn.toFixed(2)}, recebidas R$ ${s.realizedIn.toFixed(2)}; despesas previstas R$ ${s.plannedOut.toFixed(2)}, pagas R$ ${s.realizedOut.toFixed(2)}.`;
  }

  let careLine: string;
  if (careErr) {
    careLine =
      "Cuidados dos filhos (pets): INDISPONÍVEIS agora (erro ao consultar). Não invente; diga que não conseguiu consultar.";
  } else {
    const careLines = (care ?? []).map(
      (c) =>
        `- ${c.pet_profiles?.name ?? "?"}: ${c.title} (${c.overdue_since ? `pendente desde ${c.overdue_since}` : `previsto ${c.next_date}`})`,
    );
    careLine = careLines.length
      ? `Próximos cuidados dos filhos (pets):\n${careLines.join("\n")}`
      : "Sem cuidados de pets pendentes registrados.";
  }

  return [
    `Hoje é ${today} (fuso America/Sao_Paulo). Competência atual: ${month}.`,
    finLine,
    careLine,
    await casaContext(supabase),
  ].join("\n");
}

/** Tarefas abertas (com id, para a Luísa concluir a certa), lista de compras e manutenções. */
async function casaContext(supabase: SupabaseClient<Database>): Promise<string> {
  const [tasks, shop, maint] = await Promise.all([
    supabase
      .from("tasks")
      .select("id, title, area_slug, due_date, recurrence")
      .eq("done", false)
      .order("due_date", { ascending: true, nullsFirst: false })
      .limit(40),
    supabase.from("shopping_items").select("name, quantity").is("bought_at", null).limit(40),
    supabase
      .from("home_maintenance")
      .select("title, scheduled_date")
      .is("done_date", null)
      .limit(10),
  ]);
  const unavailable = (what: string) =>
    `${what}: INDISPONÍVEL agora (erro ao consultar). Não invente; diga que não conseguiu consultar.`;
  const taskLine = tasks.error
    ? unavailable("Tarefas abertas")
    : tasks.data.length
      ? `Tarefas abertas (id entre colchetes):\n${tasks.data
          .map(
            (t) =>
              `- [${t.id}] ${t.title}${t.area_slug ? ` · área ${t.area_slug}` : ""}${t.due_date ? ` · vence ${t.due_date}` : ""}${t.recurrence !== "none" ? ` · repete ${t.recurrence}` : ""}`,
          )
          .join("\n")}`
      : "Nenhuma tarefa aberta.";
  const shopLine = shop.error
    ? unavailable("Lista de compras")
    : shop.data.length
      ? `Lista de compras (faltando): ${shop.data.map((i) => (i.quantity ? `${i.name} (${i.quantity})` : i.name)).join(", ")}`
      : "Lista de compras vazia.";
  const maintLine = maint.error
    ? unavailable("Manutenções da casa")
    : maint.data.length
      ? `Manutenções da casa pendentes: ${maint.data.map((m) => (m.scheduled_date ? `${m.title} (${m.scheduled_date})` : m.title)).join(", ")}`
      : "Nenhuma manutenção da casa pendente.";
  return [taskLine, shopLine, maintLine].join("\n");
}

const SYSTEM = `Você é a Luísa, assistente pessoal da usuária no app ${APP_NAME}. Tom acolhedor, objetivo, em português brasileiro. Nunca invente valores, datas ou fatos.

Responda SEMPRE e SOMENTE com um objeto json válido (sem texto fora do json), neste formato:
{"reply":"texto amigável para a usuária","action":{"type":"none"}}
- "reply": texto amigável (pode usar markdown simples).
- "action": use {"type":"none"} quando não houver nada a registrar; quando a usuária pedir para registrar algo, use uma das ações abaixo.

Exemplo de json com ação:
{"reply":"Preparei o registro da despesa, confirma?","action":{"type":"criar_despesa","description":"Mercado","amount":120.5,"date":"2026-10-17"}}

Ações graváveis (somente estas):
1. Despesa avulsa: {"type":"criar_despesa","description":"...","amount":123.45,"date":"aaaa-mm-dd"} — amount em reais (número), date opcional (se omitida, usa hoje). Só inclua a action se tiver descrição E valor; se faltar valor, pergunte no reply e use {"type":"none"}. Se a data for futura, a despesa entra como prevista (ainda não paga); se for hoje ou passada, entra como paga.
2. Registro de diário: {"type":"registrar_diario","content":"...","date":"aaaa-mm-dd","area_slug":"opcional"} — content é o texto do registro.
3. Tarefa ou lembrete: {"type":"criar_tarefa","title":"...","date":"aaaa-mm-dd","area_slug":"casa","recurrence":"none"} — date é o dia em que deve ser feita (opcional); recurrence é "none", "daily", "alternate", "weekly" ou "monthly". Ex.: "me lembra de trocar a roupa de cama no sábado" → criar_tarefa com a data do próximo sábado e area_slug "casa".
4. Tarefa feita: {"type":"concluir_tarefa","title":"...","task_id":"id da lista de tarefas abertas","area_slug":"casa"} — se a usuária fez algo que está nas tarefas abertas, use o id exato dela; se não estiver na lista, omita task_id (fica registrado como feito). Ex.: "hoje limpei a cozinha".
5. Lista de compras: {"type":"adicionar_compra","items":[{"name":"sabão em pó","quantity":"1"}]} — quantity opcional. Ex.: "comprar sabão em pó", "acabou o café".
Áreas válidas para area_slug: casa, carro, saude, financas, cachorros, diario, carreira, desenvolvimento, autocuidado, intelecto, espiritualidade, social.

Regras:
- Pedidos sobre pets (vacina, vermífugo, banho, peso): NÃO crie action. Explique no reply que a atualização de cuidados dos filhos ainda é feita na página Meus Filhos, e oriente a abrir a área.
- Consultas (resumo do mês, cuidados pendentes): responda com os dados do contexto, action {"type":"none"}.
- Receitas, manutenções da casa e demais módulos: ainda não graváveis pelo chat; diga isso com honestidade.
- Uma ação por resposta. Se a usuária pedir duas coisas, prepare a primeira e diga que a outra vem em seguida.
- Nunca confirme gravação no reply: a gravação só acontece depois que a usuária confirmar o resumo no app. Diga algo como "preparei o registro, confirma?".

Contexto atual:`;

/** Chama um provedor compatível com OpenAI (chat completions). Devolve o texto bruto da resposta. */
async function callLlm(
  apiKey: string,
  system: string,
  history: { role: string; content: string }[],
) {
  const baseUrl = (process.env["LLM_BASE_URL"] || "https://api.deepseek.com").replace(/\/+$/, "");
  const model = process.env["LLM_MODEL"] || "deepseek-flash";
  let res: Response;
  try {
    res = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model,
        messages: [{ role: "system", content: system }, ...history],
        response_format: { type: "json_object" },
        temperature: 0.3,
        max_tokens: 800,
      }),
      signal: AbortSignal.timeout(30_000),
    });
  } catch (e) {
    console.error("[luisa] falha ao chamar o provedor de IA:", e);
    throw new Error(LLM_UNAVAILABLE);
  }
  if (!res.ok) {
    console.error("[luisa] provedor de IA respondeu", res.status);
    throw new Error(LLM_UNAVAILABLE);
  }
  const json = (await res.json().catch(() => null)) as {
    choices?: { message?: { content?: unknown } }[];
  } | null;
  return json?.choices?.[0]?.message?.content;
}

export const luisaSend = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { conversationId: string; message: string }) => {
    if (!d?.conversationId || typeof d.message !== "string" || !d.message.trim()) {
      throw new Error("Mensagem inválida");
    }
    return { conversationId: d.conversationId, message: d.message.trim().slice(0, 2000) };
  })
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const apiKey = process.env["LLM_API_KEY"];
    if (!apiKey) throw new Error("Integração de IA não configurada no servidor.");

    // Conversa precisa ser da usuária (RLS garante; erro se não existir)
    const { data: convo } = await supabase
      .from("luisa_conversations")
      .select("id")
      .eq("id", data.conversationId)
      .single();
    if (!convo) throw new Error("Conversa não encontrada.");

    // Limite diário (o RLS já restringe a contagem às mensagens desta usuária)
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { count, error: countErr } = await supabase
      .from("luisa_messages")
      .select("id", { count: "exact", head: true })
      .eq("role", "user")
      .gte("created_at", since);
    if (countErr) throw new Error("Não consegui verificar o limite de uso. Tente de novo.");
    if ((count ?? 0) >= DAILY_LIMIT) {
      throw new Error(
        "Você atingiu o limite diário de mensagens para a Luísa. Volte amanhã, tá bem?",
      );
    }

    const { error: insErr } = await supabase
      .from("luisa_messages")
      .insert({ conversation_id: data.conversationId, role: "user", content: data.message });
    if (insErr) throw new Error("Não consegui salvar sua mensagem.");

    // As 40 mais recentes, devolvidas em ordem cronológica
    const { data: recent, error: histErr } = await supabase
      .from("luisa_messages")
      .select("role, content")
      .eq("conversation_id", data.conversationId)
      .order("created_at", { ascending: false })
      .limit(40);
    if (histErr) throw new Error("Não consegui ler o histórico da conversa.");
    const history = [...(recent ?? [])].reverse();

    const contextBlock = await buildContext(supabase);
    const content = await callLlm(apiKey, `${SYSTEM}\n${contextBlock}`, history);
    const parsed = parseLuisaContent(content);

    const { data: saved, error: saveErr } = await supabase
      .from("luisa_messages")
      .insert({
        conversation_id: data.conversationId,
        role: "assistant",
        content: parsed.reply,
        action: parsed.action ? (parsed.action as unknown as Json) : null,
      })
      .select("id, role, content, action, created_at")
      .single();
    if (saveErr) throw new Error("Não consegui salvar a resposta.");
    await supabase
      .from("luisa_conversations")
      .update({ updated_at: new Date().toISOString() })
      .eq("id", data.conversationId);
    return saved;
  });

export const luisaConfirm = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { messageId: string; approved: boolean }) => {
    if (!d?.messageId) throw new Error("Mensagem inválida");
    return { messageId: d.messageId, approved: d.approved === true };
  })
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const { data: msg, error: msgErr } = await supabase
      .from("luisa_messages")
      .select("id, action")
      .eq("id", data.messageId)
      .eq("role", "assistant")
      .maybeSingle();
    if (msgErr) throw new Error("Não consegui concluir a ação. Tente de novo.");
    const action = validateLuisaAction(msg?.action, true);
    if (!msg || !action) throw new Error("Ação não encontrada.");
    if (action.status !== "pendente") throw new Error("Esta ação já foi tratada.");

    // Reserva a ação de forma atômica: só quem trocar "pendente" ganha o direito de gravar.
    const setStatus = async (from: LuisaAction["status"], to: LuisaAction["status"]) => {
      const { data: rows, error } = await supabase
        .from("luisa_messages")
        .update({ action: { ...action, status: to } as unknown as Json })
        .eq("id", msg.id)
        .eq("role", "assistant")
        .eq("action->>status", from)
        .select("id");
      if (error) throw new Error("Não consegui concluir a ação. Tente de novo.");
      return (rows?.length ?? 0) > 0;
    };

    if (!data.approved) {
      if (!(await setStatus("pendente", "cancelada"))) throw new Error("Esta ação já foi tratada.");
      return { status: "cancelada" as const };
    }

    if (!(await setStatus("pendente", "confirmada"))) throw new Error("Esta ação já foi tratada.");

    const today = todaySP();
    let failure: string | null = null;
    if (action.type === "criar_despesa") {
      const date = action.date ?? today;
      const pay = expensePayment(action.amount!, date, today);
      const { error } = await supabase.from("fin_entries").insert({
        kind: "despesa",
        description: action.description!,
        amount_planned: action.amount!,
        amount_paid: pay.amount_paid,
        due_date: date,
        paid_date: pay.paid_date,
        competence: monthOf(date),
        nature: "variavel",
        wallet: "banco",
        notes: "Registrado pela Luísa",
      });
      if (error) failure = "Não consegui gravar a despesa. Verifique e tente de novo.";
    } else if (action.type === "registrar_diario") {
      const { error } = await supabase.from("diary_entries").insert({
        content: action.content!,
        entry_date: action.date ?? today,
        area_slug: action.area_slug ?? null,
      });
      if (error) failure = "Não consegui gravar o registro do diário.";
    } else if (action.type === "criar_tarefa") {
      const { error } = await supabase.from("tasks").insert({
        title: action.title!,
        area_slug: action.area_slug ?? null,
        due_date: action.date ?? null,
        recurrence: action.recurrence ?? "none",
      });
      if (error) failure = "Não consegui criar a tarefa.";
    } else if (action.type === "concluir_tarefa") {
      failure = await completeTask(supabase, action, today);
    } else if (action.type === "adicionar_compra") {
      const { data: missing, error: readErr } = await supabase
        .from("shopping_items")
        .select("name")
        .is("bought_at", null);
      const items = withoutMissing(
        action.items ?? [],
        (missing ?? []).map((i) => i.name),
      );
      const { error } = readErr
        ? { error: readErr }
        : items.length
          ? await supabase.from("shopping_items").insert(items)
          : { error: null };
      if (error) failure = "Não consegui pôr os itens na lista de compras.";
    }

    if (failure) {
      // Devolve a ação para "pendente" para ela poder tentar de novo.
      await setStatus("confirmada", "pendente").catch(() => false);
      throw new Error(failure);
    }
    return { status: "confirmada" as const };
  });

/** Conclui a tarefa indicada (rotina avança pra próxima data) ou, sem tarefa, registra como feito. */
async function completeTask(
  supabase: SupabaseClient<Database>,
  action: LuisaAction,
  today: string,
): Promise<string | null> {
  const fail = "Não consegui marcar a tarefa como feita.";
  const { data: task, error } = action.task_id
    ? await supabase
        .from("tasks")
        .select("id, done, due_date, recurrence")
        .eq("id", action.task_id)
        .maybeSingle()
    : { data: null, error: null };
  if (error) return fail;
  if (task && !task.done && task.recurrence !== "none") {
    const next = nextDueDate(
      task.recurrence as Recurrence,
      today,
      task.due_date ? Number(task.due_date.slice(8, 10)) : undefined,
    );
    const { error: e } = await supabase.rpc("complete_recurring_task", {
      p_task_id: task.id,
      p_next_due: next!,
    });
    return e ? fail : null;
  }
  if (task && !task.done) {
    const { error: e } = await supabase.from("tasks").update({ done: true }).eq("id", task.id);
    return e ? fail : null;
  }
  if (task?.done) return null; // já estava feita: nada a gravar
  // não está na lista: fica registrado como feito (entra no histórico da área)
  const { error: e } = await supabase
    .from("tasks")
    .insert({ title: action.title!, area_slug: action.area_slug ?? null, done: true });
  return e ? fail : null;
}
