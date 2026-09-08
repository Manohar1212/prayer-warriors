const E164 = /^\+[1-9]\d{7,14}$/;

/** Builds an E.164 number from a country code and a national number typed by a person. */
export function toE164(countryCode: string, national: string): string | null {
  const cc = countryCode.replace(/\D/g, '');
  const digits = national.replace(/\D/g, '').replace(/^0+/, '');
  if (!cc || !digits) return null;
  const candidate = `+${cc}${digits}`;
  return E164.test(candidate) ? candidate : null;
}
