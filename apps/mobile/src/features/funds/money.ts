/** Indian digit grouping: last three digits, then pairs. */
function groupIndian(digits: string): string {
  if (digits.length <= 3) return digits;
  const last3 = digits.slice(-3);
  const rest = digits.slice(0, -3);
  const pairs = rest.replace(/\B(?=(\d{2})+(?!\d))/g, ',');
  return `${pairs},${last3}`;
}

/** ₹ with Indian grouping; paise shown only when non-zero. Negative amounts use a true minus sign. */
export function formatRupees(paise: number): string {
  const negative = paise < 0;
  const abs = Math.abs(Math.round(paise));
  const rupees = Math.floor(abs / 100);
  const rest = abs % 100;
  const whole = groupIndian(String(rupees));
  const text = rest === 0 ? `₹${whole}` : `₹${whole}.${String(rest).padStart(2, '0')}`;
  return negative ? `−${text}` : text;
}

/** Parses a typed rupee amount ("5,000", "₹1234.50") into paise. Null when invalid or not positive. */
export function parseRupees(text: string): number | null {
  const cleaned = text.replace(/[₹,\s]/g, '');
  if (!/^\d+(\.\d{1,2})?$/.test(cleaned)) return null;
  const [whole, fraction = ''] = cleaned.split('.');
  const paise = Number(whole) * 100 + Number(fraction.padEnd(2, '0'));
  return paise > 0 ? paise : null;
}
