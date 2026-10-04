const message = 'Use ComponentProps; in React 19 it already includes ref.';

/** Flags `ComponentPropsWithRef` imported from react or used as `React.ComponentPropsWithRef`. */
const noComponentPropsWithRefRule = {
  meta: {
    type: 'suggestion',
    docs: { description: 'Prefer ComponentProps over the redundant ComponentPropsWithRef.' },
  },
  create(context) {
    return {
      ImportSpecifier(node) {
        if (node.parent.source.value !== 'react') return;
        if (node.imported.name === 'ComponentPropsWithRef') context.report({ node, message });
      },
      TSQualifiedName(node) {
        if (node.right.name === 'ComponentPropsWithRef') context.report({ node, message });
      },
    };
  },
};

export default {
  meta: { name: 'veles-react', version: '1.0.0' },
  rules: { 'no-component-props-with-ref': noComponentPropsWithRefRule },
};
