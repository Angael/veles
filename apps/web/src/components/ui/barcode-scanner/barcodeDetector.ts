import type {
  BarcodeDetector as PolyfillBarcodeDetector,
  BarcodeFormat,
} from 'barcode-detector/pure';

type BarcodeDetectorLike = Pick<PolyfillBarcodeDetector, 'detect'>;
type BarcodeDetectorConstructor = {
  new (options: { formats: BarcodeFormat[] }): BarcodeDetectorLike;
  getSupportedFormats?: () => Promise<BarcodeFormat[]>;
};

declare global {
  interface Window {
    BarcodeDetector?: BarcodeDetectorConstructor;
  }
}

/** Packaged food: EAN/UPC on the pack, GS1-128 and 2D codes on labels. */
const retailFormats: BarcodeFormat[] = [
  'ean_13',
  'ean_8',
  'upc_a',
  'upc_e',
  'code_128',
  'data_matrix',
  'qr_code',
];
/**
 * GS1 DataBar on fresh food and ready-meal labels (GTIN + expiry + lot). `databar_expanded` also
 * covers the stacked variant. Native detectors (Android, macOS) usually do not support it.
 */
const dataBarFormats: BarcodeFormat[] = ['databar', 'databar_expanded', 'databar_limited'];

/** Native detector for every retail format, or `null` when the browser cannot provide one. */
async function createNativeDetector() {
  if (!window.BarcodeDetector?.getSupportedFormats) return null;
  try {
    const supported = await window.BarcodeDetector.getSupportedFormats();
    if (!retailFormats.every((format) => supported.includes(format))) return null;
    const nativeFormats = [...retailFormats, ...dataBarFormats].filter((format) =>
      supported.includes(format),
    );
    const missing = dataBarFormats.filter((format) => !supported.includes(format));
    return { detector: new window.BarcodeDetector({ formats: nativeFormats }), missing };
  } catch {
    // Native support can be partial or unavailable; the WASM decoder supports all formats.
    return null;
  }
}

async function createWasmDetector(formats: BarcodeFormat[]): Promise<BarcodeDetectorLike> {
  // Keep the WASM decoder out of the initial client bundle.
  const { BarcodeDetector } = await import('barcode-detector/pure');
  return new BarcodeDetector({ formats });
}

/**
 * Prefers native decoding for retail formats. Formats the native detector lacks (usually DataBar)
 * are decoded with WASM, only on frames where native decoding found nothing, to save CPU.
 */
export async function createDetector(): Promise<BarcodeDetectorLike> {
  const native = await createNativeDetector();
  if (!native) return createWasmDetector([...retailFormats, ...dataBarFormats]);
  if (!native.missing.length) return native.detector;

  const fallback = await createWasmDetector(native.missing);
  return {
    async detect(image) {
      const found = await native.detector.detect(image);
      return found.length ? found : fallback.detect(image);
    },
  };
}
