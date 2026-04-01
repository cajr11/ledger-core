/**
 * Amounts are stored in smallest currency units (centavos, cents, pesewas, kobo).
 * Divide by 100 to get the display value.
 */
export function formatAmount(smallestUnit: string | number, currency?: string) {
  const num = Number(smallestUnit) / 100;
  const formatted = num.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return currency ? `$${formatted} ${currency}` : `$${formatted}`;
}
