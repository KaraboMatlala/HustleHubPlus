const rand = new Intl.NumberFormat("en-ZA", {
  style: "currency",
  currency: "ZAR",
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

export function formatPrice(amount) {
  return rand.format(Number(amount) || 0);
}

export function formatDate(value) {
  if (!value) return "";

  return new Date(value).toLocaleDateString("en-ZA", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}
