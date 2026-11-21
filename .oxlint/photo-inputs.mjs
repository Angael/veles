const allowedFile = 'components/ui/photo-source/usePhotoSource.tsx';
const message =
  'Use usePhotoSource() for image inputs. One <input> cannot offer both sources on phones: with ' +
  '`capture` it opens only the camera; without it Android opens a gallery-only photo picker. ' +
  'usePhotoSource renders both inputs; show its camera and gallery buttons.';

/** Value of a JSX attribute when it is a plain string, e.g. `accept='image/*'` or `accept={'…'}`. */
function stringValue(attribute) {
  const value = attribute.value;
  if (value?.type === 'Literal') return String(value.value);
  if (value?.type === 'JSXExpressionContainer' && value.expression.type === 'Literal') {
    return String(value.expression.value);
  }
  return undefined;
}

/**
 * Flags `<input>` elements with `capture` or an image `accept` outside usePhotoSource. Raw image
 * inputs regressed twice: camera-only uploads, then gallery-only uploads on Android.
 */
const usePhotoSourceRule = {
  meta: {
    type: 'problem',
    docs: { description: 'Require usePhotoSource for image file inputs.' },
  },
  create(context) {
    if (context.filename.replaceAll('\\', '/').endsWith(allowedFile)) return {};
    return {
      JSXOpeningElement(node) {
        if (node.name.type !== 'JSXIdentifier' || node.name.name !== 'input') return;
        const isPhotoInput = node.attributes.some((attribute) => {
          if (attribute.type !== 'JSXAttribute' || attribute.name.type !== 'JSXIdentifier') {
            return false;
          }
          if (attribute.name.name === 'capture') return true;
          return attribute.name.name === 'accept' && /image/i.test(stringValue(attribute) ?? '');
        });
        if (isPhotoInput) context.report({ node, message });
      },
    };
  },
};

export default {
  meta: { name: 'veles-photos', version: '1.0.0' },
  rules: { 'use-photo-source': usePhotoSourceRule },
};
