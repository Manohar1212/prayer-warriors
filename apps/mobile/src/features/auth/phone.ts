const E164 = /^\+[1-9]\d{7,14}$/;

/** Builds an E.164 number from a country code and a national number typed by a person. */
export function toE164(countryCode: string, national: string): string | null {
  const cc = countryCode.replace(/\D/g, '');
  const digits = national.replace(/\D/g, '').replace(/^0+/, '');
  if (!cc || !digits) return null;
  const candidate = `+${cc}${digits}`;
  return E164.test(candidate) ? candidate : null;
}

/**
 * A mobile number as someone types it in Profile: a bare Indian number (10 digits, spaces and
 * dashes allowed) becomes +91…, anything starting with + must already carry its country code.
 */
export function parseMobile(text: string): string | null {
  const raw = text.trim();
  if (raw.startsWith('+')) {
    const candidate = `+${raw.replace(/\D/g, '')}`;
    return E164.test(candidate) ? candidate : null;
  }
  const digits = raw.replace(/\D/g, '').replace(/^0+/, '');
  return digits.length === 10 ? toE164('91', digits) : null;
}

/** "+919100641194" → "+91 91006 41194", for showing an Indian number the way people write it. */
export function formatMobile(phone: string): string {
  const m = /^\+91(\d{5})(\d{5})$/.exec(phone);
  return m ? `+91 ${m[1]} ${m[2]}` : phone;
}
