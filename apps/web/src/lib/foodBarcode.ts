import { type } from 'arktype';

const gtinType = type('/^[0-9]{14}$/').narrow((value, ctx) => {
  const sum = value
    .slice(0, -1)
    .split('')
    .reduce((total, digit, index) => total + Number(digit) * (index % 2 === 0 ? 3 : 1), 0);
  return (
    (10 - (sum % 10)) % 10 === Number(value.at(-1)) || ctx.mustBe('a GTIN with a valid check digit')
  );
});
const retailBarcodeType = type('/^(?:[0-9]{8}|[0-9]{12,14})$/');

/** Removes only GTIN padding, matching the EAN/UPC identifiers already used by food lookup. */
function unpadGtin(gtin: string) {
  if (gtin.startsWith('000000')) return gtin.slice(6);
  if (gtin.startsWith('00')) return gtin.slice(2);
  if (gtin.startsWith('0')) return gtin.slice(1);
  return gtin;
}

/** GS1 DataBar always carries a GTIN, so other values from it are not food barcodes. */
const dataBarFormats = new Set(['databar', 'databar_expanded', 'databar_limited']);
/** 2D codes also carry URLs and text; only accept retail numbers from them. */
const matrixFormats = new Set(['data_matrix', 'qr_code']);

/**
 * Extracts the product GTIN from GS1 element strings (raw or printed `(01)…` form), Digital Links
 * or DataBar, ignoring lot/expiry/weight. Returns `null` for malformed GS1 data so scanners skip it.
 */
export function getFoodBarcode(rawValue: string, format?: string): string | null {
  const value = rawValue.trim();
  if (!value) return null;
  // Symbology identifiers sent by hardware scanners: GS1-128, DataMatrix, QR Code and DataBar.
  const withoutIdentifier = value.replace(/^\](?:d2|Q3|C1|e0)/, '');
  const data = withoutIdentifier.startsWith(String.fromCharCode(29))
    ? withoutIdentifier.slice(1)
    : withoutIdentifier;
  let gtin =
    data.match(/^01([0-9]{14})/)?.[1] ??
    data.replace(/\s+/g, '').match(/\(01\)([0-9]{14})(?=\(|$)/)?.[1];

  if (!gtin && /^https?:\/\//i.test(value)) {
    try {
      const segments = new URL(value).pathname.split('/');
      const identifier = segments.indexOf('01');
      if (identifier !== -1) gtin = segments[identifier + 1];
    } catch {
      return null;
    }
  }

  if (gtin) return gtinType.allows(gtin) ? unpadGtin(gtin) : null;
  // Printed GS1 data without a usable `(01)` GTIN.
  if (/^\([0-9]{2,4}\)/.test(data)) return null;
  if (format && dataBarFormats.has(format)) return gtinType.allows(data) ? unpadGtin(data) : null;
  if (format && matrixFormats.has(format)) {
    if (!retailBarcodeType.allows(value)) return null;
    if (value.length === 14) return gtinType.allows(value) ? unpadGtin(value) : null;
  }
  return value;
}

/** Finds an existing product even when its EAN/UPC was saved with a different GTIN padding. */
export function foodBarcodeAliases(barcode: string) {
  if (!retailBarcodeType.allows(barcode)) return [barcode];
  const gtin = barcode.padStart(14, '0');
  const aliases = [barcode, gtin, unpadGtin(gtin)];
  if (gtin.startsWith('0')) aliases.push(gtin.slice(1));
  if (gtin.startsWith('00')) aliases.push(gtin.slice(2));
  if (gtin.startsWith('000000')) aliases.push(gtin.slice(6));
  return [...new Set(aliases)];
}
