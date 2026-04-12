export function parseStockValue(stock: number | string): number {
  const normalized = typeof stock === "number" ? String(stock) : stock;
  const parsed = Number.parseFloat(normalized.replace(",", "."));
  return Number.isFinite(parsed) ? parsed : Number.NaN;
}
