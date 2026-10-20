import { addMonths, monthOf, type Entry } from "./finance";
export type Account = "banco" | "poupanca" | "pluxee" | "ifood";
export type Opening = {
  id: string;
  wallet: Account;
  competence: string;
  amount: number;
  included: boolean;
  label: string | null;
};
export type Transfer = {
  id: string;
  from_wallet: "banco" | "poupanca";
  to_wallet: "banco" | "poupanca";
  amount: number;
  transfer_date: string;
  reversed_at: string | null;
};
export const ACCOUNT_NAMES: Record<Account, string> = {
  banco: "Conta corrente",
  poupanca: "Poupança",
  pluxee: "Pluxee Guarida",
  ifood: "iFood Benefícios Riachuelo",
};
export function accountMovement(
  entries: Entry[],
  transfers: Transfer[],
  account: Account,
  month: string,
) {
  let incoming = 0,
    outgoing = 0,
    transferred = 0;
  for (const e of entries) {
    if (!e.paid_date || monthOf(e.paid_date) !== month || e.amount_paid <= 0) continue;
    const wallet = e.wallet === "beneficio" ? (e.benefit_account ?? "pluxee") : "banco";
    if (wallet !== account) continue;
    if (e.kind === "receita") incoming += e.amount_paid;
    else outgoing += e.amount_paid;
  }
  for (const t of transfers) {
    if (t.reversed_at || monthOf(t.transfer_date) !== month) continue;
    if (t.to_wallet === account) transferred += t.amount;
    if (t.from_wallet === account) transferred -= t.amount;
  }
  return {
    incoming,
    outgoing,
    transferred,
    net: Math.round((incoming - outgoing + transferred) * 100) / 100,
  };
}
export function accountBalance(
  entries: Entry[],
  transfers: Transfer[],
  openings: Opening[],
  account: Account,
  month: string,
) {
  const prior = openings
    .filter((o) => o.wallet === account && o.competence <= month)
    .sort((a, b) => b.competence.localeCompare(a.competence))[0];
  const movement = accountMovement(entries, transfers, account, month);
  if (!prior)
    return { opening: null, closing: null, movement, included: true, manual: false, label: null };
  let opening = prior.amount;
  let closing = prior.included ? prior.amount : 0;
  for (let m = prior.competence; m <= month; m = addMonths(m, 1)) {
    opening = m === prior.competence ? prior.amount : closing;
    closing += accountMovement(entries, transfers, account, m).net;
  }
  return {
    opening,
    closing: Math.round(closing * 100) / 100,
    movement,
    included: prior.competence === month ? prior.included : true,
    manual: prior.competence === month,
    label: prior.competence === month ? prior.label : "Transportado do fechamento anterior",
  };
}
