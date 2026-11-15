export const brl = (n: number | string | null | undefined) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(n ?? 0));

export const brlShort = (n: number) =>
  n >= 1000 ? `R$ ${new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 1 }).format(n / 1000)} mil` : brl(n);

export const num = (n: number | string | null | undefined) => new Intl.NumberFormat("pt-BR").format(Number(n ?? 0));

const TZ = "America/Sao_Paulo";
export const dateShort = (d: string | Date) =>
  new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short", timeZone: TZ }).format(new Date(d));
export const dateTime = (d: string | Date) =>
  new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit", timeZone: TZ }).format(new Date(d));
export const dateLong = (d: string | Date) =>
  new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "long", year: "numeric", timeZone: TZ }).format(new Date(d));

export const STATUS: Record<string, { label: string; tone: "lime" | "stone" | "blue" | "ink" | "red" }> = {
  pending: { label: "Aguardando pagamento", tone: "stone" },
  paid: { label: "Pago", tone: "lime" },
  processing: { label: "Em separação", tone: "stone" },
  shipped: { label: "Enviado", tone: "blue" },
  delivered: { label: "Entregue", tone: "ink" },
  cancelled: { label: "Cancelado", tone: "red" },
  refunded: { label: "Estornado", tone: "red" },
};
export const STATUS_FLOW = ["pending", "paid", "processing", "shipped", "delivered"];
export const CHANNEL: Record<string, string> = { online: "Online", store: "Loja física", whatsapp: "WhatsApp" };
export const PAYMENT: Record<string, string> = { pix: "Pix", card: "Cartão", cash: "Dinheiro" };
export const REASON: Record<string, string> = { sale: "Venda", restock: "Reposição", adjustment: "Ajuste", return: "Devolução" };

export const slugify = (s: string) =>
  s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

/** Intervalos do seletor de período do painel. */
export const PERIODS: Record<string, string> = { "7d": "Últimos 7 dias", mes: "Este mês", "30d": "Últimos 30 dias", "90d": "Últimos 90 dias" };
export function periodRange(key: string | undefined) {
  const to = new Date();
  const from = new Date();
  if (key === "7d") from.setDate(to.getDate() - 7);
  else if (key === "30d") from.setDate(to.getDate() - 30);
  else if (key === "90d") from.setDate(to.getDate() - 90);
  else { from.setDate(1); from.setHours(0, 0, 0, 0); }
  return { from: from.toISOString(), to: to.toISOString(), key: key && PERIODS[key] ? key : "mes" };
}
