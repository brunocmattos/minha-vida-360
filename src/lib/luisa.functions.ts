import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { parseLuisaOutput, validateLuisaAction, type LuisaAction } from "@/lib/luisa";
import { summarizeMonth, monthOf, type Entry } from "@/lib/finance";

const MODEL = "openai/gpt-6-astra";
const GATEWAY = "https://ai.gateway.lovable.dev/v1";

function todaySP(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo" }).format(new Date());
}

// Schema estrito: todas as chaves obrigatórias, opcionais como null (exigência do gateway).
const actionSchema = z.object({
  reply: z.string(),
  action: z
    .object({
      type: z.enum(["none", "criar_despesa", "registrar_diario"]),
      description: z.string().nullable(),
      amount: z.number().nullable(),
      date: z.string().nullable(),
      content: z.string().nullable(),
      area_slug: z.string().nullable(),
    })
    .nullable(),
});

async function buildContext(supabase: any): Promise<string> {
  const today = todaySP();
  const month = monthOf(today);
  const { data: entries } = await supabase.from("fin_entries").select("*");
  const s = summarizeMonth((entries ?? []) as Entry[], month);
  const { data: care } = await supabase
    .from("pet_care_records")
    .select("title, next_date, overdue_since, pet_id, pet_profiles(name)")
    .or(`overdue_since.not.is.null,next_date.gte.${today}`)
    .order("next_date", { ascending: true })
    .limit(10);
  const careLines = (care ?? []).map(
    (c: any) => `- ${c.pet_profiles?.name ?? "?"}: ${c.title} (${c.overdue_since ? `pendente desde ${c.overdue_since}` : `previsto ${c.next_date}`})`,
  );
  return [
    `Hoje é ${today} (fuso America/Sao_Paulo). Competência atual: ${month}.`,
    `Resumo financeiro do mês (dados reais): receitas previstas R$ ${s.plannedIn.toFixed(2)}, recebidas R$ ${s.realizedIn.toFixed(2)}; despesas previstas R$ ${s.plannedOut.toFixed(2)}, pagas R$ ${s.realizedOut.toFixed(2)}.`,
    careLines.length ? `Próximos cuidados dos filhos (pets):\n${careLines.join("\n")}` : "Sem cuidados de pets pendentes registrados.",
  ].join("\n");
}

const SYSTEM = `Você é a Luísa, assistente pessoal da usuária no app Minha Vida 360. Tom acolhedor, objetivo, em português brasileiro. Nunca invente valores, datas ou fatos.

Sua resposta DEVE ser um JSON com:
- "reply": texto amigável para a usuária.
- "action": opcional, quando a usuária pedir para registrar algo.

Ações graváveis (somente estas):
1. Despesa avulsa: {"type":"criar_despesa","description":"...","amount":123.45,"date":"aaaa-mm-dd"} — amount em reais (número), date opcional (se omitida, usa hoje). Só inclua a action se tiver descrição E valor; se faltar valor, pergunte no reply e use {"type":"none"}.
2. Registro de diário: {"type":"registrar_diario","content":"...","date":"aaaa-mm-dd","area_slug":"opcional"} — content é o texto do registro.

Regras:
- Pedidos sobre pets (vacina, vermífugo, banho, peso): NÃO crie action. Explique no reply que a atualização de cuidados dos filhos ainda é feita na página Meus Filhos, e oriente a abrir a área.
- Consultas (resumo do mês, cuidados pendentes): responda com os dados do contexto, action {"type":"none"}.
- Tarefas, receitas e demais módulos: ainda não graváveis pelo chat; diga isso com honestidade.
- Nunca confirme gravação no reply: a gravação só acontece depois que a usuária confirmar o resumo no app. Diga algo como "preparei o registro, confirma?".

Contexto atual:`;

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
    const apiKey = process.env["LOVABLE_API_KEY"];
    if (!apiKey) throw new Error("Integração de IA não configurada no servidor.");

    // Conversa precisa ser da usuária (RLS garante; erro se não existir)
    const { data: convo } = await supabase
      .from("luisa_conversations")
      .select("id")
      .eq("id", data.conversationId)
      .single();
    if (!convo) throw new Error("Conversa não encontrada.");

    const { error: insErr } = await supabase
      .from("luisa_messages")
      .insert({ conversation_id: data.conversationId, role: "user", content: data.message });
    if (insErr) throw new Error("Não consegui salvar sua mensagem.");

    const { data: history } = await supabase
      .from("luisa_messages")
      .select("role, content")
      .eq("conversation_id", data.conversationId)
      .order("created_at", { ascending: true })
      .limit(40);

    const contextBlock = await buildContext(supabase);

    const { createOpenAI } = await import("@ai-sdk/openai");
    const { streamText, Output } = await import("ai");
    const provider = createOpenAI({
      baseURL: GATEWAY,
      apiKey,
      headers: { "Lovable-API-Key": apiKey, "X-Lovable-AIG-SDK": "vercel-ai-sdk" },
    });

    const result = streamText({
      model: provider.responses(MODEL),
      system: `${SYSTEM}\n${contextBlock}`,
      messages: (history ?? []).map((m: any) => ({ role: m.role as "user" | "assistant", content: m.content })),
      output: Output.object({ schema: actionSchema }),
      providerOptions: {
        openai: {
          store: false,
          forceReasoning: true,
          reasoningEffort: "low",
          reasoningSummary: "auto",
          include: ["reasoning.encrypted_content"],
        },
      },
    });

    let parsed: { reply: string; action: LuisaAction | null };
    try {
      parsed = parseLuisaOutput(await result.output);
    } catch {
      const text = await Promise.resolve(result.text).catch(() => "");
      parsed = { reply: text || "Tive um problema para responder. Tente de novo?", action: null };
    }

    const { data: saved, error: saveErr } = await supabase
      .from("luisa_messages")
      .insert({
        conversation_id: data.conversationId,
        role: "assistant",
        content: parsed.reply,
        action: parsed.action ? (parsed.action as any) : null,
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
    const { data: msg } = await supabase
      .from("luisa_messages")
      .select("id, action")
      .eq("id", data.messageId)
      .single();
    const action = validateLuisaAction(msg?.action);
    if (!msg || !action) throw new Error("Ação não encontrada.");
    if (action.status !== "pendente") throw new Error("Esta ação já foi tratada.");

    if (!data.approved) {
      await supabase.from("luisa_messages").update({ action: { ...action, status: "cancelada" } as any }).eq("id", msg.id);
      return { status: "cancelada" as const };
    }

    const today = todaySP();
    if (action.type === "criar_despesa") {
      const date = action.date ?? today;
      const { error } = await supabase.from("fin_entries").insert({
        kind: "despesa",
        description: action.description!,
        amount_planned: action.amount!,
        amount_paid: action.amount!,
        due_date: date,
        paid_date: date,
        competence: monthOf(date),
        nature: "variavel",
        wallet: "banco",
        notes: "Registrado pela Luísa",
      });
      if (error) throw new Error("Não consegui gravar a despesa. Verifique e tente de novo.");
    } else if (action.type === "registrar_diario") {
      const { error } = await supabase.from("diary_entries").insert({
        content: action.content!,
        entry_date: action.date ?? today,
        area_slug: action.area_slug ?? null,
      });
      if (error) throw new Error("Não consegui gravar o registro do diário.");
    }

    await supabase.from("luisa_messages").update({ action: { ...action, status: "confirmada" } as any }).eq("id", msg.id);
    return { status: "confirmada" as const };
  });
