export function formatCurrency(value) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(Number(value || 0));
}

export function formatNumber(value, maximumFractionDigits = 2) {
  return new Intl.NumberFormat("pt-BR", {
    maximumFractionDigits,
  }).format(Number(value || 0));
}

export function formatDate(value) {
  if (!value) return "—";
  const [year, month, day] = value.split("-").map(Number);
  return new Intl.DateTimeFormat("pt-BR").format(
    new Date(year, month - 1, day),
  );
}

export function toInputDate(value) {
  return value || new Date().toISOString().slice(0, 10);
}
