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

const formats: BarcodeFormat[] = [
  'ean_13',
  'ean_8',
  'upc_a',
  'upc_e',
  'code_128',
  'data_matrix',
  'qr_code',
];

/** Uses native decoding only when it supports every requested format, including 2D food labels. */
export async function createDetector(): Promise<BarcodeDetectorLike> {
  if (window.BarcodeDetector?.getSupportedFormats) {
    try {
      const supported = await window.BarcodeDetector.getSupportedFormats();
      if (formats.every((format) => supported.includes(format))) {
        return new window.BarcodeDetector({ formats });
      }
    } catch {
      // Native support can be partial or unavailable; the WASM decoder supports all requested formats.
    }
  }

  // Keep the WASM decoder out of the initial client bundle on browsers with full native support.
  const { BarcodeDetector } = await import('barcode-detector/pure');
  return new BarcodeDetector({ formats });
}
