import type { Product } from "./types";

/** Modelo de venda da peça: estoque próprio, dropshipping (o fornecedor envia) ou sob encomenda. */
export type Fulfillment = "stock" | "dropship" | "preorder";

export const FULFILLMENT: Record<Fulfillment, { label: string; hint: string }> = {
  stock: { label: "Estoque próprio", hint: "Confere e baixa o estoque; a loja envia." },
  dropship: { label: "Dropshipping", hint: "Vende sem estoque; o fornecedor envia direto ao cliente." },
  preorder: { label: "Sob encomenda", hint: "Vende sem estoque; a loja produz ou compra e envia no prazo." },
};

/** Quantidade máxima por item quando a peça vende sem estoque (mesmo limite do checkout). */
export const ON_DEMAND_MAX = 20;

export const sellsWithoutStock = (p: Pick<Product, "fulfillment">) => (p.fulfillment ?? "stock") !== "stock";

/** Quanto dá para vender de uma variação: o estoque, ou o limite do pedido se a peça vende sem estoque. */
export const sellable = (p: Pick<Product, "fulfillment">, stock: number) => (sellsWithoutStock(p) ? ON_DEMAND_MAX : stock);

/** Texto de prazo mostrado ao cliente; vazio para estoque próprio sem prazo extra. */
export function leadTimeText(p: Pick<Product, "fulfillment" | "lead_time_days">) {
  const d = p.lead_time_days ?? 0;
  if (p.fulfillment === "preorder") return d > 0 ? `Sob encomenda · envio em até ${d} dias úteis` : "Sob encomenda";
  if (d > 0) return `Envio em até ${d} dias úteis`;
  return "";
}
